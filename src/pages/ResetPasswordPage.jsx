import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

/**
 * Şifre Sıfırlama Sayfası — E-postadaki bağlantıya tıklandıktan sonra açılır.
 *
 * URL formatı: /sifre-sifirla?token=<uuid>
 * Token URL parametresinden alınır, yeni şifre formdan girilir.
 *
 * Token geçersiz veya süresi dolmuşsa backend hata döndürür.
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();

  // URL'deki query parametrelerini oku — token değerini al
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // ?token=xxxx-xxxx-xxxx

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Token URL'de yoksa geçersiz bağlantı sayfası göster
  if (!token) {
    return (
      <div style={{ ...styles.container }}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>Geçersiz Bağlantı</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Bu şifre sıfırlama bağlantısı geçersiz görünüyor.
              Lütfen yeni bir sıfırlama talebi oluşturun.
            </p>
            <Link to="/sifremi-unuttum" style={{ color: '#2E7D32', fontWeight: '700', textDecoration: 'none' }}>
              Yeni Bağlantı Talep Et
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Şifre sıfırlama formunu gönderir.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Şifre eşleşme kontrolü
    if (newPassword !== confirmPassword) {
      setError('Girilen şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      // Backend'e token + yeni şifre gönder
      await resetPassword(token, newPassword);
      setSuccess(true);
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => navigate('/giris'), 3000);
    } catch (err) {
      setError(err.response?.data || 'Şifre sıfırlama başarısız. Bağlantının süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .rp-card { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .rp-input {
          width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
          font-size: 15px; font-family: 'Inter', sans-serif; background: #f8fafc;
          transition: all 0.3s ease; box-sizing: border-box; outline: none; color: #1e293b;
        }
        .rp-input:focus { border-color: #2E7D32; background: #fff; box-shadow: 0 0 0 4px rgba(46,125,50,0.1); }
        .rp-btn {
          width: 100%; padding: 15px; background: linear-gradient(135deg, #2E7D32, #43A047);
          color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.3s ease; margin-top: 8px;
        }
        .rp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(46,125,50,0.35); }
        .rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="rp-card" style={styles.card}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
          <h1 style={styles.title}>Yeni Şifre Belirle</h1>
          <p style={styles.subtitle}>Hesabınız için yeni bir şifre oluşturun.</p>
        </div>

        {/* Şifre başarıyla sıfırlandı — yönlendirme mesajı */}
        {success ? (
          <div style={styles.successBox}>
            ✅ <strong>Şifreniz başarıyla güncellendi!</strong><br />
            3 saniye içinde giriş sayfasına yönlendiriliyorsunuz...<br /><br />
            <Link to="/giris" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none' }}>
              Hemen Giriş Yap →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Yeni Şifre</label>
              <input
                type="password"
                className="rp-input"
                placeholder="En az 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Yeni Şifre Tekrar</label>
              <input
                type="password"
                className="rp-input"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="rp-btn" disabled={loading}>
              {loading ? '⏳ Güncelleniyor...' : '🔒 Şifremi Güncelle'}
            </button>
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
  subtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#374151' },
  errorBox: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: '10px', padding: '12px 16px', fontSize: '14px', marginBottom: '16px',
  },
  successBox: {
    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
    borderRadius: '12px', padding: '24px', fontSize: '14px', lineHeight: '1.8', textAlign: 'center',
  },
};

export default ResetPasswordPage;
