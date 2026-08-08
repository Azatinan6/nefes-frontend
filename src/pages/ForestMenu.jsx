import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForestMenu = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Oyuna gitmeden önce giriş kontrolü yapar
  const goToGame = (path) => {
    if (isAuthenticated()) {
      navigate(path);
    } else {
      // Giriş yapılmamışsa login sayfasına yönlendir, döneceği sayfa bilgisini de gönder
      navigate('/giris', { state: { from: path } });
    }
  };

  // Tabelaların ve karakterlerin üzerine gelecek şeffaf ve tıklanabilir buton stili
  const hotspotStyle = {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0)', // Başlangıçta tamamen şeffaf
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    zIndex: 10,
    borderRadius: '20px', // Köşeleri yumuşatılmış tıklama alanları
    transition: 'background-color 0.2s ease-in-out', // Hover için yumuşak geçiş
  };

  // Hover efektleri (Üzerine gelince hafif beyaz parlama)
  const handleMouseEnter = (e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
  const handleMouseLeave = (e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0)';

  return (
    <div style={{
      /* Not: Eğer yeni resmi nefes-ormani2.jpg olarak kaydettiysen buradaki url'i değiştir. */
      backgroundImage: 'url(/nefes-ormani.jpg)', 
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: 'calc(100vh - 70px)',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* 1. Hafta: Fark Et (Sol Alt - Yoga Yapan Çocuk) */}
      <button
        onClick={() => goToGame('/oyun/hafta-1-fark-et')}
        title="Dik Dur, Gücünü Hisset!"
        style={{ ...hotspotStyle, top: '55%', left: '3%', width: '13%', height: '30%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 2. Hafta: Hisset (Sol Alt/Orta - Kurbağa ve Nilüfer) */}
      <button
        onClick={() => goToGame('/oyun/hafta-2-hisset')}
        title="Kurbağa ile Zıpla!"
        style={{ ...hotspotStyle, top: '63%', left: '22%', width: '22%', height: '32%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 3. Hafta: Hareket Ettir (Sol Orta - Gökkuşağı) */}
      <button
        onClick={() => goToGame('/oyun/hafta-3-hareket-ettir')}
        title="Gökkuşağı Çiz!"
        style={{ ...hotspotStyle, top: '26%', left: '8%', width: '20%', height: '28%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 4. Hafta: Kontrol Et (Sağ Alt - Kristal Mağarası) */}
      <button
        onClick={() => goToGame('/oyun/hafta-4-kontrol-et')}
        title="Gizemli Kristal Mağarası"
        style={{ ...hotspotStyle, top: '62%', left: '48%', width: '22%', height: '35%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 5. Hafta: Sürdür (Orta Üst - Yelkenli ve Göl) */}
      <button
        onClick={() => goToGame('/oyun/hafta-5-surdur')}
        title="Rüzgarlı Göl Macerası"
        style={{ ...hotspotStyle, top: '20%', left: '34%', width: '18%', height: '25%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 6. Hafta: Güç Üret (Orta Merkez - Volkanın Önündeki Tabela) */}
      <button
        onClick={() => goToGame('/oyun/hafta-6-guc-uret')}
        title="Süper Gücünü Kullan!"
        style={{ ...hotspotStyle, top: '55%', left: '35%', width: '13%', height: '16%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 7. Hafta: Birleştir (Sağ Orta - Asma Köprü) */}
      <button
        onClick={() => goToGame('/oyun/hafta-7-birlestir')}
        title="Cesaret Köprüsü"
        style={{ ...hotspotStyle, top: '24%', left: '58%', width: '15%', height: '22%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

      {/* 8. Hafta: Aktar (Sağ Üst - Elmas ve Tapınak Finali) */}
      <button
        onClick={() => goToGame('/oyun/hafta-8-aktar')}
        title="Büyük Hazine Peşinde"
        style={{ ...hotspotStyle, top: '22%', left: '72%', width: '25%', height: '35%' }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      />

    </div>
  );
};

export default ForestMenu;