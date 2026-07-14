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

interface LeadData {
  name: string;
  age: number;
  phone: string;
  level: string;
  notes?: string;
  createdAt: string;
}

/**
 * Thêm một dòng thông tin học viên mới vào Google Sheets
 */
export async function appendLeadToSheet(lead: LeadData): Promise<void> {
  try {
    const values = [
      [
        lead.name,
        lead.age,
        lead.phone,
        lead.level,
        lead.notes || '',
        lead.createdAt
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'A:F', // Ghi vào cột A đến F
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values
      }
    });

    console.log(`[Google Sheets] Đã ghi nhận lead: ${lead.name}`);
  } catch (error) {
    console.error('[Google Sheets] Lỗi khi ghi nhận lead:', error);
  }
}
