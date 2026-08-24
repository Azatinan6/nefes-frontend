import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerFizyo, registerPatient } from '../services/api';

/**
 * Kayıt Ol Sayfası — İki farklı kayıt tipi sunar:
 *
 * 1. FİZYOTERAPİST KAYDI: Ad, e-posta, şifre, lisans no, uzmanlık
 *    → PENDING durumda kaydedilir, admin onayı beklenir
 *
 * 2. AİLE/HASTA KAYDI: Ad, e-posta, şifre, fizyoterapist davet kodu, tip seçimi
 *    → Direkt ACTIVE olarak kaydedilir, giriş yapılabilir
 *
 * Sekme yapısı ile iki form arasında geçiş sağlanır.
 */
const RegisterPage = () => {
  const navigate = useNavigate();

  // Aktif sekme sadece Fizyoterapist
  const [activeTab, setActiveTab] = useState('fizyo');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Yükleme ve durum mesajları
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isKvkkModalOpen, setIsKvkkModalOpen] = useState(false);

  // Fizyoterapist form verileri
  const [fizyoForm, setFizyoForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    specialization: '',
    isKvkkApproved: false,
  });



  /**
   * Fizyoterapist kayıt formunu gönderir.
   */
  const handleFizyoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Şifre eşleşme kontrolü
    if (fizyoForm.password !== fizyoForm.confirmPassword) {
      setError('Girilen şifreler eşleşmiyor.');
      return;
    }

    if (!fizyoForm.isKvkkApproved) {
      setError('Lütfen KVKK Aydınlatma Metni ve Açık Rıza Beyanı\'nı onaylayın.');
      return;
    }

    setLoading(true);
    try {
      await registerFizyo({
        fullName: fizyoForm.fullName,
        email: fizyoForm.email,
        password: fizyoForm.password,
        licenseNumber: fizyoForm.licenseNumber,
        specialization: fizyoForm.specialization,
        isKvkkApproved: fizyoForm.isKvkkApproved,
      });

      setSuccess('Başvurunuz alındı! Yönetici onayının ardından e-posta ile bilgilendirileceksiniz.');
    } catch (err) {
      setError(err.response?.data || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .register-card { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .reg-input {
          width: 100%; padding: 13px 16px; border: 2px solid #e2e8f0;
          border-radius: 10px; font-size: 14px; font-family: 'Inter', sans-serif;
          background: #f8fafc; transition: all 0.3s ease; box-sizing: border-box;
          outline: none; color: #1e293b;
        }
        .reg-input:focus { border-color: #2E7D32; background: #fff; box-shadow: 0 0 0 4px rgba(46,125,50,0.1); }
        .reg-select { width: 100%; padding: 13px 16px; border: 2px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-family: 'Inter', sans-serif; background: #f8fafc; outline: none; cursor: pointer; color: #1e293b; }
        .reg-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #2E7D32, #43A047);
          color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.3s ease; }
        .reg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(46,125,50,0.35); }
        .reg-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .tab-btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: 'Inter', sans-serif; }
      `}</style>

      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div className="register-card" style={styles.card}>
        
        {/* Başlık */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>🌿</div>
          <h1 style={styles.title}>N.E.F.E.S. AL</h1>
          <p style={styles.subtitle}>Yeni hesap oluşturun</p>
        </div>

        {/* Sekme seçimi — Sadece Fizyoterapist */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button
            className="tab-btn"
            style={{
              background: '#fff',
              color: '#2E7D32',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            🩺 Fizyoterapist Kaydı
          </button>
        </div>

        {/* Hasta/Aile Bilgilendirmesi */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
                👨‍👩‍👧 <strong>Aile / Hasta mısınız?</strong><br/>
                Hastalar kendi kendilerine kayıt olamazlar. Sisteme giriş yapabilmek için kendi <strong>fizyoterapistinizle iletişime geçiniz</strong>. Fizyoterapistiniz sizi eklediğinde şifreniz e-posta adresinize gönderilecektir.
            </p>
        </div>

        {/* Hata/Başarı mesajları */}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}
        {success && <div style={styles.successBox}>✅ {success}</div>}

        {/* ===== FİZYOTERAPİST KAYIT FORMU ===== */}
        {activeTab === 'fizyo' && (
          <form onSubmit={handleFizyoSubmit}>
            
            {/* Onay süreci bilgi kutusu */}
            <div style={styles.infoBox}>
              ℹ️ Fizyoterapist başvurunuz <strong>yönetici onayına</strong> tabidir. Onay sonrası e-posta ile bilgilendirileceksiniz.
            </div>

            <Field label="Ad Soyad">
              <input className="reg-input" type="text" placeholder="Dr. Adınız Soyadınız"
                value={fizyoForm.fullName}
                onChange={(e) => setFizyoForm({...fizyoForm, fullName: e.target.value})}
                required />
            </Field>

            <Field label="E-posta Adresi">
              <input className="reg-input" type="email" placeholder="ornek@hastane.com"
                value={fizyoForm.email}
                onChange={(e) => setFizyoForm({...fizyoForm, email: e.target.value})}
                required />
            </Field>

            <Field label="Lisans / Diploma Numarası">
              <input className="reg-input" type="text" placeholder="Fizyoterapi lisans numaranız"
                value={fizyoForm.licenseNumber}
                onChange={(e) => setFizyoForm({...fizyoForm, licenseNumber: e.target.value})}
                required />
            </Field>

            <Field label="Uzmanlık Alanı (isteğe bağlı)">
              <input className="reg-input" type="text" placeholder="Ör: Pediatrik Fizyoterapi"
                value={fizyoForm.specialization}
                onChange={(e) => setFizyoForm({...fizyoForm, specialization: e.target.value})} />
            </Field>

            <Field label="Şifre">
              <div style={{ position: 'relative' }}>
                <input className="reg-input" type={showPassword ? "text" : "password"} placeholder="En az 8 karakter"
                  value={fizyoForm.password}
                  onChange={(e) => setFizyoForm({...fizyoForm, password: e.target.value})}
                  required minLength={8} />
                <button type="button" onMouseDown={() => setShowPassword(true)} onMouseUp={() => setShowPassword(false)} onMouseLeave={() => setShowPassword(false)} onTouchStart={() => setShowPassword(true)} onTouchEnd={() => setShowPassword(false)} style={styles.eyeBtn}>
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </Field>

            <Field label="Şifre Tekrar">
              <div style={{ position: 'relative' }}>
                <input className="reg-input" type={showConfirmPassword ? "text" : "password"} placeholder="Şifrenizi tekrar girin"
                  value={fizyoForm.confirmPassword}
                  onChange={(e) => setFizyoForm({...fizyoForm, confirmPassword: e.target.value})}
                  required />
                <button type="button" onMouseDown={() => setShowConfirmPassword(true)} onMouseUp={() => setShowConfirmPassword(false)} onMouseLeave={() => setShowConfirmPassword(false)} onTouchStart={() => setShowConfirmPassword(true)} onTouchEnd={() => setShowConfirmPassword(false)} style={styles.eyeBtn}>
                  {showConfirmPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </Field>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="kvkkCheck"
                checked={fizyoForm.isKvkkApproved}
                onChange={(e) => setFizyoForm({...fizyoForm, isKvkkApproved: e.target.checked})}
                style={{ marginTop: '4px', cursor: 'pointer' }}
              />
              <label htmlFor="kvkkCheck" style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', cursor: 'pointer' }}>
                <span onClick={(e) => { e.preventDefault(); setIsKvkkModalOpen(true); }} style={{ color: '#2E7D32', textDecoration: 'underline' }}>KVKK Aydınlatma Metni</span>'ni ve kişisel verilerimin işlenmesine ilişkin Açık Rıza Beyanı'nı okudum, anladım ve kabul ediyorum.
              </label>
            </div>

            <button type="submit" className="reg-btn" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? '⏳ Başvuru gönderiliyor...' : '📋 Başvuru Gönder'}
            </button>
          </form>
        )}

        {/* Giriş yap yönlendirme */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{ color: '#64748b', fontSize: '14px' }}>Zaten hesabınız var mı? </span>
          <Link to="/giris" style={{ color: '#2E7D32', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
            Giriş Yap
          </Link>
        </div>

        {/* Ana sayfaya dön */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>

      {/* KVKK Modal */}
      {isKvkkModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{marginTop: 0, color: '#1e293b'}}>KVKK Aydınlatma Metni</h2>
            <div style={{maxHeight: '60vh', overflowY: 'auto', fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '20px'}}>
              <p><strong>1. Veri Sorumlusunun Kimliği</strong></p>
              <p>Kişisel verileriniz veri sorumlusu sıfatıyla tarafımızca KVKK'ya uygun olarak işlenmektedir.</p>
              <p><strong>2. Kişisel Verilerin İşlenme Amacı</strong></p>
              <p>Toplanan kişisel verileriniz, hesabınızın oluşturulması, platform hizmetlerinin sunulması ve tıbbi geçmiş/ilerleme analizlerinin yapılabilmesi amacıyla işlenecektir.</p>
              <p><strong>3. Açık Rıza</strong></p>
              <p>Özel nitelikli kişisel veri sayılan sağlık verilerinizin işlenmesine ve kaydedilmesine özgür iradenizle açık rıza vermektesiniz.</p>
            </div>
            <button 
              onClick={() => setIsKvkkModalOpen(false)} 
              className="reg-btn"
            >
              Okudum, Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Form alanı sarmalayıcı — tekrar eden label + input yapısını azaltır
const Field = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '7px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
      {label}
    </label>
    {children}
  </div>
);

const styles = {
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '30px', maxWidth: '500px', width: '100%',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)', maxHeight: '90vh'
  },
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #f3e5f5 100%)',
    padding: '20px', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px',
    borderRadius: '50%', background: 'rgba(46, 125, 50, 0.07)', pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: '-80px', left: '-80px', width: '280px', height: '280px',
    borderRadius: '50%', background: 'rgba(2, 136, 209, 0.07)', pointerEvents: 'none',
  },
  card: {
    backgroundColor: '#fff', borderRadius: '24px', padding: '40px 36px',
    width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.12)',
    position: 'relative', zIndex: 1, maxHeight: '90vh', overflowY: 'auto',
  },
  title: { fontSize: '26px', fontWeight: '900', color: '#1e293b', margin: '0 0 6px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  errorBox: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5',
  },
  successBox: {
    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
    borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5',
  },
  infoBox: {
    backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
    borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6',
  },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0
  }
};

export default RegisterPage;
