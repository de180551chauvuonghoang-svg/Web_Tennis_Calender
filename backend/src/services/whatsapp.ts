import { Client, LocalAuth } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { parseLeadMessage } from './groq';
import { supabase } from './supabase';
import { sendDiscordBookingNotification } from './discord';
import fs from 'fs';

let client: Client;

// Cache LID JID → số điện thoại thực cho các số trong MONITORED_PHONES
// Được xây dựng khi client sẵn sàng và cập nhật khi phát hiện contact mới
const lidToPhoneCache = new Map<string, string>();

function formatWhatsappJid(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '84' + clean.slice(1);
  }
  if (!clean.startsWith('84') && clean.length === 9) {
    clean = '84' + clean;
  }
  return `${clean}@c.us`;
}

function normalizePhone(p: string): string {
  const d = p.replace(/\D/g, '');
  if (d.startsWith('84')) return d;
  if (d.startsWith('0')) return '84' + d.slice(1);
  return '84' + d;
}

/**
 * Xây dựng cache LID → SĐT bằng cách quét tất cả contacts
 * và tìm contact nào có SĐT khớp với MONITORED_PHONES
 */
async function buildLidPhoneCache() {
  try {
    const monitoredRaw = process.env.MONITORED_PHONES || '';
    if (!monitoredRaw) return;
    const monitoredNormalized = monitoredRaw.split(',').map(p => normalizePhone(p.trim()));

    const contacts = await client.getContacts();
    let found = 0;
    for (const contact of contacts) {
      const contactNumber = (contact.number || '').replace(/\D/g, '');
      if (!contactNumber) continue;
      const contactNorm = normalizePhone(contactNumber);
      if (monitoredNormalized.includes(contactNorm)) {
        // Lưu cả JID @lid lẫn @c.us vào cache
        const serialized = contact.id._serialized;
        lidToPhoneCache.set(serialized, contactNorm);
        found++;
        console.log(`[WhatsApp] Đã map JID "${serialized}" → SĐT theo dõi "${contactNorm}"`);
      }
    }
    console.log(`[WhatsApp] Xây dựng LID cache hoàn tất: ${found} số theo dõi được map.`);
  } catch (err) {
    console.error('[WhatsApp] Lỗi khi xây dựng LID cache:', err);
  }
}

