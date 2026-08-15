import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';

const FinalAdventureGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  const [energy, setEnergy] = useState(0); // 0 ile 100 arası
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // Toplanan kristal sayısı (Maks 5)
  const [promptMessage, setPromptMessage] = useState("");
  const [isCharging, setIsCharging] = useState(true);

  const blowIntensityRef = useRef(0);
  const animationFrameId = useRef(null);
  const initRef = useRef(false);
  const gameOverRef = useRef(false);

  // Kristal Renkleri ve Simgeleri
  const crystals = [
    { id: 1, color: '#EF4444', emoji: '🔴' }, // Kırmızı
    { id: 2, color: '#3B82F6', emoji: '🔵' }, // Mavi
    { id: 3, color: '#10B981', emoji: '🟢' }, // Yeşil
    { id: 4, color: '#F59E0B', emoji: '🟡' }, // Sarı
    { id: 5, color: '#8B5CF6', emoji: '🟣' }  // Mor
  ];

  // Sözel Komutlar (Motivasyon)
  const positiveFeedbacks = [
    "Harika!",
    "Çok güzel yaptın!",
    "Süpersin!",
    "Bravo!",
    "Başardın!"
  ];

  // Ses Şiddetini Yüzdeye Çevir
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    const currentDb = Math.min(Math.round((blowIntensity / 220) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  // Sesli Komut (Sadece state günceller ve okur)
  const speak = (message) => {
    if (gameOverRef.current || !isListening) return;
    setPromptMessage(message);
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'tr-TR';
    speech.rate = 1.0;
    speech.pitch = 1.2;
    window.speechSynthesis.speak(speech);
  };

  // İlk başlangıç
  useEffect(() => {
    if (isListening && !gameOver && laps === 0) {
      speak("Nefes Kristalleri Macerasına Hoş Geldin! Kristali parlatmak için mikrofona üfle!");
    }
  }, [isListening]);

  // Component unmount temizliği
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 220) * 100), 100);

        if (isCharging && laps < 5) {
          setEnergy((prev) => {
            let newEnergy = prev;
            
            // Üfleme Hedefi (%20 - %80)
            if (currentDb >= 20 && currentDb <= 80) {
              newEnergy += 0.3; // Kristal şarj olur
              setScore(s => s + 1);
            } 
            // Çok Sert Üfleme
            else if (currentDb > 80) {
              newEnergy += 0.05; 
            }
            // Zayıf veya Yok
            else {
              newEnergy = Math.max(prev - 0.2, 0); 
            }

            if (newEnergy >= 100) {
              triggerCrystalCollect();
              return 100;
            }

            return newEnergy;
          });
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, isCharging, laps]);

  const triggerCrystalCollect = () => {
    setIsCharging(false);
    
    // Rastgele motivasyon cümlesi seç
    const randomFeedback = positiveFeedbacks[Math.floor(Math.random() * positiveFeedbacks.length)];
    speak(randomFeedback);
    
    const newLaps = laps + 1;
    
    setTimeout(() => {
      setLaps(newLaps);
      
      if (newLaps < 5) {
        // Yeni kristale geçiş
        speak("Bir kez daha deneyelim! Sıradaki kristali parlat.");
        setEnergy(0);
        setIsCharging(true);
      } else {
        // Oyun Bitti!
        handleFinishGame();
      }
    }, 3000);
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    
    window.speechSynthesis.cancel();
    speak("Tebrikler! Nefes Macerasını Tamamladın!");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 8, // 8. Hafta Oyunu
      score: Math.floor(score) + 1000, // Büyük final bonusu
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      setTimeout(() => {
        navigate('/cocuk-paneli');
      }, 7000);
    } catch (error) {
      setTimeout(() => {
        navigate('/cocuk-paneli');
      }, 7000);
    }
  };

  // Yüksek Kontrast Teması (Gizemli Mağara / Macera)
  const themeColors = { 
    bg: '#1E1B4B', // Çok Koyu Mor (Mağara içi)
    text: cpTheme.text.light, 
    card: 'rgba(255, 255, 255, 0.1)', 
    border: '#8B5CF6', 
    accent: '#A78BFA'
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      {/* Arka Plan Işık Efektleri */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', backgroundColor: '#8B5CF6', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', backgroundColor: '#3B82F6', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>

      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} scale={2.0} theme="darkBg" customStyle={{ top: '48%', right: '30px' }} />

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Nefes Şiddeti Göstergesi */}
        {!gameOver && (
          <div style={{
            backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
            border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            backdropFilter: 'blur(10px)',
            opacity: isCharging ? 1 : 0.4,
            transition: 'opacity 0.5s ease'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>💨 Üfleme Gücü</h3>
            <div style={{ width: '200px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
              
              {/* İdeal Üfleme Aralığı (%20 - %80) */}
              <div style={{ position: 'absolute', left: '20%', width: '60%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.6)', zIndex: 1 }} />
              
              <div style={{ 
                width: `${dbPercentage}%`, height: '100%', 
                backgroundColor: dbPercentage > 80 ? '#F59E0B' : themeColors.accent, 
                transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
              }} />
            </div>
            <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
          </div>
        )}

        {/* Skor */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          backdropFilter: 'blur(10px)',
          marginLeft: gameOver ? 'auto' : '0' // Ortalamak için
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFF' }}>💎 Nefes Kristalleri</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#CBD5E1' }}>
            Toplanan: {laps}/5 | Skor: {Math.floor(score)}
          </div>
          
          {!isListening && !gameOver ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: cpTheme.primary.teal, color: cpTheme.text.light, marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : !gameOver && (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: cpTheme.primary.coral, color: cpTheme.text.light, marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Kristaller */}
      
      {!gameOver ? (
        <div style={{
          position: 'absolute', top: '50%', left: '45%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px',
          zIndex: 10
        }}>
          {crystals.map((crystal, index) => {
            const isCollected = index < laps;
            const isCurrent = index === laps;
            
            return (
              <div key={crystal.id} style={{
                position: 'relative',
                width: '100px', height: '100px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '60px',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isCollected ? 'scale(1.2)' : isCurrent ? 'scale(1.1) translateY(-10px)' : 'scale(0.8)',
                opacity: isCollected ? 1 : isCurrent ? 0.8 : 0.3,
                filter: isCollected ? `drop-shadow(0 0 20px ${crystal.color})` : 'grayscale(80%)'
              }}>
                {crystal.emoji}
                
                {/* Şarj olan kristalin etrafındaki enerji halkası */}
                {isCurrent && isCharging && energy > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '120px', height: '120px',
                    borderRadius: '50%',
                    border: `4px solid ${crystal.color}`,
                    opacity: energy / 100,
                    boxShadow: `0 0 ${energy / 2}px ${crystal.color}`
                  }}></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* OYUN BİTTİ EKRANI (Büyük Kristal ve Madalya) */
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 50,
          animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
          <h1 style={{ color: '#FCD34D', fontSize: '48px', textShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center', marginBottom: '20px' }}>
            Tebrikler!<br/>Nefes Macerasını Tamamladın!
          </h1>
          
          <div style={{
            position: 'relative',
            fontSize: '150px',
            filter: 'drop-shadow(0 0 50px rgba(255, 215, 0, 0.8))'
          }}>
            💎
            <div style={{
              position: 'absolute',
              bottom: '-30px', right: '-30px',
              fontSize: '100px',
              animation: 'bounce 2s infinite'
            }}>
              🏅
            </div>
          </div>
        </div>
      )}

      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes popIn {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>

      {/* 3. AI EĞİTMEN KARAKTERİ */}
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
            💬 {promptMessage || 'Derin bir nefes al ve üfle!'}
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

export default FinalAdventureGame;