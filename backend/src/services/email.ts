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

interface LessonScheduledDetails {
  studentName: string;
  studentEmail: string;
  coachName: string;
  startTime: string;
  endTime: string;
  court: string;
  mapsLink?: string;
  platform: string;
  isUpdate?: boolean;
}

/**
 * Gửi email thông báo đặt/sửa lịch học thành công
 */
export async function sendLessonScheduledEmail(details: LessonScheduledDetails): Promise<void> {
  if (!emailUser || !emailPass) {
    console.warn('[Email Service] Bỏ qua gửi email đặt lịch do thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env.');
    return;
  }

  const formatVietnameseDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dayName}, ngày ${day}/${month}/${year} vào lúc ${time}`;
  };

  const startFormatted = formatVietnameseDate(details.startTime);
  const endLocalTime = new Date(details.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const timeRangeText = `${startFormatted} - ${endLocalTime}`;

  const subjectText = details.isUpdate 
    ? '🎾 THÔNG BÁO: LỊCH TẬP TENNIS CỦA BẠN ĐÃ ĐƯỢC CẬP NHẬT!' 
    : '🎾 THÔNG BÁO: LỊCH TẬP TENNIS CỦA BẠN ĐÃ ĐƯỢC THIẾT LẬP THÀNH CÔNG!';

  const headerTitle = details.isUpdate 
    ? '📅 LỊCH TẬP TENNIS ĐÃ ĐƯỢC CẬP NHẬT' 
    : '📅 LỊCH TẬP TENNIS ĐÃ ĐƯỢC THIẾT LẬP';

  const welcomeText = details.isUpdate 
    ? 'Lịch tập luyện tennis của bạn đã được thay đổi/cập nhật thành công. Dưới đây là thông tin chi tiết buổi học mới:' 
    : 'Lịch tập luyện tennis của bạn đã được thiết lập thành công. Dưới đây là thông tin chi tiết về buổi tập của bạn:';

  const mailOptions = {
    from: `"Tennis Academy" <${emailUser}>`,
    to: details.studentEmail,
    subject: subjectText,
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
          .btn-maps {
            display: inline-block;
            background-color: #c2ff14;
            color: #000000;
            text-decoration: none;
            padding: 10px 20px;
            font-weight: 700;
            border-radius: 8px;
            margin-top: 10px;
            text-align: center;
          }
          .tips-list {
            padding-left: 20px;
            margin-top: 10px;
            color: #cbd5e1;
          }
          .tips-list li {
            margin-bottom: 8px;
          }
          .footer {
            background-color: #11151c;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #2d3748;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎾 TENNIS ACADEMY</div>
            <h1 class="title">${headerTitle}</h1>
          </div>
          <div class="content">
            <p class="welcome-msg">
              Xin chào <strong>${details.studentName}</strong>,<br><br>
              ${welcomeText}
            </p>
            
            <div class="info-card">
              <h3 class="info-title">🗓️ Chi tiết buổi học</h3>
              <div class="info-item">
                <span class="info-label">👤 Học viên:</span>
                <span class="info-value">${details.studentName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🧢 Huấn luyện viên:</span>
                <span class="info-value">${details.coachName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">⏰ Thời gian:</span>
                <span class="info-value">${timeRangeText}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📍 Sân tập:</span>
                <span class="info-value">${details.court}</span>
              </div>
              <div class="info-item">
                <span class="info-label">💬 Nhắc lịch qua:</span>
                <span class="info-value">${details.platform}</span>
              </div>
              
              ${details.mapsLink ? `
              <div style="text-align: center; margin-top: 15px;">
                <a href="${details.mapsLink}" target="_blank" class="btn-maps">🗺️ Xem bản đồ đường đi</a>
              </div>
              ` : ''}
            </div>

            <div style="background-color: rgba(194, 255, 20, 0.05); border-left: 4px solid #c2ff14; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
              <h4 style="margin-top: 0; color: #ffffff; font-weight: 700; font-size: 15px;">💡 Một số lưu ý chuẩn bị:</h4>
              <ul class="tips-list">
                <li>Hãy mặc trang phục thể thao thoải mái và giày thể thao chuyên dụng chơi tennis.</li>
                <li>Nên mang theo nước uống cá nhân hoặc bổ sung nước điện giải trong suốt buổi tập.</li>
                <li>Vui lòng **có mặt trước 5-10 phút** để khởi động thật kỹ cùng HLV, tránh chấn thương ngoài ý muốn.</li>
                <li>Nếu cần thay đổi giờ học hoặc có việc bận đột xuất, xin vui lòng liên hệ HLV trước **ít nhất 2 tiếng**.</li>
              </ul>
            </div>

            <p style="margin-bottom: 0; color: #cbd5e1;">
              Chúc bạn có một buổi tập tennis thật nhiều niềm vui và hiệu quả! Hẹn gặp lại bạn trên sân đấu.
            </p>
          </div>
          <div class="footer">
            Học viện Tennis Academy | Giáo án cá nhân hóa 1-kèm-1<br>
            Email này được gửi tự động khi HLV xác nhận lịch tập của bạn.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Đã gửi email xác nhận lịch tập (${details.isUpdate ? 'cập nhật' : 'mới'}) đến ${details.studentEmail}`);
}

