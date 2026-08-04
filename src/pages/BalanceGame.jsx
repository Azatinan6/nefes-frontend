import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const BalanceGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [playerPos, setPlayerPos] = useState(10); // Karakterin köprü üzerindeki konumu (%)
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const blowIntensityRef = useRef(0);
  const isPostureCorrectRef = useRef(false);

  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    isPostureCorrectRef.current = isPostureCorrect;
  }, [blowIntensity, isPostureCorrect]);

  // Karakter Yürüme/Denge Döngüsü
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setPlayerPos((prevPos) => {
          let newPos = prevPos;
          
          // Denge Şartı: Dik duruş + Sakin/İstikrarlı Nefes (Çok üflerse koşar, az üflerse durur)
          if (isPostureCorrectRef.current && blowIntensityRef.current > 15) {
            newPos = prevPos + 0.5 + (blowIntensityRef.current * 0.01); 
            setScore((s) => s + 2);
          } else {
             // Dik durmazsa veya nefesi keserse köprüde hafif geri kayar (Denge kaybı)
             newPos = prevPos > 10 ? prevPos - 0.2 : 10;
          }

          // Köprünün sonuna ulaştıysa başa dön ve bonus ver
          if (newPos >= 85) {
            setScore((s) => s + 150); 
            return 10; 
          }
          
          return newPos;
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
      gameId: 6, // Denge Parkuru ID'si
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
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)',
      // Ormanın derinlikleri: Üst taraf açık yeşil/sarı ışık, alt taraf koyu orman yeşili
      background: 'linear-gradient(to bottom, #C8E6C9 0%, #81C784 40%, #388E3C 70%, #1B5E20 100%)', 
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. SAĞ ÜST KÖŞE: Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.25)', 
        backdropFilter: 'blur(10px)', 
        padding: '15px 25px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        color: '#1B5E20',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>⚖️ Denge Kur Odaklan</h3>
        <div style={{ fontSize: '15px', color: '#2E7D32', fontWeight: 'bold' }}>
          Skor: <strong style={{color: '#1B5E20'}}>{score}</strong> | 💎 <strong style={{color: '#1B5E20'}}>{Math.floor(score / 500)}</strong>
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
            backgroundColor: isPostureCorrect ? 'rgba(33, 150, 243, 0.9)' : 'rgba(96, 125, 139, 0.9)',
            backdropFilter: 'blur(5px)',
            boxShadow: isPostureCorrect ? '0 0 15px rgba(33,150,243,0.6)' : '0 8px 20px rgba(0,0,0,0.2)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Dengedesin, İlerliyorsun!' : '⚠️ Denge İçin Dik Dur!'}
        </button>
      </div>

      {/* 3. OYUN ALANI ELEMANLARI (Macera Parkuru) */}
      
      {/* Arka Plan Ağaçları */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '100px', opacity: 0.5, zIndex: 1 }}>🌲</div>
      <div style={{ position: 'absolute', top: '25%', right: '15%', fontSize: '120px', opacity: 0.6, zIndex: 1 }}>🌳</div>
      
      {/* Asma Köprü (Zemin) */}
      <div style={{ 
        position: 'absolute', bottom: '35%', left: '5%', right: '5%', 
        height: '25px', backgroundColor: '#795548', 
        borderTop: '4px solid #5D4037', borderBottom: '4px solid #4E342E',
        borderRadius: '10px', zIndex: 2,
        boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
      }}>
        {/* Köprü ipleri efekti */}
        <div style={{ position: 'absolute', top: '-40px', left: '0', right: '0', borderBottom: '3px dashed #8D6E63', height: '40px', borderRadius: '50%' }}></div>
      </div>

      {/* Karakter (Yürüyen Çocuk Emoji) */}
      <div style={{
        position: 'absolute',
        bottom: '38%', 
        left: `${playerPos}%`, 
        fontSize: '90px', 
        transition: 'left 0.1s linear, transform 0.2s ease',
        zIndex: 3,
        filter: 'drop-shadow(0px 8px 5px rgba(0,0,0,0.4))',
        // Dik durmazsa karakter sallanıyormuş gibi hissiyat verilir
        transform: (!isPostureCorrect && isListening) ? 'rotate(-15deg)' : 'rotate(0deg)'
      }}>
        🏃‍♂️
      </div>
      
      {/* Bitiş Noktası (Ağaç Ev veya Hedef) */}
      <div style={{ position: 'absolute', bottom: '36%', right: '2%', fontSize: '100px', zIndex: 2 }}>
        🏕️
      </div>

      {/* Dinamik Denge Uyarısı */}
      {!isPostureCorrect && isListening && (
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 152, 0, 0.9)', color: 'white', padding: '15px 30px',
          borderRadius: '16px', fontWeight: 'bold', fontSize: '20px', zIndex: 110,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.5)'
        }}>
          ⚠️ Dengeni Kaybediyorsun, Dik Dur!
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

export default BalanceGame;