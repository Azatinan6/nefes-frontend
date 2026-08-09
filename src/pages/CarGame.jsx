import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';

const CarGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [gamePhase, setGamePhase] = useState('start');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Hazır mısın? Arabayı takip edelim!");
  
  // Araba pozisyonları (Yüzde cinsinden)
  const [carPos, setCarPos] = useState({ x: 10, y: 50 });

  const intensityRef = useRef(0);
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);
  const phaseTimerRef = useRef(null);
  
  const progressRef = useRef(0);

  // Ses Şiddetini Hesapla
  useEffect(() => {
    intensityRef.current = blowIntensity;
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
    const currentDb = Math.min(Math.round((validIntensity / 160) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  // Sesli Komutlar
  const playAudioPrompt = (message) => {
    if (!gameOver && isListening) {
      setPromptMessage(message);
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
    }
  };

  // Aşama Yönetimi
  useEffect(() => {
    if (isListening && !gameOver) {
      const schedulePhases = () => {
        // 1. Start
        playAudioPrompt("Hazır mısın? Arabayı takip edelim! Dik duralım. Gözlerin arabada olsun. Arabayı gözlerinle ve başınla takip et.");
        setGamePhase('start');
        
        // 2. Inhale (10s sonra)
        phaseTimerRef.current = setTimeout(() => {
          setGamePhase('inhale');
          playAudioPrompt("Burnundan yavaşça kontrollü bir nefes al.");
        }, 12000);

        // 3. Exhale (20s sonra)
        setTimeout(() => {
          setGamePhase('exhale');
          playAudioPrompt("Şimdi yavaşça ağzından nefes ver.");
        }, 22000);

        // 4. Continue (32s sonra)
        setTimeout(() => {
          setGamePhase('continue');
          playAudioPrompt("Harika! Arabayı takip etmeye devam edelim. Peki bu sırada dik durabilir miyiz?");
        }, 32000);

        // 5. Inhale_Exhale (45s sonra)
        setTimeout(() => {
          setGamePhase('inhale_exhale');
          playAudioPrompt("Sakin sakin nefes al ve uzunca arabayı takip ederken ağzından ver.");
        }, 45000);

        // 6. Success & End (60s sonra)
        setTimeout(() => {
          setGamePhase('success');
          playAudioPrompt("Bravo! Hem arabayı takip ettin hem de nefesini korudun!");
          setTimeout(() => {
            handleFinishGame();
          }, 5000);
        }, 60000);
      };

      schedulePhases();
    }

    return () => {
      window.speechSynthesis.cancel();
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [isListening]);

  // Oyun Motoru - Arabayı hareket ettir
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 160) * 100), 100);

        progressRef.current += 0.05;
        if (progressRef.current > 100) progressRef.current = 0;

        // X pozisyonu zamanla soldan sağa ilerler
        const newX = progressRef.current;
        
        // Y pozisyonu nefes şiddetine göre değişir.
        // Daha sakin bir geçiş için Y pozisyonunu yumuşatıyoruz
        setCarPos(prev => {
          // Yüzde 0 (aşağı) ile 100 (yukarı) arası
          // currentDb arttıkça araba yukarı çıksın (Y azalır çünkü top: 0 en üsttür)
          const targetY = 90 - (currentDb * 0.8); 
          const smoothY = prev.y + (targetY - prev.y) * 0.05;
          return { x: newX, y: smoothY };
        });

        if (currentDb > 10) {
          setScore(s => s + 0.1);
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };
      animationFrameId.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 4, 
      score: Math.floor(score),
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! Oyun tamamlandı. Skorun: ${Math.floor(score)}`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`Oyun Tamamlandı! Skorun: ${Math.floor(score)}`);
    }
  };

  const styles = {
    container: {
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      background: '#81D4FA', // Gökyüzü mavisi
      overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif",
      color: cpTheme.text.dark, display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    glassCard: {
      background: cpTheme.card.white, backdropFilter: 'blur(10px)',
      borderRadius: '24px', border: `1px solid ${cpTheme.elements.border}`,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    },
    topPanel: {
      position: 'absolute', top: '20px', width: '90%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10,
    },
    statBox: {
      padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    road: {
      position: 'absolute', bottom: '0', width: '100%', height: '30%',
      background: '#795548', borderTop: '10px solid #4CAF50',
    },
    aiCoach: {
      position: 'absolute', bottom: '30px', left: '30px',
      display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 20,
    },
    coachAvatar: {
      width: '100px', height: '100px', backgroundColor: cpTheme.card.white,
      borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '50px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: `4px solid ${cpTheme.elements.border}`,
    },
    chatBubble: {
      marginBottom: '30px', padding: '15px 25px', backgroundColor: cpTheme.card.white,
      borderRadius: '20px 20px 20px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '350px', fontWeight: '600', color: cpTheme.text.dark, fontSize: '16px', lineHeight: '1.5',
    },
    btnStart: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: cpTheme.text.light,
      background: cpTheme.primary.teal, border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    },
    btnStop: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: cpTheme.text.light,
      background: cpTheme.primary.coral, border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase.includes('inhale') ? 'inhale' : 'hold'} />
      
      <div style={styles.topPanel}>
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: cpTheme.primary.teal }}>🎙️ Nefes Şiddeti</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 50 ? cpTheme.primary.coral : cpTheme.primary.emerald, 
              transition: 'width 0.1s linear', borderRadius: '8px'
            }} />
          </div>
          <span style={{ marginTop: '8px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: cpTheme.text.dark }}>Gözün Arabada!</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px', color: cpTheme.text.muted }}>
            Skor: {Math.floor(score)}
          </div>
          {!isListening ? (
            <button onClick={startListening} style={styles.btnStart}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={styles.btnStop}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* Arka Plan Manzarası */}
      <div style={styles.road}></div>
      <div style={{ position: 'absolute', top: '40%', left: '10%', fontSize: '80px' }}>🌲</div>
      <div style={{ position: 'absolute', top: '35%', left: '50%', fontSize: '100px' }}>🌳</div>
      <div style={{ position: 'absolute', top: '45%', left: '80%', fontSize: '70px' }}>🌲</div>
      <div style={{ position: 'absolute', top: '10%', left: '20%', fontSize: '60px', opacity: 0.8 }}>☁️</div>
      <div style={{ position: 'absolute', top: '15%', left: '70%', fontSize: '80px', opacity: 0.9 }}>☁️</div>
      
      {/* Araba */}
      <div style={{
        position: 'absolute',
        left: `${carPos.x}%`,
        top: `${carPos.y}%`,
        fontSize: '80px',
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.1s linear, top 0.1s linear',
        zIndex: 15,
        filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))'
      }}>
        🚗
      </div>

      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>🤖</div>
        <div style={styles.chatBubble}>{promptMessage}</div>
      </div>
    </div>
  );
};

export default CarGame;
