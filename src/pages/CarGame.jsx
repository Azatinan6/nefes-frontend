import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';

const CarGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  const [progress, setProgress] = useState(0); // 0 ile 100 arası
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // 5 tur
  const [promptMessage, setPromptMessage] = useState("");

  const blowIntensityRef = useRef(0);
  const animationFrameId = useRef(null);

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

  // Oyun Başlangıç Komutları
  useEffect(() => {
    if (isListening && !gameOver) {
      speak("Hazır mısın? Dik dur. Gözlerin arabada olsun. Burnundan yavaşça nefes al.");
      setTimeout(() => speak("Arabayı gözlerinle takip et."), 5000);
      setTimeout(() => speak("Ağzından yavaşça nefes ver."), 10000);
    }
  }, [isListening]);

  // Component unmount olduğunda sesi sustur
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 220) * 100), 100);

        setProgress((prev) => {
          let newProgress = prev;
          
          // İdeal Üfleme Aralığı (Çok hassas olmasın: %10 - %70 arası ideal)
          if (currentDb >= 10 && currentDb <= 70) {
            newProgress += 0.15; // Arabanın hızını yavaşlattık (daha fazla nefes dayanıklılığı gerektirir)
            setScore(s => s + 1);
          } 
          // Çok Sert Üfleme
          else if (currentDb > 70) {
            newProgress += 0.05; // İlerleme çok daha fazla yavaşlar
          }
          // Üfleme Yok veya Çok Zayıf
          else {
            newProgress = Math.max(prev - 0.1, 0); // Yavaşça gerileme (fren)
          }

          if (newProgress >= 100) {
            setLaps(l => l + 1);
            return 0; // Başa dön
          }

          return newProgress;
        });

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver]);

  // Tur Tamamlanma Yan Etkileri
  useEffect(() => {
    if (laps > 0) {
      if (laps >= 5) {
        handleFinishGame();
      } else {
        setScore(s => s + 100);
      }
    }
  }, [laps]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    
    window.speechSynthesis.cancel();
    // Bitiş komutu
    const finalSpeech = new SpeechSynthesisUtterance("Harika! Hem dik durdun hem de nefesini kontrol ettin!");
    finalSpeech.lang = 'tr-TR';
    window.speechSynthesis.speak(finalSpeech);
    setPromptMessage("Harika! Hem dik durdun hem de nefesini kontrol ettin!");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 4, 
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

  // Araba Konumu (Sinüs dalgası ile kavisli rota)
  const carX = progress; // %0'dan %100'e yatay
  const carY = 50 + Math.sin((progress / 100) * Math.PI * 4) * 25; // Yukarı aşağı kavis

  // Yüksek Kontrast Teması (Yemyeşil Doğa)
  const themeColors = { 
    bg: '#A5D6A7', // Açık yeşil çimen
    text: cpTheme.text.dark, 
    card: cpTheme.card.white, 
    border: '#388E3C', // Koyu yeşil
    accent: '#4CAF50'
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} scale={2.0} theme="lightBg" customStyle={{ top: '75%' }} />

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Nefes Şiddeti Göstergesi */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>💨 Nefes Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Üfleme Aralığı (%10 - %70) */}
            <div style={{ position: 'absolute', left: '10%', width: '60%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 70 ? cpTheme.primary.coral : themeColors.accent, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        {/* Skor */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>🚗 Gözün Arabada!</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: cpTheme.text.muted }}>
            Tur: {laps}/5 | Skor: {Math.floor(score)}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: cpTheme.primary.teal, color: cpTheme.text.light, marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: cpTheme.primary.coral, color: cpTheme.text.light, marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Kavisli Yol ve Araba */}
      
      {/* SVG Kavisli Yol Çizimi (Matematiksel sinüs dalgasına tam uyar) */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        {/* Yolun kendisi (Kahverengi) */}
        <path d="M 0 50 Q 12.5 89.2 25 50 T 50 50 T 75 50 T 100 50" fill="none" stroke="#795548" strokeWidth="15" strokeLinecap="round" />
        {/* Yol Şeritleri (Sarı Kesik Çizgiler) */}
        <path d="M 0 50 Q 12.5 89.2 25 50 T 50 50 T 75 50 T 100 50" fill="none" stroke="#FFC107" strokeWidth="1" strokeDasharray="2, 2" />
      </svg>

      {/* Araba */}
      <div style={{
        position: 'absolute',
        left: `${carX}%`,
        top: `${carY}%`,
        fontSize: '100px',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'
      }}>
        🚙
      </div>
      
      {/* Çevre Detayları */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', fontSize: '80px', zIndex: 1 }}>🌲</div>
      <div style={{ position: 'absolute', top: '75%', left: '50%', fontSize: '100px', zIndex: 1 }}>🌳</div>
      <div style={{ position: 'absolute', top: '25%', left: '80%', fontSize: '70px', zIndex: 1 }}>🌲</div>

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
            💬 {promptMessage || 'Nefesini koru...'}
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

export default CarGame;

