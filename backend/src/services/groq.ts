import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const groqApiKey = process.env.GROQ_API_KEY || '';

if (!groqApiKey) {
  console.error('[Groq OCR] Thiếu GROQ_API_KEY trong cấu hình.');
}

const groq = new Groq({ apiKey: groqApiKey });

/**
 * Thực hiện quét ảnh bằng Groq Vision Model để trích xuất số điện thoại và nền tảng (Zalo / WhatsApp)
 */
export async function performOcr(imageBuffer: Buffer, mimeType: string): Promise<{ phone: string; platform: string }> {
  try {
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `
Hãy quét hình ảnh này và tìm kiếm:
1. Số điện thoại liên hệ (chuỗi số điện thoại, ví dụ: 090xxx hoặc +8490xxx).
2. Nền tảng liên hệ (Zalo hoặc WhatsApp) được chỉ định trong ảnh (qua logo, biểu tượng, hoặc văn bản xung quanh). Nếu không xác định được nền tảng, mặc định chọn "Zalo".

Yêu cầu định dạng trả về dưới dạng JSON:
{
  "phone": "số điện thoại tìm thấy (hoặc chuỗi rỗng nếu không thấy)",
  "platform": "Zalo" hoặc "WhatsApp"
}
Chỉ trả về JSON, không kèm giải thích hay Markdown tags nào khác bên ngoài JSON.
    `.trim();

    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ] as any
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('[Groq OCR] Phản hồi từ Groq:', content);

    const parsed = JSON.parse(content);
    return {
      phone: (parsed.phone || '').trim(),
      platform: (parsed.platform || 'Zalo').trim()
    };
  } catch (error) {
    console.error('[Groq OCR] Xảy ra lỗi khi gọi Groq API:', error);
    throw error;
  }
}

/**
 * Phân tích tin nhắn thô từ WhatsApp bên thứ 3 gửi sang để lấy thông tin học viên
 */
export async function parseLeadMessage(text: string): Promise<{
  name: string;
  age: number | null;
  phone: string;
  level: string;
  notes: string;
  platform: string;
}> {
  try {
    const prompt = `
Hãy đóng vai trò là trợ lý AI trích xuất thông tin học viên đăng ký học tennis từ tin nhắn văn bản.
Trích xuất các thông tin sau từ tin nhắn:
1. name: Họ tên học viên (nếu không có, chọn "Học viên WhatsApp")
2. age: Tuổi học viên (nếu không có hoặc không phân tích được, trả về null)
3. phone: Số điện thoại liên hệ của học viên (tìm kiếm số điện thoại di động trong tin nhắn, ví dụ: 090xxx hoặc +8490xxx, nếu không có thì trả về chuỗi rỗng)
4. level: Trình độ học viên (chọn 1 trong 3 giá trị: "Basic" nếu là cơ bản/mới chơi, "Intermediate" nếu trung cấp, "Advanced" nếu nâng cao. Mặc định là "Basic")
5. notes: Ghi chú hoặc yêu cầu đặc biệt của học viên. Nếu không có thì điền toàn bộ nội dung tin nhắn gốc.
6. platform: Nền tảng muốn liên hệ (Zalo hoặc WhatsApp). Mặc định là "WhatsApp" nếu không ghi rõ.

Tin nhắn:
"""
${text}
"""

Yêu cầu định dạng trả về dưới dạng JSON:
{
  "name": "...",
  "age": null hoặc số,
  "phone": "...",
  "level": "Basic" | "Intermediate" | "Advanced",
  "notes": "...",
  "platform": "Zalo" | "WhatsApp"
}
Chỉ trả về JSON, không kèm giải thích hay Markdown tags nào khác bên ngoài JSON.
    `.trim();

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('[Groq Lead Parser] Phản hồi từ Groq:', content);

    const parsed = JSON.parse(content);
    return {
      name: parsed.name || 'Học viên WhatsApp',
      age: typeof parsed.age === 'number' ? parsed.age : null,
      phone: (parsed.phone || '').replace(/\D/g, ''), // Chỉ giữ số
      level: parsed.level || 'Basic',
      notes: parsed.notes || text,
      platform: parsed.platform || 'WhatsApp'
    };
  } catch (error) {
    console.error('[Groq Lead Parser] Lỗi khi gọi Groq API:', error);
    // Fallback cơ bản
    return {
      name: 'Học viên WhatsApp',
      age: null,
      phone: '',
      level: 'Basic',
      notes: text,
      platform: 'WhatsApp'
    };
  }
}

export interface SessionBooking {
  studentName: string;
  studentPhone: string;
  totalSessions: number;
  currentSession: number;
  startTime: string;
  duration: number;
  court: string;
}

/**
 * Phân tích tin nhắn chốt lịch tự nhiên của HLV trên Discord (Hỗ trợ đặt nhiều buổi cùng lúc)
 */
