import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const RocketGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [rocketHeight, setRocketHeight] = useState(8); // Fırlatma rampasındaki başlangıç seviyesi
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
        setRocketHeight((prevHeight) => {
          let newHeight = prevHeight - 1.5; // Yerçekimi
          
          if (isPostureCorrectRef.current && blowIntensityRef.current > 30) {
            newHeight = prevHeight + (blowIntensityRef.current * 0.35); 
            setScore((s) => s + 2); 
          }

          if (newHeight >= 85) {
             setScore((s) => s + 5); 
             return 85; 
          }
          if (newHeight <= 8) return 8; // Zemin (Rampa) sınırı
          
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
      gameId: 4, 
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

  return (
    // DIŞ KUTU YOK - Oyun alanı Navbar'ın altındaki tüm ekranı kaplar
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)', // 70px Navbar boşluğu
      background: 'linear-gradient(to top, #4fc3f7 0%, #1565c0 40%, #000033 100%)',
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. SAĞ ÜST KÖŞE: Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Yarı saydam siyah
        backdropFilter: 'blur(8px)', // Arka planı bulanıklaştırır
        padding: '15px 25px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>🚀 Güçlü Üfle</h3>
        <div style={{ fontSize: '15px', color: '#e0e0e0' }}>
          Skor: <strong style={{color: 'white'}}>{score}</strong> | 💎 <strong style={{color: 'white'}}>{Math.floor(score / 500)}</strong>
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
            boxShadow: isPostureCorrect ? '0 0 15px rgba(33,150,243,0.6)' : '0 8px 20px rgba(0,0,0,0.3)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Mükemmel Duruş!' : '⚠️ Dik Duruyorum Butonuna Basılı Tut'}
        </button>
      </div>

      {/* 3. OYUN ALANI ELEMANLARI (Tam Ekrana Yayıldı) */}
      
      {/* Yıldızlar ve Gezegenler */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', fontSize: '24px', color: 'white' }}>✨</div>
      <div style={{ position: 'absolute', top: '25%', left: '85%', fontSize: '30px', color: 'white' }}>⭐</div>
      <div style={{ position: 'absolute', top: '8%', left: '60%', fontSize: '18px', color: 'white' }}>✨</div>
      <div style={{ position: 'absolute', top: '30%', left: '30%', fontSize: '60px' }}>🌕</div>

      {/* Fırlatma Rampası (Zemin) */}
      <div style={{ 
        position: 'absolute', bottom: '0', left: '0', right: '0', 
        height: '8%', backgroundColor: '#455a64', 
        borderTop: '6px solid #37474f', zIndex: 1,
        boxShadow: '0 -5px 15px rgba(0,0,0,0.2)'
      }}></div>

      {/* Roket */}
      <div style={{
        position: 'absolute',
        bottom: `${rocketHeight}%`,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '90px', // Ekrana yayıldığı için roketi büyüttük
        transition: 'bottom 0.1s linear',
        zIndex: 2,
        filter: (isListening && isPostureCorrect && blowIntensity > 30) ? 'drop-shadow(0px 25px 15px rgba(255,87,34,0.9))' : 'drop-shadow(0px 10px 5px rgba(0,0,0,0.5))'
      }}>
        🚀
      </div>
      
      {/* Dik Durmama Uyarısı (Oyunun Tam Ortasında) */}
      {!isPostureCorrect && isListening && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(211, 47, 47, 0.9)', color: 'white', padding: '15px 30px',
          borderRadius: '16px', fontWeight: 'bold', fontSize: '20px', zIndex: 110,
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.5)'
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

export default RocketGame;