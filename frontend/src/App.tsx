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
  AlertCircle
} from 'lucide-react';

// Backend URL
const API_BASE = 'http://localhost:3001/api';

interface Lead {
  id: string;
  name: string;
  age: number | null;
  phone: string;
  level: string;
  status: 'New' | 'Contacted' | 'Scheduled' | 'Cancelled';
  notes: string;
  created_at: string;
}

export default function App() {
  const [view, setView] = useState<'client' | 'admin'>('client');
  
  // Client States
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

  // Admin States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ phone: string; platform: string } | null>(null);
  const [ocrError, setOcrError] = useState('');
  
  // Scheduling Modal/Section States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [schedulerForm, setSchedulerForm] = useState({
    coachName: 'Huấn luyện viên Jayce',
    platform: 'Zalo',
    startTime: '',
    endTime: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch leads on admin view
  useEffect(() => {
    if (view === 'admin') {
      fetchLeads();
    }
  }, [view]);

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

  // Handle Client Form Submit
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      setClientError('Vui lòng điền Họ tên và Số điện thoại.');
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
        setClientError(err.error || 'Có lỗi xảy ra khi gửi đăng ký.');
      }
    } catch (err) {
      setClientError('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Handle OCR Image Upload
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrResult(null);
    setOcrError('');

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      const response = await fetch(`${API_BASE}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          coachName: schedulerForm.coachName,
          platform: schedulerForm.platform,
          startTime: new Date(schedulerForm.startTime).toISOString(),
          endTime: new Date(schedulerForm.endTime).toISOString()
        })
      });

      if (response.ok) {
        setScheduleSuccess(true);
        fetchLeads(); // Refresh leads
        setTimeout(() => {
          setSelectedLead(null);
          setScheduleSuccess(false);
          setSchedulerForm({
            coachName: 'Huấn luyện viên Jayce',
            platform: 'Zalo',
            startTime: '',
            endTime: '',
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

  // Format Date for table
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate Quick Contact links
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: '#000', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', boxShadow: '0 0 15px var(--accent-glow)' }}>🎾</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>Web Tennis Calendar</h1>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hệ thống Quản lý & Đặt lịch Tennis hiện đại</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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
            Học viên đăng ký
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
            Quản trị viên (HLV)
          </button>
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
                <Award size={16} /> Khóa học chất lượng cao
              </div>
              <h2 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', color: '#fff' }}>
                Đánh thức đam mê <br />
                <span style={{ color: 'var(--accent-color)', textShadow: '0 0 20px rgba(194,255,20,0.15)' }}>Tennis chuyên nghiệp</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                Đăng ký ngay lớp học thử cá nhân 1-kèm-1 cùng huấn luyện viên có chứng chỉ chuyên môn. Chúng tôi cam kết giáo án cá nhân hóa giúp bạn nâng trình nhanh chóng và tránh chấn thương tối đa.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                <div className="glass" style={{ padding: '15px', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '20px' }}>1-kèm-1</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tập trung cao nhất vào kỹ thuật cá nhân của học viên.</p>
                </div>
                <div className="glass" style={{ padding: '15px', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '20px' }}>Linh hoạt</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tùy chỉnh lịch tập dựa trên thời gian rảnh rỗi của bạn.</p>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="glass" style={{ padding: '40px', borderRadius: '24px' }}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Đăng ký Tư vấn & Đặt lịch</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Điền thông tin cơ bản, HLV sẽ liên hệ trực tiếp chốt giờ học.</p>
              </div>

              {clientSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', textAlign: 'center', gap: '15px' }}>
                  <div style={{ color: 'var(--success-color)', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={40} />
                  </div>
                  <h4 style={{ fontSize: '20px', fontWeight: '700' }}>Gửi Thông tin Thành công!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px' }}>
                    Yêu cầu đã được lưu nhận. HLV của chúng tôi sẽ liên lạc với bạn qua Zalo/WhatsApp trong thời gian sớm nhất.
                  </p>
                  <button 
                    onClick={() => setClientSuccess(false)}
                    style={{ marginTop: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Đăng ký cho học viên khác
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
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Họ và tên *</label>
                    <input 
                      type="text" 
                      placeholder="Nguyễn Văn A"
                      value={clientForm.name}
                      onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tuổi</label>
                      <input 
                        type="number" 
                        placeholder="25"
                        value={clientForm.age}
                        onChange={e => setClientForm({ ...clientForm, age: e.target.value })}
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Số điện thoại (Zalo/WhatsApp) *</label>
                      <input 
                        type="tel" 
                        placeholder="0901234567"
                        value={clientForm.phone}
                        onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 15px', color: '#fff', fontSize: '14px', outline: 'none' }}
                        required
                      />
                    </div>
                  </div>

                  {/* Level Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trình độ hiện tại</label>
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
                            {lvl === 'Basic' ? 'Cơ bản' : lvl === 'Intermediate' ? 'Trung cấp' : 'Nâng cao'}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.7 }}>{lvl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Ghi chú mong muốn</label>
                    <textarea 
                      placeholder="Ví dụ: Rảnh vào cuối tuần, cần cải thiện kỹ thuật giao bóng,..."
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
                    {isSubmittingLead ? 'Đang gửi đăng ký...' : 'Gửi Đăng ký Lịch học'}
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

        {/* ================= ADMIN VIEW ================= */}
        {view === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '10px' }}>
            
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
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tải ảnh chụp số điện thoại lên. Trợ lý AI Groq sẽ đọc ảnh và trả về link chat trực tiếp.</p>
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
                      {ocrLoading ? 'Đang phân tích hình ảnh bằng Groq...' : 'Tải lên ảnh chụp liên hệ'}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hỗ trợ JPG, PNG, WEBP</span>
                  </div>
                </div>

                {/* Result screen */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  {ocrLoading && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                      <span>Trợ lý Groq Vision đang nhận diện số điện thoại...</span>
                    </div>
                  )}

                  {ocrError && (
                    <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '15px' }}>
                      <AlertCircle size={18} /> <span>{ocrError}</span>
                    </div>
                  )}

                  {!ocrLoading && !ocrResult && !ocrError && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      <p>Chưa có ảnh nào được tải lên.</p>
                      <p style={{ fontSize: '11px' }}>Hãy thử tải ảnh danh thiếp hoặc thông tin chat để OCR tự động lấy số điện thoại.</p>
                    </div>
                  )}

                  {ocrResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
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
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Họ tên</th>
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Tuổi</th>
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Số điện thoại</th>
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Trình độ</th>
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Ngày Đăng ký</th>
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Trạng thái</th>
                          <th style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map(lead => (
                          <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '14px 10px', fontWeight: '600' }}>{lead.name}</td>
                            <td style={{ padding: '14px 10px' }}>{lead.age || '—'}</td>
                            <td style={{ padding: '14px 10px' }}>{lead.phone}</td>
                            <td style={{ padding: '14px 10px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: lead.level === 'Basic' ? 'rgba(194,255,20,0.1)' : lead.level === 'Intermediate' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)',
                                color: lead.level === 'Basic' ? 'var(--accent-color)' : lead.level === 'Intermediate' ? '#3b82f6' : '#ec4899'
                              }}>
                                {lead.level === 'Basic' ? 'Cơ bản' : lead.level === 'Intermediate' ? 'Trung cấp' : 'Nâng cao'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {formatDate(lead.created_at)}
                            </td>
                            <td style={{ padding: '14px 10px' }}>
                              <select 
                                value={lead.status}
                                onChange={e => handleUpdateStatus(lead.id, e.target.value as Lead['status'])}
                                style={{
                                  backgroundColor: 'rgba(0,0,0,0.3)',
                                  color: lead.status === 'Scheduled' ? 'var(--success-color)' : lead.status === 'New' ? '#3b82f6' : lead.status === 'Contacted' ? '#eab308' : '#94a3b8',
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
                                <option value="Cancelled">Đã Hủy</option>
                              </select>
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => setSelectedLead(lead)}
                                  disabled={lead.status === 'Scheduled'}
                                  style={{
                                    backgroundColor: 'var(--accent-color)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    opacity: lead.status === 'Scheduled' ? 0.4 : 1
                                  }}
                                >
                                  <CalendarIcon size={12} /> Lên lịch
                                </button>
                                
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
                        ))}
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
                        <select 
                          value={schedulerForm.coachName}
                          onChange={e => setSchedulerForm({ ...schedulerForm, coachName: e.target.value })}
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        >
                          <option value="Huấn luyện viên Jayce">Châu Vương Hoàng (Jayce)</option>
                          <option value="Huấn luyện viên Hào Anh">HLV Hào Anh</option>
                          <option value="Huấn luyện viên Minh">HLV Minh Nguyễn</option>
                          <option value="Huấn luyện viên Tuấn">HLV Tuấn Anh</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Nền tảng mong muốn liên lạc</label>
                        <select 
                          value={schedulerForm.platform}
                          onChange={e => setSchedulerForm({ ...schedulerForm, platform: e.target.value })}
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        >
                          <option value="Zalo">Zalo</option>
                          <option value="WhatsApp">WhatsApp</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Thời gian bắt đầu</label>
                        <input 
                          type="datetime-local"
                          value={schedulerForm.startTime}
                          onChange={e => setSchedulerForm({ ...schedulerForm, startTime: e.target.value })}
                          required
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Thời gian kết thúc</label>
                        <input 
                          type="datetime-local"
                          value={schedulerForm.endTime}
                          onChange={e => setSchedulerForm({ ...schedulerForm, endTime: e.target.value })}
                          required
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        />
                      </div>

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
