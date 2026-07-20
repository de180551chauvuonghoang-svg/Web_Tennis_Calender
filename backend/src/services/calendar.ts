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

function buildDescriptionHtml(details: EventDetails, status: 'pending' | 'in_progress' | 'completed'): string {
  const progressText = details.currentSession && details.currentSession > 0
    ? `${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''}`
    : 'Chưa xác định';

  let detailsHtml = `
<b>👤 Học viên:</b> ${details.studentName}<br>
<b>📞 Số điện thoại:</b> ${details.phone}<br>
<b>📘 Trình độ:</b> ${details.level}<br>
<b>📊 Tiến độ buổi học:</b> Buổi thứ ${progressText}<br>
<b>👤 Huấn luyện viên phụ trách:</b> ${details.coachName}<br>
<b>📍 Địa điểm / Sân tập:</b> ${details.location || 'Chưa xác định'}<br>
<b>📝 Ghi chú lịch dạy:</b> ${details.notes || 'Không có ghi chú'}<br>
  `.trim();

  if (status === 'completed') {
    detailsHtml = `<div style="text-decoration: line-through; color: #888888;">${detailsHtml}</div>`;
  }

  let statusBarHtml = '';
  if (status === 'pending') {
    statusBarHtml = `
      <tr>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #FFD700; color: #FFD700; font-weight: bold; text-align: center;">🟡 ĐANG CHỜ</td>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #e0e0e0; color: #999999; text-align: center;">⚪ ĐANG TẬP</td>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #e0e0e0; color: #999999; text-align: center;">⚪ HOÀN THÀNH</td>
      </tr>
    `;
  } else if (status === 'in_progress') {
    statusBarHtml = `
      <tr>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #e0e0e0; color: #999999; text-align: center;">⚪ ĐANG CHỜ</td>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #28A745; color: #28A745; font-weight: bold; text-align: center;">🟢 ĐANG TẬP</td>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #e0e0e0; color: #999999; text-align: center;">⚪ HOÀN THÀNH</td>
      </tr>
    `;
  } else {
    statusBarHtml = `
      <tr>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #e0e0e0; color: #999999; text-align: center; text-decoration: line-through;">⚪ ĐANG CHỜ</td>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #e0e0e0; color: #999999; text-align: center; text-decoration: line-through;">⚪ ĐANG TẬP</td>
        <td style="width: 33%; padding: 8px 4px; border-bottom: 4px solid #888888; color: #888888; font-weight: bold; text-align: center; text-decoration: line-through;">⚫ HOÀN THÀNH</td>
      </tr>
    `;
  }

  return `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 10px; color: #333;">
  <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop" alt="Tennis Banner" style="width: 100%; max-width: 500px; height: auto; border-radius: 8px; display: block; margin-bottom: 15px;" />
  
  <div style="font-size: 14px; line-height: 1.6; margin-top: 15px;">
    ${detailsHtml}
  </div>
  
  <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
    <b>Trạng thái lớp học:</b>
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px;">
      ${statusBarHtml}
    </table>
  </div>
</div>
  `.trim();
}

/**
 * Tạo mới một sự kiện lịch tập tennis trên Google Calendar (Mặc định: Đang chờ - Banana Yellow)
 */
export async function createCalendarEvent(details: EventDetails): Promise<{ eventId: string; htmlLink: string }> {
  try {
    const sessionSuffix = details.currentSession && details.currentSession > 0
      ? ` (Buổi ${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''})`
      : '';

    const summary = `🟡 [ĐANG CHỜ] Tennis: ${details.studentName}${sessionSuffix} [HLV: ${details.coachName}]`;
    const description = buildDescriptionHtml(details, 'pending');

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
        colorId: '5', // Màu vàng (đang chờ)
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
 * Cập nhật sự kiện sang trạng thái "Đang tập" (Màu xanh Basil - 10)
 */
export async function updateCalendarEventToInProgress(eventId: string, details: EventDetails): Promise<void> {
  try {
    const sessionSuffix = details.currentSession && details.currentSession > 0
      ? ` (Buổi ${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''})`
      : '';
    const summary = `🟢 [ĐANG TẬP] Tennis: ${details.studentName}${sessionSuffix} [HLV: ${details.coachName}]`;
    const description = buildDescriptionHtml(details, 'in_progress');

    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        summary: summary,
        description: description,
        colorId: '10' // Màu xanh lá Basil
      }
    });
    console.log(`[Google Calendar] Đã cập nhật sự kiện ${eventId} sang ĐANG TẬP`);
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi chuyển sự kiện sang ĐANG TẬP:', error);
  }
}

/**
 * Đánh dấu sự kiện hoàn thành trên Google Calendar (Màu xám Graphite - 8, nội dung gạch ngang)
 */
export async function markCalendarEventCompleted(eventId: string, details: EventDetails): Promise<void> {
  try {
    const sessionSuffix = details.currentSession && details.currentSession > 0
      ? ` (Buổi ${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''})`
      : '';
    const summary = `⚫ [ĐÃ HOÀN THÀNH] Tennis: ${details.studentName}${sessionSuffix} [HLV: ${details.coachName}]`;
    const description = buildDescriptionHtml(details, 'completed');

    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        summary: summary,
        description: description,
        colorId: '8' // Màu xám Graphite
      }
    });
    console.log(`[Google Calendar] Đã đánh dấu hoàn thành cho sự kiện ${eventId}`);
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi đánh dấu hoàn thành sự kiện:', error);
  }
}

/**
 * Cập nhật sự kiện sang trạng thái "Đang chờ" (Màu vàng Banana - 5)
 */
export async function updateCalendarEventToPending(eventId: string, details: EventDetails): Promise<void> {
  try {
    const sessionSuffix = details.currentSession && details.currentSession > 0
      ? ` (Buổi ${details.currentSession}${details.totalSessions && details.totalSessions > 0 ? '/' + details.totalSessions : ''})`
      : '';
    const summary = `🟡 [ĐANG CHỜ] Tennis: ${details.studentName}${sessionSuffix} [HLV: ${details.coachName}]`;
    const description = buildDescriptionHtml(details, 'pending');

    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        summary: summary,
        description: description,
        colorId: '5' // Màu vàng Banana
      }
    });
    console.log(`[Google Calendar] Đã cập nhật sự kiện ${eventId} sang ĐANG CHỜ`);
  } catch (error) {
    console.error('[Google Calendar] Lỗi khi chuyển sự kiện sang ĐANG CHỜ:', error);
  }
}

/**
 * Kiểm tra sự kiện Google Calendar có tồn tại không
 */
export async function checkCalendarEventExists(eventId: string): Promise<boolean> {
  try {
    const response = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });
    if (response.data.status === 'cancelled') {
      return false;
    }
    return true;
  } catch (error: any) {
    if (error.code === 404 || (error.response && error.response.status === 404)) {
      return false;
    }
    console.error(`[Google Calendar] Lỗi khi kiểm tra sự kiện ${eventId}:`, error);
    return true;
  }
}



