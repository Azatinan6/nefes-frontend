import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Temel Sayfalar ve Paneller
import LandingPage from './pages/LandingPage';
import ForestMenu from './pages/ForestMenu';
import PhysiotherapistPanel from './pages/PhysiotherapistPanel';
import FamilyAIReport from './pages/FamilyAIReport';
import BreathTest from './pages/BreathTest';

// 8 Haftalık DTx Oyunları
import AwarenessGame from './pages/AwarenessGame';
import FrogGame from './pages/FrogGame';
import RainbowGame from './pages/RainbowGame';
import CrystalGame from './pages/CrystalGame';
import SailboatGame from './pages/SailboatGame';
import RocketGame from './pages/RocketGames';
import BalanceGame from './pages/BalanceGame';
import FinalAdventureGame from './pages/FinalAdventureGame';

// ===== YENİ EKLENEN SAYFALAR — Kimlik doğrulama ve yönetim =====
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPanel from './pages/AdminPanel';

// ===== AUTH SİSTEMİ — Context ve korumalı rota bileşenleri =====
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Ana Uygulama Bileşeni — Tüm routing ve yapı burada tanımlanır.
 *
 * AuthProvider en dıştaki sarmalayıcıdır — bu sayede tüm alt bileşenler
 * useAuth() hook'u ile kullanıcı bilgilerine erişebilir.
 */