export function startWhatsAppClient() {
  console.log('[WhatsApp] Đang khởi tạo client...');

  // Xóa session cũ nếu có để luôn yêu cầu quét mã QR mỗi lần chạy theo yêu cầu của người dùng
  try {
    if (fs.existsSync('./.wwebjs_auth')) {
      fs.rmSync('./.wwebjs_auth', { recursive: true, force: true });
      console.log('[WhatsApp] Đã xóa session cũ để in lại mã QR liên kết.');
    }
  } catch (err) {
    console.error('[WhatsApp] Lỗi khi xóa session cũ:', err);
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  // Sự kiện tạo mã QR đăng nhập
  client.on('qr', (qr) => {
    console.log('[WhatsApp] ĐÃ TẠO MÃ QR ĐĂNG NHẬP. HÃY QUÉT MÃ BÊN DƯỚI:');
    qrcode.generate(qr, { small: true });
  });

  // Sự kiện sẵn sàng hoạt động → xây dựng LID cache ngay
  client.on('ready', () => {
    console.log('[WhatsApp] CLIENT ĐÃ SẴN SÀNG HOẠT ĐỘNG! Đang lắng nghe...');
    // Xây dựng cache LID → SĐT cho các số theo dõi sau 3 giây (để tránh race condition)
    setTimeout(() => buildLidPhoneCache(), 3000);
  });

  // Sự kiện lỗi xác thực
  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Xác thực thất bại:', msg);
  });

  // Lắng nghe tất cả tin nhắn mới (kể cả khi đang mở chat hoặc đã đọc ở thiết bị khác)
  client.on('message_create', async (message) => {
    try {
      // Tránh lặp vô hạn bằng cách bỏ qua các tin nhắn tự giới thiệu của chính bot
      if (message.body.includes('I am the Coach') || message.body.includes('Our partner has referred your information')) {
        return;
      }

      console.log(`[WhatsApp Debug] Nhận tin nhắn từ JID: ${message.from}, To: ${message.to}, fromMe: ${message.fromMe}, nội dung: "${message.body}"`);
      
      const monitoredRaw = process.env.MONITORED_PHONES || '';
      if (!monitoredRaw) {
        console.log('[WhatsApp Debug] Không tìm thấy MONITORED_PHONES trong env.');
        return;
      }

      const monitoredPhones = monitoredRaw.split(',').map(p => p.trim().replace(/\D/g, ''));
      
      // Xác định số điện thoại người gửi thực
      // Ưu tiên: cache LID → contact.number → JID (nếu @c.us)
      let senderPhone = '';
      if (message.fromMe) {
        // Tin nhắn gửi đi từ tài khoản đang đăng nhập
        senderPhone = client.info && client.info.wid ? client.info.wid.user : '';
      } else {
        const fromJid = message.from || '';

        // 1. Kiểm tra cache LID trước (nhanh nhất, không cần gọi API)
        if (lidToPhoneCache.has(fromJid)) {
          senderPhone = lidToPhoneCache.get(fromJid)!;
          console.log(`[WhatsApp Debug] Tìm thấy SĐT từ LID cache: "${senderPhone}"`);
        } else {
          // 2. Gọi getContact() để lấy số thực
          try {
            const contact = await message.getContact();
            senderPhone = contact.number || '';

            if (!senderPhone) {
              // 3. contact.number rỗng → xử lý theo loại JID
              if (fromJid.endsWith('@c.us')) {
                senderPhone = fromJid.replace('@c.us', '');
              } else {
                // LID format và không có trong cache → bỏ qua
                console.log(`[WhatsApp Debug] JID dạng LID (${fromJid}) không có trong cache, bỏ qua.`);
                return;
              }
            } else {
              // Nếu contact.number có giá trị, cập nhật cache để lần sau nhanh hơn
              const phoneNorm = normalizePhone(senderPhone.replace(/\D/g, ''));
              const monitoredNorm = monitoredPhones.map(p => normalizePhone(p));
              if (monitoredNorm.includes(phoneNorm)) {
                lidToPhoneCache.set(fromJid, phoneNorm);
                console.log(`[WhatsApp Debug] Cập nhật cache: "${fromJid}" → "${phoneNorm}"`);
              }
            }
          } catch {
            senderPhone = fromJid.endsWith('@c.us') ? fromJid.replace('@c.us', '') : '';
            if (!senderPhone) return;
          }
        }
      }
      senderPhone = senderPhone.replace(/\D/g, '').trim();

      console.log(`[WhatsApp Debug] Số điện thoại người gửi giải mã: "${senderPhone}"`);

      // Kiểm tra xem số điện thoại thực có nằm trong danh sách theo dõi không
      const senderNormalized = normalizePhone(senderPhone);
      const isMonitored = monitoredPhones.some(mp => {
        const mpNorm = normalizePhone(mp);
        return mpNorm === senderNormalized || mp === senderPhone;
      });

      if (!isMonitored) {
        console.log(`[WhatsApp Debug] Số người gửi "${senderPhone}" (${senderNormalized}) không nằm trong danh sách theo dõi [${monitoredPhones.join(', ')}]. Bỏ qua.`);
        return;
      }


      console.log(`[WhatsApp] Nhận được tin nhắn từ nguồn theo dõi (${senderPhone}): "${message.body}"`);

      // Gọi Groq AI để phân tích tin nhắn và lấy thông tin học viên
      const leadInfo = await parseLeadMessage(message.body);
      
      if (!leadInfo.phone) {
        console.warn('[WhatsApp] AI không tìm thấy số điện thoại của học viên mới trong tin nhắn.');
        return;
      }

      console.log('[WhatsApp] Kết quả phân tích từ AI:', leadInfo);

      // Thêm học viên mới vào Supabase với trạng thái 'Contacted'
      let newLead = null;
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert([{
            name: leadInfo.name,
            age: leadInfo.age,
            phone: leadInfo.phone,
            level: leadInfo.level,
            status: 'Contacted',
            notes: `[Tự động từ WhatsApp nguồn ${senderPhone}] ${leadInfo.notes}`
          }])
          .select()
          .single();

        if (error) {
          console.error('[WhatsApp] Lỗi lưu lead mới vào Supabase:', error);
        } else {
          newLead = data;
          console.log('[WhatsApp] Đã lưu học viên mới vào database với ID:', newLead?.id);
        }
      } catch (dbErr) {
        console.error('[WhatsApp] Ngoại lệ khi lưu database:', dbErr);
      }

      // Tự động kết bạn và gửi tin nhắn chào mừng qua WhatsApp cho học viên
      const studentJid = formatWhatsappJid(leadInfo.phone);
      let contactStatus = 'Đã tự động gửi tin nhắn chào mừng qua WhatsApp';

      const studentName = (!leadInfo.name || leadInfo.name === 'Học viên WhatsApp') ? 'mate' : leadInfo.name;
      const welcomeMessage = `Hello ${studentName}, I am the Coach Hoang Jayce. Our partner has referred your information to us. Could you share what level of tennis you are interested in (beginner or advanced), and which the free time and many lesson you would like to train in?`;

      try {
        const contacts = await client.getContacts();
        
        // Kiểm tra xem số này có thực sự được lưu trong danh bạ hay chưa
        const isSaved = contacts.some(c => {
          if (c.id._serialized !== studentJid) return false;
          
          // Kiểm tra xem có phải là contact của tôi (isMyContact) hoặc có tên lưu trong danh bạ (khác với số điện thoại)
          const hasSavedName = c.name && c.name.trim() !== '' && c.name.trim() !== c.number;
          return c.isMyContact === true || !!hasSavedName;
        });

        if (isSaved) {
          console.log(`[WhatsApp] Học viên (${leadInfo.phone}) đã có sẵn trong danh bạ HLV.`);
          console.log('đã có trong danh bạ'); // In đúng yêu cầu: "in ra đã có trong danh bạ"
          contactStatus = 'Học viên đã có sẵn trong danh bạ (Hệ thống không gửi lại tin nhắn giới thiệu)';
        } else {
          console.log(`[WhatsApp] Học viên (${leadInfo.phone}) chưa có trong danh bạ HLV. Tiến hành gửi tin nhắn chào mừng...`);
          await client.sendMessage(studentJid, welcomeMessage);
          console.log(`[WhatsApp] Đã gửi tin nhắn chào mừng thành công tới học viên (${leadInfo.phone})`);
        }
      } catch (contactErr) {
        console.error('[WhatsApp] Lỗi khi check danh bạ học viên, mặc định gửi tin chào mừng:', contactErr);
        await client.sendMessage(studentJid, welcomeMessage);
      }

      // Gửi thông báo đến Discord để báo tin cho HLV biết
      const discordNotifyText = `📢 **HỌC VIÊN MỚI TỰ ĐỘNG TỪ WHATSAPP**\n` +
        `👤 **Họ tên**: ${leadInfo.name}\n` +
        `📞 **Số điện thoại**: ${leadInfo.phone}\n` +
        `📘 **Nền tảng mong muốn**: ${leadInfo.platform}\n` +
        `✅ **Trạng thái**: ${contactStatus}\n` +
        `📝 **Nội dung tin gốc**: *"${message.body}"*`;

      // Gửi webhook dạng text đơn giản hoặc qua kênh Discord
      const embed = {
        title: '🟢 TỰ ĐỘNG THU THẬP HỌC VIÊN THÀNH CÔNG',
        description: `Hệ thống vừa tự động tiếp nhận học viên từ nguồn theo dõi **${senderPhone}**!`,
        color: 3066993, // Green
        fields: [
          { name: '👤 Học viên', value: leadInfo.name, inline: true },
          { name: '📞 Số điện thoại', value: leadInfo.phone, inline: true },
          { name: '⚡ Trạng thái', value: contactStatus, inline: false },
          { name: '📝 Ghi chú', value: leadInfo.notes, inline: false }
        ],
        footer: {
          text: `Nguồn gửi: ${senderPhone}`
        }
      };

      // Gửi đến Discord Webhook
      const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
      if (discordWebhookUrl) {
        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] })
        }).catch(err => console.error('[WhatsApp] Lỗi gửi thông báo Discord:', err));
      }

    } catch (err) {
      console.error('[WhatsApp] Lỗi xử lý tin nhắn:', err);
    }
  });

  client.initialize();
}
