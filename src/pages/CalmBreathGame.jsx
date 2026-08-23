import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import api from '../services/api';
const CalmBreathGame = () => {
  const { isListening, startListening, stopListening } = useBreathSensor();
  
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const initRef = useRef(false);
  
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
    if (!isListening || gameOverRef.current || phase === 'idle') return;
    
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
    gameOverRef.current = true;
    setPhase('idle');
    
    const earnedCrystals = Math.floor(score / 1600);
    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 5, // Huzur Nefesi ID
      score: score,
      breathCrystals: earnedCrystals
    };

    try {
      const response = await api.post('/progress/save', progressData);
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
      background: cpTheme.bg.lavender, 
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={phase} />

      
      {/* Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px',
        backgroundColor: cpTheme.card.white, backdropFilter: 'blur(10px)', 
        padding: '15px 25px', borderRadius: '16px', border: `1px solid ${cpTheme.elements.border}`,
        color: cpTheme.text.dark, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
        zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🧘 Huzur Nefesi</h3>
        <div style={{ fontSize: '15px', color: cpTheme.text.muted, fontWeight: 'bold' }}>
          Skor: <strong style={{color: cpTheme.text.dark}}>{score}</strong> | 💎 <strong style={{color: cpTheme.text.dark}}>{Math.floor(score / 1600)}</strong>
        </div>
        
        {!isListening ? (
          <button onClick={startGame} style={actionBtnStyle(cpTheme.primary.teal)}>Oyuna Başla</button>
        ) : (
          <button onClick={handleFinishGame} style={actionBtnStyle(cpTheme.primary.coral)}>Görevi Bitir</button>
        )}
      </div>

      {/* Dinamik Yönerge Mesajı Paneli */}
      <div style={{
        position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: (!isPostureCorrect && phase !== 'idle') ? cpTheme.primary.coral : cpTheme.card.white,
        color: (!isPostureCorrect && phase !== 'idle') ? cpTheme.text.light : cpTheme.text.dark, padding: '15px 35px', borderRadius: '25px',
        fontWeight: 'bold', fontSize: '24px', zIndex: 100, backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: `1px solid ${cpTheme.elements.border}`,
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
            padding: '16px 40px', fontSize: '18px', color: cpTheme.text.light, 
            border: 'none', borderRadius: '30px', cursor: 'pointer',
            backgroundColor: isPostureCorrect ? cpTheme.primary.teal : cpTheme.text.muted,
            backdropFilter: 'blur(5px)',
            boxShadow: isPostureCorrect ? '0 0 20px rgba(0, 131, 143, 0.4)' : '0 8px 20px rgba(0,0,0,0.1)',
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
