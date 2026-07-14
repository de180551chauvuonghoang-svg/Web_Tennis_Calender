-- 1. Bảng lưu trữ thông tin đăng ký học viên (leads)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER,
    phone TEXT NOT NULL,
    level TEXT NOT NULL, -- 'Basic', 'Intermediate', 'Advanced'
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Scheduled', 'Cancelled'
    notes TEXT,
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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tạo index giúp tăng tốc độ truy vấn
CREATE INDEX idx_lessons_lead_id ON lessons(lead_id);
CREATE INDEX idx_lessons_reminder_sent ON lessons(reminder_sent);

-- Tắt RLS để đơn giản hóa giao tiếp trực tiếp
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
