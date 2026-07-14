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
