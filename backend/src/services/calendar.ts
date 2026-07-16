import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
const calendarId = process.env.GOOGLE_CALENDAR_ID || '';

if (!privateKey || !clientEmail || !calendarId) {
  console.error('[Google Calendar] Thiếu thông tin cấu hình credentials hoặc calendar ID.');
}

const auth = new google.auth.JWT(
  clientEmail,
  undefined,
  privateKey,
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });

interface EventDetails {
  studentName: string;
  phone: string;
  level: string;
  coachName: string;
  startTime: string; // ISOString
  endTime: string; // ISOString
  notes?: string;
  location?: string;
  currentSession?: number;
  totalSessions?: number;
}

/**
 * Tạo mới một sự kiện lịch tập tennis trên Google Calendar
 */
export async function createCalendarEvent(details: EventDetails): Promise<{ eventId: string; htmlLink: string }> {
  try {
    const sessionSuffix = details.currentSession && details.currentSession > 0
      ? ` (Buổi ${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''})`
      : '';

    const summary = `🎾 Lịch tập Tennis: ${details.studentName}${sessionSuffix} [HLV: ${details.coachName}]`;
    const progressText = details.currentSession && details.currentSession > 0
      ? `${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''}`
      : 'Chưa xác định';

    const description = `
<b>👤 Học viên:</b> ${details.studentName}<br>
<b>📞 Số điện thoại:</b> ${details.phone}<br>
<b>📘 Trình độ:</b> ${details.level}<br>
<b>📊 Tiến độ buổi học:</b> Buổi thứ ${progressText}<br>
<b>👤 Huấn luyện viên phụ trách:</b> ${details.coachName}<br>
<b>📍 Địa điểm / Sân tập:</b> ${details.location || 'Chưa xác định'}<br>
<b>📝 Ghi chú lịch dạy:</b> ${details.notes || 'Không có ghi chú'}<br>
<br>
<img src="https://images.unsplash.com/photo-1554068865-24bccd4e34b8?w=600" alt="Tennis" width="100%" style="border-radius: 8px; margin-top: 10px;" />
    `.trim();

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: {
        summary: summary,
        description: description,
        location: details.location,
        start: {
          dateTime: details.startTime,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        end: {
          dateTime: details.endTime,
          timeZone: 'Asia/Ho_Chi_Minh',
        },
        colorId: '5', // Màu vàng/xanh chuối tương tự màu tennis
      },
    });

    const eventId = response.data.id || '';
    const htmlLink = response.data.htmlLink || '';

    console.log(`[Google Calendar] Đã tạo thành công sự kiện: ${eventId}`);
    return { eventId, htmlLink };
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi tạo sự kiện:', error);
    throw error;
  }
}

/**
 * Xóa một sự kiện lịch tập tennis trên Google Calendar
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
    console.log(`[Google Calendar] Đã xóa thành công sự kiện: ${eventId}`);
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi xóa sự kiện:', error);
  }
}

/**
 * Cập nhật màu sắc của một sự kiện trên Google Calendar
 */
export async function updateCalendarEventColor(eventId: string, colorId: string): Promise<void> {
  try {
    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        colorId: colorId
      }
    });
    console.log(`[Google Calendar] Đã cập nhật màu sự kiện ${eventId} thành ${colorId}`);
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi cập nhật màu sắc:', error);
  }
}

/**
 * Đánh dấu sự kiện hoàn thành trên Google Calendar bằng cách đổi màu thành màu xám và thêm tiền tố [ĐÃ HOÀN THÀNH] vào tiêu đề
 */
export async function markCalendarEventCompleted(eventId: string, studentName: string, coachName: string, sessionText: string): Promise<void> {
  try {
    const summary = `✅ [ĐÃ HOÀN THÀNH] Lịch tập Tennis: ${studentName} (${sessionText}) [HLV: ${coachName}]`;
    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        summary: summary,
        colorId: '8' // Màu xám Graphite chỉ thị đã hoàn thành
      }
    });
    console.log(`[Google Calendar] Đã đánh dấu hoàn thành cho sự kiện ${eventId}`);
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi đánh dấu hoàn thành sự kiện:', error);
  }
}

