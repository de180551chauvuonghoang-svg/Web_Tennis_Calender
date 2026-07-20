import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || '587');
const emailUser = process.env.EMAIL_USER || '';
const emailPass = process.env.EMAIL_PASS || '';

// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465, // true nếu port là 465, ngược lại false
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

interface RegistrationDetails {
  name: string;
  age?: number | string | null;
  phone: string;
  email: string;
  level: string;
  notes?: string;
  total_sessions?: number | string;
  session_hours?: number | string;
}

/**
 * Gửi email thông báo đăng ký thành công cho học viên mới
 */
export async function sendRegistrationSuccessEmail(details: RegistrationDetails): Promise<void> {
  if (!emailUser || !emailPass) {
    console.warn('[Email Service] Bỏ qua gửi email do thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env.');
    return;
  }

  const levelText = details.level === 'Basic' 
    ? 'Cơ bản (Beginner)' 
    : details.level === 'Intermediate' 
    ? 'Trung cấp (Intermediate)' 
    : 'Nâng cao (Advanced)';

  const sessionHoursText = details.session_hours ? `${details.session_hours} giờ/buổi` : 'Chưa đăng ký';
  const totalSessionsText = details.total_sessions ? `${details.total_sessions} buổi` : 'Chưa đăng ký';
  
  // Tách phần ghi chú thực tế từ form
  let cleanNotes = details.notes || '';
  cleanNotes = cleanNotes.replace(/\[Email:.*?\]\s*/g, '').replace(/\[Thời lượng:.*?\]\s*/g, '');

  const mailOptions = {
    from: `"Tennis Academy" <${emailUser}>`,
    to: details.email,
    subject: '🎾 ĐĂNG KÝ TƯ VẤN & ĐẶT LỊCH HỌC TENNIS THÀNH CÔNG!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0d0f12;
            color: #e2e8f0;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #1a1f26;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid #2d3748;
          }
          .header {
            background-color: #11151c;
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #c2ff14;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #c2ff14;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin: 10px 0 0 0;
          }
          .content {
            padding: 30px;
            line-height: 1.6;
          }
          .welcome-msg {
            font-size: 16px;
            margin-bottom: 25px;
            color: #cbd5e1;
          }
          .info-card {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .info-title {
            font-size: 16px;
            font-weight: 700;
            color: #c2ff14;
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(194, 255, 20, 0.1);
            padding-bottom: 8px;
          }
          .info-item {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
          }
          .info-item:last-child {
            margin-bottom: 0;
          }
          .info-label {
            color: #94a3b8;
            font-weight: 600;
          }
          .info-value {
            color: #ffffff;
            font-weight: 700;
            text-align: right;
          }
          .footer {
            background-color: #11151c;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #2d3748;
          }
          .highlight {
            color: #c2ff14;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎾 TENNIS ACADEMY</div>
            <h1 class="title">ĐĂNG KÝ HỌC THỬ THÀNH CÔNG</h1>
          </div>
          <div class="content">
            <p class="welcome-msg">
              Xin chào <strong>${details.name}</strong>,<br><br>
              Cảm ơn bạn đã quan tâm và đăng ký tư vấn lớp học tennis tại học viện của chúng tôi. Hệ thống đã ghi nhận yêu cầu của bạn. Dưới đây là thông tin chi tiết bạn đã đăng ký:
            </p>
            
            <div class="info-card">
              <h3 class="info-title">📋 Thông tin học viên</h3>
              <div class="info-item">
                <span class="info-label">👤 Họ và tên:</span>
                <span class="info-value">${details.name}</span>
              </div>
              ${details.age ? `
              <div class="info-item">
                <span class="info-label">🎂 Tuổi:</span>
                <span class="info-value">${details.age}</span>
              </div>
              ` : ''}
              <div class="info-item">
                <span class="info-label">📞 Số điện thoại:</span>
                <span class="info-value">${details.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">✉️ Email:</span>
                <span class="info-value">${details.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📊 Trình độ hiện tại:</span>
                <span class="info-value">${levelText}</span>
              </div>
              <div class="info-item">
                <span class="info-label">⏱️ Số buổi tập đăng ký:</span>
                <span class="info-value">${totalSessionsText}</span>
              </div>
              <div class="info-item">
                <span class="info-label">⏳ Thời lượng tập luyện:</span>
                <span class="info-value">${sessionHoursText}</span>
              </div>
              ${cleanNotes ? `
              <div style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 12px;">
                <span class="info-label" style="display: block; margin-bottom: 5px;">📝 Ghi chú của bạn:</span>
                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; font-style: italic; color: #cbd5e1;">"${cleanNotes}"</div>
              </div>
              ` : ''}
            </div>

            <p style="margin-bottom: 0; color: #cbd5e1;">
              🌟 <strong>Bước tiếp theo:</strong> Huấn luyện viên (HLV) của chúng tôi sẽ chủ động liên hệ trực tiếp với bạn qua Zalo/WhatsApp trong vòng 24 giờ tới để chốt lịch học cụ thể.
            </p>
          </div>
          <div class="footer">
            Học viện Tennis Academy | Giáo án cá nhân hóa 1-kèm-1<br>
            Bạn nhận được email này vì đã gửi yêu cầu đăng ký tại trang web của chúng tôi.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Đã gửi email đăng ký thành công đến ${details.email}`);
}
