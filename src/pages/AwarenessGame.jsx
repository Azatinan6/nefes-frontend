import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const AwarenessGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [sleepLevel, setSleepLevel] = useState(100); // 100: Tam Uykuda, 0: Tamamen Uyanık
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);

  const blowIntensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);

  // Referansları ve Desibel Yüzdesini güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    
    // Desibel hesaplama (Max 100). Burundan nefes alma düşük desibel üretir.
    const currentDb = Math.min(Math.round((blowIntensity / 50) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 2) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Sadece pozitif destek, olumsuz uyarı yok)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Sırtını dik tut ve aynadaki uykucuyu uyandırmak için burnundan derin bir nefes al.";
      } else if (type === 'encourage') {
        message = "Harika gidiyorsun, burnundan nefes almaya devam et!";
      } else if (type === 'face_move') {
        message = "Süper! Şimdi gülümse ve yüzünü hareket ettir.";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      // Aynı uyarıyı üst üste yapmaması için 6 saniye kilit
      setTimeout(() => { warningGiven.current = false; }, 6000);
    }
  };

  // Oyun başladığında ilk yönlendirmeyi yap
  useEffect(() => {
    if (isListening) {
      playAudioPrompt('start');
    }
  }, [isListening]);

  // Uykucu Uyandırma Motoru (Burundan Nefes Alma)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        setSleepLevel((prevLevel) => {
          let newLevel = prevLevel + 0.5; // Nefes alınmadığında tekrar uykuya dalar
          const currentDb = Math.min(Math.round((blowIntensityRef.current / 50) * 100), 100);
          
          // İDEAL BURUN NEFESİ: Düşük ve sabit desibel (%5 ile %25 arası)
          if (currentDb >= 5 && currentDb <= 25) {
            newLevel = prevLevel - 1.5; // Karakter uyanmaya başlar
          } 
          // ÇOK GÜÇLÜ ÜFLEYİŞ (Ağızdan)
          else if (currentDb > 25) {
             // Sadece uyanma yavaşlar, olumsuz uyarı verilmez.
             newLevel = prevLevel - 0.2; 
          }

          if (newLevel <= 0) newLevel = 0; // Tamamen uyandı
          if (newLevel >= 100) newLevel = 100; // Derin uyku

          // Puanlama: Karakter uyandıkça puan artar
          if (newLevel < 90 && currentDb >= 5 && currentDb <= 25) {
            setScore((prevScore) => {
              const newScore = prevScore + 1;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
          }

          return newLevel;
        });

        // 5 Saniye boyunca nefes yoksa teşvik edici prompt ver
        if (Date.now() - lastBreathTime.current > 5000) {
          playAudioPrompt('encourage');
        } 
        // Yüzde 50 uyandığında yüz hareketleri promptu ver
        else if (sleepLevel > 45 && sleepLevel < 50 && !warningGiven.current) {
          playAudioPrompt('face_move');
        }

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver, sleepLevel]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 1, // 1. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`1. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Yüksek Kontrast Teması (Zıt Renkler)
  const themeColors = { 
    bg: '#000000', // Siyah arka plan (Yüksek Kontrast)
    text: '#FFFFFF', // Beyaz metin
    card: '#212121', // Koyu gri kart
    border: '#00E5FF' // Canlı turkuaz/siyan (Dikkat çekici)
  };

  // Uykucunun yüz ifadesini uyku seviyesine göre belirle
  const getAvatarExpression = () => {
    if (sleepLevel > 80) return '😴'; // Derin uyku
    if (sleepLevel > 50) return '🥱'; // Esneme
    if (sleepLevel > 20) return '🤨'; // Gözleri açmaya çalışma (yüz hareketi)
    return '😃'; // Tamamen uyanık ve gülümseyen
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      
      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Desibel Performans Göstergesi (Burun Nefesi Hassasiyeti) */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,229,255,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.border }}>🎙️ Burun Nefesi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#424242', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Burun Nefesi Aralığı (%5 - %25) */}
            <div style={{ position: 'absolute', left: '5%', width: '20%', height: '100%', backgroundColor: 'rgba(0, 229, 255, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 25 ? '#FFC400' : '#00E5FF', 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: themeColors.text }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,229,255,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>🪞 1. Bölüm: Aynadaki Uykucu</h2>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: themeColors.text }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: '#00E5FF', color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Ayna ve Uykucu Karakter */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* Sihirli Ayna Çerçevesi */}
        <div style={{
          width: '300px', height: '400px',
          border: `10px solid ${themeColors.border}`,
          borderRadius: '150px 150px 20px 20px', // Ayna şekli
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: `0 0 ${100 - sleepLevel}px rgba(0, 229, 255, ${1 - (sleepLevel/100)})`,
          transition: 'box-shadow 0.5s ease',
          position: 'relative', overflow: 'hidden'
        }}>
          
          {/* Uykucu Karakter */}
          <div style={{ 
            fontSize: '150px', 
            transform: `scale(${0.8 + ((100 - sleepLevel) / 500)}) translateY(${sleepLevel / 5}px)`, 
            transition: 'all 0.3s ease-out',
            filter: `drop-shadow(0px 10px 15px rgba(0,0,0,0.8))`
          }}>
            {getAvatarExpression()}
          </div>

          {/* Uyku Gösterge Çubuğu (Aynanın Altında) */}
          <div style={{
            position: 'absolute', bottom: '20px', width: '80%', height: '10px',
            backgroundColor: '#424242', borderRadius: '5px', overflow: 'hidden'
          }}>
            <div style={{
              width: `${100 - sleepLevel}%`, height: '100%',
              backgroundColor: themeColors.border, transition: 'width 0.2s linear'
            }}/>
          </div>
        </div>
      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ (Yanda Bekleyen Çocuk Avatarı) */}
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
        
        {/* Karakterin Konuşma Balonu (Sadece Pozitif Prompt) */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {sleepLevel > 50 ? 'Burnundan derin nefes al, uykucuyu uyandıralım!' : 'Süper! Yüzünü hareket ettir ve gülümse.'}
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

export default AwarenessGame;