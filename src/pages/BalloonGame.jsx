import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const BalloonGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [balloonHeight, setBalloonHeight] = useState(5); // Başlangıç yüksekliği
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const blowIntensityRef = useRef(0);
  const isPostureCorrectRef = useRef(false);

  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    isPostureCorrectRef.current = isPostureCorrect;
  }, [blowIntensity, isPostureCorrect]);

  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setBalloonHeight((prevHeight) => {
          let newHeight = prevHeight - 1.5; // Yerçekimi balonu aşağı çeker
          
          if (isPostureCorrectRef.current && blowIntensityRef.current > 15) {
            newHeight = prevHeight + (blowIntensityRef.current * 0.25); 
          }

          if (newHeight >= 85) return 85; // Ekrandan taşmaması için sınır
          if (newHeight <= 5) return 5; // Zemin sınırı
          
          if (isPostureCorrectRef.current && newHeight > 20) {
            setScore((prevScore) => prevScore + 1);
          }

          return newHeight;
        });
      }, 100);
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    
    const earnedCrystals = Math.floor(score / 500);

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 1, 
      score: score,
      breathCrystals: earnedCrystals
    };

    try {
      const response = await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(response.data);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert("Skor kaydedildi (Backend kapalıysa bu hata normaldir).");
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)', // Navbar altı tam ekran
      background: 'linear-gradient(to bottom, #29b6f6 0%, #e1f5fe 100%)', // Ferah gökyüzü degrade
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. SAĞ ÜST KÖŞE: Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.25)', // Yarı saydam beyaz
        backdropFilter: 'blur(10px)', 
        padding: '15px 25px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        color: '#01579b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>🎈 Balonu Büyüt</h3>
        <div style={{ fontSize: '15px', color: '#0277bd', fontWeight: 'bold' }}>
          Skor: <strong style={{color: '#01579b'}}>{score}</strong> | 💎 <strong style={{color: '#01579b'}}>{Math.floor(score / 500)}</strong>
        </div>
        
        {!isListening ? (
          <button onClick={startListening} style={actionBtnStyle('#4CAF50')}>Oyuna Başla</button>
        ) : (
          <button onClick={handleFinishGame} style={actionBtnStyle('#f44336')}>Görevi Bitir</button>
        )}
      </div>

      {/* 2. ALT ORTA KISIM: Yüzen (Floating) Dik Durma Butonu */}
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
            backgroundColor: isPostureCorrect ? 'rgba(33, 150, 243, 0.85)' : 'rgba(96, 125, 139, 0.85)',
            backdropFilter: 'blur(5px)',
            boxShadow: isPostureCorrect ? '0 0 15px rgba(33,150,243,0.6)' : '0 8px 20px rgba(0,0,0,0.2)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Harika Dik Duruyorsun!' : '⚠️ Dik Duruyorum Butonuna Basılı Tut'}
        </button>
      </div>

      {/* 3. OYUN ALANI ELEMANLARI (Tam Ekrana Yayıldı) */}
      
      {/* Dekoratif Arka Plan Bulutları */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', fontSize: '120px', opacity: 0.8 }}>☁️</div>
      <div style={{ position: 'absolute', top: '35%', left: '75%', fontSize: '150px', opacity: 0.6 }}>☁️</div>
      <div style={{ position: 'absolute', top: '65%', left: '25%', fontSize: '90px', opacity: 0.7 }}>☁️</div>

      {/* Balon */}
      <div style={{
        position: 'absolute',
        bottom: `${balloonHeight}%`,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '140px', // Ekrana yayıldığı için balonu devasa yaptık
        transition: 'bottom 0.1s linear',
        zIndex: 2,
        filter: 'drop-shadow(0px 15px 10px rgba(0,0,0,0.2))'
      }}>
        🎈
      </div>
      
      {/* Dik Durmama Uyarısı (Oyunun Tam Ortasında) */}
      {!isPostureCorrect && isListening && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(211, 47, 47, 0.9)', color: 'white', padding: '15px 30px',
          borderRadius: '16px', fontWeight: 'bold', fontSize: '20px', zIndex: 110,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.5)'
        }}>
          ⚠️ Lütfen Dik Durun!
        </div>
      )}

    </div>
  );
};

// Sağ üstteki buton için stil
const actionBtnStyle = (bgColor) => ({ 
  padding: '8px 16px', fontSize: '15px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
  boxShadow: '0 4px 6px rgba(0,0,0,0.2)', width: '100%', marginTop: '5px'
});

export default BalloonGame;