interface LessonCancelledDetails {
  studentName: string;
  studentEmail: string;
  coachName: string;
  startTime: string;
  court: string;
}

/**
 * Gửi email thông báo hủy lịch tập đến học viên
 */
export async function sendLessonCancelledEmail(details: LessonCancelledDetails): Promise<void> {
  if (!emailUser || !emailPass) {
    console.warn('[Email Service] Bỏ qua gửi email hủy lịch do thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env.');
    return;
  }

  const formatVietnameseDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dayName}, ngày ${day}/${month}/${year} vào lúc ${time}`;
  };

  const timeFormatted = formatVietnameseDate(details.startTime);

  const mailOptions = {
    from: `"Tennis Academy" <${emailUser}>`,
    to: details.studentEmail,
    subject: '🔴 THÔNG BÁO: LỊCH TẬP TENNIS CỦA BẠN ĐÃ BỊ HỦY',
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
            border-bottom: 2px solid #ef4444;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #ef4444;
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
            color: #ef4444;
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(239, 68, 68, 0.1);
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔴 TENNIS ACADEMY</div>
            <h1 class="title">❌ LỊCH TẬP TENNIS ĐÃ BỊ HỦY</h1>
          </div>
          <div class="content">
            <p class="welcome-msg">
              Xin chào <strong>${details.studentName}</strong>,<br><br>
              Chúng tôi xin thông báo buổi tập tennis dưới đây của bạn đã bị hủy:
            </p>
            
            <div class="info-card">
              <h3 class="info-title">❌ Thông tin lịch bị hủy</h3>
              <div class="info-item">
                <span class="info-label">👤 Học viên:</span>
                <span class="info-value">${details.studentName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🧢 Huấn luyện viên:</span>
                <span class="info-value">${details.coachName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">⏰ Thời gian:</span>
                <span class="info-value">${timeFormatted}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📍 Sân tập:</span>
                <span class="info-value">${details.court}</span>
              </div>
            </div>

            <p style="margin-bottom: 0; color: #cbd5e1;">
              Nếu đây là sự nhầm lẫn hoặc bạn muốn lên lịch tập lại vào khung giờ khác, vui lòng liên hệ trực tiếp với Huấn luyện viên qua Zalo/WhatsApp để được sắp xếp lịch mới. Xin cảm ơn bạn!
            </p>
          </div>
          <div class="footer">
            Học viện Tennis Academy | Giáo án cá nhân hóa 1-kèm-1<br>
            Email này được gửi tự động khi HLV xác nhận hủy lịch tập của bạn.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Đã gửi email thông báo hủy lịch tập đến ${details.studentEmail}`);
}
