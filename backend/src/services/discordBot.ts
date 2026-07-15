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
      
      // Gọi Groq AI để phân tích tin nhắn tự nhiên thành cấu trúc
      const bookingInfo = await parseDiscordBooking(content, currentDateStr);
      console.log('[Discord Bot] Kết quả phân tích từ AI:', bookingInfo);

      if (!bookingInfo.studentName) {
        await statusMsg.edit('❌ **AI không thể trích xuất được tên học viên từ tin nhắn. Vui lòng thử lại với tên rõ ràng hơn!**');
        return;
      }

      // 1. Tìm học viên trong bảng leads
      let { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .ilike('name', `%${bookingInfo.studentName}%`)
        .limit(1)
        .maybeSingle();

      // Nếu không tìm thấy, tự động tạo lead mới làm fallback
      if (!lead) {
        console.log(`[Discord Bot] Không tìm thấy học viên "${bookingInfo.studentName}", tự động tạo mới lead...`);
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert([{
            name: bookingInfo.studentName,
            age: null,
            phone: 'Không có SĐT (Tạo từ Discord Bot)',
            level: 'Basic',
            status: 'Contacted',
            notes: `[Tạo tự động từ Discord Bot chat của HLV ${message.author.username}]`
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

      // 2. Tính toán startTime và endTime
      const start = new Date(bookingInfo.startTime);
      if (isNaN(start.getTime())) {
        await statusMsg.edit('❌ **Thời gian bắt đầu không hợp lệ hoặc AI phân tích sai cấu trúc thời gian.**');
        return;
      }
      const end = new Date(start.getTime() + bookingInfo.duration * 60 * 1000);

      const startTimeStr = start.toISOString();
      const endTimeStr = end.toISOString();

      // 3. Kiểm tra xem học viên này đã có lịch cũ chưa -> Xóa lịch cũ trước
      const { data: existingLesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('lead_id', lead.id)
        .maybeSingle();

      if (existingLesson) {
        if (existingLesson.google_event_id) {
          await deleteCalendarEvent(existingLesson.google_event_id).catch(() => {});
        }
        await supabase
          .from('lessons')
          .delete()
          .eq('id', existingLesson.id);
      }

      // 4. Lấy thông tin sân
      const courtInfo = COURT_LOCATIONS[bookingInfo.court] || COURT_LOCATIONS['Hào Anh tennis Coffee'];
      const mapsLink = courtInfo.mapsLink;
      const courtAddress = courtInfo.address;

      // 5. Tạo lịch trên Google Calendar
      const calendarResult = await createCalendarEvent({
        studentName: lead.name,
        phone: lead.phone,
        level: lead.level,
        coachName: message.author.username, // Lấy tên HLV chat trên Discord
        startTime: startTimeStr,
        endTime: endTimeStr,
        notes: lead.notes,
        location: courtAddress
      });

      // 6. Lưu buổi học mới vào Supabase
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert([{
          lead_id: lead.id,
          coach_name: message.author.username,
          platform: 'Discord',
          start_time: startTimeStr,
          end_time: endTimeStr,
          google_event_id: calendarResult.eventId,
          reminder_sent: false,
          court: bookingInfo.court,
          maps_link: mapsLink
        }])
        .select()
        .single();

      if (lessonError || !newLesson) {
        console.error('[Discord Bot] Lỗi khi tạo lesson:', lessonError);
        await statusMsg.edit('❌ **Gặp lỗi khi ghi nhận thông tin buổi học vào Cơ sở dữ liệu.**');
        return;
      }

      // 7. Cập nhật trạng thái lead sang 'Scheduled'
      await supabase
        .from('leads')
        .update({ status: 'Scheduled' })
        .eq('id', lead.id);

      // 8. Đồng bộ vào Google Sheets đối soát
      await appendLessonToSheet({
        studentName: lead.name,
        phone: lead.phone,
        coachName: message.author.username,
        startTime: startTimeStr,
        duration: bookingInfo.duration,
        court: bookingInfo.court,
        mapsLink: mapsLink,
        createdAt: new Date().toISOString()
      }).catch(err => console.error('[Discord Bot] Lỗi ghi nhận Sheets:', err));

      // 9. Gửi phản hồi thành công cùng embed thông báo địa chỉ copy
      const formatTime = (iso: string) => {
        return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) + 
               ' ngày ' + 
               new Date(iso).toLocaleDateString('vi-VN');
      };

      const successEmbed = {
        title: '🎾 THÀNH CÔNG — TỰ ĐỘNG ĐẶT LỊCH QUA DISCORD BOT',
        description: `🔔 Buổi tập của học viên **${lead.name}** đã được lên lịch thành công bởi HLV **${message.author.username}**!`,
        color: 12779284, // Màu Tennis #C2FF14
        fields: [
          { name: '👤 Học viên', value: lead.name, inline: true },
          { name: '⏰ Thời gian bắt đầu', value: formatTime(startTimeStr), inline: true },
          { name: '⏱️ Thời lượng', value: `${bookingInfo.duration} phút`, inline: true },
          { name: '📍 Địa điểm / Sân tập', value: bookingInfo.court, inline: true },
          { name: '🗺️ Bản đồ Google Maps', value: `[Bấm để mở Bản đồ](${mapsLink})`, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: '📋 Địa chỉ đầy đủ (copy)', value: `\`\`\`\n${courtAddress}\n\`\`\``, inline: false }
        ],
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
