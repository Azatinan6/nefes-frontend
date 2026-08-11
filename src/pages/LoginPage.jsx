import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginAPI } from '../services/api';

/**
 * Giriş Yap Sayfası — E-posta ve şifre ile sisteme giriş sağlar.
 *
 * Giriş akışı:
 * 1. Kullanıcı form doldurup "Giriş Yap"a tıklar
 * 2. API'ye istek gönderilir
 * 3. Başarılıysa JWT token ve kullanıcı bilgisi AuthContext'e kaydedilir
 * 4. Kullanıcının rolüne göre ilgili panele yönlendirme yapılır
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // router'dan gelen state'i alıyoruz (ForestMenu'den yönlendirme yapılmışsa from değerini alacağız)
  const location = useLocation();
  const from = location.state?.from || null;

  // Form alanları için state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Yükleme ve hata durumları
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Form gönderildiğinde çalışır.
   * Backend'e istek atar, başarılıysa rol bazlı yönlendirme yapar.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle
    setError('');        // Önceki hata mesajını temizle
    setLoading(true);

    try {
      // Backend login endpoint'ine istek gönder
      const response = await loginAPI(email, password);
      const authData = response.data;

      // AuthContext'e token ve kullanıcı bilgilerini kaydet
      login(authData);

      // Yönlendirme mantığı: Eğer belli bir oyundan gelinmişse oraya git, yoksa rol bazlı yönlendir
      if (from) {
         navigate(from);
      } else {
        // Kullanıcının rolüne göre doğru panele yönlendir
        switch (authData.role) {
          case 'ROLE_ADMIN':
            navigate('/admin');           // Admin yönetim paneli
            break;
          case 'ROLE_FIZYO':
            navigate('/fizyoterapist');   // Fizyoterapist paneli
            break;
          case 'ROLE_AILE':
            navigate('/aile-paneli');     // Aile rapor paneli
            break;
          case 'ROLE_COCUK':
            navigate('/cocuk-paneli');    // Çocuk oyun paneli
            break;
          default:
            navigate('/');               // Bilinmeyen rol → ana sayfa
        }
      }
    } catch (err) {
      // Backend'den gelen hata mesajını göster
      const errorMsg = err.response?.data || 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animasyon CSS tanımları */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .login-card { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .logo-icon { animation: float 3s ease-in-out infinite; }
        
        .login-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
          transition: all 0.3s ease;
          box-sizing: border-box;
          outline: none;
          color: #1e293b;
        }
        .login-input:focus {
          border-color: #2E7D32;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
        }
        .login-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(46, 125, 50, 0.35);
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Arka plan dekoratif elementleri */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      {/* Giriş Kartı */}
      <div className="login-card" style={styles.card}>
        
        {/* Logo ve başlık */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="logo-icon" style={styles.logoIcon}>🌿</div>
          <h1 style={styles.title}>N.E.F.E.S. AL</h1>
          <p style={styles.subtitle}>Sisteme giriş yapın</p>
        </div>

        {/* Hata mesajı kutusu — sadece hata varsa gösterilir */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Giriş formu */}
        <form onSubmit={handleSubmit}>
          
          {/* E-posta alanı */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <input
              type="email"
              className="login-input"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Şifre alanı */}
          <div style={styles.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={styles.label}>Şifre</label>
              {/* Şifremi unuttum linki */}
              <Link to="/sifremi-unuttum" style={styles.forgotLink}>
                Şifremi unuttum
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: 0
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {/* Giriş butonu — yükleme sırasında devre dışı */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? '⏳ Giriş yapılıyor...' : '🔐 Giriş Yap'}
          </button>
        </form>

        {/* Kayıt ol yönlendirme */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ color: '#64748b', fontSize: '14px' }}>Hesabınız yok mu? </span>
          <Link to="/kayit" style={{ color: '#2E7D32', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
            Kayıt Ol
          </Link>
        </div>

        {/* Ana sayfaya dön */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
};

// Sayfa stil nesneleri — satır içi yazım yerine burada toplandı (temiz kod)
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #f3e5f5 100%)',
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', top: '-100px', right: '-100px',
    width: '400px', height: '400px',
    borderRadius: '50%',
    background: 'rgba(46, 125, 50, 0.08)',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: '-100px', left: '-100px',
    width: '350px', height: '350px',
    borderRadius: '50%',
    background: 'rgba(2, 136, 209, 0.08)',
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.12)',
    position: 'relative',
    zIndex: 1,
  },
  logoIcon: {
    fontSize: '52px',
    display: 'block',
    marginBottom: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
  },
  forgotLink: {
    color: '#2E7D32',
    fontSize: '13px',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default LoginPage;
