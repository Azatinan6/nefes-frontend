import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const RainbowGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [progress, setProgress] = useState(0); // 0 (Bulutlu) ile 100 (Açık Gökyüzü ve Gökkuşağı)
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
    
    // Desibel hesaplama (Max 100). Göğüs açarak alınan derin nefes sabit bir hışırtı üretir.
    const currentDb = Math.min(Math.round((blowIntensity / 50) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 2) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Torakal mobiliteye özel, pozitif destek)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Kollarını iki yana kocaman aç ve göğsünü açarak derin bir nefes al!";
      } else if (type === 'encourage') {
        message = "Çok iyi! Göğsünü açmaya ve gökkuşağını büyütmeye devam et.";
      } else if (type === 'calm_down') {
        message = "Çok güçlüsün! Bulutları dağıtmak için nefesimizi yavaşça içimize çekelim.";
      } else if (type === 'success') {
        message = "Harika, gökyüzü pırıl pırıl oldu!";
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

  // Torakal Mobilite Motoru (Gökkuşağı ve Bulutlar)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setProgress((prev) => {
          let newProgress = prev - 0.5; // Nefes alınmadığında bulutlar yavaşça kapanır
          const currentDb = Math.min(Math.round((blowIntensityRef.current / 50) * 100), 100);
          
          // İDEAL NEFES: Toraks ekspansiyonu için yavaş ve derin nefes (%5 - %30 arası)
          if (currentDb >= 5 && currentDb <= 30) {
            newProgress = prev + 1.5; // Bulutlar açılır, gökkuşağı belirir
          } 
          // ÇOK SESLİ: Hızlı üfleme veya bağırma
          else if (currentDb > 30) {
            newProgress = prev - 0.2; // Gelişim durur
            playAudioPrompt('calm_down');
          }

          if (newProgress >= 100) {
            // Tamamen açıldığında ekstra bonus ver
            setScore((prevScore) => {
              const newScore = prevScore + 5;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
            return 100;
          }
          if (newProgress <= 0) newProgress = 0;

          // Düzenli nefes ve hareket puanı
          if (newProgress > 20 && currentDb >= 5 && currentDb <= 30) {
            setScore((prevScore) => {
              const newScore = prevScore + 1;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
          }

          return newProgress;
        });

        // 4 Saniye boyunca nefes/ses yoksa teşvik edici prompt ver
        if (Date.now() - lastBreathTime.current > 4000) {
          playAudioPrompt('encourage');
        }
        // Gökkuşağı tam açılmaya yaklaştığında başarı mesajı
        else if (progress > 85 && progress < 90 && !warningGiven.current) {
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

  // İlerlemeye göre dinamik arka plan (Karanlık griden parlak maviye)
  const skyColor = progress > 50 
    ? `rgba(2, 136, 209, ${progress / 100})`  // Parlak Mavi
    : `rgba(38, 50, 56, ${1 - (progress / 100)})`; // Koyu Gri/Bulutlu

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
        
        {/* Desibel Performans Göstergesi (Derin Nefes Hassasiyeti) */}
        <div style={{
          backgroundColor: '#263238', padding: '15px 25px', borderRadius: '16px',
          border: '3px solid #FFEB3B', boxShadow: '0 8px 20px rgba(255,235,59,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Torakal Nefes Aralığı (%5 - %30) */}
            <div style={{ position: 'absolute', left: '5%', width: '25%', height: '100%', backgroundColor: 'rgba(255, 235, 59, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 30 ? '#FF1744' : '#FFEB3B', 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: '#263238', padding: '15px 30px', borderRadius: '16px',
          border: '3px solid #FFEB3B', boxShadow: '0 8px 20px rgba(255,235,59,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFEB3B' }}>🌈 3. Bölüm: Göğsümü Açıyorum</h2>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#FFF' }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: '#FFEB3B', color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Bulutlar ve Gökkuşağı */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'
      }}>
        
        {/* Gökkuşağı (Nefes aldıkça büyür ve belirginleşir) */}
        <div style={{
          position: 'absolute',
          fontSize: '250px',
          opacity: Math.max(progress / 100, 0), // Tamamen gizliden görünürlüğe geçer
          transform: `scale(${0.2 + (progress / 125)}) translateY(${50 - (progress * 0.5)}px)`, 
          transition: 'all 0.2s ease-out',
          zIndex: 1,
          filter: 'drop-shadow(0px 0px 40px rgba(255,255,255,0.6))'
        }}>
          🌈
        </div>

        {/* Sol Bulut (Nefes aldıkça sola kayar) */}
        <div style={{
          position: 'absolute', left: '35%',
          fontSize: '180px', zIndex: 2,
          transform: `translateX(-${progress * 6}px)`,
          opacity: 1 - (progress / 150), // Dağılırken hafif silikleşir
          transition: 'all 0.2s linear',
          filter: `brightness(${50 + (progress * 0.5)}%)` // Karanlıktan aydınlığa geçer
        }}>
          ☁️
        </div>

        {/* Sağ Bulut (Nefes aldıkça sağa kayar) */}
        <div style={{
          position: 'absolute', right: '35%',
          fontSize: '180px', zIndex: 2,
          transform: `translateX(${progress * 6}px)`,
          opacity: 1 - (progress / 150),
          transition: 'all 0.2s linear',
          filter: `brightness(${50 + (progress * 0.5)}%)`
        }}>
          ☁️
        </div>

      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ (Yanda Bekleyen Çocuk Avatarı) */}
      <div style={{
        position: 'absolute', bottom: '30px', left: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 100
      }}>
        <div style={{
          width: '120px', height: '120px', backgroundColor: '#FFF', borderRadius: '50%',
          border: '4px solid #FFEB3B', display: 'flex', justifyContent: 'center',
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.8)',
        }}>
          👦🏻
        </div>
        
        {/* Karakterin Konuşma Balonu (Pozitif Yönlendirme) */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {progress < 80 ? 'Kollarını kocaman aç ve nefes al!' : 'Harika! Gökyüzü açılıyor.'}
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

export default RainbowGame;