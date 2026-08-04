import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const FlowerGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(3);

  const intensityRef = useRef(0);
  const postureRef = useRef(false);
  const phaseRef = useRef(phase);

  useEffect(() => {
    intensityRef.current = blowIntensity;
    postureRef.current = isPostureCorrect;
    phaseRef.current = phase;
  }, [blowIntensity, isPostureCorrect, phase]);

  const startGame = () => {
    startListening();
    setPhase('sniff');
  };

  useEffect(() => {
    let loop;
    if (isListening && !gameOver) {
      loop = setInterval(() => {
        if (!postureRef.current && phaseRef.current === 'hold') {
          setPhase('fail');
          setTimeout(() => setPhase('sniff'), 2500);
        }

        if (phaseRef.current === 'sniff' && postureRef.current) {
          if (intensityRef.current > 20) { 
            setPhase('hold');
            setCountdown(3);
          }
        }
      }, 200);
    }
    return () => clearInterval(loop);
  }, [isListening, gameOver]);

  useEffect(() => {
    let timerInterval;
    let noiseCheckInterval;

    if (phase === 'hold') {
      timerInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setPhase('success');
            setScore((s) => s + 100);
            setTimeout(() => setPhase('sniff'), 2500); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      noiseCheckInterval = setInterval(() => {
        if (intensityRef.current > 15) {
          setPhase('fail');
          setTimeout(() => setPhase('sniff'), 2500);
        }
      }, 200);
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(noiseCheckInterval);
    };
  }, [phase]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    setPhase('idle');
    
    const earnedCrystals = Math.floor(score / 500);
    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 2, 
      score: score,
      breathCrystals: earnedCrystals
    };

    try {
      const response = await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(response.data);
    } catch (error) {
      console.error("Hata:", error);
      alert("Skor kaydedildi (Backend henüz kapalıysa bu uyarı normaldir).");
    }
  };

  const getMessage = () => {
    if (!isPostureCorrect && phase !== 'idle') return "⚠️ Lütfen Dik Dur!";
    switch (phase) {
      case 'idle': return "Oyuna başlamak için tıkla!";
      case 'sniff': return "🌸 Derin bir nefes çek (çiçeği kokla)!";
      case 'hold': return `🦋 Kelebek kondu! Sessiz ol ve nefesini ${countdown} saniye tut!`;
      case 'success': return "✨ Harika! Nefesini çok iyi yönettin!";
      case 'fail': return "💨 Kelebek ürktü! Nefesini tutarken daha sessiz olmalısın.";
      default: return "";
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)', // Navbar altı tam ekran
      background: 'linear-gradient(to bottom, #81D4FA 0%, #E1F5FE 60%, #81C784 60%, #388E3C 100%)', // Üstü Gökyüzü, Altı Çimen
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. SAĞ ÜST KÖŞE: Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.4)', 
        backdropFilter: 'blur(10px)', 
        padding: '15px 25px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        color: '#004D40',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>🌸 Çiçek Bahçesi</h3>
        <div style={{ fontSize: '15px', color: '#00695C', fontWeight: 'bold' }}>
          Skor: <strong style={{color: '#004D40'}}>{score}</strong> | 💎 <strong style={{color: '#004D40'}}>{Math.floor(score / 500)}</strong>
        </div>
        
        {!isListening ? (
          <button onClick={startGame} style={actionBtnStyle('#4CAF50')}>Oyuna Başla</button>
        ) : (
          <button onClick={handleFinishGame} style={actionBtnStyle('#f44336')}>Görevi Bitir</button>
        )}
      </div>

      {/* 2. ÜST ORTA KISIM: Dinamik Yönerge Mesajı Paneli */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: phase === 'fail' || (!isPostureCorrect && phase !== 'idle') ? 'rgba(211, 47, 47, 0.85)' : 'rgba(255, 255, 255, 0.75)',
        color: phase === 'fail' || (!isPostureCorrect && phase !== 'idle') ? 'white' : '#1B5E20',
        padding: '12px 30px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '22px',
        zIndex: 100,
        backdropFilter: 'blur(5px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        border: '2px solid rgba(255,255,255,0.5)',
        transition: 'all 0.3s'
      }}>
        {getMessage()}
      </div>

      {/* 3. ALT ORTA KISIM: Yüzen (Floating) Dik Durma Butonu */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100
      }}>
        <button 
          onMouseDown={() => setIsPostureCorrect(true)}
          onMouseUp={() => setIsPostureCorrect(false)}
          onMouseLeave={() => setIsPostureCorrect(false)}
          onTouchStart={() => setIsPostureCorrect(true)}
          onTouchEnd={() => setIsPostureCorrect(false)}
          style={{
            padding: '16px 40px', 
            fontSize: '18px', 
            color: 'white', 
            border: '2px solid rgba(255,255,255,0.4)', 
            borderRadius: '30px', 
            cursor: 'pointer',
            backgroundColor: isPostureCorrect ? 'rgba(33, 150, 243, 0.9)' : 'rgba(96, 125, 139, 0.9)',
            backdropFilter: 'blur(5px)',
            boxShadow: isPostureCorrect ? '0 0 15px rgba(33,150,243,0.6)' : '0 8px 20px rgba(0,0,0,0.2)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Dik Duruş Sağlandı!' : '⚠️ Dik Duruyorum Butonuna Basılı Tut'}
        </button>
      </div>

      {/* 4. OYUN ALANI ELEMANLARI (Manzara) */}
      
      {/* Güneş ve Bulutlar */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', fontSize: '80px', opacity: 0.9, zIndex: 1 }}>☀️</div>
      <div style={{ position: 'absolute', top: '15%', left: '15%', fontSize: '120px', opacity: 0.7, zIndex: 1 }}>☁️</div>
      <div style={{ position: 'absolute', top: '25%', left: '65%', fontSize: '90px', opacity: 0.6, zIndex: 1 }}>☁️</div>

      {/* Çiçek - Alt çimen zemininde duruyor */}
      <div style={{ 
          position: 'absolute',
          bottom: '22%', // Çimenlerin hemen üstüne hizalandı
          left: '50%',
          transform: `translateX(-50%) ${phase === 'sniff' ? 'scale(1.2)' : 'scale(1)'}`,
          fontSize: '160px', 
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          zIndex: 2,
          filter: 'drop-shadow(0px 10px 5px rgba(0,0,0,0.2))'
      }}>
        {phase === 'success' ? '🌺' : '🌻'}
      </div>
      
      {/* Kelebek Animasyonu - Serbest Uçuş Hissi */}
      {(phase === 'hold' || phase === 'success' || phase === 'fail') && (
        <div style={{
          position: 'absolute', 
          top: phase === 'fail' ? '10%' : '45%', 
          left: phase === 'fail' ? '-10%' : '52%', // Çiçeğin hemen üzerine konar
          fontSize: '80px', 
          transition: 'left 1.2s ease-in-out, top 1.2s ease-in-out, opacity 0.5s',
          opacity: phase === 'fail' ? 0 : 1,
          zIndex: 3,
          filter: 'drop-shadow(2px 5px 4px rgba(0,0,0,0.3))'
        }}>
          🦋
        </div>
      )}

    </div>
  );
};

// Sağ üstteki buton için stil
const actionBtnStyle = (bgColor) => ({ 
  padding: '8px 16px', fontSize: '15px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', marginTop: '5px'
});

export default FlowerGame;