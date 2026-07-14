import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Đảm bảo dotenv tải đúng từ thư mục gốc backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing credentials in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
