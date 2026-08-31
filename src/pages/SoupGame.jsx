import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SoupGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState('start'); // start, inhale, pre-exhale, exhale, success
  const [coolProgress, setCoolProgress] = useState(0); // 0 (sıcak/buharlı) - 100 (soğudu)
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
  const animationFrameId = useRef(null);
  const coolingMotivationRef = useRef(false);

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
        handleFinishGame(true);
      } else {
        scheduleTimeout(() => startCycle(), 1000);
      }
    }
  }, [isListening, gameOver, gamePhase, laps]);

  const startCycle = () => {
    if (gameOverRef.current || isPausedRef.current) return;

    setCoolProgress(0);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';
    coolingMotivationRef.current = false;

    const messages = ["Dik dur.", "Çorbamızı koklayalım.", "Burnundan derin ve yavaş nefes al."];

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

      playAudioPrompt("Şimdi çorbamızı soğutalım.");

      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        playAudioPrompt("Ağzından yavaşça ve uzun nefes ver.");
      }, 1800);

      // Son mesaj tamamlanınca üfleme kısmı açılır (blur kalkar)
      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        setGamePhase('exhale');
        phaseRef.current = 'exhale';
      }, 3600);
    }, inhaleEnd + 3000);
  };

  // Oyun Döngüsü (Sadece nefes verme anında çorba soğur)
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

        setCoolProgress((prev) => {
          let newProgress = prev;

          if (currentDb >= 10 && currentDb <= 85) {
            newProgress += 0.25;
            if (newProgress >= 15 && !coolingMotivationRef.current) {
              coolingMotivationRef.current = true;
              playAudioPrompt("Çorbamız soğuyor!");
            }
          } else if (currentDb > 85) {
            newProgress += 0.05;
          } else {
            newProgress = Math.max(prev - 0.05, 0);
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
    if (coolProgress >= 100 && phaseRef.current === 'exhale') {
      handleSoupCooled();
    }
  }, [coolProgress]);

  const handleSoupCooled = () => {
    phaseRef.current = 'success';
    setGamePhase('success');

    playAudioPrompt("Harika üfledin!");
    scheduleTimeout(() => {
      if (!gameOverRef.current && !isPausedRef.current) playAudioPrompt("Bravo!");
    }, 1600);

    setScore((s) => Math.min(s + 10, 100));
    setCrystals((c) => Math.min(c + 10, 100));
    const newLaps = laps + 1;
    setLaps(newLaps);

    scheduleTimeout(() => {
      if (gameOverRef.current || isPausedRef.current) {
        setGamePhase('start');
        phaseRef.current = 'start';
        return;
      }
      if (newLaps >= 10) {
        handleFinishGame(true);
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
    setCoolProgress(0);
    setHoldTimer(0);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun duraklatıldı. Devam etmek için başla tuşuna basın.");
  };

  const handleStartGame = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    startListening();
  };

  const handleFinishGame = async (isCompleted = false) => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    clearAllTimeouts();
    window.speechSynthesis.cancel();

    if (isCompleted) {
      const progressData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        gameId: 6,
        score: 100,
        breathCrystals: 100,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        alert(`Harika! Oyun Tamamlandı! Tebrikler! 🎉\nKazandığın Kristal: 100 💎\nMenüye dönülüyor...`);
      } catch (error) {
        alert(`Oyun Tamamlandı! Tebrikler! 🎉\nKazandığın Kristal: 100 💎\nMenüye dönülüyor...`);
      }
    }

    navigate('/cocuk-paneli');
  };

  // Tema Renkleri (Sıcak Ev Ortamı / Masa)
  const themeColors = {
    bg: '#FFE0B2',
    text: cpTheme.text.dark,
    card: cpTheme.card.white,
    border: '#FF9800',
    accent: '#FF5722'
  };

  const btnStyleStart = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.teal, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)' };
  const btnStyleStop = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.coral, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' };
  const btnStyleExit = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: '#9E9E9E', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(158, 158, 158, 0.4)' };

  const isBlurred = gamePhase === 'inhale' || gamePhase === 'pre-exhale';
  const steamOpacity = Math.max(1 - (coolProgress / 100), 0);

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.0} theme="lightBg" customStyle={{ top: '48%', right: '30px' }} />

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
          }
          @keyframes bobbing {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-20px); }
          }
        `}
      </style>

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
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>🥣 Çorbayı Kokla ve Soğut!</h2>
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

      {/* 2. OYUN ALANI: Masa ve Çorba Kasesi */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.5s ease'
      }}>

        {/* Masa Yüzeyi */}
        <div style={{
          position: 'absolute', bottom: 0, width: '100%', height: '35%',
          backgroundColor: '#795548',
          borderTop: '15px solid #5D4037',
          zIndex: 0
        }}></div>

        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          zIndex: 10
        }}>

          {/* Buhar Efektleri (soğudukça görünürlüğü azalır) */}
          <div style={{
            display: 'flex', gap: '20px', height: '150px', marginBottom: '10px',
            opacity: steamOpacity,
            transition: 'opacity 0.2s linear'
          }}>
            {[1, 2, 3].map(i => (
              <svg key={i} width="40" height="150" viewBox="0 0 40 150" style={{
                animation: gamePhase !== 'success' ? `bobbing ${1 + i * 0.2}s infinite alternate ease-in-out` : 'none'
              }}>
                <path d="M20,150 Q40,112.5 20,75 T20,0" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="8" strokeLinecap="round" />
              </svg>
            ))}
          </div>

          {/* Çorba Kasesi */}
          <div style={{
            position: 'relative',
            width: '300px', height: '150px',
            backgroundColor: '#E53935',
            borderBottomLeftRadius: '150px', borderBottomRightRadius: '150px',
            boxShadow: '0 15px 25px rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'center'
          }}>
            {/* Çorbanın Üst Yüzeyi (Sarı Mercimek Çorbası) */}
            <div style={{
              position: 'absolute', top: 0,
              width: '100%', height: '40px',
              backgroundColor: '#FFC107',
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              border: '8px solid #E53935',
              boxSizing: 'border-box'
            }}></div>
          </div>
        </div>
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

export default SoupGame;
