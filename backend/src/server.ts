import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { supabase } from './services/supabase';
import { appendLeadToSheet, appendLessonToSheet } from './services/sheets';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEventColor } from './services/calendar';
import { sendDiscordBookingNotification } from './services/discord';
import { performOcr } from './services/groq';
import { startScheduler } from './scheduler';
import { startWhatsAppClient } from './services/whatsapp';
import { startDiscordBot } from './services/discordBot';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Cấu hình Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.ALLOWED_ORIGIN, // URL Vercel production (đặt trong .env)
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    // Cho phép tất cả *.vercel.app
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Cấu hình Multer để lưu ảnh trong Memory Buffer (phục vụ OCR)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

// ==================== ENDPOINTS ====================

/**
 * 1. Đăng ký học viên mới (Form học viên)
 */
app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const { name, age, phone, level, notes } = req.body;

    if (!name || !phone || !level) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (Tên, Số điện thoại, Trình độ).' });
    }

    const leadData = {
      name,
      age: age ? parseInt(age) : null,
      phone,
      level,
      status: 'New',
      notes: notes || ''
    };

    // a. Lưu vào Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Error]', error);
      return res.status(500).json({ error: 'Lỗi khi lưu thông tin vào cơ sở dữ liệu.' });
    }

    // b. Lưu vào Google Sheets trong nền (không làm nghẽn phản hồi khách hàng)
    appendLeadToSheet({
      name: lead.name,
      age: lead.age,
      phone: lead.phone,
      level: lead.level,
      notes: lead.notes,
      createdAt: new Date(lead.created_at).toLocaleString('vi-VN')
    }).catch(err => console.error('[Google Sheets Bg Error]', err));

    return res.status(201).json(lead);
  } catch (err: any) {
    console.error('[API Lead Register Error]', err);
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * 2. Lấy danh sách leads
 */
app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*, lessons(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách học viên.' });
    }

    return res.json(leads);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * 2b. Lấy danh sách huấn luyện viên (Coaches) từ Supabase
 */
app.get('/api/coaches', async (req: Request, res: Response) => {
  try {
    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Supabase Coaches Error]', error);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách HLV từ cơ sở dữ liệu.' });
    }

    return res.json(coaches);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * 2c. Đăng nhập cho Admin / Huấn luyện viên
 */
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    // Kiểm tra mật khẩu quản trị
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Mật khẩu quản trị không chính xác.' });
    }

    // Kiểm tra email trong bảng coaches
    const { data: coach, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('[Login Supabase Error]', error);
      return res.status(500).json({ error: 'Lỗi kiểm tra cơ sở dữ liệu.' });
    }

    if (!coach) {
      return res.status(404).json({ error: 'Email không thuộc danh sách Huấn luyện viên được cấp quyền.' });
    }

    return res.json({
      success: true,
      coach: {
        id: coach.id,
        name: coach.name,
        email: coach.email
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * 3. Cập nhật trạng thái/thông tin lead
 */
app.put('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Lỗi khi cập nhật thông tin.' });
    }

    // Nếu chuyển trạng thái thành Hoàn thành (Completed), đổi màu lịch Google sang màu xanh lá (Basil - colorId 10)
    if (updates.status === 'Completed') {
      try {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('google_event_id')
          .eq('lead_id', id)
          .maybeSingle();

        if (lesson && lesson.google_event_id) {
          await updateCalendarEventColor(lesson.google_event_id, '10');
        }
      } catch (calErr) {
        console.error('[Calendar Color Update Fail]', calErr);
      }
    }

    // Nếu chuyển trạng thái thành Hủy (Cancelled), xóa sự kiện trên Google Calendar và xóa record buổi học
    if (updates.status === 'Cancelled') {
      try {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('lead_id', id)
          .maybeSingle();

        if (lesson) {
          if (lesson.google_event_id) {
            await deleteCalendarEvent(lesson.google_event_id);
          }
          await supabase
            .from('lessons')
            .delete()
            .eq('id', lesson.id);
        }
      } catch (calErr) {
        console.error('[Calendar Cancel Fail]', calErr);
      }
    }

    return res.json(lead);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * 4. Xóa vĩnh viễn lead
 */
app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Lỗi khi xóa học viên.' });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * 5. Lên lịch tập và tạo sự kiện Google Calendar
 */
app.post('/api/lessons', async (req: Request, res: Response) => {
  try {
    const { leadId, coachName, platform, startTime, endTime, court, lat, lng } = req.body;

    if (!leadId || !coachName || !startTime || !endTime) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc để lên lịch dạy.' });
    }

    // a. Lấy thông tin lead từ Database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Không tìm thấy học viên tương ứng.' });
    }

    // a2. Kiểm tra nếu học viên này đã có lịch tập trước đó thì xóa lịch cũ trước khi ghi nhận lịch mới
    const { data: existingLesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (existingLesson) {
      if (existingLesson.google_event_id) {
        await deleteCalendarEvent(existingLesson.google_event_id);
      }
      await supabase
        .from('lessons')
        .delete()
        .eq('id', existingLesson.id);
    }

    // Hardcoded court locations with exact addresses
    const COURT_LOCATIONS: Record<string, { address: string; mapsLink: string }> = {
      'Hào Anh tennis Coffee': {
        address: 'Tennis & Coffee Hào Anh Hội An, V8JV+W45, Lý Thường Kiệt, Hội An Đông, Đà Nẵng, Vietnam',
        mapsLink: 'https://www.google.com/maps/search/?api=1&query=15.8818113%2C108.3403445',
      },
      'Sân Victoria resort': {
        address: 'V9W9+8GM Hoi An Dong, Da Nang, Vietnam',
        mapsLink: 'https://www.google.com/maps/search/?api=1&query=V9W9%2B8GM+Hoi+An+Dong+Da+Nang+Vietnam',
      },
    };

    const courtInfo = COURT_LOCATIONS[court as string];
    const mapsLink = courtInfo?.mapsLink || (court ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court)}` : '');
    const courtAddress = courtInfo?.address || court || 'Chưa xác định';

    // b. Tạo lịch trên Google Calendar
    const calendarResult = await createCalendarEvent({
      studentName: lead.name,
      phone: lead.phone,
      level: lead.level,
      coachName,
      startTime,
      endTime,
      notes: lead.notes,
      location: courtAddress
    });

    // c. Lưu buổi học vào Supabase
    const lessonData: any = {
      lead_id: leadId,
      coach_name: coachName,
      platform: platform || 'Zalo',
      start_time: startTime,
      end_time: endTime,
      google_event_id: calendarResult.eventId,
      reminder_sent: false
    };

    // Gán các trường bổ sung
    lessonData.court = court || null;
    lessonData.maps_link = mapsLink || null;

    let insertResult = await supabase
      .from('lessons')
      .insert([lessonData])
      .select()
      .maybeSingle();

    // Fallback nếu cột court/maps_link chưa tồn tại trong Supabase
    if (insertResult.error) {
      console.warn('[Supabase Insert Warning] Thử lưu buổi học không có cột court/maps_link...');
      const fallbackData = {
        lead_id: leadId,
        coach_name: coachName,
        platform: platform || 'Zalo',
        start_time: startTime,
        end_time: endTime,
        google_event_id: calendarResult.eventId,
        reminder_sent: false
      };
      insertResult = await supabase
        .from('lessons')
        .insert([fallbackData])
        .select()
        .maybeSingle();
    }

    if (insertResult.error || !insertResult.data) {
      console.error('[Lesson Db Error]', insertResult.error);
      return res.status(500).json({ error: 'Lỗi khi lưu thông tin lịch dạy.' });
    }

    const lesson = insertResult.data;

    // d. Cập nhật trạng thái lead thành 'Scheduled'
    await supabase
      .from('leads')
      .update({ status: 'Scheduled' })
      .eq('id', leadId);

    // e. Gửi thông báo đến Discord Webhook
    sendDiscordBookingNotification({
      studentName: lead.name,
      phone: lead.phone,
      platform: platform || 'Zalo',
      coachName,
      startTime,
      endTime,
      notes: lead.notes,
      court: court || 'Chưa xác định',
      courtAddress: courtAddress || undefined,
      mapsLink: mapsLink
    }).catch(err => console.error('[Discord Webhook Bg Error]', err));

    // f. Ghi nhận vào Google Sheets đối soát
    const durationMins = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
    appendLessonToSheet({
      studentName: lead.name,
      phone: lead.phone,
      coachName,
      startTime,
      duration: durationMins,
      court: court || 'Chưa xác định',
      mapsLink: mapsLink || 'Không có',
      createdAt: new Date().toISOString()
    }).catch(err => console.error('[Google Sheets Lessons Error]', err));

    return res.status(201).json({ lesson, htmlLink: calendarResult.htmlLink });
  } catch (err: any) {
    console.error('[API Book Lesson Error]', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi thiết lập lịch học.' });
  }
});

/**
 * 6. Quét ảnh trích xuất liên hệ (OCR qua Groq Vision)
 */
app.post('/api/ocr', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy tệp ảnh được tải lên.' });
    }

    const { buffer, mimetype } = req.file;

    // Gọi dịch vụ OCR
    const ocrResult = await performOcr(buffer, mimetype);

    return res.json(ocrResult);
  } catch (err: any) {
    console.error('[API OCR Error]', err);
    return res.status(500).json({ error: 'Gặp lỗi trong quá trình xử lý OCR.' });
  }
});


// Serving frontend built files in production environment (if directory exists)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log('[Server] Đang phục vụ tệp tĩnh Frontend từ thư mục:', frontendDistPath);
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  console.log('[Server] Chạy chế độ chỉ API (Backend độc lập). Không phục vụ tệp tĩnh.');
  
  // Trả về JSON chào mừng tại root để Render check liveness thành công
  app.get('/', (req, res) => {
    res.json({ status: 'healthy', message: 'Web Tennis Calendar API is running.' });
  });
}

// ==================== KHỞI CHẠY SERVER ====================

app.listen(PORT, () => {
  console.log(`[Server] Web Tennis Calendar đang chạy tại cổng http://localhost:${PORT}`);
  // Khởi chạy cron job quét nhắc lịch
  startScheduler();

  // Khởi chạy Discord Bot
  try {
    startDiscordBot();
  } catch (err) {
    console.error('[Server] Lỗi khi khởi chạy Discord Bot:', err);
  }

  // Khởi chạy WhatsApp Client
  try {
    startWhatsAppClient();
  } catch (err) {
    console.error('[Server] Lỗi khi khởi chạy WhatsApp Client:', err);
  }
});
// Trigger reload: refine contacts check by filtering for actual phonebook contacts




