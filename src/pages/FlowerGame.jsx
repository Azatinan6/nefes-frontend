import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
const FlowerGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [progress, setProgress] = useState(0); // 0 (Karanlık) ile 100 (Açık Gökyüzü ve Gökkuşağı) arası
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
    
    // Desibel hesaplama (Max 100)
    const currentDb = Math.min(Math.round((blowIntensity / 160) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 2) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Sadece pozitif destek ve torakal mobilite yönlendirmesi)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'encourage') {
        message = "Kollarını iki yana kocaman aç ve derin bir nefes al!";
      } else if (type === 'calm_down') {
        message = "Güzeldi ama bir kez daha deneyelim, gökkuşağı için daha yavaş nefes alabilirsin.";
      } else if (type === 'success') {
        message = "Harika, bulutlar dağılıyor! Böyle devam et.";
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

  // Torakal Mobilite Motoru (Gökkuşağı Büyütme)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setProgress((prev) => {
          let newProgress = prev - 0.3; // Nefes alınmadığında bulutlar yavaşça kapanır
          const currentDb = Math.min(Math.round((blowIntensityRef.current / 160) * 100), 100);
          
          // İDEAL NEFES ALMA: Göğsü açacak yavaş ve derin nefes (%5 - %30 arası)
          if (currentDb >= 5 && currentDb <= 30) {
            newProgress = prev + 1.2; // Bulutlar açılır, gökkuşağı büyür
          } 
          // ÇOK SESLİ: Hızlı/Sert çekilen veya üflenen nefes
          else if (currentDb > 30) {
            playAudioPrompt('calm_down');
          }

          if (newProgress >= 100) newProgress = 100;
          if (newProgress <= 0) newProgress = 0;

          // Puanlama ve Geri Bildirim
          if (newProgress > 20 && currentDb >= 5 && currentDb <= 30) {
            setScore((prevScore) => {
              const newScore = prevScore + 1;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
          }

          return newProgress;
        });

        // 4.5 Saniye boyunca nefes yoksa kollarını açıp nefes almasını iste
        if (Date.now() - lastBreathTime.current > 4500) {
          playAudioPrompt('encourage');
        } 
        // Gelişimi fark edip motive etme
        else if (progress > 40 && progress < 45 && !warningGiven.current) {
          playAudioPrompt('success');
        }

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver, progress]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 3, // 3. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`3. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Dinamik Arka Plan Rengi: İlerlemeye göre koyu griden parlak maviye geçer
  const skyColor = progress > 50 
    ? `rgba(41, 182, 246, ${progress / 160})`  // Aydınlık Gökyüzü
    : `rgba(38, 50, 56, ${1 - (progress / 160)})`; // Karanlık/Bulutlu

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: skyColor, overflow: 'hidden', fontFamily: 'sans-serif',
      color: '#FFF', transition: 'background-color 0.5s ease'
    }}>
      
      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Desibel Performans Göstergesi */}
        <div style={{
          backgroundColor: '#37474F', padding: '15px 25px', borderRadius: '16px',
          border: '3px solid #FFC107', boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 30 ? cpTheme.primary.coral : cpTheme.primary.emerald, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: cpTheme.card.white, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${cpTheme.elements.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>🌈 Göğsümü Açıyorum</h2>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: cpTheme.text.muted }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: cpTheme.primary.teal, color: cpTheme.text.light, marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: cpTheme.primary.coral, color: cpTheme.text.light, marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI (Bulutlar ve Gökkuşağı) */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'
      }}>
        
        {/* Gökkuşağı (Nefes aldıkça büyür ve belirginleşir) */}
        <div style={{
          position: 'absolute',
          fontSize: '300px',
          opacity: Math.max(progress / 160, 0.1), // Tamamen kaybolmaz, hafifçe silüeti kalır
          transform: `scale(${0.5 + (progress / 200)}) translateY(${30 - (progress * 0.3)}px)`, // Aşağıdan yukarıya doğru yükselerek büyür
          transition: 'all 0.2s ease-out',
          zIndex: 1,
          filter: 'drop-shadow(0px 0px 30px rgba(255,255,255,0.4))'
        }}>
          🌈
        </div>

        {/* Sol Bulut (Nefes aldıkça sola kayar) */}
        <div style={{
          position: 'absolute', left: '30%',
          fontSize: '180px', zIndex: 2,
          transform: `translateX(-${progress * 4}px)`,
          opacity: 1 - (progress / 220), // Dağılırken hafif silikleşir
          transition: 'all 0.2s linear',
          filter: `brightness(${50 + (progress * 0.5)}%)` // Aydınlanır
        }}>
          ☁️
        </div>

        {/* Sağ Bulut (Nefes aldıkça sağa kayar) */}
        <div style={{
          position: 'absolute', right: '30%',
          fontSize: '180px', zIndex: 2,
          transform: `translateX(${progress * 4}px)`,
          opacity: 1 - (progress / 220),
          transition: 'all 0.2s linear',
          filter: `brightness(${50 + (progress * 0.5)}%)`
        }}>
          ☁️
        </div>

      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ (Yanda Bekleyen Avatar) */}
      <div style={{
        position: 'absolute', bottom: '30px', left: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 100
      }}>
        <div style={{
          width: '120px', height: '120px', backgroundColor: cpTheme.card.white, borderRadius: '50%',
          border: `4px solid ${cpTheme.elements.border}`, display: 'flex', justifyContent: 'center',
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }}>
          👦🏻
        </div>
        
        {/* Karakterin Konuşma Balonu */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: cpTheme.card.white, color: cpTheme.text.dark, padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            maxWidth: '220px', textAlign: 'center'
          }}>
            {progress < 50 ? '💬 Kollarını kocaman aç ve nefes al!' : '💬 Süper, gökkuşağı çıkıyor!'}
          </div>
        )}
      </div>

    </div>
  );
};

const btnStyle = { 
  padding: '12px 24px', fontSize: '18px', border: 'none', 
  borderRadius: '12px', cursor: 'pointer', fontWeight: '900', width: '100%',
  textTransform: 'uppercase', boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
};

export default FlowerGame;