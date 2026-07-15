import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  UploadCloud, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle, 
  Trash2, 
  Award,
  Activity,
  AlertCircle,
  Lock,
  LogOut,
  Mail,
  Globe
} from 'lucide-react';

// Backend URL
// Backend URL — dùng VITE_API_URL khi deploy production, localhost khi dev
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';



interface Lead {
  id: string;
  name: string;
  age: number | null;
  phone: string;
  level: string;
  status: 'New' | 'Contacted' | 'Scheduled' | 'Completed' | 'Cancelled';
  notes: string;
  created_at: string;
  lessons?: {
    id: string;
    coach_name: string;
    platform: string;
    start_time: string;
    end_time: string;
  }[];
}

const TRANSLATIONS = {
  vi: {
    title: "Web Tennis Calendar",
    subtitle: "Hệ thống Quản lý & Đặt lịch Tennis hiện đại",
    tabStudent: "Học viên đăng ký",
    tabAdmin: "Quản trị viên (HLV)",
    badgeIntro: "Khóa học chất lượng cao",
    heroHeading: "Đánh thức đam mê",
    heroHeadingAccent: "Tennis chuyên nghiệp",
    heroDesc: "Đăng ký ngay lớp học thử cá nhân 1-kèm-1 cùng huấn luyện viên có chứng chỉ chuyên môn. Chúng tôi cam kết giáo án cá nhân hóa giúp bạn nâng trình nhanh chóng và tránh chấn thương tối đa.",
    feature1Title: "1-kèm-1",
    feature1Desc: "Tập trung cao nhất vào kỹ thuật cá nhân của học viên.",
    feature2Title: "Linh hoạt",
    feature2Desc: "Tùy chỉnh lịch tập dựa trên thời gian rảnh rỗi của bạn.",
    formTitle: "Đăng ký Tư vấn & Đặt lịch",
    formSubtitle: "Điền thông tin cơ bản, HLV sẽ liên hệ trực tiếp chốt giờ học.",
    labelName: "Họ và tên *",
    placeholderName: "Nguyễn Văn A",
    labelAge: "Tuổi",
    placeholderAge: "25",
    labelPhone: "Số điện thoại (Zalo/WhatsApp) *",
    placeholderPhone: "0901234567",
    labelLevel: "Trình độ hiện tại",
    levelBasic: "Cơ bản",
    levelIntermediate: "Trung cấp",
    levelAdvanced: "Nâng cao",
    labelNotes: "Ghi chú mong muốn",
    placeholderNotes: "Ví dụ: Rảnh vào cuối tuần, cần cải thiện kỹ thuật giao bóng,...",
    btnSubmit: "Gửi Đăng ký Lịch học",
    btnSubmitting: "Đang gửi đăng ký...",
    successTitle: "Gửi Thông tin Thành công!",
    successDesc: "Yêu cầu đã được lưu nhận. HLV của chúng tôi sẽ liên lạc với bạn qua Zalo/WhatsApp trong thời gian sớm nhất.",
    btnAnother: "Đăng ký cho học viên khác",
    errMissing: "Vui lòng điền Họ tên và Số điện thoại.",
    errConnect: "Không thể kết nối đến máy chủ."
  },
  en: {
    title: "Web Tennis Calendar",
    subtitle: "Modern Tennis Booking & Management System",
    tabStudent: "Student Register",
    tabAdmin: "Coaches & Admins",
    badgeIntro: "High Quality Courses",
    heroHeading: "Unleash Your Passion",
    heroHeadingAccent: "Professional Tennis",
    heroDesc: "Register now for a private 1-on-1 trial lesson with certified professional coaches. We promise personalized lesson plans to help you progress quickly and avoid injuries.",
    feature1Title: "1-on-1",
    feature1Desc: "Maximum focus on the student's personal technique.",
    feature2Title: "Flexible",
    feature2Desc: "Customize your schedule based on your spare time.",
    formTitle: "Consultation & Booking",
    formSubtitle: "Fill in basic info, the coach will contact you to finalize the schedule.",
    labelName: "Full Name *",
    placeholderName: "John Doe",
    labelAge: "Age",
    placeholderAge: "25",
    labelPhone: "Phone Number (Zalo/WhatsApp) *",
    placeholderPhone: "+84901234567",
    labelLevel: "Current Level",
    levelBasic: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    labelNotes: "Special Notes / Preferences",
    placeholderNotes: "e.g., Available on weekends, want to improve serving technique,...",
    btnSubmit: "Submit Booking Request",
    btnSubmitting: "Submitting request...",
    successTitle: "Registration Successful!",
    successDesc: "Your request has been received. Our coach will contact you via Zalo/WhatsApp as soon as possible.",
    btnAnother: "Register another student",
    errMissing: "Please fill in both Full Name and Phone Number.",
    errConnect: "Unable to connect to the server."
  }
};

interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function CustomSelect({ value, options, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="custom-select-trigger"
        style={{ borderColor: isOpen ? 'var(--accent-color)' : 'var(--border-color)' }}
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.2s',
          fontSize: '10px',
          opacity: 0.7
        }}>▼</span>
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            backgroundColor: '#14161c',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 100,
            maxHeight: '200px',
            overflowY: 'auto',
            backdropFilter: 'blur(10px)',
            padding: '4px'
          }}
        >
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`custom-select-option ${opt.value === value ? 'active' : ''}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Hardcoded court locations
const COURT_LOCATIONS: Record<string, { address: string; mapsLink: string; lat: number; lng: number }> = {
  'Hào Anh tennis Coffee': {
    address: 'Tennis & Coffee Hào Anh Hội An, V8JV+W45, Lý Thường Kiệt, Hội An Đông, Đà Nẵng, Vietnam',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=15.8818113%2C108.3403445',
    lat: 15.8818113,
    lng: 108.3403445,
  },
  'Sân Victoria resort': {
    address: 'V9W9+8GM Hoi An Dong, Da Nang, Vietnam',
    mapsLink: 'https://www.google.com/maps/search/?api=1&query=V9W9%2B8GM+Hoi+An+Dong+Da+Nang+Vietnam',
    lat: 16.058,
    lng: 108.228,
  },
};

export default function App() {
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  // Translations helper
  const t = TRANSLATIONS[lang];
  
  // Client (Student) States
  const [clientForm, setClientForm] = useState({
    name: '',
    age: '',
    phone: '',
    level: 'Basic',
    notes: ''
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [clientSuccess, setClientSuccess] = useState(false);
  const [clientError, setClientError] = useState('');

  // Admin Login States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('adminLoggedIn') === 'true';
  });
  const [currentCoach, setCurrentCoach] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('adminCoach');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLogining, setIsLogining] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [coaches, setCoaches] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ phone: string; platform: string } | null>(null);
  const [ocrError, setOcrError] = useState('');
  
  // Scheduling Modal/Section States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [schedulerForm, setSchedulerForm] = useState({
    coachName: 'Hoang Jayce',
    platform: 'Zalo',
    startTime: '',
    duration: '90',
    court: 'Hào Anh tennis Coffee',
    lat: 10.841398,
    lng: 106.772583,
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [copiedCourt, setCopiedCourt] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fetch coaches & warm up Render backend on app mount
  useEffect(() => {
    // Background ping to wake up Render (fire-and-forget)
    fetch(API_BASE.replace('/api', '')).catch(() => {});
    
    // Pre-fetch coaches early so they are ready for the scheduler form & dashboard
    fetchCoaches();
  }, []);

  // Fetch leads on admin dashboard load
  useEffect(() => {
    if (view === 'admin' && isLoggedIn) {
      fetchLeads();
    }
  }, [view, isLoggedIn]);

  // Listener for Clipboard Paste (Ctrl+V) to capture screenshots
  useEffect(() => {
    if (view !== 'admin' || !isLoggedIn) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processOcr(file);
            break; // Process the first image found
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [view, isLoggedIn]);

  // Pre-fill scheduler form when a lead is selected for scheduling/editing
  useEffect(() => {
    if (selectedLead) {
      const existing = selectedLead.lessons?.[0];
      if (existing) {
        // Helper to format ISO to YYYY-MM-DDTHH:mm
        const toDatetimeLocal = (isoStr: string) => {
          const date = new Date(isoStr);
          if (isNaN(date.getTime())) return '';
          const tzOffset = date.getTimezoneOffset() * 60000;
          return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
        };

        // Calculate duration in minutes
        const start = new Date(existing.start_time);
        const end = new Date(existing.end_time);
        const diffMins = Math.round((end.getTime() - start.getTime()) / (60 * 1000));

         setSchedulerForm({
          coachName: existing.coach_name || (coaches[0]?.name || 'Hoang Jayce'),
          platform: existing.platform || 'Zalo',
          startTime: toDatetimeLocal(existing.start_time),
          duration: String(diffMins || '90'),
          court: (existing as any).court || 'Hào Anh tennis Coffee',
          lat: (existing as any).lat || 10.841398,
          lng: (existing as any).lng || 106.772583,
        });
      } else {
        // Reset to default values for new booking
        setSchedulerForm({
          coachName: coaches[0]?.name || 'Hoang Jayce',
          platform: 'Zalo',
          startTime: '',
          duration: '90',
          court: 'Hào Anh tennis Coffee',
          lat: 10.841398,
          lng: 106.772583,
        });
      }
    }
  }, [selectedLead, coaches]);


  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch(`${API_BASE}/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`${API_BASE}/coaches`);
      if (response.ok) {
        const data = await response.json();
        setCoaches(data);
        if (data.length > 0) {
          setSchedulerForm(prev => ({ ...prev, coachName: data[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };

  // Handle Admin Login Submit
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Vui lòng nhập Email và Mật khẩu.');
      return;
    }

    setIsLogining(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (response.ok) {
        const result = await response.json();
        setIsLoggedIn(true);
        setCurrentCoach(result.coach);
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminCoach', JSON.stringify(result.coach));
        
        // Reset login form fields
        setLoginEmail('');
        setLoginPassword('');
      } else {
        const err = await response.json();
        setLoginError(err.error || 'Sai thông tin đăng nhập.');
      }
    } catch (error) {
      setLoginError('Lỗi kết nối đến máy chủ.');
    } finally {
      setIsLogining(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    setCurrentCoach(null);
    setOcrPreviewUrl(null);
    setOcrResult(null);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminCoach');
    setLeads([]);
    setCoaches([]);
  };

  // Handle Client Form Submit
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      setClientError(t.errMissing);
      return;
    }
    
    setIsSubmittingLead(true);
    setClientError('');
    setClientSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      });

      if (response.ok) {
        setClientSuccess(true);
        setClientForm({ name: '', age: '', phone: '', level: 'Basic', notes: '' });
      } else {
        const err = await response.json();
        setClientError(err.error || 'Error submitting form.');
      }
    } catch (err) {
      setClientError(t.errConnect);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Core OCR process helper
  const processOcr = async (file: File) => {
    setOcrLoading(true);
    setOcrResult(null);
    setOcrError('');

    // Generate local preview URL to display the full image
    const preview = URL.createObjectURL(file);
    setOcrPreviewUrl(preview);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/ocr`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setOcrResult(result);
      } else {
        const err = await response.json();
        setOcrError(err.error || 'OCR xử lý ảnh thất bại.');
      }
    } catch (error) {
      setOcrError('Lỗi kết nối khi gửi ảnh OCR.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Handle OCR Image Upload from File Input
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processOcr(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Change Lead Status
  const handleUpdateStatus = async (id: string, newStatus: Lead['status']) => {
    try {
      const response = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle Delete Lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học viên này vĩnh viễn?')) return;
    try {
      const response = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchLeads();
        if (selectedLead?.id === id) {
          setSelectedLead(null);
        }
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  // Handle Book Lesson (Schedule Event)
  const handleScheduleLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsScheduling(true);
    setScheduleSuccess(false);

    try {
      const start = new Date(schedulerForm.startTime);
      const end = new Date(start.getTime() + parseInt(schedulerForm.duration) * 60 * 1000);

      const response = await fetch(`${API_BASE}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          coachName: schedulerForm.coachName,
          platform: schedulerForm.platform,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          court: schedulerForm.court,
          lat: schedulerForm.lat,
          lng: schedulerForm.lng
        })
      });

      if (response.ok) {
        setScheduleSuccess(true);
        fetchLeads(); // Refresh leads
        setTimeout(() => {
          setSelectedLead(null);
          setScheduleSuccess(false);
          setSchedulerForm({
            coachName: coaches.length > 0 ? coaches[0].name : 'Hoang Jayce',
            platform: 'Zalo',
            startTime: '',
            duration: '90',
            court: 'Hào Anh tennis Coffee',
            lat: 10.841398,
            lng: 106.772583
          });
        }, 2500);
      } else {
        const err = await response.json();
        alert(err.error || 'Đặt lịch thất bại.');
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ để đặt lịch.');
    } finally {
      setIsScheduling(false);
    }
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // hour 0 is 12
    const strHours = String(hours).padStart(2, '0');
    
    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
  };

  const getZaloLink = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return `https://zalo.me/${clean}`;
  };

  const getWhatsAppLink = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    const standard = clean.startsWith('0') ? '84' + clean.slice(1) : clean;
    return `https://wa.me/${standard}`;
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header / Navbar */}
      <header className="glass" style={{ margin: '20px auto', maxWidth: '1200px', width: '95%', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-color) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: '0 0 15px var(--accent-glow)',
          }}>
            <img 
              src="/logo.png" 
              alt="Web Tennis Logo" 
              style={{ 
                width: '54px', 
                height: '54px', 
                objectFit: 'contain', 
                borderRadius: '50%',
                backgroundColor: '#0c101b',
              }} 
            />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.5px', color: '#fff', lineHeight: '1.2' }}>{t.title}</h1>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', fontWeight: '500' }}>{t.subtitle}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Language Switcher */}
          <button 
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={14} /> {lang === 'vi' ? 'EN' : 'VI'}
          </button>

          {/* View toggle tabs */}
          <div style={{ display: 'flex', gap: '10px', borderLeft: '1px solid var(--border-color)', paddingLeft: '15px' }}>
            <button 
              onClick={() => setView('client')}
              className="tab-btn"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s',
                backgroundColor: view === 'client' ? 'var(--accent-color)' : 'transparent',
                color: view === 'client' ? '#000' : 'var(--text-primary)',
                boxShadow: view === 'client' ? '0 0 10px var(--accent-glow)' : 'none'
              }}
            >
              {t.tabStudent}
            </button>
            <button 
              onClick={() => setView('admin')}
              className="tab-btn"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s',
                backgroundColor: view === 'admin' ? 'var(--accent-color)' : 'transparent',
                color: view === 'admin' ? '#000' : 'var(--text-primary)',
                boxShadow: view === 'admin' ? '0 0 10px var(--accent-glow)' : 'none'
              }}
            >
              {t.tabAdmin}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', width: '95%', margin: '0 auto' }}>
        
        {/* ================= CLIENT (STUDENT) VIEW ================= */}
        {view === 'client' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px', alignItems: 'center' }} className="responsive-grid">
            
            {/* Left intro panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', padding: '6px 14px', borderRadius: '30px', width: 'fit-content', fontWeight: '700', fontSize: '13px' }}>
                <Award size={16} /> {t.badgeIntro}
              </div>
              <h2 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', color: '#fff' }}>
                {t.heroHeading} <br />
                <span style={{ color: 'var(--accent-color)', textShadow: '0 0 20px rgba(194,255,20,0.15)' }}>{t.heroHeadingAccent}</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                {t.heroDesc}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className="glass" style={{ padding: '15px', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '20px' }}>{t.feature1Title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.feature1Desc}</p>
                </div>
                <div className="glass" style={{ padding: '15px', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '20px' }}>{t.feature2Title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.feature2Desc}</p>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="glass" style={{ padding: '40px', borderRadius: '24px' }}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800' }}>{t.formTitle}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t.formSubtitle}</p>
              </div>

              {clientSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', textAlign: 'center', gap: '15px' }}>
                  <div style={{ color: 'var(--success-color)', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={40} />
                  </div>
                  <h4 style={{ fontSize: '20px', fontWeight: '700' }}>{t.successTitle}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px' }}>
                    {t.successDesc}
                  </p>
                  <button 
                    onClick={() => setClientSuccess(false)}
                    style={{ marginTop: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {t.btnAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {clientError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', padding: '10px 15px', borderRadius: '8px', fontSize: '13px' }}>
                      <AlertCircle size={16} /> {clientError}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t.labelName}</label>
                    <input 
                      type="text" 
                      placeholder={t.placeholderName}
                      value={clientForm.name}
                      onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t.labelAge}</label>
                      <input 
                        type="number" 
                        placeholder={t.placeholderAge}
                        value={clientForm.age}
                        onChange={e => setClientForm({ ...clientForm, age: e.target.value })}
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t.labelPhone}</label>
                      <input 
                        type="tel" 
                        placeholder={t.placeholderPhone}
                        value={clientForm.phone}
                        onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none' }}
                        required
                      />
                    </div>
                  </div>

                  {/* Level Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t.labelLevel}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {['Basic', 'Intermediate', 'Advanced'].map(lvl => (
                        <div 
                          key={lvl}
                          onClick={() => setClientForm({ ...clientForm, level: lvl })}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid',
                            borderColor: clientForm.level === lvl ? 'var(--accent-color)' : 'var(--border-color)',
                            backgroundColor: clientForm.level === lvl ? 'var(--accent-glow)' : 'transparent',
                            color: clientForm.level === lvl ? 'var(--accent-color)' : 'var(--text-primary)'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '13px', fontWeight: '700' }}>
                            {lvl === 'Basic' ? t.levelBasic : lvl === 'Intermediate' ? t.levelIntermediate : t.levelAdvanced}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.7 }}>{lvl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t.labelNotes}</label>
                    <textarea 
                      placeholder={t.placeholderNotes}
                      value={clientForm.notes}
                      onChange={e => setClientForm({ ...clientForm, notes: e.target.value })}
                      rows={3}
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingLead}
                    style={{
                      marginTop: '10px',
                      backgroundColor: 'var(--accent-color)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '14px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '15px',
                      boxShadow: '0 4px 15px var(--accent-glow)',
                      transition: 'all 0.3s'
                    }}
                  >
                    {isSubmittingLead ? t.btnSubmitting : t.btnSubmit}
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

        {/* ================= ADMIN VIEW (HLV/COACH) ================= */}
        {view === 'admin' && (
          <div>
            {/* 1. LOGIN SCREEN */}
            {!isLoggedIn ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', borderRadius: '50%', width: '60px', height: '60px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                      <Lock size={28} />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: '800' }}>Huấn luyện viên Đăng nhập</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Cung cấp Email HLV và mật khẩu truy cập hệ thống quản trị.</p>
                  </div>

                  {loginError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
                      <AlertCircle size={16} /> {loginError}
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Email huấn luyện viên</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-secondary)' }} />
                        <input 
                          type="email" 
                          placeholder="hoangjayce@gmail.com"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px 12px 42px', color: '#fff', fontSize: '14px', outline: 'none', width: '100%' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mật khẩu truy cập</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-secondary)' }} />
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px 12px 42px', color: '#fff', fontSize: '14px', outline: 'none', width: '100%' }}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLogining}
                      style={{
                        marginTop: '10px',
                        backgroundColor: 'var(--accent-color)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '14px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '15px',
                        boxShadow: '0 4px 15px var(--accent-glow)',
                        transition: 'all 0.3s'
                      }}
                    >
                      {isLogining ? 'Đang kiểm tra...' : 'Đăng nhập vào Dashboard'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              
              /* 2. LOGGED IN ADMIN DASHBOARD */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Admin info & Logout Bar */}
                <div className="glass" style={{ padding: '12px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                      👤
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Xin chào huấn luyện viên:</span>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{currentCoach?.name} ({currentCoach?.email})</h4>
                    </div>
                  </div>
                  <button 
                    onClick={handleAdminLogout}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: 'var(--error-color)',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>

                {/* Top Cards row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="responsive-grid">
                  <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '16px' }}>
                    <div style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', borderRadius: '12px', padding: '12px' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Tổng số học viên (Leads)</h4>
                      <span style={{ fontSize: '28px', fontWeight: '800' }}>{leads.length}</span>
                    </div>
                  </div>
                  
                  <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '16px' }}>
                    <div style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--success-color)', borderRadius: '12px', padding: '12px' }}>
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Đã lên lịch tập</h4>
                      <span style={{ fontSize: '28px', fontWeight: '800' }}>
                        {leads.filter(l => l.status === 'Scheduled').length}
                      </span>
                    </div>
                  </div>

                  <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '16px' }}>
                    <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', borderRadius: '12px', padding: '12px' }}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Lead chưa xử lý</h4>
                      <span style={{ fontSize: '28px', fontWeight: '800' }}>
                        {leads.filter(l => l.status === 'New').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OCR & Quick Link Section */}
                <div className="glass" style={{ padding: '25px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800' }}>📸 Công cụ Trích xuất Thông tin & Liên hệ nhanh (OCR)</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tải ảnh chụp số điện thoại lên hoặc dán ảnh trực tiếp từ clipboard (Ctrl+V). Trợ lý AI Groq sẽ đọc ảnh và trả về link chat trực tiếp.</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '25px' }} className="responsive-grid">
                    
                    {/* Image upload area */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: '12px',
                        padding: '30px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '200px'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color)')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleOcrUpload} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <UploadCloud size={40} style={{ color: 'var(--text-secondary)' }} />
                        <p style={{ fontWeight: '600', fontSize: '14px' }}>
                          {ocrLoading ? 'Đang phân tích hình ảnh bằng Groq...' : 'Tải lên hoặc Nhấn Ctrl+V để Dán ảnh'}
                        </p>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hỗ trợ JPG, PNG, WEBP</span>
                      </div>
                    </div>

                    {/* Result screen */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '15px' }}>
                      
                      {/* FULL PREVIEW OF UPLOADED/PASTED IMAGE */}
                      {ocrPreviewUrl && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', width: '100%' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '5px 10px', display: 'block', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', fontWeight: '600' }}>Hình ảnh đang quét (Đầy đủ):</span>
                          <div style={{ padding: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img 
                              src={ocrPreviewUrl} 
                              alt="Uploaded Screenshot" 
                              style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', display: 'block', borderRadius: '4px' }} 
                            />
                          </div>
                        </div>
                      )}

                      {ocrLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                          <span>Trợ lý Groq Vision đang nhận diện số điện thoại...</span>
                        </div>
                      )}

                      {ocrError && (
                        <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
                          <AlertCircle size={18} /> <span>{ocrError}</span>
                        </div>
                      )}

                      {!ocrLoading && !ocrResult && !ocrError && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          <p>Chưa có ảnh nào được tải lên hoặc dán từ clipboard.</p>
                          <p style={{ fontSize: '11px', marginTop: '5px' }}>Hãy thử tải ảnh danh thiếp hoặc nhấn **Ctrl+V** để dán ảnh chụp màn hình hội thoại.</p>
                        </div>
                      )}

                      {ocrResult && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px' }}>
                          <h4 style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '15px' }}>⚡ KẾT QUẢ TRÍCH XUẤT OCR THÀNH CÔNG:</h4>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Số điện thoại</span>
                              <strong style={{ fontSize: '16px', color: '#fff' }}>{ocrResult.phone || 'Không tìm thấy'}</strong>
                            </div>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Nền tảng phát hiện</span>
                              <strong style={{ fontSize: '16px', color: '#fff' }}>{ocrResult.platform}</strong>
                            </div>
                          </div>

                      {ocrResult.phone && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <a 
                            href={getZaloLink(ocrResult.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              backgroundColor: '#0068FF',
                              color: '#fff',
                              textDecoration: 'none',
                              padding: '10px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '13px',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <MessageSquare size={16} /> Liên hệ Zalo
                          </a>
                          
                          <a 
                            href={getWhatsAppLink(ocrResult.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              backgroundColor: '#25D366',
                              color: '#fff',
                              textDecoration: 'none',
                              padding: '10px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '13px',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <PhoneCall size={16} /> Liên hệ WhatsApp
                          </a>
                        </div>
                      )}

                          <button 
                            onClick={() => {
                              setClientForm({
                                name: 'Học viên OCR',
                                age: '',
                                phone: ocrResult.phone,
                                level: 'Basic',
                                notes: `Khách hàng trích xuất qua ảnh OCR. Nền tảng: ${ocrResult.platform}`
                              });
                              setView('client');
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              borderRadius: '8px',
                              padding: '10px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              marginTop: '5px'
                            }}
                          >
                            + Tạo học viên mới với thông tin này
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                </div>

                {/* List and scheduler layout */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedLead ? '1.5fr 1fr' : '1fr', gap: '30px', transition: 'all 0.3s' }}>
                  
                  {/* Main table list */}
                  <div className="glass" style={{ padding: '25px', borderRadius: '16px', overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '15px' }}>👥 Danh sách Đăng ký Học viên</h3>
                    
                    {isLoadingLeads ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                        <span>Đang tải thông tin...</span>
                      </div>
                    ) : leads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <span>Chưa có học viên nào đăng ký.</span>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Họ tên</th>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Tuổi</th>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Số điện thoại</th>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Trình độ</th>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Ngày Đăng ký</th>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Trạng thái</th>
                              <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.map(lead => {
                              const isCompleted = lead.status === 'Completed';
                              const isCancelled = lead.status === 'Cancelled';
                              const isScheduled = lead.status === 'Scheduled';
                              const rowStyle = isCompleted ? { opacity: 0.4, textDecoration: 'line-through' } : {};

                              return (
                                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                  <td style={{ padding: '14px 10px', fontWeight: '600', whiteSpace: 'nowrap', ...rowStyle }}>{lead.name}</td>
                                  <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', ...rowStyle }}>{lead.age || '—'}</td>
                                  <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', ...rowStyle }}>{lead.phone}</td>
                                  <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', opacity: isCompleted ? 0.4 : 1 }}>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: lead.level === 'Basic' ? 'rgba(194,255,20,0.1)' : lead.level === 'Intermediate' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)',
                                      color: lead.level === 'Basic' ? 'var(--accent-color)' : lead.level === 'Intermediate' ? '#3b82f6' : '#ec4899',
                                      whiteSpace: 'nowrap',
                                      textDecoration: isCompleted ? 'line-through' : 'none'
                                    }}>
                                      {lead.level === 'Basic' ? 'Cơ bản' : lead.level === 'Intermediate' ? 'Trung cấp' : 'Nâng cao'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 10px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', ...rowStyle }}>
                                    {formatDate(lead.created_at)}
                                  </td>
                                  <td style={{ padding: '14px 10px', whiteSpace: 'nowrap' }}>
                                    {isCompleted ? (
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: 'var(--success-color)',
                                        backgroundColor: 'rgba(34,197,94,0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        ✓ Hoàn Thành
                                      </span>
                                    ) : isCancelled ? (
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: 'var(--error-color)',
                                        backgroundColor: 'rgba(239,68,68,0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        ✗ Đã Hủy
                                      </span>
                                    ) : (
                                      <select 
                                        value={lead.status}
                                        onChange={e => handleUpdateStatus(lead.id, e.target.value as Lead['status'])}
                                        style={{
                                          backgroundColor: 'rgba(0,0,0,0.3)',
                                          color: lead.status === 'Scheduled' ? 'var(--accent-color)' : lead.status === 'New' ? '#3b82f6' : lead.status === 'Contacted' ? '#eab308' : '#94a3b8',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '6px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          outline: 'none',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <option value="New">Mới</option>
                                        <option value="Contacted">Đã Liên Hệ</option>
                                        <option value="Scheduled">Đã Lên Lịch</option>
                                      </select>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                      {/* Lên lịch / Sửa lịch Button */}
                                      <button 
                                        onClick={() => setSelectedLead(lead)}
                                        style={{
                                          backgroundColor: (isScheduled || isCompleted) ? '#eab308' : 'var(--accent-color)',
                                          color: '#000',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '6px 12px',
                                          fontWeight: '700',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <CalendarIcon size={12} /> {(isScheduled || isCompleted) ? 'Sửa lịch' : 'Lên lịch'}
                                      </button>

                                      {/* Hoàn thành Button (Chỉ hiển thị khi đã lên lịch) */}
                                      {isScheduled && (
                                        <button
                                          onClick={() => handleUpdateStatus(lead.id, 'Completed')}
                                          style={{
                                            backgroundColor: 'rgba(34,197,94,0.1)',
                                            border: '1px solid var(--success-color)',
                                            color: 'var(--success-color)',
                                            borderRadius: '6px',
                                            padding: '6px 10px',
                                            fontWeight: '700',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.25)'}
                                          onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.1)'}
                                          title="Hoàn thành buổi học"
                                        >
                                          Hoàn thành
                                        </button>
                                      )}

                                      {/* Hủy lịch Button (Chỉ hiển thị khi đã lên lịch) */}
                                      {isScheduled && (
                                        <button
                                          onClick={() => handleUpdateStatus(lead.id, 'Cancelled')}
                                          style={{
                                            backgroundColor: 'rgba(239,68,68,0.1)',
                                            border: '1px solid var(--error-color)',
                                            color: 'var(--error-color)',
                                            borderRadius: '6px',
                                            padding: '6px 10px',
                                            fontWeight: '700',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.25)'}
                                          onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                                          title="Hủy lịch tập"
                                        >
                                          Hủy lịch
                                        </button>
                                      )}
                                      
                                      {/* Xóa Lead vĩnh viễn */}
                                      <button 
                                        onClick={() => handleDeleteLead(lead.id)}
                                        style={{
                                          backgroundColor: 'rgba(239,68,68,0.1)',
                                          color: 'var(--error-color)',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '6px 8px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>

                  {/* Side Scheduler Form */}
                  {selectedLead && (
                    <div className="glass" style={{ padding: '25px', borderRadius: '16px', height: 'fit-content' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800' }}>📆 Đặt lịch buổi học</h3>
                        <button 
                          onClick={() => setSelectedLead(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Đóng
                        </button>
                      </div>

                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '14px', color: '#fff', marginBottom: '6px' }}>Học viên được chọn:</h4>
                        <p style={{ fontSize: '13px', fontWeight: '600' }}>👤 {selectedLead.name} ({selectedLead.age || '—'} tuổi)</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📞 {selectedLead.phone} | Trình độ: {selectedLead.level}</p>
                        {selectedLead.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>📝 {selectedLead.notes}</p>}
                      </div>

                      {scheduleSuccess ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <div style={{ color: 'var(--success-color)', display: 'inline-flex', padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', marginBottom: '10px' }}>
                            <CheckCircle size={32} />
                          </div>
                          <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success-color)' }}>Đã lên lịch thành công!</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sự kiện đã được đồng bộ lên Google Calendar và gửi thông báo tới kênh Discord.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleScheduleLesson} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Huấn luyện viên giảng dạy</label>
                            <CustomSelect 
                              value={schedulerForm.coachName}
                              onChange={val => setSchedulerForm({ ...schedulerForm, coachName: val })}
                              options={coaches.length > 0 ? coaches.map(c => ({ value: c.name, label: c.name })) : [{ value: 'Hoang Jayce', label: 'Hoang Jayce' }]}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Nền tảng mong muốn liên lạc</label>
                            <CustomSelect 
                              value={schedulerForm.platform}
                              onChange={val => setSchedulerForm({ ...schedulerForm, platform: val })}
                              options={[
                                { value: 'Zalo', label: 'Zalo' },
                                { value: 'WhatsApp', label: 'WhatsApp' }
                              ]}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Thời gian bắt đầu</label>
                            <div className="datetime-container">
                              <input 
                                type="datetime-local"
                                className="datetime-input"
                                value={schedulerForm.startTime}
                                onChange={e => setSchedulerForm({ ...schedulerForm, startTime: e.target.value })}
                                required
                                onClick={(e) => {
                                  try {
                                    e.currentTarget.showPicker();
                                  } catch (err) {}
                                }}
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none', width: '100%' }}
                              />
                              <div className="datetime-icon">
                                <CalendarIcon size={16} />
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Thời lượng tập</label>
                            <CustomSelect 
                              value={schedulerForm.duration}
                              onChange={val => setSchedulerForm({ ...schedulerForm, duration: val })}
                              options={[
                                { value: '30', label: '30 phút' },
                                { value: '60', label: '1 giờ' },
                                { value: '90', label: '1.5 giờ (90 phút)' },
                                { value: '120', label: '2 giờ' },
                                { value: '150', label: '2.5 giờ' },
                                { value: '180', label: '3 giờ' }
                              ]}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Địa điểm / Sân tập</label>
                            <CustomSelect 
                              value={schedulerForm.court}
                              onChange={val => {
                                const courtData = COURT_LOCATIONS[val];
                                setSchedulerForm({
                                  ...schedulerForm,
                                  court: val,
                                  lat: courtData?.lat ?? schedulerForm.lat,
                                  lng: courtData?.lng ?? schedulerForm.lng,
                                });
                              }}
                              options={[
                                { value: 'Hào Anh tennis Coffee', label: '🎾 Sân 1 — Hào Anh tennis Coffee' },
                                { value: 'Sân Victoria resort', label: '🎾 Sân 2 — Sân Victoria resort' },
                              ]}
                            />
                          </div>

                          {COURT_LOCATIONS[schedulerForm.court] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* Address display row */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '12px',
                              }}>
                                <span style={{ fontSize: '15px', lineHeight: '1.2', flexShrink: 0 }}>📍</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: '600', marginBottom: '3px', color: 'var(--text-primary)' }}>Địa chỉ sân tập</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                                    {COURT_LOCATIONS[schedulerForm.court].address}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons: Maps + Copy */}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <a
                                  href={COURT_LOCATIONS[schedulerForm.court].mapsLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    backgroundColor: 'rgba(66,133,244,0.12)',
                                    border: '1px solid rgba(66,133,244,0.3)',
                                    borderRadius: '6px',
                                    padding: '8px 10px',
                                    textDecoration: 'none',
                                    color: '#4285F4',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(66,133,244,0.22)')}
                                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgba(66,133,244,0.12)')}
                                >
                                  🗺️ Mở Google Maps
                                </a>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(COURT_LOCATIONS[schedulerForm.court].address).then(() => {
                                      setCopiedCourt(true);
                                      setTimeout(() => setCopiedCourt(false), 2000);
                                    });
                                  }}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    backgroundColor: copiedCourt ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                                    border: copiedCourt ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '8px 10px',
                                    color: copiedCourt ? 'var(--success-color)' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {copiedCourt ? '✓ Đã sao chép!' : '📋 Sao chép địa chỉ'}
                                </button>
                              </div>
                            </div>
                          )}


                          <button 
                            type="submit" 
                            disabled={isScheduling}
                            style={{
                              backgroundColor: 'var(--accent-color)',
                              color: '#000',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '12px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '14px',
                              boxShadow: '0 4px 10px var(--accent-glow)',
                              transition: 'all 0.3s',
                              marginTop: '5px'
                            }}
                          >
                            {isScheduling ? 'Đang tạo lịch tập...' : 'Xác nhận đặt lịch & Báo Discord'}
                          </button>
                        </form>
                      )}

                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Floating animations / CSS for spinners */}
      <style>{`
        .tab-btn:hover {
          background-color: rgba(194, 255, 20, 0.1);
        }
        .responsive-grid {
          @media (max-width: 768px) {
            grid-template-columns: 1fr !important;
          }
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 4px solid rgba(255,255,255,0.1);
          border-left-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
