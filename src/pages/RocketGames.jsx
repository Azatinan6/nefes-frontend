import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';

const RocketGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  const [energy, setEnergy] = useState(0); // 0 ile 100 arası
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // Toplam 5 tur
  const [promptMessage, setPromptMessage] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [phase, setPhase] = useState('start'); // start, charge, launch, rest

  const blowIntensityRef = useRef(0);
  const animationFrameId = useRef(null);
  const phaseTimerRef = useRef(null);
  const gameOverRef = useRef(false);

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

  const startLapSequence = () => {
    if (!isListening || gameOver) return;
    setPhase('start');
    setEnergy(0);
    setIsLaunching(false);

    speak("Dik dur.");
    setTimeout(() => speak("Kollarını yukarı uzat."), 2000);
    setTimeout(() => speak("Hazır mısın?"), 4500);
    setTimeout(() => speak("Burnundan derin bir nefes al."), 7000);
    
    // Nefes alma sonrası
    setTimeout(() => speak("Roket hazır!"), 11000);
    
    setTimeout(() => {
      speak("Şimdi tek ve kontrollü bir üfleme yap.");
      setPhase('charge');
    }, 13000);
  };

  // İlk başlangıç
  useEffect(() => {
    if (isListening && !gameOver && laps === 0) {
      startLapSequence();
    }
  }, [isListening]);

  // Yeni Tur (Döngü Kontrolü)
  useEffect(() => {
    if (laps > 0 && laps < 5 && !gameOver && isListening) {
      startLapSequence();
    } else if (laps >= 5) {
      handleFinishGame();
    }
  }, [laps]);

  // Component unmount temizliği
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 220) * 100), 100);

        if (phase === 'charge' && !isLaunching) {
          setEnergy((prev) => {
            let newEnergy = prev;
            
            // Güçlü Üfleme Hedefi (%30 - %100)
            if (currentDb >= 30) {
              newEnergy += 0.5; // Daha hızlı dolar, tek ve güçlü üfleme için
              setScore(s => s + 1);
            } 
            // Çok Zayıf Üfleme veya Yok
            else {
              newEnergy = Math.max(prev - 0.2, 0); 
            }

            if (newEnergy >= 100) {
              triggerLaunch();
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
  }, [isListening, gameOver, phase, isLaunching]);

  const triggerLaunch = () => {
    setIsLaunching(true);
    setPhase('launch');
    speak("Roket fırladı!");
    
    setTimeout(() => {
      speak("Harika! Roketi uzaya gönderdin.");
    }, 3000);

    setTimeout(() => {
      speak("Şimdi dinlen.");
      setPhase('rest');
    }, 6500);

    // Yeni tura geçiş
    setTimeout(() => {
      setLaps(l => l + 1);
    }, 10000); // Dinlenmesi için fazladan zaman veriyoruz
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    
    window.speechSynthesis.cancel();
    speak("Tüm roketleri başarıyla fırlattın! Harikasın!");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 7, // 7. Hafta Oyunu
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

  // Yüksek Kontrast Teması (Uzay)
  const themeColors = { 
    bg: '#0F172A', // Koyu uzay mavisi
    text: cpTheme.text.light, 
    card: 'rgba(255, 255, 255, 0.1)', 
    border: '#38BDF8', 
    accent: '#0EA5E9'
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      {/* Arka Plan Uzay Efektleri */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', fontSize: '40px', opacity: 0.8 }}>⭐</div>
      <div style={{ position: 'absolute', top: '50%', left: '80%', fontSize: '20px', opacity: 0.5 }}>⭐</div>
      <div style={{ position: 'absolute', top: '10%', left: '60%', fontSize: '30px', opacity: 0.9 }}>🌟</div>
      <div style={{ position: 'absolute', top: '40%', left: '20%', fontSize: '80px', opacity: 0.6 }}>🌍</div>
      <div style={{ position: 'absolute', top: '70%', left: '85%', fontSize: '100px', opacity: 0.3 }}>🪐</div>

      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} scale={2.0} theme="darkBg" customStyle={{ top: '48%', right: '30px' }} />

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Nefes Şiddeti Göstergesi */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          backdropFilter: 'blur(10px)',
          opacity: phase === 'charge' ? 1 : 0.4,
          transition: 'opacity 0.5s ease'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>💨 Üfleme Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Üfleme Aralığı (%30 - %100) (Güçlü Üfleme) */}
            <div style={{ position: 'absolute', left: '30%', width: '70%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.6)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage < 30 ? '#F59E0B' : themeColors.accent, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFF' }}>🚀 Roketi Fırlat!</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#CBD5E1' }}>
            Tur: {laps}/5 | Skor: {Math.floor(score)}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: cpTheme.primary.teal, color: cpTheme.text.light, marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: cpTheme.primary.coral, color: cpTheme.text.light, marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Fırlatma Rampası ve Roket */}
      
      {/* Rampa Yüzeyi */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', height: '15%',
        backgroundColor: '#475569', // Koyu gri metalik zemin
        borderTop: '10px solid #334155',
        zIndex: 0
      }}></div>

      {/* Fırlatma Platformu */}
      <div style={{
        position: 'absolute', bottom: '15%', left: '50%',
        width: '200px', height: '20px', backgroundColor: '#94A3B8',
        transform: 'translateX(-50%)', borderRadius: '5px 5px 0 0',
        zIndex: 1
      }}></div>
      
      <div style={{
        position: 'absolute', bottom: '15%', left: '42%',
        width: '10px', height: '100px', backgroundColor: '#64748B',
        zIndex: 2
      }}></div>
      <div style={{
        position: 'absolute', bottom: '15%', left: '58%',
        width: '10px', height: '100px', backgroundColor: '#64748B',
        zIndex: 2
      }}></div>

      {/* Roket */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: isLaunching ? '150%' : '15%',
        fontSize: '150px',
        transform: `translate(-50%, 0)`,
        transition: isLaunching ? 'bottom 2.5s cubic-bezier(0.5, 0, 0.2, 1)' : 'none',
        zIndex: 10,
        filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.8))'
      }}>
        🚀
      </div>

      {/* Roket Ateşi (Sadece fırlarken veya enerji birikirken göster) */}
      {!isLaunching && energy > 0 && phase === 'charge' && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '15%',
          transform: 'translateX(-50%)',
          fontSize: `${50 + (energy)}px`,
          zIndex: 9,
          opacity: 0.8
        }}>
          🔥
        </div>
      )}
      {isLaunching && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '150%',
          transform: 'translate(-50%, 150px)',
          fontSize: '120px',
          zIndex: 9,
          transition: 'bottom 2.5s cubic-bezier(0.5, 0, 0.2, 1)'
        }}>
          🔥
        </div>
      )}

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
            💬 {promptMessage || 'Güçlü bir nefes için bekle...'}
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

export default RocketGame;