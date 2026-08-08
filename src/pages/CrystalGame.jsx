import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const CrystalGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [gamePhase, setGamePhase] = useState('inhale'); // 'inhale' (nefes al), 'hold' (nefes tut), 'success' (kelebek kondu)
  const [crystalGlow, setCrystalGlow] = useState(0); // 0 ile 100 arası parlaklık
  const [holdProgress, setHoldProgress] = useState(0); // 3 saniyelik nefes tutma süresi (0-100)
  
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);

  const blowIntensityRef = useRef(0);
  const phaseRef = useRef('inhale');
  const warningGiven = useRef(false);

  // Referansları güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    phaseRef.current = gamePhase;
    
    // Desibel hesaplama (Max 100)
    const currentDb = Math.min(Math.round((blowIntensity / 50) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity, gamePhase]);

  // Sesli Yönlendirme (Nefes Tutma/Kontrol odaklı, pozitif destek)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Derin bir nefes alarak kristali doldur, sonra kelebek için nefesini tut!";
      } else if (type === 'hold_now') {
        message = "Harika! Şimdi nefesini tut ve hiç ses çıkarma, kelebek geliyor...";
      } else if (type === 'scared') {
        message = "Kelebek sesten biraz ürktü, hadi tekrar kristali doldurup sessizce bekleyelim.";
      } else if (type === 'success') {
        message = "Süper! Kelebek kondu. Nefesini harika kontrol ediyorsun!";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      setTimeout(() => { warningGiven.current = false; }, 6000);
    }
  };

  useEffect(() => {
    if (isListening) playAudioPrompt('start');
  }, [isListening]);

  // Nefes Kontrol ve Tutma Motoru (Inspiratuvar Hold)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 50) * 100), 100);

        // AŞAMA 1: NEFES AL VE KRİSTALİ DOLDUR
        if (phaseRef.current === 'inhale') {
          setCrystalGlow((prev) => {
            let newGlow = prev - 1; // Nefes alınmadığında kristal söner
            
            // İdeal Nefes Alma (%5 - %30)
            if (currentDb >= 5 && currentDb <= 30) {
              newGlow = prev + 2; 
            }
            
            if (newGlow <= 0) newGlow = 0;
            
            // Kristal tamamen dolduğunda Nefes Tutma (Hold) aşamasına geç
            if (newGlow >= 100) {
              setGamePhase('hold');
              playAudioPrompt('hold_now');
              return 100;
            }
            return newGlow;
          });
        }

        // AŞAMA 2: NEFESİNİ TUT (Sessizlik Beklentisi)
        else if (phaseRef.current === 'hold') {
          // Nefes tutarken (sessizlikte) desibel çok düşük olmalı (< %8)
          if (currentDb < 8) {
            setHoldProgress((prev) => {
              const newProgress = prev + 3; // Yaklaşık 3 saniyede %100 olur (100ms * 30 = 3000ms)
              
              // 3 Saniye Başarıyla Tutulduysa:
              if (newProgress >= 100) {
                setGamePhase('success');
                setScore((s) => {
                  const newScore = s + 50;
                  setCrystals(Math.floor(newScore / 200));
                  return newScore;
                });
                playAudioPrompt('success');
                
                // 4 saniye sonra yeni tur için sıfırla
                setTimeout(() => {
                  setGamePhase('inhale');
                  setCrystalGlow(0);
                  setHoldProgress(0);
                }, 4000);
                
                return 100;
              }
              return newProgress;
            });
          } 
          // ÇOCUK NEFESİNİ TUTAMAZ VEYA SES ÇIKARIRSA (Kelebek kaçar)
          else if (currentDb >= 8) {
            setGamePhase('inhale');
            setCrystalGlow(50); // Ceza yok, sadece kristal biraz söner
            setHoldProgress(0);
            playAudioPrompt('scared'); // Olumsuz değil, motive edici uyarı
          }
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
      gameId: 4, // 4. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`4. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Yüksek Kontrast Teması (Karanlık Mağara ve Parlak Kristal)
  const themeColors = { 
    bg: '#121212', // Çok Koyu Gri/Siyah
    text: '#E0F7FA', // Açık Camgöbeği
    card: '#263238', 
    border: '#00E5FF', // Parlak Turkuaz (Kristal Rengi)
    butterfly: '#FFEA00' // Parlak Sarı (Yüksek Kontrast)
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
        
        {/* Desibel Performans Göstergesi */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,229,255,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* Dinamik Hedef Göstergesi: 'inhale' aşamasında nefes alma alanı (%5-%30) yeşil, 'hold' aşamasında sessizlik alanı (%0-%8) yeşil */}
            {gamePhase === 'inhale' ? (
              <div style={{ position: 'absolute', left: '5%', width: '25%', height: '100%', backgroundColor: 'rgba(0, 229, 255, 0.4)', zIndex: 1 }} />
            ) : (
              <div style={{ position: 'absolute', left: '0%', width: '8%', height: '100%', backgroundColor: 'rgba(255, 234, 0, 0.6)', zIndex: 1 }} />
            )}
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 30 ? '#FF1744' : themeColors.border, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>
            {gamePhase === 'hold' ? '🤫 Sessiz Ol...' : `%{dbPercentage}`}
          </span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,229,255,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>💎 4. Bölüm: Kristal Mağara</h2>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#FFF' }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: '#00E5FF', color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Parlayan Kristal ve Kelebek */}
      <div style={{
        position: 'absolute', top: '55%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Kristal Emojisi (Nefes aldıkça parlar) */}
          <div style={{ 
            fontSize: '150px', 
            zIndex: 2,
            filter: `drop-shadow(0px 0px ${crystalGlow / 2}px rgba(0, 229, 255, ${crystalGlow / 100}))`,
            transform: `scale(${1 + (crystalGlow / 500)})`,
            transition: 'all 0.2s ease'
          }}>
            💎
          </div>

          {/* Kelebek (Nefes tutuldukça kristale yaklaşır) */}
          <div style={{
            position: 'absolute',
            fontSize: '80px',
            zIndex: 3,
            // Nefes alırken uzakta uçar, nefes tutarken kristale yaklaşır, success olunca tam kristalin üstüne konar
            top: gamePhase === 'success' ? '-40px' : '-150px',
            left: gamePhase === 'success' ? '50px' : `${150 - holdProgress}px`,
            opacity: gamePhase === 'inhale' ? 0.5 : 1,
            transform: gamePhase === 'success' ? 'scale(1)' : `scale(${0.5 + (holdProgress/200)}) rotate(${Math.sin(Date.now() / 100) * 15}deg)`,
            transition: 'all 0.3s ease-out',
            filter: 'drop-shadow(0px 5px 10px rgba(255, 234, 0, 0.5))'
          }}>
            🦋
          </div>

        </div>
        
        {/* Nefes Tutma Çubuğu (Sadece 'hold' aşamasında görünür) */}
        {gamePhase === 'hold' && (
          <div style={{ marginTop: '40px', width: '300px', height: '15px', backgroundColor: '#424242', borderRadius: '10px', overflow: 'hidden', border: '2px solid #FFEA00' }}>
            <div style={{ width: `${holdProgress}%`, height: '100%', backgroundColor: '#FFEA00', transition: 'width 0.1s linear' }} />
          </div>
        )}
        
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
        
        {/* Karakterin Konuşma Balonu */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {
              gamePhase === 'inhale' ? 'Kristali doldurmak için nefes al...' : 
              gamePhase === 'hold' ? 'Harika! Şimdi nefesini tut (Sessiz ol).' : 
              'Süper! Kelebek kondu.'
            }
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

export default CrystalGame;