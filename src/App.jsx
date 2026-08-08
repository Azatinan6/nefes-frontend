import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

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
import RocketGame from './pages/RocketGames'; // Eğer dosya adın RocketGames.jsx kaldıysa burayı RocketGames olarak güncelle
import BalanceGame from './pages/BalanceGame';
import FinalAdventureGame from './pages/FinalAdventureGame';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* TEK VE BİRLEŞTİRİLMİŞ ÜST MENÜ (NAVBAR) */}
        <nav style={{ 
          height: '75px', 
          backgroundColor: '#2E7D32', // Canlı Orman Yeşili
          color: 'white',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 40px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          zIndex: 100
        }}>
          {/* Sol Taraf - Logo */}
          <Link to="/" style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '1px', color: '#FFEB3B', textDecoration: 'none', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
            🌿 N.E.F.E.S. Rehab
          </Link>

          {/* Orta - Tüm Sayfalar ve Paneller Bir Arada */}
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <Link to="/" style={navLinkStyle}>Ana Sayfa</Link>
            <Link to="/cocuk-paneli" style={navLinkStyle}>Çocuk Paneli</Link>
            <Link to="/aile-paneli" style={navLinkStyle}>Aile Paneli</Link> 
            <Link to="/fizyoterapist" style={navLinkStyle}>Fizyoterapist Paneli</Link>
          </div>

          {/* Sağ Taraf - Kayıt ve Giriş İşlemleri */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <button style={{...btnStyle, backgroundColor: '#FFFFFF', color: '#2E7D32'}}>Giriş Yap</button>
            <button style={{...btnStyle, backgroundColor: '#FFCA28', color: '#333'}}>Kayıt Ol</button>
          </div>
        </nav>

        {/* Alt Kısım (Sayfa İçerikleri) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
          <Routes>
            {/* Temel Paneller */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/cocuk-paneli" element={<ForestMenu />} />
            <Route path="/fizyoterapist" element={<PhysiotherapistPanel />} />
            <Route path="/aile-paneli" element={<FamilyAIReport />} /> 
            <Route path="/test" element={<BreathTest />} />

            {/* 8 Haftalık Nefes Kahramanı Oyun Rotası (ForestMenu ile eşleştirildi) */}
            <Route path="/oyun/hafta-1-fark-et" element={<AwarenessGame />} />
            <Route path="/oyun/hafta-2-hisset" element={<FrogGame />} />
            <Route path="/oyun/hafta-3-hareket-ettir" element={<RainbowGame />} />
            <Route path="/oyun/hafta-4-kontrol-et" element={<CrystalGame />} />
            <Route path="/oyun/hafta-5-surdur" element={<SailboatGame />} />
            <Route path="/oyun/hafta-6-guc-uret" element={<RocketGame />} /> 
            <Route path="/oyun/hafta-7-birlestir" element={<BalanceGame />} /> 
            <Route path="/oyun/hafta-8-aktar" element={<FinalAdventureGame />} /> 
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const navLinkStyle = {
  textDecoration: 'none', 
  color: '#FFFFFF', 
  fontWeight: '600',
  fontSize: '16px',
  padding: '8px 12px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
};

const btnStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '25px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '15px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s'
};

export default App;