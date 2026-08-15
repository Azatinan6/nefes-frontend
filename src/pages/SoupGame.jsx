import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';

const SoupGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  const [steamLevel, setSteamLevel] = useState(100); // 100 (Çok sıcak/buharlı) - 0 (Soğuk)
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // 5 tur
  const [promptMessage, setPromptMessage] = useState("");
  const [timer, setTimer] = useState(3);
  const [showTimer, setShowTimer] = useState(false);
  const [isExhalePhase, setIsExhalePhase] = useState(false);

  const gameOverRef = useRef(false);
  const blowIntensityRef = useRef(0);
  const animationFrameId = useRef(null);
  const initRef = useRef(false);
  const warningGiven = useRef(false);
  const phaseRef = useRef('start');
  const cycleTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const firstCycleRef = useRef(true);
  const lapCompletedInCurrentCycle = useRef(false);

  // Ses Şiddetini Yüzdeye Çevir
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    const noiseThreshold = 40; // Daha düşük eşik (kolay üfleme için)
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
    const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  // Sesli Komut (Sadece state günceller ve okur)
  const speak = (message) => {
    if (gameOverRef.current || !isListening) return;
    setPromptMessage(message);
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'tr-TR';
    speech.rate = 1.0;
    speech.pitch = 1.2;
    window.speechSynthesis.speak(speech);
  };

  const startCycle = () => {
    if (gameOverRef.current || !isListening) return;
    phaseRef.current = 'inhale';
    setIsExhalePhase(false);
    lapCompletedInCurrentCycle.current = false;
    warningGiven.current = false;
    setSteamLevel(100);

    if (firstCycleRef.current) {
      speak("Hazır mısın? Dik dur. Burnundan yavaşça nefes al.");
    } else {
      speak("Nefes al.");
    }
    
    setShowTimer(true);
    setTimer(3);
    
    let count = 3;
    intervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setTimer(count);
      } else {
        clearInterval(intervalRef.current);
        setShowTimer(false);
        phaseRef.current = 'exhale';
        setIsExhalePhase(true);
        if (firstCycleRef.current) {
          speak("Şimdi çorbayı üfleyerek soğut.");
          firstCycleRef.current = false;
        } else {
          speak("Nefes ver.");
        }
        
        cycleTimeoutRef.current = setTimeout(() => {
          if (!gameOverRef.current && isListening) {
            startCycle();
          }
        }, 12000); // 12 saniyelik nefes veriş süresi
      }
    }, 1500); // Nefes alma süresi 1500ms
  };

  // Oyun Başlangıç Komutları
  useEffect(() => {
    if (isListening && !gameOver && !initRef.current) {
      initRef.current = true;
      firstCycleRef.current = true;
      startCycle();
    }
    else if (!isListening) {
      initRef.current = false;
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.speechSynthesis.cancel();
    }
  }, [isListening, gameOver]);

  // Component unmount olduğunda sesi sustur
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const noiseThreshold = 40;
        let validIntensity = blowIntensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);

        setSteamLevel((prev) => {
          let newSteam = prev;
          
          if (phaseRef.current === 'exhale' && !lapCompletedInCurrentCycle.current) {
            // İdeal Üfleme Aralığı
            if (currentDb >= 10 && currentDb <= 85) {
              newSteam -= 0.25; 
              setScore(s => s + 1);
            } 
            // Çok Sert Üfleme
            else if (currentDb > 85) {
              newSteam -= 0.1; // Sıçrama etkisi
            }
            // Üfleme Yok veya Çok Zayıf
            else {
              newSteam = Math.min(prev + 0.05, 100); // Üflemezse tekrar ısınır
            }
          } else if (lapCompletedInCurrentCycle.current) {
            newSteam = 0; // Hedef tamamlandı
          } else {
            // Nefes alırken değer sabit kalsın (veya çok hafif artsın)
          }

          if (newSteam <= 0 && !lapCompletedInCurrentCycle.current) {
            triggerSuccess();
            lapCompletedInCurrentCycle.current = true;
            return 0;
          }

          return newSteam;
        });

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver]);

  const triggerSuccess = () => {
    phaseRef.current = 'success';
    setLaps(l => l + 1);
  };

  // Tur Tamamlanma Yan Etkileri
  useEffect(() => {
    if (laps > 0) {
      if (laps >= 5) {
        handleFinishGame();
      } else {
        setScore(s => s + 100);
        const motivations = [
          "Harika! Çorba soğudu.",
          "Çok iyi gidiyorsun, mükemmel!",
          "Süpersin, çorba kasesi bitti!",
          "Muhteşem bir nefes! Aynen böyle devam et."
        ];
        const randomMsg = motivations[Math.floor(Math.random() * motivations.length)];
        speak(randomMsg);
      }
    }
  }, [laps]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    window.speechSynthesis.cancel();
    
    // Bitiş komutu
    const finalSpeech = new SpeechSynthesisUtterance("Tüm çorbaları başarıyla soğuttun! Harikasın!");
    finalSpeech.lang = 'tr-TR';
    window.speechSynthesis.speak(finalSpeech);
    setPromptMessage("Tüm çorbaları başarıyla soğuttun! Harikasın!");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 6, // 6. Hafta Oyunu
      score: Math.floor(score),
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      setTimeout(() => {
        alert(`Harika! Oyun Tamamlandı! Skor: ${Math.floor(score)}\nMenüye dönülüyor...`);
        navigate('/cocuk-paneli');
      }, 3000);
    } catch (error) {
      setTimeout(() => {
        alert(`Oyun Tamamlandı! Skor: ${Math.floor(score)}\nMenüye dönülüyor...`);
        navigate('/cocuk-paneli');
      }, 3000);
    }
  };

  // Tema Renkleri (Sıcak Ev Ortamı / Masa)
  const themeColors = { 
    bg: '#FFE0B2', // Açık turuncu/ahşap rengi
    text: cpTheme.text.dark, 
    card: cpTheme.card.white, 
    border: '#FF9800', 
    accent: '#FF5722'
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} scale={2.0} theme="lightBg" customStyle={{ top: '48%', right: '30px' }} />

      {/* Büyük Ekranda 1, 2, 3 Sayacı */}
      {showTimer && isListening && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '150px', fontWeight: 'bold', color: '#FF5722', zIndex: 150,
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
          animation: 'pulse 1s infinite'
        }}>
          {timer}
        </div>
      )}

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Nefes Şiddeti Göstergesi */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          filter: !isExhalePhase && isListening ? 'blur(3px)' : 'none',
          transition: 'filter 0.3s ease'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>💨 Üfleme Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Üfleme Aralığı (%10 - %85) */}
            <div style={{ position: 'absolute', left: '10%', width: '75%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 85 ? cpTheme.primary.coral : themeColors.accent, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        {/* Skor */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>🥣 Çorbanı Soğut!</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: cpTheme.text.muted }}>
            Tur: {laps}/5 | Skor: {Math.floor(score)}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: cpTheme.primary.teal, color: cpTheme.text.light, marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: cpTheme.primary.coral, color: cpTheme.text.light, marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Masa ve Çorba Kasesi */}
      
      {/* Masa Yüzeyi */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', height: '35%',
        backgroundColor: '#795548', // Ahşap kahverengi
        borderTop: '15px solid #5D4037',
        zIndex: 0
      }}></div>

      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 10
      }}>
        
        {/* Buhar Efektleri (steamLevel'a göre görünürlüğü azalır) */}
        <div style={{
          display: 'flex', gap: '20px', height: '150px', marginBottom: '10px',
          opacity: steamLevel / 100,
          transition: 'opacity 0.2s linear'
        }}>
          {[1, 2, 3].map(i => (
            <svg key={i} width="40" height="150" viewBox="0 0 40 150" style={{
              animation: phaseRef.current !== 'success' ? `bobbing ${1 + i*0.2}s infinite alternate ease-in-out` : 'none'
            }}>
              <path d="M20,150 Q40,112.5 20,75 T20,0" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="8" strokeLinecap="round" />
            </svg>
          ))}
        </div>

        {/* CSS Animasyonu için stil */}
        <style>
          {`
            @keyframes bobbing {
              0% { transform: translateY(0px); }
              100% { transform: translateY(-20px); }
            }
          `}
        </style>

        {/* Çorba Kasesi */}
        <div style={{
          position: 'relative',
          width: '300px', height: '150px',
          backgroundColor: '#E53935', // Kırmızı Kase
          borderBottomLeftRadius: '150px', borderBottomRightRadius: '150px',
          boxShadow: '0 15px 25px rgba(0,0,0,0.4)',
          display: 'flex', justifyContent: 'center'
        }}>
          {/* Çorbanın Üst Yüzeyi (Sarı Mercimek Çorbası) */}
          <div style={{
            position: 'absolute', top: 0,
            width: '100%', height: '40px',
            backgroundColor: '#FFC107',
            borderRadius: '50%',
            transform: 'translateY(-50%)',
            border: '8px solid #E53935',
            boxSizing: 'border-box'
          }}></div>
        </div>
      </div>

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
            💬 {promptMessage || 'Çorbanı dikkatlice üfle...'}
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

export default SoupGame;
