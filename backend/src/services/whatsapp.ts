import { Client, LocalAuth } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { parseLeadMessage } from './groq';
import { supabase } from './supabase';
import { sendDiscordBookingNotification } from './discord';

let client: Client;

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

export function startWhatsAppClient() {
  console.log('[WhatsApp] Đang khởi tạo client...');

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

  // Sự kiện sẵn sàng hoạt động
  client.on('ready', () => {
    console.log('[WhatsApp] CLIENT ĐÃ SẴN SÀNG HOẠT ĐỘNG! Đang lắng nghe...');
  });

  // Sự kiện lỗi xác thực
  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Xác thực thất bại:', msg);
  });

  // Lắng nghe tất cả tin nhắn mới (kể cả khi đang mở chat hoặc đã đọc ở thiết bị khác)
  client.on('message_create', async (message) => {
    try {
      // Bỏ qua tin nhắn do chính tài khoản HLV gửi đi (chỉ nhận tin nhắn từ người khác gửi đến)
      if (message.fromMe) return;

      console.log(`[WhatsApp Debug] Nhận tin nhắn từ JID: ${message.from}, nội dung: "${message.body}"`);
      
      const monitoredRaw = process.env.MONITORED_PHONES || '';
      if (!monitoredRaw) {
        console.log('[WhatsApp Debug] Không tìm thấy MONITORED_PHONES trong env.');
        return;
      }

      const monitoredPhones = monitoredRaw.split(',').map(p => p.trim().replace(/\D/g, ''));
      const contact = await message.getContact();
      const senderPhone = (contact.number || message.from.split('@')[0]).trim();
      console.log(`[WhatsApp Debug] Giải mã số điện thoại người gửi thành công: "${senderPhone}" (từ JID: ${message.from})`);

      // Kiểm tra xem tin nhắn có gửi từ các số điện thoại đang theo dõi hay không
      if (!monitoredPhones.includes(senderPhone)) {
        console.log(`[WhatsApp Debug] Số người gửi "${senderPhone}" không nằm trong danh sách theo dõi [${monitoredPhones.join(', ')}]. Bỏ qua.`);
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
      const { data: newLead, error } = await supabase
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

      if (error || !newLead) {
        console.error('[WhatsApp] Lỗi lưu lead mới vào Supabase:', error);
        return;
      }

      console.log('[WhatsApp] Đã lưu học viên mới vào database với ID:', newLead.id);

      // Tự động kết bạn và gửi tin nhắn chào mừng qua WhatsApp cho học viên
      const studentJid = formatWhatsappJid(leadInfo.phone);
      const welcomeMessage = `Hello ${leadInfo.name}, I am the Coach Hoang Jayce. Our partner has referred your information to us. Could you share what level of tennis you are interested in (beginner or advanced), and which the free time and many lesson you would like to train in ?`;

      await client.sendMessage(studentJid, welcomeMessage);
      console.log(`[WhatsApp] Đã gửi tin nhắn chào mừng thành công tới học viên (${leadInfo.phone})`);

      // Gửi thông báo đến Discord để báo tin cho HLV biết
      const discordNotifyText = `📢 **HỌC VIÊN MỚI TỰ ĐỘNG TỪ WHATSAPP**\n` +
        `👤 **Họ tên**: ${leadInfo.name}\n` +
        `📞 **Số điện thoại**: ${leadInfo.phone}\n` +
        `📘 **Nền tảng mong muốn**: ${leadInfo.platform}\n` +
        `✅ **Trạng thái**: Đã tự động gửi tin nhắn chào mừng giới thiệu qua WhatsApp!\n` +
        `📝 **Nội dung tin gốc**: *"${message.body}"*`;

      // Gửi webhook dạng text đơn giản hoặc qua kênh Discord
      const embed = {
        title: '🟢 TỰ ĐỘNG THU THẬP HỌC VIÊN THÀNH CÔNG',
        description: `Hệ thống vừa tự động tiếp nhận học viên từ nguồn theo dõi **${senderPhone}**!`,
        color: 3066993, // Green
        fields: [
          { name: '👤 Học viên', value: leadInfo.name, inline: true },
          { name: '📞 Số điện thoại', value: leadInfo.phone, inline: true },
          { name: '⚡ Trạng thái', value: 'Đã tự động nhắn tin chào mừng qua WhatsApp', inline: false },
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
