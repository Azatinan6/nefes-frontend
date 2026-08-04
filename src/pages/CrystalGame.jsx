import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const CrystalGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [crystalEnergy, setCrystalEnergy] = useState(10); // Kristal doluluk oranı (%)
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isFullyCharged, setIsFullyCharged] = useState(false);

  const blowIntensityRef = useRef(0);
  const isPostureCorrectRef = useRef(false);

  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    isPostureCorrectRef.current = isPostureCorrect;
  }, [blowIntensity, isPostureCorrect]);

  // Kristal Enerji Dolum Döngüsü
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setCrystalEnergy((prevEnergy) => {
          let newEnergy = prevEnergy - 1; // Nefes verilmezse enerji yavaşça azalır
          
          // Dik duruş + Nefes aktivitesi varsa kristal dolar
          if (isPostureCorrectRef.current && blowIntensityRef.current > 12) {
            newEnergy = prevEnergy + (blowIntensityRef.current * 0.3); 
            setScore((s) => s + 3);
          }

          if (newEnergy >= 100) {
             setIsFullyCharged(true);
             setScore((s) => s + 300); // Kristal tam dolum bonusu
             return 100; 
          }
          if (newEnergy <= 10) return 10;
          
          return newEnergy;
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
      gameId: 8, // Büyük Kristal Görevi ID'si
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
      // Mistik Kristal Mağarası Degrade Arka Planı
      background: 'linear-gradient(to bottom, #4A148C 0%, #7B1FA2 40%, #8E24AA 70%, #311B92 100%)', 
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. SAĞ ÜST KÖŞE: Şeffaf (Glassmorphism) Bilgi Kartı */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', 
        backdropFilter: 'blur(10px)', 
        padding: '15px 25px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>💎 Büyük Kristal Görevi</h3>
        <div style={{ fontSize: '15px', color: '#E1BEE7', fontWeight: 'bold' }}>
          Skor: <strong style={{color: '#FFF'}}>{score}</strong> | 💎 <strong style={{color: '#FFF'}}>{Math.floor(score / 500)}</strong>
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
            backgroundColor: isPostureCorrect ? 'rgba(156, 39, 176, 0.9)' : 'rgba(96, 125, 139, 0.9)',
            backdropFilter: 'blur(5px)',
            boxShadow: isPostureCorrect ? '0 0 20px rgba(186, 104, 200, 0.8)' : '0 8px 20px rgba(0,0,0,0.3)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Enerji Akışı Aktif!' : '⚠️ Enerji İçin Dik Dur!'}
        </button>
      </div>

      {/* 3. OYUN ALANI ELEMANLARI */}
      
      {/* Mağara Işıltıları / Yıldızlar */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', fontSize: '25px', opacity: 0.6 }}>✨</div>
      <div style={{ position: 'absolute', top: '30%', right: '20%', fontSize: '35px', opacity: 0.7 }}>⭐</div>
      <div style={{ position: 'absolute', top: '15%', left: '55%', fontSize: '20px', opacity: 0.5 }}>✨</div>

      {/* Büyük Kristal (Enerjiye göre parlar ve büyür) */}
      <div style={{
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${1 + (crystalEnergy / 150)})`,
        fontSize: '150px',
        transition: 'transform 0.2s ease',
        zIndex: 2,
        filter: isFullyCharged 
          ? 'drop-shadow(0px 0px 50px rgba(224, 64, 251, 1))' 
          : `drop-shadow(0px 0px ${crystalEnergy}px rgba(186, 104, 200, 0.9))`
      }}>
        💎
      </div>

      {/* Enerji Dolum Çubuğu (Progress Bar) */}
      <div style={{
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '300px',
        height: '25px',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: '15px',
        border: '2px solid rgba(255,255,255,0.3)',
        overflow: 'hidden',
        zIndex: 10
      }}>
        <div style={{
          width: `${crystalEnergy}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #BA68C8, #E040FB, #FF80AB)',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 15px #E040FB'
        }}></div>
      </div>

      {/* Tebrik Mesajı (Kristal Dolunca) */}
      {isFullyCharged && (
        <div style={{
          position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(156, 39, 176, 0.95)', color: 'white', padding: '15px 35px',
          borderRadius: '20px', fontWeight: 'bold', fontSize: '22px', zIndex: 110,
          boxShadow: '0 0 30px rgba(224, 64, 251, 0.8)', border: '2px solid white'
        }}>
          🎉 Harika! Büyük Kristal Tamamen Enerji Doldu! 🔮
        </div>
      )}

      {/* Dik Durmama Uyarısı */}
      {!isPostureCorrect && isListening && (
        <div style={{
          position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(211, 47, 47, 0.9)', color: 'white', padding: '12px 25px',
          borderRadius: '16px', fontWeight: 'bold', fontSize: '18px', zIndex: 110,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.5)'
        }}>
          ⚠️ Enerji Akışı Kesildi, Lütfen Dik Durun!
        </div>
      )}

    </div>
  );
};

const actionBtnStyle = (bgColor) => ({ 
  padding: '8px 16px', fontSize: '15px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', marginTop: '5px'
});

export default CrystalGame;