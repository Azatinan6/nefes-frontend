import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CarGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState('start'); // start, inhale, pre-exhale, exhale, success
  const [progress, setProgress] = useState(0); // 0 ile 100 arası yol ilerlemesi
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // 10 tekrar
  const [promptMessage, setPromptMessage] = useState("");
  const [holdTimer, setHoldTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const blowIntensityRef = useRef(0);
  const gameOverRef = useRef(false);
  const phaseRef = useRef('start');
  const isPausedRef = useRef(false);
  const timeoutsRef = useRef([]);
  const firstCycleRef = useRef(true);
  const animationFrameId = useRef(null);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const scheduleTimeout = (cb, delay) => {
    const id = setTimeout(() => {
      cb();
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Ses Şiddetini Yüzdeye Çevir
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    const noiseThreshold = 40;
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
    const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  const playAudioPrompt = (message) => {
    if (!gameOverRef.current && isListening) {
      setPromptMessage(message);
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
    }
  };

  useEffect(() => {
    gameOverRef.current = false;
    return () => {
      gameOverRef.current = true;
      clearAllTimeouts();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isListening && !gameOver && gamePhase === 'start' && !isPausedRef.current) {
      gameOverRef.current = false;
      if (laps >= 10) {
        handleFinishGame(true, score, laps);
      } else {
        scheduleTimeout(() => startCycle(), 1000);
      }
    }
  }, [isListening, gameOver, gamePhase, laps]);

  const startCycle = () => {
    if (gameOverRef.current || isPausedRef.current) return;

    setProgress(0);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';

    const messages = firstCycleRef.current
      ? ["Hazır mısın?", "Dik dur.", "Gözlerin arabada olsun.", "Burnundan yavaşça nefes al."]
      : ["Dik dur.", "Gözlerin arabada olsun.", "Burnundan yavaşça nefes al."];
    firstCycleRef.current = false;

    messages.forEach((msg, i) => {
      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        playAudioPrompt(msg);
      }, i * 1800);
    });

    const inhaleEnd = messages.length * 1800;

    // 1, 2, 3 sayaç animasyonu (ekran blurlu kalır)
    scheduleTimeout(() => { if (!gameOverRef.current && !isPausedRef.current) setHoldTimer(3) }, inhaleEnd);
    scheduleTimeout(() => { if (!gameOverRef.current && !isPausedRef.current) setHoldTimer(2) }, inhaleEnd + 1000);
    scheduleTimeout(() => { if (!gameOverRef.current && !isPausedRef.current) setHoldTimer(1) }, inhaleEnd + 2000);

    scheduleTimeout(() => {
      if (gameOverRef.current || isPausedRef.current) return;
      setHoldTimer(0);
      setGamePhase('pre-exhale');
      phaseRef.current = 'pre-exhale';

      playAudioPrompt("Arabayı gözlerinle takip et.");

      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        playAudioPrompt("Ağzından yavaşça nefes ver.");
      }, 1800);

      // "Ağzından yavaşça nefes ver." tamamlanınca üfleme kısmı açılır (blur kalkar)
      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        setGamePhase('exhale');
        phaseRef.current = 'exhale';
      }, 3600);
    }, inhaleEnd + 3000);
  };

  // Oyun Döngüsü (Sadece nefes verme anında araba ilerler)
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        if (phaseRef.current !== 'exhale' || isPausedRef.current) {
          animationFrameId.current = requestAnimationFrame(updateGame);
          return;
        }

        const noiseThreshold = 40;
        let validIntensity = blowIntensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);

        setProgress((prev) => {
          let newProgress = prev;

          if (currentDb >= 10 && currentDb <= 85) {
            newProgress += 0.25;
          } else if (currentDb > 85) {
            newProgress += 0.05;
          } else {
            newProgress = Math.max(prev - 0.1, 0);
          }

          return Math.min(newProgress, 100);
        });

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver]);

  useEffect(() => {
    if (progress >= 100 && phaseRef.current === 'exhale') {
      handleRaceComplete();
    }
  }, [progress]);

  const handleRaceComplete = () => {
    phaseRef.current = 'success';
    setGamePhase('success');

    playAudioPrompt("Harika! Hem dik durdun hem de nefesini kontrol ettin!");

    const newScore = Math.min(score + 10, 100);
    const newCrystals = Math.min(crystals + 1, 10);
    const newLaps = laps + 1;
    
    setScore(newScore);
    setCrystals(newCrystals);
    setLaps(newLaps);

    scheduleTimeout(() => {
      if (gameOverRef.current || isPausedRef.current) {
        setGamePhase('start');
        phaseRef.current = 'start';
        return;
      }
      if (newLaps >= 10) {
        handleFinishGame(true, newScore, newLaps);
      } else {
        startCycle();
      }
    }, 4000);
  };

  const handlePauseGame = () => {
    stopListening();
    setIsPaused(true);
    isPausedRef.current = true;
    clearAllTimeouts();
    setGamePhase('start');
    phaseRef.current = 'start';
    setProgress(0);
    setHoldTimer(0);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun duraklatıldı. Devam etmek için başla tuşuna basın.");
  };

  const handleStartGame = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    startListening();
  };

  const handleFinishGame = async (isCompleted = false, finalScore = score, finalLaps = laps) => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    clearAllTimeouts();
    window.speechSynthesis.cancel();

    if (finalLaps > 0) {
      if (isCompleted) {
        setPromptMessage("Harika! Oyun Tamamlandı! Tebrikler! 🎉");
        const speech = new SpeechSynthesisUtterance("Harika! Oyun Tamamlandı! Tebrikler!");
        speech.lang = 'tr-TR';
        speech.rate = 1.0;
        speech.pitch = 1.1;
        window.speechSynthesis.speak(speech);
      } else {
        setPromptMessage(`Oyun bitirildi. Toplanan Kristal: ${finalLaps}`);
        const speech = new SpeechSynthesisUtterance(`Çok iyi çabaladın! Kazandığın kristal: ${finalLaps}`);
        speech.lang = 'tr-TR';
        window.speechSynthesis.speak(speech);
      }

      const userStorage = localStorage.getItem('nefes_user');
      const userData = userStorage ? JSON.parse(userStorage) : null;
      const currentUserId = userData ? userData.userId : (localStorage.getItem('patientId') || localStorage.getItem('userId'));

      const progressData = {
        userId: currentUserId,
        gameId: 4,
        score: finalScore,
        breathCrystals: finalLaps,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        setTimeout(() => {
          alert(`Harika çaba! Kazanılan Kristal: ${finalLaps} 💎 \nMenüye dönülüyor...`);
          navigate('/cocuk-paneli');
        }, 500);
        return;
      } catch (error) {
        setTimeout(() => {
          alert(`Skor: ${finalLaps} (Kaydedilemedi) \nMenüye dönülüyor...`);
          navigate('/cocuk-paneli');
        }, 500);
        return;
      }
    }

    navigate('/cocuk-paneli');
  };

  // Araba Konumu (Sinüs dalgası ile kavisli rota)
  const carX = progress;
  const carY = 50 + Math.sin((progress / 100) * Math.PI * 4) * 25;

  // Yüksek Kontrast Teması (Yemyeşil Doğa)
  const themeColors = {
    bg: '#A5D6A7',
    text: cpTheme.text.dark,
    card: cpTheme.card.white,
    border: '#388E3C',
    accent: '#4CAF50'
  };

  const btnStyleStart = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.teal, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)' };
  const btnStyleStop = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.coral, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' };
  const btnStyleExit = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: '#9E9E9E', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(158, 158, 158, 0.4)' };

  const isBlurred = gamePhase === 'inhale' || gamePhase === 'pre-exhale';

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.0} theme="lightBg" customStyle={{ top: '75%' }} />

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>

        {/* Nefes Şiddeti Göstergesi */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: gamePhase === 'exhale' || gamePhase === 'success' ? 1 : 0.4,
          filter: gamePhase === 'exhale' || gamePhase === 'success' ? 'none' : 'blur(1px) grayscale(50%)',
          transition: 'all 0.4s ease'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>💨 Nefes Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>

            {/* İdeal Üfleme Aralığı (%10 - %85) */}
            <div style={{ position: 'absolute', left: '10%', width: '75%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.4)', zIndex: 1 }} />

            <div style={{
              width: `${dbPercentage}%`, height: '100%',
              backgroundColor: dbPercentage > 85 ? cpTheme.primary.coral : themeColors.accent,
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        {/* Kristal ve Tekrar */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '300px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>🚗 Gözün Arabada!</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: cpTheme.text.muted }}>
            💎 Kristal: {crystals} | 🔄 Tekrar: {laps}/10
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', width: '100%', justifyContent: 'flex-end' }}>
            {!isListening ? (
              <button onClick={handleStartGame} style={btnStyleStart}>▶️ BAŞLA</button>
            ) : (
              <button onClick={handlePauseGame} style={btnStyleStop}>⏸️ DURDUR</button>
            )}
            <button onClick={() => handleFinishGame(false)} style={btnStyleExit}>🚪 ÇIKIŞ</button>
          </div>
        </div>
      </div>

      {/* 1, 2, 3 Animasyonu */}
      {gamePhase === 'inhale' && holdTimer > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '120px', fontWeight: 'bold', color: '#FF9800',
          textShadow: '2px 2px 12px rgba(0,0,0,0.5)', zIndex: 100,
          animation: 'blink 1s infinite'
        }}>
          {holdTimer}
        </div>
      )}

      {/* 2. OYUN ALANI: Kavisli Yol ve Araba */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.5s ease'
      }}>
        {/* SVG Kavisli Yol Çizimi (Matematiksel sinüs dalgasına tam uyar) */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
          <path d="M 0 50 Q 12.5 89.2 25 50 T 50 50 T 75 50 T 100 50" fill="none" stroke="#795548" strokeWidth="15" strokeLinecap="round" />
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
      </div>

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

        {isListening && promptMessage && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {promptMessage}
          </div>
        )}
      </div>

    </div>
  );
};

export default CarGame;