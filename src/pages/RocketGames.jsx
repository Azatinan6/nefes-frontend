import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const RocketGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [rocketHeight, setRocketHeight] = useState(0); // 0 (Volkanın içi) ile 100 (Uzay) arası
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [launchCount, setLaunchCount] = useState(0);

  const blowIntensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);
  const peakReached = useRef(false);

  // Referansları ve Desibel Yüzdesini güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    
    // Gürültü Filtresi: Arka plan seslerini ve klavye tıkırtılarını yok sayar
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // Roketin daha dengeli havalanması için
    const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 10) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Güçlü Ekspirasyon ve Motivasyon odaklı)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Derin bir nefes al ve roketi fırlatmak için tüm gücünle tek seferde üfle!";
      } else if (type === 'encourage') {
        message = "Hadi, derin bir nefes daha alıp daha güçlü üfleyelim!";
      } else if (type === 'success') {
        message = "İnanılmaz bir güç! Roket uzaya ulaştı.";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      setTimeout(() => { warningGiven.current = false; }, 5000);
    }
  };

  useEffect(() => {
    if (isListening) playAudioPrompt('start');
  }, [isListening]);

  // HATA DÜZELTMESİ (Component unmount olunca sesi kes)
  useEffect(() => {
    return () => {
      warningGiven.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  // Güç Üretme Motoru (PEF / Roket Fırlatma)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        const noiseThreshold = 30; 
        let validIntensity = blowIntensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;

        const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);

        setRocketHeight((prev) => {
          let newHeight = prev;
          
          // GÜÇLÜ ÜFLEME BEKLENTİSİ: Tek nefeste fırlatma (%20 ve üzeri desibel roket havalandırır)
          if (currentDb > 20) {
            // Şiddete göre roket 2 kat daha hızlı yükselir
            newHeight += (currentDb / 5); 
            peakReached.current = false;
          } 
          // ÜFLEME BİTTİ (Yerçekimi roketi aşağı çeker)
          else {
            newHeight -= 2.5; // Hızla yere düşer
          }

          if (newHeight <= 0) newHeight = 0; // Yerde

          // BAŞARILI FIRLATMA (Uzaya Ulaşma)
          if (newHeight >= 100 && !peakReached.current) {
            peakReached.current = true;
            setScore((s) => {
              const newScore = s + 100;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
            setLaunchCount((l) => l + 1);
            playAudioPrompt('success');
            return 100; // Zirvede bir an asılı kalır
          }

          // Kısmi Yükselme Puanı (Yukarı çıktıkça minik puanlar alır)
          if (newHeight > prev && currentDb > 20) {
            setScore((s) => s + 1);
          }

          return newHeight;
        });

        // 6 Saniye boyunca güçlü üfleme yoksa teşvik edici prompt ver
        if (Date.now() - lastBreathTime.current > 6000) {
          playAudioPrompt('encourage');
        }

      }, 50); // Daha hızlı tepkime (Güçlü üflemeyi anında yakalamak için 100ms yerine 50ms)
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    
    // HATA DÜZELTMESİ (Konuşmayı kesin keser)
    warningGiven.current = true;
    window.speechSynthesis.cancel();

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 6, // 6. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`6. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Yüksek Kontrast Teması (Kızgın Volkan ve Karanlık Uzay)
  const themeColors = { 
    bg: '#212121', // Çok Koyu Gri (Gökyüzü/Uzay)
    text: '#FFFFFF', // Beyaz
    card: '#424242', 
    border: '#FF3D00', // Parlak Volkan Turuncusu
    accent: '#FFEA00' // Ateş Sarısı
  };

  // Roket yüksekliğine göre arka plan rengini uzaya doğru karartma efekti
  const dynamicBg = rocketHeight > 50 
    ? `rgba(0, 0, 0, ${rocketHeight / 100})` 
    : themeColors.bg;

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: dynamicBg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text, transition: 'background-color 0.2s ease'
    }}>
      
      {/* Yıldız Efektleri (Roket yükseldikçe belirginleşir) */}
      {rocketHeight > 60 && (
        <>
          <div style={{ position: 'absolute', top: '10%', left: '20%', fontSize: '20px' }}>✨</div>
          <div style={{ position: 'absolute', top: '25%', right: '15%', fontSize: '30px' }}>🌟</div>
          <div style={{ position: 'absolute', top: '5%', left: '70%', fontSize: '15px' }}>✨</div>
        </>
      )}

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Desibel Performans Göstergesi (Güçlü Üfleme Hassasiyeti) */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(255,61,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.border }}>🎙️ Patlama Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Güçlü Üfleme Aralığı (Ters mantık: %20 ve üzeri yeşil alan) */}
            <div style={{ position: 'absolute', left: '20%', width: '80%', height: '100%', backgroundColor: 'rgba(0, 230, 118, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 20 ? '#00E676' : '#FF9100', // Yüksek güç isteniyor
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(255,61,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>🚀 6. Bölüm: Volkan Vadisi</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#FFF' }}>
            Fırlatma: {launchCount} | Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: themeColors.border, color: '#FFF', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#D50000', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Volkan ve Roket */}
      <div style={{
        position: 'absolute', bottom: '0', width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
      }}>
        
        {/* Roket */}
        <div style={{
          position: 'absolute',
          bottom: `${15 + (rocketHeight * 0.7)}%`, // Roket %15'ten başlar, volkanın içinden çıkar
          fontSize: '150px',
          zIndex: 10,
          transition: 'bottom 0.1s ease-out',
          filter: 'drop-shadow(0px 15px 10px rgba(0,0,0,0.6))'
        }}>
          🚀
          {/* Ateş Efekti (Sadece güçlü üflerken çıkar) */}
          {dbPercentage > 20 && (
            <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', fontSize: '60px', animation: 'fire 0.2s infinite alternate' }}>
              🔥
            </div>
          )}
        </div>

        {/* Volkan Dağı (Ön Plan) */}
        <div style={{
          position: 'absolute', bottom: '-50px', width: '400px', height: '300px',
          backgroundColor: '#3E2723', borderRadius: '200px 200px 0 0',
          borderTop: '20px solid #FF3D00', // Lav
          zIndex: 15, display: 'flex', justifyContent: 'center', boxShadow: '0 -10px 40px rgba(255, 61, 0, 0.4)'
        }}>
          <div style={{ fontSize: '80px', marginTop: '20px' }}>🌋</div>
        </div>

      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ (Yanda Bekleyen Çocuk Avatarı) */}
      <div style={{
        position: 'absolute', bottom: '30px', left: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 100
      }}>
        <div style={{
          width: '120px', height: '120px', backgroundColor: '#FFF', borderRadius: '50%',
          border: `4px solid ${themeColors.border}`, display: 'flex', justifyContent: 'center',
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.8)',
        }}>
          👦🏻
        </div>
        
        {/* Karakterin Konuşma Balonu */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {
              rocketHeight > 90 ? 'Mükemmel! Uzaya çıktık!' : 
              dbPercentage > 20 ? 'Daha güçlü, devam et!' : 
              'Tüm gücünle tek seferde üfle!'
            }
          </div>
        )}
      </div>

      {/* CSS Ateş Animasyonu */}
      <style>
        {`
          @keyframes fire {
            0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
            100% { transform: translateX(-50%) scale(1.2) translateY(10px); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

const btnStyle = { 
  padding: '12px 24px', fontSize: '18px', border: 'none', 
  borderRadius: '12px', cursor: 'pointer', fontWeight: '900', width: '100%',
  textTransform: 'uppercase', boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
};

export default RocketGame;