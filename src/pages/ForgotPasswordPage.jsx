import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';

/**
 * Şifremi Unuttum Sayfası — E-posta adresine şifre sıfırlama bağlantısı gönderir.
 *
 * Güvenlik notu: E-posta sistemde kayıtlı olsun ya da olmasın,
 * her zaman aynı başarı mesajı gösterilir. Bu sayede
 * kötü niyetli kişiler sistemdeki e-posta adreslerini test edemez.
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // Form gönderildi mi?
  const [error, setError] = useState('');

  /**
   * Formu gönderir — backend'e şifre sıfırlama isteği atar.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      // Başarılı veya e-posta bulunamadı — her iki durumda da aynı mesajı göster
      setSubmitted(true);
    } catch (err) {
      setError('İstek gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
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
        .fp-card { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .fp-input {
          width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
          font-size: 15px; font-family: 'Inter', sans-serif; background: #f8fafc;
          transition: all 0.3s ease; box-sizing: border-box; outline: none; color: #1e293b;
        }
        .fp-input:focus { border-color: #2E7D32; background: #fff; box-shadow: 0 0 0 4px rgba(46,125,50,0.1); }
        .fp-btn {
          width: 100%; padding: 15px; background: linear-gradient(135deg, #2E7D32, #43A047);
          color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.3s ease; margin-top: 8px;
        }
        .fp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(46,125,50,0.35); }
        .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="fp-card" style={styles.card}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔑</div>
          <h1 style={styles.title}>Şifremi Unuttum</h1>
          <p style={styles.subtitle}>
            E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
          </p>
        </div>

        {/* Form gönderildikten sonra başarı mesajı göster */}
        {submitted ? (
          <div>
            <div style={styles.successBox}>
              📬 <strong>E-posta gönderildi!</strong><br />
              Kayıtlı e-posta adresinize şifre sıfırlama bağlantısı gönderdik.
              Bağlantı <strong>1 saat</strong> geçerlidir.<br /><br />
              <em style={{ fontSize: '13px', color: '#4b5563' }}>
                Gelen kutunuzda göremiyorsanız spam/önemsiz klasörünü kontrol edin.
              </em>
            </div>
            <Link to="/giris" style={styles.backLink}>
              ← Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          // Şifremi unuttum formu
          <form onSubmit={handleSubmit}>
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>E-posta Adresiniz</label>
              <input
                type="email"
                className="fp-input"
                placeholder="kayitli@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="fp-btn" disabled={loading}>
              {loading ? '⏳ Gönderiliyor...' : '📧 Sıfırlama Bağlantısı Gönder'}
            </button>

            {/* Geri dön linki */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/giris" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>
                ← Giriş Sayfasına Dön
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #f3e5f5 100%)',
    padding: '20px', fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: '#fff', borderRadius: '24px', padding: '48px 40px',
    width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.12)',
  },
  title: { fontSize: '26px', fontWeight: '900', color: '#1e293b', margin: '0 0 10px 0' },
  subtitle: { fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.6' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#374151' },
  errorBox: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: '10px', padding: '12px 16px', fontSize: '14px', marginBottom: '16px',
  },
  successBox: {
    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
    borderRadius: '12px', padding: '20px', fontSize: '14px', lineHeight: '1.7',
    marginBottom: '20px',
  },
  backLink: {
    display: 'block', textAlign: 'center', color: '#2E7D32',
    fontWeight: '600', fontSize: '14px', textDecoration: 'none',
  },
};

export default ForgotPasswordPage;
