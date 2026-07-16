import { Client, GatewayIntentBits } from 'discord.js';
import { parseDiscordBooking } from './groq';
import { supabase } from './supabase';
import { createCalendarEvent, deleteCalendarEvent } from './calendar';
import { appendLessonToSheet } from './sheets';
import { sendDiscordBookingNotification } from './discord';

let botClient: Client;

const COURT_LOCATIONS: Record<string, { address: string; mapsLink: string }> = {
  'Hào Anh tennis Coffee': {
    address: 'Tennis & Coffee Hào Anh Hội An, V8JV+W45, Lý Thường Kiệt, Hội An Đông, Đà Nẵng, Vietnam',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=15.8818113%2C108.3403445',
  },
  'Sân Victoria resort': {
    address: 'V9W9+8GM Hoi An Dong, Da Nang, Vietnam',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=V9W9%2B8GM+Hoi+An+Dong+Da+Nang+Vietnam',
  },
};

function getCoachName(authorName: string): string {
  const lower = authorName.toLowerCase();
  if (lower === 'hoangcvde180551' || lower.includes('hoangcv') || lower === 'hoang jayce') {
    return 'hoang jayce';
  }
  return authorName;
}

export function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN || '';
  const channelId = process.env.DISCORD_BOOKING_CHANNEL_ID || '';

  if (!token || !channelId) {
    console.error('[Discord Bot] Thiếu DISCORD_BOT_TOKEN hoặc DISCORD_BOOKING_CHANNEL_ID trong file .env');
    return;
  }

  console.log('[Discord Bot] Đang khởi tạo bot client...');

  botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  botClient.on('ready', () => {
    console.log(`[Discord Bot] ĐÃ ĐĂNG NHẬP THÀNH CÔNG: ${botClient.user?.tag}! Đang lắng nghe kênh ${channelId}...`);
  });

  botClient.on('messageCreate', async (message) => {
    // Bỏ qua tin nhắn từ Bot
    if (message.author.bot) return;

    // Chỉ lắng nghe tin nhắn trong kênh đặt lịch cấu hình sẵn
    if (message.channelId !== channelId) return;

    const content = message.content.trim();
    console.log(`[Discord Bot] Nhận tin nhắn đặt lịch từ HLV ${message.author.username}: "${content}"`);

    // Gửi tin nhắn phản hồi đang xử lý
    const statusMsg = await message.reply('⏳ **Hệ thống AI đang phân tích cú pháp đặt lịch của HLV...**');

    try {
      const currentDateStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      
      // Gọi Groq AI để phân tích tin nhắn tự nhiên thành cấu trúc danh sách
      const bookings = await parseDiscordBooking(content, currentDateStr);
      console.log('[Discord Bot] Kết quả phân tích từ AI:', bookings);

      if (!bookings || bookings.length === 0) {
        await statusMsg.edit('❌ **AI không thể trích xuất được bất kỳ lịch học nào từ tin nhắn. Vui lòng kiểm tra lại cú pháp!**');
        return;
      }

      const firstBooking = bookings[0];
      if (!firstBooking.studentName && !firstBooking.studentPhone) {
        await statusMsg.edit('❌ **AI không thể trích xuất được tên hoặc số điện thoại học viên từ tin nhắn. Vui lòng thử lại với tên hoặc số điện thoại rõ ràng hơn!**');
        return;
      }

      let lead = null;

      // 1. Tìm học viên theo tên
      if (firstBooking.studentName && firstBooking.studentName.trim() !== '') {
        const { data } = await supabase
          .from('leads')
          .select('*')
          .ilike('name', `%${firstBooking.studentName}%`)
          .limit(1)
          .maybeSingle();
        lead = data;
      }

      // Nếu không tìm thấy bằng tên và có số điện thoại, thì tìm bằng SĐT
      if (!lead && firstBooking.studentPhone) {
        console.log(`[Discord Bot] Thử tìm học viên bằng SĐT: ${firstBooking.studentPhone}`);
        const phoneQuery = firstBooking.studentPhone.startsWith('84')
          ? firstBooking.studentPhone
          : '84' + firstBooking.studentPhone.replace(/^0/, '');
        
        const altResult = await supabase
          .from('leads')
          .select('*')
          .or(`phone.ilike.%${firstBooking.studentPhone}%,phone.ilike.%${phoneQuery}%`)
          .limit(1)
          .maybeSingle();
        lead = altResult.data;
        if (lead) {
          console.log(`[Discord Bot] Đã tìm thấy học viên bằng SĐT: ${lead.name}`);
        }
      }

      // Nếu vẫn không tìm thấy, tự động tạo lead mới làm fallback
      if (!lead) {
        const fallbackName = firstBooking.studentName || `Khách hàng ${firstBooking.studentPhone}`;
        console.log(`[Discord Bot] Không tìm thấy học viên, tự động tạo mới lead "${fallbackName}"...`);
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert([{
            name: fallbackName,
            age: null,
            phone: firstBooking.studentPhone || 'Không có SĐT (Tạo từ Discord Bot)',
            level: 'Basic',
            status: 'Contacted',
            notes: `[Tạo tự động từ Discord Bot chat của HLV ${getCoachName(message.author.username)}]`
          }])
          .select()
          .single();

        if (createError || !newLead) {
          console.error('[Discord Bot] Lỗi tạo lead mới:', createError);
          await statusMsg.edit('❌ **Không tìm thấy học viên trong hệ thống và thất bại khi cố gắng tạo tự động.**');
          return;
        }
        lead = newLead;
      }

      // Cập nhật thông tin total_sessions của học viên nếu có giá trị mới lớn hơn
      const maxTotalSessions = Math.max(...bookings.map(b => b.totalSessions));
      const maxCurrentSession = Math.max(...bookings.map(b => b.currentSession));
      
      const updateFields: Record<string, any> = { status: 'Scheduled' };
      if (maxTotalSessions > lead.total_sessions) {
        updateFields.total_sessions = maxTotalSessions;
      }
      if (maxCurrentSession > lead.completed_sessions) {
        // Cập nhật số buổi hiện tại cao nhất
        updateFields.completed_sessions = maxCurrentSession;
      }
      
      const { data: updatedLead } = await supabase
        .from('leads')
        .update(updateFields)
        .eq('id', lead.id)
        .select()
        .single();
        
      if (updatedLead) {
        lead = updatedLead;
      }

      const results = [];

      // Vòng lặp xử lý từng buổi tập được yêu cầu
      for (const bookingInfo of bookings) {
        const start = new Date(bookingInfo.startTime);
        if (isNaN(start.getTime())) {
          console.error('[Discord Bot] Lỗi: Thời gian bắt đầu không hợp lệ:', bookingInfo.startTime);
          continue;
        }
        const end = new Date(start.getTime() + bookingInfo.duration * 60 * 1000);

        const startTimeStr = start.toISOString();
        const endTimeStr = end.toISOString();

        // Kiểm tra xem học viên này đã có lịch trùng giờ bắt đầu này chưa -> Tiến hành thay thế (reschedule)
        const { data: existingLesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('lead_id', lead.id)
          .eq('start_time', startTimeStr)
          .maybeSingle();
  
        if (existingLesson) {
          console.log(`[Discord Bot] Phát hiện lịch học trùng giờ bắt đầu (${startTimeStr}), tiến hành thay thế...`);
          if (existingLesson.google_event_id) {
            await deleteCalendarEvent(existingLesson.google_event_id).catch(() => {});
          }
          await supabase
            .from('lessons')
            .delete()
            .eq('id', existingLesson.id);
        }

        const courtInfo = COURT_LOCATIONS[bookingInfo.court] || COURT_LOCATIONS['Hào Anh tennis Coffee'];
        const mapsLink = courtInfo.mapsLink;
        const courtAddress = courtInfo.address;

        // Tạo lịch trên Google Calendar cho buổi này
        const calendarResult = await createCalendarEvent({
          studentName: lead.name,
          phone: lead.phone,
          level: lead.level,
          coachName: getCoachName(message.author.username),
          startTime: startTimeStr,
          endTime: endTimeStr,
          notes: lead.notes,
          location: courtAddress,
          currentSession: bookingInfo.currentSession > 0 ? bookingInfo.currentSession : lead.completed_sessions,
          totalSessions: bookingInfo.totalSessions > 0 ? bookingInfo.totalSessions : lead.total_sessions
        });

        // Lưu buổi học mới vào Supabase
        const { data: newLesson, error: lessonError } = await supabase
          .from('lessons')
          .insert([{
            lead_id: lead.id,
            coach_name: getCoachName(message.author.username),
            platform: 'Discord',
            start_time: startTimeStr,
            end_time: endTimeStr,
            google_event_id: calendarResult.eventId,
            reminder_sent: false
          }])
          .select()
          .single();

        if (lessonError || !newLesson) {
          console.error('[Discord Bot] Lỗi khi tạo lesson trong Supabase:', lessonError);
          continue;
        }

        // Đồng bộ vào Google Sheets đối soát
        await appendLessonToSheet({
          studentName: lead.name,
          phone: lead.phone,
          coachName: getCoachName(message.author.username),
          startTime: startTimeStr,
          duration: bookingInfo.duration,
          court: bookingInfo.court,
          mapsLink: mapsLink,
          createdAt: new Date().toISOString()
        }).catch(err => console.error('[Discord Bot] Lỗi ghi nhận Sheets:', err));

        results.push({
          bookingInfo,
          startTimeStr,
          endTimeStr,
          mapsLink,
          courtAddress
        });
      }

      if (results.length === 0) {
        await statusMsg.edit('❌ **Lên lịch thất bại cho tất cả các buổi tập được yêu cầu. Vui lòng kiểm tra lại!**');
        return;
      }

      // Gửi phản hồi thành công gom nhóm các buổi tập hoặc hiển thị chi tiết 1 buổi
      const formatTime = (iso: string) => {
        return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) + 
               ' ngày ' + 
               new Date(iso).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      };

      const fields: any[] = [];

      if (results.length === 1) {
        // Form 1 buổi tập duy nhất: Hiển thị đầy đủ thông tin chi tiết dạng lưới ô thông tin
        const res = results[0];
        const { bookingInfo, startTimeStr, endTimeStr, mapsLink, courtAddress } = res;
        
        const completedSessions = bookingInfo.currentSession > 0 
          ? bookingInfo.currentSession 
          : ((lead as any).completed_sessions || 0);
          
        const totalSessions = bookingInfo.totalSessions > 0 
          ? bookingInfo.totalSessions 
          : ((lead as any).total_sessions || 0);

        const sessionsInfo = totalSessions > 0
          ? `${completedSessions}/${totalSessions} buổi`
          : (completedSessions > 0 ? `Đã tập ${completedSessions} buổi` : 'Chưa có thông tin');

        fields.push(
          { name: '👤 Học viên', value: lead.name, inline: true },
          { name: '⏰ Thời gian bắt đầu', value: formatTime(startTimeStr), inline: true },
          { name: '⏳ Thời gian kết thúc', value: formatTime(endTimeStr), inline: true },
          { name: '⏱️ Thời lượng', value: `${bookingInfo.duration} phút`, inline: true },
          { name: '📊 Tiến độ buổi học', value: sessionsInfo, inline: true },
          { name: '📍 Địa điểm / Sân tập', value: bookingInfo.court, inline: true },
          { name: '🗺️ Bản đồ Google Maps', value: `[Bấm để mở Bản đồ](${mapsLink})`, inline: true },
          { name: '📋 Địa chỉ đầy đủ (copy)', value: `\`\`\`\n${courtAddress}\n\`\`\``, inline: false }
        );
      } else {
        // Form gộp 2 buổi tập trở lên: Hiển thị danh sách các buổi tập có thời gian bắt đầu và kết thúc riêng biệt
        fields.push({ name: '👤 Học viên', value: lead.name, inline: false });

        results.forEach((res, index) => {
          const { bookingInfo, startTimeStr, endTimeStr } = res;
          const currentVal = bookingInfo.currentSession > 0 ? bookingInfo.currentSession : lead.completed_sessions;
          const totalVal = bookingInfo.totalSessions > 0 ? bookingInfo.totalSessions : lead.total_sessions;
          const sessionProgress = totalVal > 0 ? `${currentVal}/${totalVal} buổi` : `Buổi ${currentVal}`;

          fields.push({
            name: `📅 Buổi tập ${index + 1}`,
            value: `• **Bắt đầu:** ${formatTime(startTimeStr)}\n• **Kết thúc:** ${formatTime(endTimeStr)}\n• **Tiến độ:** ${sessionProgress}\n• **Sân:** ${bookingInfo.court}`,
            inline: false
          });
        });

        if (results.length > 0) {
          fields.push({
            name: '🗺️ Bản đồ Google Maps',
            value: `[Bấm để mở Bản đồ](${results[0].mapsLink})`,
            inline: true
          });
          fields.push({
            name: '📋 Địa chỉ đầy đủ (copy)',
            value: `\`\`\`\n${results[0].courtAddress}\n\`\`\``,
            inline: false
          });
        }
      }

      const successEmbed = {
        title: '🎾 THÀNH CÔNG — TỰ ĐỘNG ĐẶT LỊCH QUA DISCORD BOT',
        description: `🔔 Đã lên lịch thành công **${results.length} buổi tập** của học viên **${lead.name}** bởi HLV **${getCoachName(message.author.username)}**!`,
        color: 12779284,
        fields: fields,
        footer: {
          text: `Tennis AI Sales Assistant - Tạo lịch qua Discord`
        }
      };

      await statusMsg.delete().catch(() => {});
      await message.reply({
        content: `✅ **Đặt lịch thành công!**`,
        embeds: [successEmbed]
      });

    } catch (err: any) {
      console.error('[Discord Bot] Lỗi xử lý tin nhắn:', err);
      await statusMsg.edit(`❌ **Không thể xử lý tin nhắn. Gặp lỗi:** \`${err.message || 'Lỗi không xác định'}\``);
    }
  });

  botClient.login(token).catch(err => {
    console.error('[Discord Bot] Không thể login bot client:', err);
  });
}