export async function parseDiscordBooking(text: string, currentDateStr: string): Promise<SessionBooking[]> {
  try {
    const prompt = `
  Hãy đóng vai trò là trợ lý AI dịch tin nhắn đặt lịch tập tennis của Huấn luyện viên thành dữ liệu JSON chứa danh sách các buổi học cần lên lịch.
  Ngày hiện tại đang là: ${currentDateStr} (Múi giờ Việt Nam GMT+7).

  Hãy phân tích tin nhắn đặt lịch sau. Lưu ý rằng tin nhắn có thể chứa một hoặc nhiều buổi tập khác nhau của học viên (Ví dụ: "Tami 7h AM 18/7 and 19/7 Victoria court buổi 4 and buổi 5" -> Đây là 2 buổi tập riêng biệt: Buổi 4 vào ngày 18/7 lúc 7:00 AM và Buổi 5 vào ngày 19/7 lúc 7:00 AM). Hãy phân tích kỹ để chia nhỏ thành các buổi tập tương ứng trong danh sách:
  """
  ${text}
  """

  Yêu cầu trích xuất danh sách các buổi tập:
  Mỗi phần tử trong danh sách cần có các trường sau:
  1. studentName: Tên của học viên. Nếu không có tên rõ ràng trong tin nhắn, để là chuỗi rỗng "".
  2. studentPhone: Số điện thoại của học viên (nếu có trong tin nhắn). GHI LẠI CHỈNH XÁC TẤT CẢ CÁC CHỮ SỐ. Nếu không có, để là chuỗi rỗng "".
  3. totalSessions: Tổng số buổi học mà học viên đăng kí (số nguyên, ví dụ "3 buổi" = 3). Nếu không đề cập, để là 0.
  4. currentSession: Số thứ tự buổi tập của buổi học cụ thể đó (Ví dụ: đối với buổi tập ngày 18/7 là "buổi 4" thì currentSession là 4. Đối với buổi tập ngày 19/7 là "buổi 5" thì currentSession là 5). Nếu không đề cập, để là 0.
  5. startTime: Thời gian bắt đầu buổi tập cụ thể đó (Định dạng chuỗi ISO địa phương Việt Nam: YYYY-MM-DDTHH:mm:ss, tuyệt đối KHÔNG có chữ 'Z' hay múi giờ lệch ở cuối). Bạn cần kết hợp với ngày hiện tại (${currentDateStr}) để đưa ra giờ địa phương chính xác nhất ở Việt Nam (Ví dụ: "7h AM ngày 18/7" -> "2026-07-18T07:00:00").
  6. duration: Thời lượng buổi tập tính bằng phút (dạng số, ví dụ "1h" = 60. Mặc định là 60 nếu không nhắc đến hoặc không đề cập thời lượng).
  7. court: Tên sân tập (ánh xạ chính xác sang 1 trong 2 giá trị sau: "Hào Anh tennis Coffee" hoặc "Sân Victoria resort"). Nếu không xác định rõ, mặc định chọn "Hào Anh tennis Coffee".

  Yêu cầu định dạng trả về dưới dạng JSON với cấu trúc sau:
  {
    "sessions": [
      {
        "studentName": "...",
        "studentPhone": "...",
        "totalSessions": số_buổi_đăng_ký,
        "currentSession": số_buổi_hiện_tại,
        "startTime": "YYYY-MM-DDTHH:mm:ss",
        "duration": số_phút,
        "court": "Hào Anh tennis Coffee" | "Sân Victoria resort"
      }
    ]
  }
  Chỉ trả về JSON, không kèm giải thích hay Markdown tags nào khác ngoài JSON.
      `.trim();

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('[Groq Discord Parser] Phản hồi từ Groq:', content);

    const parsed = JSON.parse(content);
    
    let sessions: any[] = [];
    if (parsed && Array.isArray(parsed.sessions)) {
      sessions = parsed.sessions;
    } else if (parsed && (parsed.studentName || parsed.startTime)) {
      sessions = [parsed];
    }

    return sessions.map((s: any) => {
      let startTimeVal = s.startTime || new Date().toISOString();
      if (startTimeVal && !startTimeVal.includes('+') && !startTimeVal.endsWith('Z')) {
        startTimeVal += '+07:00';
      }

      return {
        studentName: s.studentName || '',
        studentPhone: (s.studentPhone || '').replace(/\D/g, ''),
        totalSessions: typeof s.totalSessions === 'number' ? s.totalSessions : 0,
        currentSession: typeof s.currentSession === 'number' ? s.currentSession : 0,
        startTime: startTimeVal,
        duration: typeof s.duration === 'number' ? s.duration : 60,
        court: s.court || 'Hào Anh tennis Coffee'
      };
    });
  } catch (error) {
    console.error('[Groq Discord Parser] Lỗi khi gọi Groq API:', error);
    throw error;
  }
}


