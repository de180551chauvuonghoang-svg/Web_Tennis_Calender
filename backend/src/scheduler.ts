import cron from 'node-cron';
import { supabase } from './services/supabase';
import { sendDiscordReminderNotification } from './services/discord';

/**
 * Bắt đầu tiến trình chạy ngầm quét lịch học để gửi nhắc nhở
 */
export function startScheduler() {
  console.log('[Scheduler] Đang khởi chạy tiến trình quét nhắc lịch học...');

  // Chạy mỗi phút một lần
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

      // Lấy danh sách lessons chưa gửi nhắc nhở
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('reminder_sent', false);

      if (error) {
        console.error('[Scheduler] Lỗi khi truy vấn Supabase:', error);
        return;
      }

      if (!lessons || lessons.length === 0) return;

      for (const lesson of lessons) {
        const startTime = new Date(lesson.start_time);

        // Nếu buổi học bắt đầu trong khoảng từ bây giờ đến 30 phút nữa
        if (startTime > now && startTime <= thirtyMinutesLater) {
          console.log(`[Scheduler] Tìm thấy lịch cần nhắc nhở cho lesson ID: ${lesson.id}`);

          // Lấy chi tiết thông tin lead
          const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', lesson.lead_id)
            .single();

          if (leadError || !lead) {
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
            mapsLink: (lesson as any).maps_link || ''
          });

          // Cập nhật trạng thái reminder_sent = true
          const { error: updateError } = await supabase
            .from('lessons')
            .update({ reminder_sent: true })
            .eq('id', lesson.id);

          if (updateError) {
            console.error(`[Scheduler] Lỗi khi cập nhật trạng thái nhắc nhở cho lesson ${lesson.id}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] Lỗi trong cron job:', error);
    }
  });
}
