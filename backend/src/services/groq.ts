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
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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

/**
 * Phân tích tin nhắn chốt lịch tự nhiên của HLV trên Discord
 */
export async function parseDiscordBooking(text: string, currentDateStr: string): Promise<{
  studentName: string;
  studentPhone: string;
  totalSessions: number;
  startTime: string;
  duration: number;
  court: string;
}> {
  try {
    const prompt = `
Hãy đóng vai trò là trợ lý AI dịch tin nhắn đặt lịch tập tennis của Huấn luyện viên thành dữ liệu JSON cấu trúc.
Ngày hiện tại đang là: ${currentDateStr} (Múi giờ Việt Nam GMT+7).

Hãy phân tích tin nhắn đặt lịch sau:
"""
${text}
"""

Yêu cầu trích xuất các trường:
1. studentName: Tên của học viên. Nếu không có tên rõ ràng trong tin nhắn, để là chuỗi rỗng "".
2. studentPhone: Số điện thoại của học viên (nếu có trong tin nhắn). GHI LẠI CHỈNH XÁC TẤT CẢ CÁC CHỮ SỐ của số điện thoại, bao gồm cả mã quốc gia. Ví dụ: "84 785669776" →0 "84785669776", "86 138 2430 1352" → "8613824301352", "+852 6041 6779" → "85260416779", "0795552428" → "0795552428". Loại bỏ mọi dấu cách, gạch nối, ngoặc, dấu cộng. Nếu không có số điện thoại nào trong tin nhắn, để là chuỗi rỗng "".
3. totalSessions: Tổng số buổi học mà học viên đăng kí (số nguyên, ví dụ "3 buổi" = 3, "5 buổi" = 5). Nếu không đề cập, để là 0.
4. startTime: Thời gian bắt đầu buổi tập (Định dạng chuỗi ISO: YYYY-MM-DDTHH:mm:ss.000Z). Bạn cần phân tích kỹ mốc thời gian HLV ghi (ví dụ: "3h30pm", "4:00 chiều", "sáng mai", "tối thứ 5"). Kết hợp với ngày hiện tại (${currentDateStr}) để quy đổi ra thời gian chính xác ở múi giờ Việt Nam (GMT+7, chuyển sang ISO UTC để lưu vào database).
5. duration: Thời lượng buổi tập tính bằng phút (dạng số, ví dụ "1h" = 60, "1h30p" = 90, "2h" = 120. Mặc định là 90).
6. court: Tên sân tập (ánh xạ chính xác sang 1 trong 2 giá trị sau: "Hào Anh tennis Coffee" hoặc "Sân Victoria resort"). Nếu không xác định rõ, mặc định chọn "Hào Anh tennis Coffee".

Yêu cầu định dạng trả về dưới dạng JSON:
{
  "studentName": "...",
  "studentPhone": "...",
  "totalSessions": số_buổi,
  "startTime": "YYYY-MM-DDTHH:mm:ss.000Z",
  "duration": số_phút,
  "court": "Hào Anh tennis Coffee" | "Sân Victoria resort"
}
Chỉ trả về JSON, không kèm giải thích hay Markdown tags nào khác bên ngoài JSON.
    `.trim();

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('[Groq Discord Parser] Phản hồi từ Groq:', content);

    const parsed = JSON.parse(content);
    return {
      studentName: parsed.studentName || '',
      studentPhone: (parsed.studentPhone || '').replace(/\D/g, ''),
      totalSessions: typeof parsed.totalSessions === 'number' ? parsed.totalSessions : 0,
      startTime: parsed.startTime || new Date().toISOString(),
      duration: typeof parsed.duration === 'number' ? parsed.duration : 90,
      court: parsed.court || 'Hào Anh tennis Coffee'
    };
  } catch (error) {
    console.error('[Groq Discord Parser] Lỗi khi gọi Groq API:', error);
    throw error;
  }
}

