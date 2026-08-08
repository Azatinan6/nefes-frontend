import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const DragonGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [bellyScale, setBellyScale] = useState(1); // Ejderhanın karnı (1 ile 2 arası büyüyecek)
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [dragonState, setDragonState] = useState('sleeping'); // 'sleeping' veya 'awake'

  const blowIntensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);

  // Referansları ve Desibel Yüzdesini güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    
    // Desibel hesaplama (Max 100)
    const currentDb = Math.min(Math.round((blowIntensity / 50) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 2) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Asla olumsuz feedback yok, hep pozitif destek)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'encourage') {
        message = "Harika gidiyorsun, karnını balon gibi şişirmeye devam et!";
      } else if (type === 'calm_down') {
        message = "Çok güçlüsün! Şimdi nefesimizi biraz daha yavaş ve sessiz alalım.";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      // 5 saniye sonra tekrar konuşabilmesi için kilidi aç
      setTimeout(() => { warningGiven.current = false; }, 5000);
    }
  };

  // Ejderha Karnı Şişirme Motoru (Diyafram Aktivasyonu)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setBellyScale((prevScale) => {
          let newScale = prevScale - 0.01; // Nefes alınmadığında yavaşça iner
          const currentDb = Math.min(Math.round((blowIntensityRef.current / 50) * 100), 100);
          
          // İDEAL NEFES ALMA: Düşük ve sabit desibel (Örn: %5 ile %25 arası)
          if (currentDb >= 5 && currentDb <= 30) {
            newScale = prevScale + 0.015;
            if (dragonState !== 'sleeping') setDragonState('sleeping');
          } 
          // ÇOK SESLİ/SERT ÜFLEYİŞ: Ejderha irkilir (Omuzlar kalkmış veya üflenmiş olabilir)
          else if (currentDb > 30) {
            setDragonState('awake');
            playAudioPrompt('calm_down'); // Olumsuz değil, sakinleştirici prompt
          }

          if (newScale >= 2.5) newScale = 2.5; // Maksimum karın şişkinliği
          if (newScale <= 1) newScale = 1; // Normal karın

          // Puanlama: Karın ideal seviyede şiş tutuldukça puan artar
          if (newScale > 1.3 && dragonState === 'sleeping') {
            setScore((prev) => {
              const newScore = prev + 1;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
          }

          return newScale;
        });

        // 4 Saniye boyunca nefes/ses yoksa teşvik edici prompt ver
        if (Date.now() - lastBreathTime.current > 4000) {
          playAudioPrompt('encourage');
        }

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver, dragonState]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 2, // 2. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`2. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Yüksek Kontrast Gece Teması (Zıt Renkler)
  const themeColors = { 
    bg: '#1A237E', // Çok Koyu Gece Mavisi
    text: '#64FFDA', // Parlak Fosforlu Turkuaz/Yeşil
    card: '#283593',
    border: '#00E676'
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      
      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Desibel Performans Göstergesi (Nefes Alma Hassasiyeti) */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Nefes Alma Aralığı Göstergesi (%5 - %30 arası yeşil alan) */}
            <div style={{ position: 'absolute', left: '5%', width: '25%', height: '100%', backgroundColor: 'rgba(0, 230, 118, 0.3)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 30 ? '#FFEA00' : '#00E676', // 30'u geçerse sarı olur (çok güçlü)
              transition: 'width 0.1s linear',
              zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFF' }}>🐉 2. Bölüm: Diyafram</h2>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: '#00E676', color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI VE UYUYAN EJDERHA */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* ZzZ Uyku Efekti */}
        {dragonState === 'sleeping' && isListening && (
          <div style={{ fontSize: '40px', color: '#FFF', marginBottom: '20px', animation: 'float 3s infinite' }}>
            ZzZ...
          </div>
        )}
        
        <div style={{ position: 'relative' }}>
          {/* Ejderhanın Vücudu/Kafası */}
          <div style={{ 
            fontSize: '180px', 
            filter: 'drop-shadow(0px 15px 20px rgba(0,0,0,0.6))',
            transition: 'transform 0.3s ease',
            transform: dragonState === 'awake' ? 'scale(1.1) translateY(-20px)' : 'scale(1)'
          }}>
            {dragonState === 'sleeping' ? '🐉' : '🐲'}
          </div>
          
          {/* Şişen Karın (Ayrı bir emoji veya yeşil daire ile temsil ediliyor) */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%',
            width: '80px', height: '80px', backgroundColor: 'rgba(100, 255, 218, 0.8)',
            borderRadius: '50%',
            transform: `translateX(-50%) scale(${bellyScale})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s linear',
            boxShadow: '0 0 20px rgba(100, 255, 218, 0.5)',
            zIndex: -1
          }} />
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
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
        }}>
          👧🏻
        </div>
        
        {/* Karakterin Konuşma Balonu */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '200px', textAlign: 'center'
          }}>
            {dragonState === 'sleeping' ? '💬 Karnını balon gibi şişir...' : '💬 Sakin ol, yavaşça nefes al.'}
          </div>
        )}
      </div>

      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes float {
            0% { transform: translate(0px, 0px); opacity: 0.5; }
            50% { transform: translate(10px, -20px); opacity: 1; }
            100% { transform: translate(20px, -40px); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

const btnStyle = { 
  padding: '12px 24px', fontSize: '18px', border: 'none', 
  borderRadius: '12px', cursor: 'pointer', fontWeight: '900', width: '100%',
  textTransform: 'uppercase', boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
};

export default DragonGame;