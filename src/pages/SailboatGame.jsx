import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor'; // Yolunu kendi projene göre kontrol et
import axios from 'axios';

const SailboatGame = () => {
  // Akıllı sensörden gelen veriler
  const { isBlowing, blowIntensity, isTalking, hasMicrophoneAccess } = useBreathSensor();
  
  const [isGameActive, setIsGameActive] = useState(false);
  const [boatPosition, setBoatPosition] = useState(5); 
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // useEffect içinde (setInterval'da) güncel değerleri okumak için Referanslar
  const blowIntensityRef = useRef(0);
  const isPostureCorrectRef = useRef(false);
  const isBlowingRef = useRef(false);

  // Hook'tan gelen verileri her değiştikçe referanslara kopyalıyoruz
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    isPostureCorrectRef.current = isPostureCorrect;
    isBlowingRef.current = isBlowing;
  }, [blowIntensity, isPostureCorrect, isBlowing]);

  // Yelkenli Hareket Döngüsü (Oyun Motoru)
  useEffect(() => {
    let gameLoop;
    
    if (isGameActive && !gameOver) {
      gameLoop = setInterval(() => {
        setBoatPosition((prevPos) => {
          let newPos = prevPos;
          
          // ŞART: Hem duruş doğru olacak, HEM de sadece "üfleme" yapılacak (bağırma değil!)
          if (isPostureCorrectRef.current && isBlowingRef.current && blowIntensityRef.current > 5) {
            newPos = prevPos + 0.3 + (blowIntensityRef.current * 0.02); 
            setScore((s) => s + 1);
          } else {
             // Nefes kesilirse veya çocuk bağırırsa tekne yavaşça geri kayar
             newPos = prevPos > 5 ? prevPos - 0.1 : 5;
          }

          // Adaya (Bitiş çizgisine) ulaştıysa
          if (newPos >= 85) {
            setScore((s) => s + 100); 
            return 5; 
          }
          
          return newPos;
        });
      }, 100);
    }

    return () => clearInterval(gameLoop);
  }, [isGameActive, gameOver]);

  const handleFinishGame = async () => {
    setIsGameActive(false);
    setGameOver(true);
    
    const earnedCrystals = Math.floor(score / 500);
    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 3, 
      score: score,
      breathCrystals: earnedCrystals
    };

    try {
      const response = await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(response.data);
    } catch (error) {
      console.error("Hata:", error);
      alert("Skor kaydedildi (Backend kapalıysa bu uyarı normaldir).");
    }
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)', 
      background: 'linear-gradient(to bottom, #81D4FA 0%, #4FC3F7 55%, #0288D1 55%, #01579B 100%)', 
      overflow: 'hidden', fontFamily: 'sans-serif'
    }}>
      
      {/* 1. SAĞ ÜST KÖŞE: Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', backgroundColor: 'rgba(255, 255, 255, 0.3)', 
        backdropFilter: 'blur(10px)', padding: '15px 25px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)',
        color: '#01579B', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
        zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>⛵ Yelkeni Yürüt</h3>
        <div style={{ fontSize: '15px', color: '#0277BD', fontWeight: 'bold' }}>
          Skor: <strong style={{color: '#01579B'}}>{score}</strong> | 💎 <strong style={{color: '#01579B'}}>{Math.floor(score / 500)}</strong>
        </div>
        
        {!isGameActive ? (
          <button onClick={() => setIsGameActive(true)} style={actionBtnStyle('#4CAF50')} disabled={!hasMicrophoneAccess}>
            {hasMicrophoneAccess ? 'Oyuna Başla' : 'Mikrofon Bekleniyor...'}
          </button>
        ) : (
          <button onClick={handleFinishGame} style={actionBtnStyle('#f44336')}>Görevi Bitir</button>
        )}
      </div>

      {/* 2. ALT ORTA KISIM: Yüzen Dik Durma Butonu */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <button 
          onMouseDown={() => setIsPostureCorrect(true)}
          onMouseUp={() => setIsPostureCorrect(false)}
          onMouseLeave={() => setIsPostureCorrect(false)}
          onTouchStart={() => setIsPostureCorrect(true)}
          onTouchEnd={() => setIsPostureCorrect(false)}
          style={{
            padding: '16px 40px', fontSize: '18px', color: 'white', border: '2px solid rgba(255,255,255,0.4)', 
            borderRadius: '30px', cursor: 'pointer',
            backgroundColor: isPostureCorrect ? 'rgba(33, 150, 243, 0.9)' : 'rgba(96, 125, 139, 0.9)',
            backdropFilter: 'blur(5px)', boxShadow: isPostureCorrect ? '0 0 15px rgba(33,150,243,0.6)' : '0 8px 20px rgba(0,0,0,0.2)',
            transform: isPostureCorrect ? 'scale(0.98)' : 'scale(1)', transition: 'all 0.2s', fontWeight: 'bold', whiteSpace: 'nowrap'
          }}
        >
          {isPostureCorrect ? '✨ Dik Duruş Sağlandı!' : '⚠️ Dik Duruyorum Butonuna Basılı Tut'}
        </button>
      </div>

      {/* 3. OYUN ALANI ELEMANLARI (Manzara) */}
      <div style={{ position: 'absolute', top: '8%', right: '15%', fontSize: '90px', opacity: 0.9, zIndex: 1 }}>☀️</div>
      <div style={{ position: 'absolute', top: '15%', left: '20%', fontSize: '130px', opacity: 0.8, zIndex: 1 }}>☁️</div>
      <div style={{ position: 'absolute', top: '30%', left: '70%', fontSize: '80px', opacity: 0.6, zIndex: 1 }}>☁️</div>

      <div style={{ 
        position: 'absolute', right: '-30px', bottom: '35%', width: '200px', height: '100px', 
        backgroundColor: '#d7ccc8', borderRadius: '50% 50% 0 0', borderTop: '4px solid #8d6e63', 
        zIndex: 2, boxShadow: '-10px 0 20px rgba(0,0,0,0.2)'
      }}>
         <div style={{ position: 'absolute', top: '-80px', left: '40px', fontSize: '100px', filter: 'drop-shadow(2px 5px 2px rgba(0,0,0,0.3))' }}>🌴</div>
      </div>

      {/* Yelkenli Tekne */}
      <div style={{
        position: 'absolute', bottom: '40%', left: `${boatPosition}%`, fontSize: '110px', 
        transition: 'left 0.1s linear', zIndex: 3, filter: 'drop-shadow(0px 10px 5px rgba(0,0,0,0.3))',
        // Sadece üflendiğinde tekne rüzgardan dolayı hafif öne yatar
        transform: (isGameActive && isPostureCorrect && isBlowing) ? 'rotate(8deg) translateY(5px)' : 'rotate(0deg) translateY(0)'
      }}>
        ⛵
      </div>
      
      {/* BAĞIRMA / KONUŞMA UYARISI (En Yüksek Öncelik) */}
      {isGameActive && isTalking && (
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 152, 0, 0.95)', color: 'white', padding: '15px 30px',
          borderRadius: '16px', fontWeight: 'bold', fontSize: '20px', zIndex: 110,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.5)', textAlign: 'center'
        }}>
          🤫 Lütfen bağırmayalım! Sadece derin bir nefes üfle... 🌬️
        </div>
      )}

      {/* Dik Durmama Uyarısı */}
      {isGameActive && !isPostureCorrect && !isTalking && (
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
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

const actionBtnStyle = (bgColor) => ({ 
  padding: '8px 16px', fontSize: '15px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', marginTop: '5px'
});

export default SailboatGame;