import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
const sheetsId = process.env.GOOGLE_SHEETS_ID || '';

if (!privateKey || !clientEmail || !sheetsId) {
  console.error('[Google Sheets] Thiếu thông tin cấu hình credentials hoặc sheets ID.');
}

const auth = new google.auth.JWT(
  clientEmail,
  undefined,
  privateKey,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Đảm bảo tab tồn tại và đã có hàng tiêu đề cột
 */
async function ensureSheetTabAndHeaders(tabName: string, headers: string[]): Promise<void> {
  try {
    // Kiểm tra tab đã tồn tại chưa
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetsId
    });
    
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === tabName);
    
    if (!sheetExists) {
      // Tạo tab mới
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetsId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: tabName
                }
              }
            }
          ]
        }
      });
      console.log(`[Google Sheets] Đã tạo tab mới: ${tabName}`);
    }
    
    // Kiểm tra xem đã có tiêu đề cột chưa (kiểm tra vùng A1:Z1)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range: `${tabName}!A1:Z1`
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      // Ghi tiêu đề
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetsId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers]
        }
      });
      console.log(`[Google Sheets] Đã tạo hàng tiêu đề cột cho tab: ${tabName}`);
    }
  } catch (error) {
    console.error(`[Google Sheets] Lỗi khi cấu hình tab ${tabName}:`, error);
  }
}

interface LeadData {
  name: string;
  age: number | string;
  phone: string;
  level: string;
  notes?: string;
  createdAt: string;
}

/**
 * Thêm một dòng thông tin học viên mới vào Google Sheets (Danh Sách Học Viên)
 */
export async function appendLeadToSheet(lead: LeadData): Promise<void> {
  const tabName = 'Danh Sách Học Viên';
  const headers = ['Họ và Tên', 'Số Điện Thoại', 'Tuổi', 'Trình Độ', 'Trạng Thái', 'Ghi Chú', 'Ngày Đăng Kỳ'];
  
  await ensureSheetTabAndHeaders(tabName, headers);
  
  try {
    const values = [
      [
        lead.name,
        "'" + lead.phone, // Tránh lỗi công thức #ERROR! của Google Sheets khi bắt đầu bằng dấu +
        lead.age || '—',
        lead.level,
        'Mới',
        lead.notes || '',
        lead.createdAt
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: `${tabName}!A:G`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values
      }
    });

    console.log(`[Google Sheets] Đã ghi nhận lead: ${lead.name} vào tab: ${tabName}`);
  } catch (error) {
    console.error('[Google Sheets] Lỗi khi ghi nhận lead:', error);
  }
}

interface LessonSheetData {
  studentName: string;
  phone: string;
  coachName: string;
  startTime: string;
  duration: number;
  court: string;
  mapsLink: string;
  createdAt: string;
}

/**
 * Ghi nhận lịch học được lên thành công vào Google Sheets (Lịch Học)
 */
export async function appendLessonToSheet(lesson: LessonSheetData): Promise<void> {
  const tabName = 'Lịch Học';
  const headers = ['Học Viên', 'Số Điện Thoại', 'Huấn Luyện Viên', 'Thời Gian Bắt Đầu', 'Thời Lượng (Phút)', 'Sân Tập', 'Link Bản Đồ', 'Ngày Lên Lịch'];
  
  await ensureSheetTabAndHeaders(tabName, headers);
  
  try {
    const values = [
      [
        lesson.studentName,
        "'" + lesson.phone, // Tránh lỗi công thức #ERROR!
        lesson.coachName,
        lesson.startTime,
        lesson.duration,
        lesson.court,
        lesson.mapsLink,
        lesson.createdAt
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: `${tabName}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values
      }
    });

    console.log(`[Google Sheets] Đã ghi nhận lịch học của ${lesson.studentName} vào tab: ${tabName}`);
  } catch (error) {
    console.error('[Google Sheets] Lỗi khi ghi lịch học vào sheets:', error);
  }
}
