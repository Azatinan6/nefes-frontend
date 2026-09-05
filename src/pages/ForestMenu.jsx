import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForestMenu = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [editMode, setEditMode] = React.useState(false); // Geliştirici modu (kapatıldı)

  // Oyuna gitmeden önce giriş kontrolü yapar
  const goToGame = (path) => {
    if (editMode) return; // Edit modundayken tıklanıp başka sayfaya gitmesini engelle
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
    backgroundColor: editMode ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0)', 
    border: editMode ? '2px dashed yellow' : 'none',
    color: 'white',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    zIndex: 10,
    borderRadius: '20px', // Köşeleri yumuşatılmış tıklama alanları
    //transition: 'background-color 0.2s ease-in-out', // Hover için yumuşak geçiş
  };

  // Hover efektleri (Üzerine gelince hafif beyaz parlama)
  //const handleMouseEnter = (e) => { if (!editMode) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; };
  //const handleMouseLeave = (e) => { if (!editMode) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0)'; };

  return (
    <div style={{
      backgroundImage: 'url(/nefes-ormani.jpg)', 
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: 'calc(100vh - 75px)', // Navbar'ın yüksekliğine göre ufak bir pay daha bıraktım (taşmayı engellemek için)
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {editMode && (
        <div style={{position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', borderRadius: '8px', zIndex: 100}}>
          <h3 style={{margin: 0, fontSize: '16px'}}>🔧 Düzenleme Modu Açık</h3>
          <p style={{margin: '5px 0 0 0', fontSize: '12px'}}>Tabelaların yerlerini ayarlamak için kırmızı kutulara bakabilirsiniz.</p>
          <button onClick={() => setEditMode(false)} style={{marginTop: '10px', padding: '5px 10px', cursor: 'pointer'}}>Kapat</button>
        </div>
      )}

      {/* 1. Hafta: Çiçek Kokla */}
      <button
        onClick={() => goToGame('/oyun/hafta-1-cicek')}
        title="Çiçek Kokla"
        style={{ ...hotspotStyle, top: '56%', left: '1.5%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "1. Hafta"}
      </button>

      {/* 2. Hafta: Eğlenceli Balon */}
      <button
        onClick={() => goToGame('/oyun/hafta-2-balon')}
        title="Eğlenceli Balon"
        style={{ ...hotspotStyle, top: '30.5%', left: '4%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "2. Hafta"}
      </button>

      {/* 3. Hafta: Yelkeni Yüzdür */}
      <button
        onClick={() => goToGame('/oyun/hafta-3-yelken')}
        title="Yelkeni Yüzdür"
        style={{ ...hotspotStyle, top: '29.5%', left: '30%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "3. Hafta"}
      </button>

      {/* 4. Hafta: Gözün Arabada! */}
      <button
        onClick={() => goToGame('/oyun/hafta-4-kontrol-et')}
        title="Gözün Arabada!"
        style={{ ...hotspotStyle, top: '33%', left: '52.5%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "4. Hafta"}
      </button>

      {/* 5. Hafta: Kurbağayı Zıplat! */}
      <button
        onClick={() => goToGame('/oyun/hafta-5-surdur')}
        title="Kurbağayı Zıplat!"
        style={{ ...hotspotStyle, top: '68.5%', left: '22%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "5. Hafta"}
      </button>

      {/* 6. Hafta: Çorbayı Kokla ve Soğut! */}
      <button
        onClick={() => goToGame('/oyun/hafta-6-guc-uret')}
        title="Çorbayı Kokla ve Soğut"
        style={{ ...hotspotStyle, top: '62%', left: '32.5%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "6. Hafta"}
      </button>

      {/* 7. Hafta: Güçlü Üfle, Roketi Fırlat! */}
      <button
        onClick={() => goToGame('/oyun/hafta-7-birlestir')}
        title="Güçlü Üfle, Roketi Fırlat!"
        style={{ ...hotspotStyle, top: '14.5%', left: '50.5%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "7. Hafta"}
      </button>

      {/* 8. Hafta: Nefes Kristalleri Macerası */}
      <button
        onClick={() => goToGame('/oyun/hafta-8-aktar')}
        title="Nefes Kristalleri Macerası"
        style={{ ...hotspotStyle, top: '19%', left: '73.5%', width: '12%', height: '13%' }}
        //onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      >
        {editMode && "8. Hafta"}
      </button>

    </div>
  );
};

export default ForestMenu;