function App() {
  return (
    // AuthProvider — tüm uygulamayı sarar, kimlik doğrulama state'ini yönetir
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

/**
 * Uygulama İçeriği — Router içinde olduğu için useNavigate kullanılabilir.
 * Navbar ve sayfalar burada render edilir.
 */
function AppContent() {
  // Auth context'inden kullanıcı bilgileri ve işlevleri al
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Çıkış yap — token temizlenir ve ana sayfaya yönlendirilir.
   */
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ===== NAVBAR — Admin panelinde gösterilmez ===== */}
      {/* Tam sayfa paneller (Admin, Login, Register) kendi başlıklarını içerdiği için
          ana navbar'ı gizliyoruz — temiz ve profesyonel görünüm için */}
      <Routes>
        {/* Bu route'larda navbar gösterilmez */}
        <Route path="/admin/*" element={null} />
        <Route path="/giris" element={null} />
        <Route path="/kayit" element={null} />
        <Route path="/sifremi-unuttum" element={null} />
        <Route path="/sifre-sifirla" element={null} />
        {/* Diğer tüm sayfalarda navbar gösterilir */}
        <Route path="*" element={
          <nav style={{
            height: '75px',
            backgroundColor: '#2E7D32',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 40px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            zIndex: 100
          }}>
            {/* Sol Taraf — Logo */}
            <Link to="/" style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '1px', color: '#FFEB3B', textDecoration: 'none', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
              🌿 N.E.F.E.S. AI
            </Link>

            {/* Orta — Panel Bağlantıları */}
            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
              <Link to="/" style={navLinkStyle}>Ana Sayfa</Link>

              {/* Çocuk paneli linki — herkes görebilir, oyunlara tıkladığında giriş istenir */}
              <Link to="/cocuk-paneli" style={navLinkStyle}>Çocuk Paneli</Link>

              {/* Aile paneli — Aile rolü veya admin için */}
              {isAuthenticated() && (user?.role === 'ROLE_AILE' || user?.role === 'ROLE_ADMIN') && (
                <Link to="/aile-paneli" style={navLinkStyle}>Aile Paneli</Link>
              )}

              {/* Fizyoterapist paneli — fizyo veya admin için */}
              {isAuthenticated() && (user?.role === 'ROLE_FIZYO' || user?.role === 'ROLE_ADMIN') && (
                <Link to="/fizyoterapist" style={navLinkStyle}>Fizyoterapist Paneli</Link>
              )}
            </div>

            {/* Sağ Taraf — Giriş/Kayıt veya Kullanıcı Menüsü */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {isAuthenticated() ? (
                // Giriş yapılmışsa: Kullanıcı adı ve çıkış butonu
                <>
                  <span style={{ color: '#FFEB3B', fontWeight: '600', fontSize: '15px' }}>
                    👤 {user?.fullName?.split(' ')[0]}
                  </span>
                  {/* Admin paneline hızlı erişim butonu — sadece admin için */}
                  {user?.role === 'ROLE_ADMIN' && (
                    <Link to="/admin" style={{ ...btnStyle, backgroundColor: '#7c3aed', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                      ⚙️ Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                // Giriş yapılmamışsa: Giriş Yap ve Kayıt Ol butonları
                <>
                  <Link to="/giris" style={{ ...btnStyle, backgroundColor: '#FFFFFF', color: '#2E7D32', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    Giriş Yap
                  </Link>
                  <Link to="/kayit" style={{ ...btnStyle, backgroundColor: '#FFCA28', color: '#333', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </nav>
        } />
      </Routes>

      {/* ===== SAYFA İÇERİKLERİ ===== */}
      <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
        <Routes>

          {/* Ana sayfa — herkese açık */}
          <Route path="/" element={<LandingPage />} />

          {/* ===== KİMLİK DOĞRULAMA SAYFALARI — Herkese açık ===== */}
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
          <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />

          {/* ===== KORUNAN PANELLER — Giriş ve rol kontrolü ===== */}

          {/* Admin Paneli — yalnızca ROLE_ADMIN */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ROLE_ADMIN']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          {/* Fizyoterapist Paneli — ROLE_FIZYO veya ROLE_ADMIN */}
          <Route path="/fizyoterapist" element={
            <ProtectedRoute roles={['ROLE_FIZYO', 'ROLE_ADMIN']}>
              <PhysiotherapistPanel />
            </ProtectedRoute>
          } />

          {/* Aile Paneli — ROLE_AILE veya ROLE_ADMIN */}
          <Route path="/aile-paneli" element={
            <ProtectedRoute roles={['ROLE_AILE', 'ROLE_ADMIN', 'ROLE_FIZYO']}>
              <FamilyAIReport />
            </ProtectedRoute>
          } />

          {/* Çocuk Paneli — herkese açık, ama oyunlar içinde giriş kontrolü var */}
          <Route path="/cocuk-paneli" element={<ForestMenu />} />

          {/* ===== OYUN SAYFALARI — Giriş yapılmış olması yeterli ===== */}
          <Route path="/test" element={<ProtectedRoute><BreathTest /></ProtectedRoute>} />
          <Route path="/oyun/hafta-1-fark-et" element={<ProtectedRoute><AwarenessGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-2-hisset" element={<ProtectedRoute><FrogGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-3-hareket-ettir" element={<ProtectedRoute><RainbowGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-4-kontrol-et" element={<ProtectedRoute><CrystalGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-5-surdur" element={<ProtectedRoute><SailboatGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-6-guc-uret" element={<ProtectedRoute><RocketGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-7-birlestir" element={<ProtectedRoute><BalanceGame /></ProtectedRoute>} />
          <Route path="/oyun/hafta-8-aktar" element={<ProtectedRoute><FinalAdventureGame /></ProtectedRoute>} />

          {/* ===== YETKİSİZ ERİŞİM SAYFASI ===== */}
          <Route path="/yetkisiz" element={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', fontFamily: 'sans-serif' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
              <h2 style={{ color: '#dc2626', fontSize: '28px', marginBottom: '12px' }}>Erişim Reddedildi</h2>
              <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '24px' }}>
                Bu sayfaya erişim yetkiniz bulunmuyor.
              </p>
              <Link to="/" style={{ color: '#2E7D32', fontWeight: '700', textDecoration: 'none' }}>
                ← Ana Sayfaya Dön
              </Link>
            </div>
          } />

        </Routes>
      </div>
    </div>
  );
}

// Navbar link stili
const navLinkStyle = {
  textDecoration: 'none',
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: '16px',
  padding: '8px 12px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
};

// Navbar buton stili
const btnStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '25px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '15px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

export default App;