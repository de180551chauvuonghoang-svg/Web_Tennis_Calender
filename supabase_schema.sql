-- 1. Bảng lưu trữ thông tin đăng ký học viên (leads)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER,
    phone TEXT NOT NULL,
    level TEXT NOT NULL, -- 'Basic', 'Intermediate', 'Advanced'
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Scheduled', 'Cancelled'
    notes TEXT,
    total_sessions INTEGER DEFAULT 0, -- Tổng số buổi học đăng kí
    completed_sessions INTEGER DEFAULT 0, -- Số buổi học đã hoàn thành
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng lưu trữ buổi học đã lên lịch (lessons)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    coach_name TEXT NOT NULL,
    platform TEXT DEFAULT 'Zalo', -- 'Zalo', 'WhatsApp'
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    google_event_id TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false, -- Đã đánh dấu hoàn thành buổi học
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tạo index giúp tăng tốc độ truy vấn
CREATE INDEX idx_lessons_lead_id ON lessons(lead_id);
CREATE INDEX idx_lessons_reminder_sent ON lessons(reminder_sent);

-- Tắt RLS để đơn giản hóa giao tiếp trực tiếp
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;

-- 4. Bảng lưu trữ danh sách Huấn luyện viên / Admin (coaches)
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;

-- Thêm tài khoản admin Hoang Jayce mẫu
INSERT INTO coaches (name, email) 
VALUES ('Hoang Jayce', 'hoangjayce@gmail.com')
ON CONFLICT (email) DO NOTHING;

