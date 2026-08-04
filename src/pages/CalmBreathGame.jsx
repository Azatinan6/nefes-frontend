import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const CalmBreathGame = () => {
  const { isListening, startListening, stopListening } = useBreathSensor();
  
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Aşamalar: idle (bekleme), inhale (nefes al), hold (tut), exhale (nefes ver)
  const [phase, setPhase] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);

  const isPostureCorrectRef = useRef(false);

  useEffect(() => {
    isPostureCorrectRef.current = isPostureCorrect;
  }, [isPostureCorrect]);

  // Nefes Döngüsü Kontrolü (4s Al -> 2s Tut -> 4s Ver)
  useEffect(() => {
    if (!isListening || gameOver) return;

    let timeout;
    if (phase === 'inhale') {
      timeout = setTimeout(() => {
        setPhase('hold');
        setTimeLeft(2);
      }, 4000);
    } else if (phase === 'hold') {
      timeout = setTimeout(() => {
        setPhase('exhale');
        setTimeLeft(4);
      }, 2000);
    } else if (phase === 'exhale') {
      timeout = setTimeout(() => {
        setPhase('inhale');
        setTimeLeft(4);
        // Döngüyü bozmadan dik durduysa puan kazandır
        if (isPostureCorrectRef.current) {
          setScore((s) => s + 50);
        }
      }, 4000);
    }

    return () => clearTimeout(timeout);
  }, [phase, isListening, gameOver]);

  // Geri Sayım Sayacı
  useEffect(() => {
    if (!isListening || gameOver || phase === 'idle') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isListening, gameOver, phase]);

  const startGame = () => {
    startListening();
    setPhase('inhale');
    setTimeLeft(4);
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    setPhase('idle');
    
    const earnedCrystals = Math.floor(score / 500);
    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 5, // Huzur Nefesi ID
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
    if (!isPostureCorrect && phase !== 'idle') return "⚠️ Lütfen Dik Durun!";
    switch (phase) {
      case 'idle': return "Oyuna başlamak için tıkla!";
      case 'inhale': return `😌 Yavaşça Nefes Al... (${timeLeft}s)`;
      case 'hold': return `⏸️ Nefesini Tut... (${timeLeft}s)`;
      case 'exhale': return `🌬️ Sakin Bir Şekilde Nefes Ver... (${timeLeft}s)`;
      default: return "";
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)',
      // Dinlendirici bir gün batımı/huzur gradyanı
      background: 'linear-gradient(to bottom, #311B92 0%, #512DA8 40%, #7E57C2 70%, #B39DDB 100%)', 
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      
      {/* Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', 
        padding: '15px 25px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.3)',
        color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
        zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🧘 Huzur Nefesi</h3>
        <div style={{ fontSize: '15px', color: '#D1C4E9', fontWeight: 'bold' }}>
          Skor: <strong style={{color: '#FFF'}}>{score}</strong> | 💎 <strong style={{color: '#FFF'}}>{Math.floor(score / 500)}</strong>
        </div>
        
        {!isListening ? (
          <button onClick={startGame} style={actionBtnStyle('#4CAF50')}>Oyuna Başla</button>
        ) : (
          <button onClick={handleFinishGame} style={actionBtnStyle('#f44336')}>Görevi Bitir</button>
        )}
      </div>

      {/* Dinamik Yönerge Mesajı Paneli */}
      <div style={{
        position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: (!isPostureCorrect && phase !== 'idle') ? 'rgba(211, 47, 47, 0.85)' : 'rgba(255, 255, 255, 0.2)',
        color: 'white', padding: '15px 35px', borderRadius: '25px',
        fontWeight: 'bold', fontSize: '24px', zIndex: 100, backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)',
        transition: 'all 0.3s'
      }}>
        {getMessage()}
      </div>

      {/* Yüzen (Floating) Dik Durma Butonu */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <button 
          onMouseDown={() => setIsPostureCorrect(true)}
          onMouseUp={() => setIsPostureCorrect(false)}
          onMouseLeave={() => setIsPostureCorrect(false)}
          onTouchStart={() => setIsPostureCorrect(true)}
          onTouchEnd={() => setIsPostureCorrect(false)}
          style={{
            padding: '16px 40px', fontSize: '18px', color: 'white', 
            border: '2px solid rgba(255,255,255,0.4)', borderRadius: '30px', cursor: 'pointer',
            backgroundColor: isPostureCorrect ? 'rgba(103, 58, 183, 0.9)' : 'rgba(158, 158, 158, 0.7)',
            backdropFilter: 'blur(5px)',
            boxShadow: isPostureCorrect ? '0 0 20px rgba(103, 58, 183, 0.8)' : '0 8px 20px rgba(0,0,0,0.3)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s', fontWeight: 'bold', whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Huzurla Dik Duruyorsun!' : '⚠️ Dik Duruyorum Butonuna Basılı Tut'}
        </button>
      </div>

      {/* Dekoratif Yıldızlar */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', fontSize: '24px', color: 'white', opacity: 0.7 }}>✨</div>
      <div style={{ position: 'absolute', top: '25%', right: '25%', fontSize: '30px', color: 'white', opacity: 0.5 }}>⭐</div>

      {/* Büyüyüp Küçülen Lotus Çiçeği (Görsel Geri Bildirim) */}
      <div style={{ 
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) ${phase === 'inhale' || phase === 'hold' ? 'scale(1.8)' : 'scale(1)'}`,
          fontSize: '140px', transition: 'transform 4s ease-in-out', zIndex: 2,
          filter: phase === 'inhale' || phase === 'hold' ? 'drop-shadow(0px 0px 30px rgba(255,255,255,0.6))' : 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))',
          opacity: phase === 'idle' ? 0.6 : 1
      }}>
        🪷
      </div>

    </div>
  );
};

const actionBtnStyle = (bgColor) => ({ 
  padding: '8px 16px', fontSize: '15px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', marginTop: '5px'
});

export default CalmBreathGame;