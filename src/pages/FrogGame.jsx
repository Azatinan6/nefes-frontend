import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const FrogGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [bellyScale, setBellyScale] = useState(1); // Kurbağanın karnı (1 ile 3 arası şişecek)
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);

  const blowIntensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);

  // Referansları ve Desibel Yüzdesini güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    
    // Desibel hesaplama (Max 100). Diyafram nefesi sabit ve düşük ses üretir.
    const currentDb = Math.min(Math.round((blowIntensity / 50) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 2) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Asla olumsuz feedback yok, sadece pozitif destek)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Kurbağanın karnını balon gibi şişirmek için derin bir nefes al!";
      } else if (type === 'encourage') {
        message = "Harika gidiyorsun, karnını şişirmeye devam et!";
      } else if (type === 'calm_down') {
        message = "Çok güçlüsün! Ejderhayı uyandırmamak için daha yavaş nefes alalım.";
      } else if (type === 'success') {
        message = "Kocaman oldu, harika bir diyafram nefesi!";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      // Aynı uyarıyı üst üste yapmaması için 6 saniye kilit
      setTimeout(() => { warningGiven.current = false; }, 6000);
    }
  };

  // Oyun başladığında ilk yönlendirmeyi yap
  useEffect(() => {
    if (isListening) {
      playAudioPrompt('start');
    }
  }, [isListening]);

  // Kurbağa Karnı Şişirme Motoru (Diyafram Aktivasyonu)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setBellyScale((prevScale) => {
          let newScale = prevScale - 0.015; // Nefes alınmadığında karın yavaşça iner
          const currentDb = Math.min(Math.round((blowIntensityRef.current / 50) * 100), 100);
          
          // İDEAL DİYAFRAM NEFESİ: Düşük ve sabit desibel (%5 ile %30 arası)
          if (currentDb >= 5 && currentDb <= 30) {
            newScale = prevScale + 0.025; // Karın şişmeye başlar
          } 
          // ÇOK SESLİ/SERT NEFES: Ejderhayı uyandırma riski (Hızlı üfleme)
          else if (currentDb > 30) {
            newScale = prevScale - 0.05; // Karın şişmez, yapay zeka sakinleştirir
            playAudioPrompt('calm_down');
          }

          // Kurbağa maksimum boyuta ulaştığında patlamaz, mutlu olur ve puan verir
          if (newScale >= 3) {
            setScore((prevScore) => {
              const newScore = prevScore + 50; // Tam şişirme bonusu
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
            playAudioPrompt('success');
            return 1; // Başarıyla şişirildiğinde karnı tekrar normale döner, döngü başlar
          }
          
          if (newScale <= 1) newScale = 1; // Normal karın boyutu

          // Düzenli nefes puanı
          if (newScale > 1.5 && currentDb >= 5 && currentDb <= 30) {
            setScore((prevScore) => {
              const newScore = prevScore + 1;
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
  }, [isListening, gameOver]);

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

  // Yüksek Kontrast Teması (Zıt Renkler: Koyu Mor Bataklık ve Parlak Yeşil)
  const themeColors = { 
    bg: '#311B92', // Çok Koyu Mor (Bataklık Gece)
    text: '#B2FF59', // Parlak Açık Yeşil
    card: '#4527A0', 
    border: '#76FF03' // Fosforlu Yeşil
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
        
        {/* Desibel Performans Göstergesi (Diyafram Hassasiyeti) */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(118,255,3,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Diyafram Nefesi Aralığı (%5 - %30) */}
            <div style={{ position: 'absolute', left: '5%', width: '25%', height: '100%', backgroundColor: 'rgba(118, 255, 3, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 30 ? '#FF1744' : '#76FF03', 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(118,255,3,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>🐸 2. Bölüm: Kurbağa Bataklığı</h2>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#FFF' }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: '#76FF03', color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Nilüfer Yaprağı ve Kurbağa */}
      <div style={{
        position: 'absolute', top: '55%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* Arka Planda Uyuyan Ejderha Silüeti (Detay, sadece görsel uyaran) */}
        <div style={{ position: 'absolute', top: '-150px', right: '-200px', fontSize: '80px', opacity: 0.3, filter: 'grayscale(100%)' }}>
          🐉💤
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Kurbağanın Şişen Karnı (Yeşil Daire) */}
          <div style={{
            position: 'absolute', top: '40%', left: '50%',
            width: '60px', height: '60px', backgroundColor: 'rgba(118, 255, 3, 0.8)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${bellyScale})`,
            transition: 'transform 0.1s linear',
            boxShadow: `0 0 ${10 * bellyScale}px rgba(118, 255, 3, 0.6)`,
            zIndex: 1
          }} />

          {/* Kurbağa Emojisi */}
          <div style={{ 
            fontSize: '160px', 
            zIndex: 2,
            filter: 'drop-shadow(0px 15px 10px rgba(0,0,0,0.5))'
          }}>
            🐸
          </div>
          
          {/* Nilüfer Yaprağı */}
          <div style={{
            position: 'absolute', bottom: '-40px', left: '50%',
            transform: 'translateX(-50%)',
            width: '250px', height: '60px', backgroundColor: '#1B5E20',
            borderRadius: '50%', zIndex: 0,
            boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.5)'
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
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.8)',
        }}>
          👧🏻
        </div>
        
        {/* Karakterin Konuşma Balonu (Sadece Pozitif Prompt) */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {bellyScale > 2 ? 'Kocaman oldu, harika!' : 'Karnını balon gibi şişir...'}
          </div>
        )}
      </div>

    </div>
  );
};

const btnStyle = { 
  padding: '12px 24px', fontSize: '18px', border: 'none', 
  borderRadius: '12px', cursor: 'pointer', fontWeight: '900', width: '100%',
  textTransform: 'uppercase', boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
};

export default FrogGame;