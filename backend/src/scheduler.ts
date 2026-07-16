import cron from 'node-cron';
import { supabase } from './services/supabase';
import { sendDiscordReminderNotification } from './services/discord';
import { markCalendarEventCompleted, updateCalendarEventToInProgress } from './services/calendar';

/**
 * Bắt đầu tiến trình chạy ngầm quét lịch học để gửi nhắc nhở và cập nhật trạng thái hoàn thành
 */
export function startScheduler() {
  console.log('[Scheduler] Đang khởi chạy tiến trình quét nhắc lịch học...');

  // Chạy mỗi phút một lần
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

      // ==========================================
      // PHẦN 1: GỬI NHẮC LỊCH SẮP DIỄN RA (TRƯỚC 30 PHÚT)
      // ==========================================
      const { data: reminderLessons, error: reminderErr } = await supabase
        .from('lessons')
        .select('*')
        .eq('reminder_sent', false);

      if (!reminderErr && reminderLessons && reminderLessons.length > 0) {
        for (const lesson of reminderLessons) {
          const startTime = new Date(lesson.start_time);

          // Nếu buổi học bắt đầu trong khoảng từ bây giờ đến 30 phút nữa
          if (startTime > now && startTime <= thirtyMinutesLater) {
            console.log(`[Scheduler] Tìm thấy lịch cần nhắc nhở cho lesson ID: ${lesson.id}`);

            // Lấy chi tiết thông tin lead
            const { data: lead } = await supabase
              .from('leads')
              .select('*')
              .eq('id', lesson.lead_id)
              .single();

            if (!lead) {
              console.error(`[Scheduler] Không tìm thấy học viên cho lead_id: ${lesson.lead_id}`);
              continue;
            }

            // Resolve địa chỉ đầy đủ theo tên sân
            const COURT_ADDRESSES: Record<string, string> = {
              'Hào Anh tennis Coffee': 'Tennis & Coffee Hào Anh Hội An, V8JV+W45, Lý Thường Kiệt, Hội An Đông, Đà Nẵng, Vietnam',
              'Sân Victoria resort': 'V9W9+8GM Hoi An Dong, Da Nang, Vietnam',
            };
            const courtName = (lesson as any).court || 'Chưa xác định';
            const courtAddress = COURT_ADDRESSES[courtName] || courtName;

            // Gửi thông báo đến Discord
            await sendDiscordReminderNotification({
              studentName: lead.name,
              phone: lead.phone,
              platform: lesson.platform || 'Zalo',
              coachName: lesson.coach_name,
              startTime: lesson.start_time,
              endTime: lesson.end_time,
              notes: lead.notes || '',
              court: courtName,
              courtAddress: courtAddress,
              mapsLink: (lesson as any).maps_link || '',
              completedSessions: lead.completed_sessions,
              totalSessions: lead.total_sessions
            });

            // Cập nhật trạng thái sự kiện trên Google Calendar sang "Đang tập" (Màu xanh Basil và cập nhật thanh trạng thái)
            if (lesson.google_event_id) {
              await updateCalendarEventToInProgress(lesson.google_event_id, {
                studentName: lead.name,
                phone: lead.phone,
                level: lead.level,
                coachName: lesson.coach_name,
                startTime: lesson.start_time,
                endTime: lesson.end_time,
                notes: lead.notes || '',
                location: courtAddress,
                currentSession: lead.completed_sessions,
                totalSessions: lead.total_sessions
              }).catch(err => console.error('[Scheduler] Lỗi cập nhật Google Calendar sang ĐANG TẬP:', err));
            }

            // Cập nhật trạng thái reminder_sent = true
            await supabase
              .from('lessons')
              .update({ reminder_sent: true })
              .eq('id', lesson.id);
          }
        }
      }

      // ==========================================
      // PHẦN 2: ĐÁNH DẤU BUỔI HỌC ĐÃ HOÀN THÀNH KHI KẾT THÚC
      // ==========================================
      let endedLessons = null;
      const queryResult = await supabase
        .from('lessons')
        .select('*')
        .eq('completed', false);

      if (queryResult.error) {
        if (queryResult.error.code === 'PGRST204') {
          console.warn('[Scheduler] ⚠️ Cảnh báo: Cột "completed" chưa tồn tại trong bảng "lessons". Vui lòng chạy lệnh SQL để thêm cột.');
        } else {
          console.error('[Scheduler] Lỗi truy vấn lessons hoàn thành:', queryResult.error);
        }
      } else {
        endedLessons = queryResult.data;
      }

      if (endedLessons && endedLessons.length > 0) {
        for (const lesson of endedLessons) {
          const endTime = new Date(lesson.end_time);

          // Nếu thời gian kết thúc buổi học đã trôi qua
          if (endTime <= now) {
            console.log(`[Scheduler] Buổi học ID ${lesson.id} đã kết thúc. Đang đánh dấu hoàn thành...`);

            // Lấy chi tiết thông tin lead
            const { data: lead } = await supabase
              .from('leads')
              .select('*')
              .eq('id', lesson.lead_id)
              .single();

            if (lead) {
              const currentCompleted = lead.completed_sessions || 0;
              const totalSessions = lead.total_sessions || 0;

              // Tăng số buổi đã học lên 1
              const newCompleted = currentCompleted + 1;
              const { error: leadUpdateErr } = await supabase
                .from('leads')
                .update({ completed_sessions: newCompleted })
                .eq('id', lead.id);

              if (leadUpdateErr) {
                console.error('[Scheduler] Lỗi cập nhật completed_sessions cho học viên:', leadUpdateErr);
              }

              const sessionText = totalSessions > 0 ? `Buổi ${newCompleted}/${totalSessions}` : `Buổi ${newCompleted}`;

              // 1. Đánh dấu hoàn thành trên Google Calendar (đổi màu thành xám và sửa tiêu đề)
              if (lesson.google_event_id) {
                const COURT_ADDRESSES: Record<string, string> = {
                  'Hào Anh tennis Coffee': 'Tennis & Coffee Hào Anh Hội An, V8JV+W45, Lý Thường Kiệt, Hội An Đông, Đà Nẵng, Vietnam',
                  'Sân Victoria resort': 'V9W9+8GM Hoi An Dong, Da Nang, Vietnam',
                };
                const courtName = (lesson as any).court || 'Chưa xác định';
                const courtAddress = COURT_ADDRESSES[courtName] || courtName;

                await markCalendarEventCompleted(lesson.google_event_id, {
                  studentName: lead.name,
                  phone: lead.phone,
                  level: lead.level,
                  coachName: lesson.coach_name,
                  startTime: lesson.start_time,
                  endTime: lesson.end_time,
                  notes: lead.notes || '',
                  location: courtAddress,
                  currentSession: newCompleted,
                  totalSessions: lead.total_sessions
                }).catch(err => console.error('[Scheduler] Lỗi cập nhật Google Calendar:', err));
              }

              // 2. Gửi thông báo hoàn thành đến Discord
              const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
              if (discordWebhookUrl) {
                const completeEmbed = {
                  title: '✅ BUỔI TẬP TENNIS ĐÃ HOÀN THÀNH',
                  description: `🔔 Buổi tập của học viên **${lead.name}** phụ trách bởi HLV **${lesson.coach_name}** đã kết thúc thành công!`,
                  color: 3066993, // Màu xanh lá cây
                  fields: [
                    { name: '👤 Học viên', value: lead.name, inline: true },
                    { name: '📞 Số điện thoại', value: lead.phone, inline: true },
                    { name: '📊 Tiến độ học tập', value: `**${newCompleted}${totalSessions > 0 ? '/' + totalSessions : ''}** buổi`, inline: true },
                    { name: '⏱️ Thời gian tập', value: `Từ ${new Date(lesson.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} đến ${new Date(lesson.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} ngày ${new Date(lesson.end_time).toLocaleDateString('vi-VN')}`, inline: false }
                  ],
                  footer: { text: 'Tennis AI - Hệ thống theo dõi buổi học tự động' }
                };

                await fetch(discordWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ embeds: [completeEmbed] })
                }).catch(err => console.error('[Scheduler] Lỗi gửi thông báo hoàn thành Discord:', err));
              }
            }

            // Đánh dấu lesson đã hoàn thành (completed = true)
            await supabase
              .from('lessons')
              .update({ completed: true })
              .eq('id', lesson.id);
          }
        }
      }

    } catch (error) {
      console.error('[Scheduler] Lỗi trong cron job:', error);
    }
  });
}


