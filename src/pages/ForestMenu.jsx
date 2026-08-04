import React from 'react';
import { useNavigate } from 'react-router-dom';

const ForestMenu = () => {
  const navigate = useNavigate();

  // Tabelaların üzerine gelecek şeffaf ve tıklanabilir buton stili
  const hotspotStyle = {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    zIndex: 10,
    borderRadius: '12px' // Tabelanın ahşap hatlarına uyması için hafif oval
  };

  return (
    <div style={{
      backgroundImage: 'url(/nefes-ormani.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: 'calc(100vh - 70px)', // Navbar altı tam ekran
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* 1. Dik Dur Güçlen (Sol Orta) */}
      <button
        onClick={() => navigate('/oyun/dik-dur')}
        title="Dik Dur Güçlen"
        style={{ ...hotspotStyle, top: '28%', left: '6%', width: '14%', height: '9%' }}
      />

      {/* 2. Yavaş Nefes Al Huzur Bul (Sol Üst) */}
      <button
        onClick={() => navigate('/oyun/huzur')}
        title="Yavaş Nefes Al Huzur Bul"
        style={{ ...hotspotStyle, top: '23%', left: '22%', width: '14%', height: '7%' }}
      />

      {/* 3. Çiçeği Kokla Nefesini Tut (Orta Sol) */}
      <button
        onClick={() => navigate('/oyun/cicek')}
        title="Çiçeği Kokla Nefesini Tut"
        style={{ ...hotspotStyle, top: '35%', left: '29%', width: '14%', height: '7%' }}
      />

      {/* 4. Karnını Şişir Balonu Büyüt (Sol Alt) */}
      <button
        onClick={() => navigate('/oyun/balon')}
        title="Karnını Şişir Balonu Büyüt"
        style={{ ...hotspotStyle, top: '59%', left: '3%', width: '14%', height: '7%' }}
      />

      {/* 5. Denge Kur Odaklan (Tam Orta) */}
      <button
        onClick={() => navigate('/oyun/denge')}
        title="Denge Kur Odaklan"
        style={{ ...hotspotStyle, top: '38%', left: '48%', width: '11%', height: '6%' }}
      />

      {/* 6. Uzun Üfle Yelkeni Yürüt (Orta Sağ) */}
      <button
        onClick={() => navigate('/oyun/yelkenli')}
        title="Uzun Üfle Yelkeni Yürüt"
        style={{ ...hotspotStyle, top: '40%', left: '61%', width: '14%', height: '7%' }}
      />

      {/* 7. Güçlü Üfle Roketi Fırlat (Sağ Üst) */}
      <button
        onClick={() => navigate('/oyun/roket')}
        title="Güçlü Üfle Roketi Fırlat"
        style={{ ...hotspotStyle, top: '31%', left: '81%', width: '15%', height: '8%' }}
      />
      
      {/* 8. Derin Çek Enerji Dol (Sağ Alt) */}
      <button
        onClick={() => navigate('/oyun/enerji')}
        title="Derin Çek Enerji Dol"
        style={{ ...hotspotStyle, top: '46%', left: '83%', width: '13%', height: '7%' }}
      />

    </div>
  );
};

export default ForestMenu;