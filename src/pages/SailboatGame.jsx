import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SailboatGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  const [gamePhase, setGamePhase] = useState('start');
  const [boatPosition, setBoatPosition] = useState(0); 
  const [waveIntensity, setWaveIntensity] = useState(0); 
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); 
  const [promptMessage, setPromptMessage] = useState("");
  const [holdTimer, setHoldTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const blowIntensityRef = useRef(0);
  const gameOverRef = useRef(false);
  const phaseRef = useRef('start');
  const continuousMoveMs = useRef(0);
  const motivationGiven = useRef(false);
  const lastBackwardPromptTime = useRef(0);
  const isPausedRef = useRef(false);
  const timeoutsRef = useRef([]);

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

  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    const noiseThreshold = 70;
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
    const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  const playAudioPrompt = (message) => {
    if (!gameOverRef.current && isListening) {
      setPromptMessage(message);
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
      scheduleTimeout(() => startCycle(laps), 1000);
    }
  }, [isListening, gameOver, laps, gamePhase]);

  const startCycle = (cycle) => {
    if (gameOverRef.current || isPausedRef.current) return;
    
    setBoatPosition(0);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';

    if (cycle === 0) {
      playAudioPrompt("Hazır mısın? Çiçek koklar gibi derin nefes al.");
    } else {
      playAudioPrompt("Çiçek koklar gibi derin nefes al.");
    }

    scheduleTimeout(() => { if (!gameOverRef.current && !isPausedRef.current) setHoldTimer(3) }, 3000);
    scheduleTimeout(() => { if (!gameOverRef.current && !isPausedRef.current) setHoldTimer(2) }, 4000);
    scheduleTimeout(() => { if (!gameOverRef.current && !isPausedRef.current) setHoldTimer(1) }, 5000);

    scheduleTimeout(() => {
      if (gameOverRef.current || isPausedRef.current) return;
      setHoldTimer(0);
      setGamePhase('prepare_exhale');
      phaseRef.current = 'prepare_exhale';
      
      playAudioPrompt("Karnını şişir. Dudaklarını hafifçe büz. Yavaş ve uzun nefes ver.");

      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        setGamePhase('exhale');
        phaseRef.current = 'exhale';
        
        continuousMoveMs.current = 0;
        motivationGiven.current = false;
        lastBackwardPromptTime.current = Date.now();
      }, 5000);

    }, 6000);
  };

  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        if (phaseRef.current !== 'exhale' || isPausedRef.current) return; // Sadece nefes verme anında ve duraklatılmamışsa gemi hareket eder

        const noiseThreshold = 70;
        let validIntensity = blowIntensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

        if (currentDb >= 15 && currentDb <= 60) {
          continuousMoveMs.current += 100;
          if (continuousMoveMs.current >= 1000 && !motivationGiven.current) {
            playAudioPrompt("Yelkenimiz hareket ediyor!");
            motivationGiven.current = true;
          }
        } else {
          continuousMoveMs.current = 0;
        }

        if (currentDb < 15) {
          if (Date.now() - lastBackwardPromptTime.current > 7000) {
            playAudioPrompt("Yavaş ve uzun nefes ver.");
            lastBackwardPromptTime.current = Date.now();
          }
        }

        setBoatPosition((prev) => {
          let newPosition = prev;
          
          if (currentDb >= 15 && currentDb <= 60) {
            newPosition += 2.5; // Yaklaşık 4 saniyede karşıya geçer
            setWaveIntensity((w) => Math.max(w - 5, 0)); 
          } 
          else if (currentDb > 60) {
            newPosition += 0.6; 
            setWaveIntensity(10); 
          }
          else {
            newPosition = Math.max(prev - 0.1, 0);
            setWaveIntensity((w) => Math.max(w - 2, 0));
          }

          if (newPosition >= 100) {
            return 100;
          }

          return newPosition;
        });

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver]);

  useEffect(() => {
    if (boatPosition >= 100 && phaseRef.current === 'exhale') {
      handleBoatReached();
    }
  }, [boatPosition]);

  const handleBoatReached = () => {
    phaseRef.current = 'success';
    setGamePhase('success');

    playAudioPrompt("Harika! Yelkeni karşı kıyıya ulaştırdık!");
    
    setScore((s) => s + 10);
    setCrystals((c) => c + 10);
      
    scheduleTimeout(() => {
      if (gameOverRef.current || isPausedRef.current) {
        setGamePhase('start');
        phaseRef.current = 'start';
        return;
      }
      const newLaps = laps + 1;
      setLaps(newLaps);
      if (newLaps >= 10) {
        handleFinishGame(true);
      } else {
        startCycle(newLaps);
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
    setBoatPosition(0);
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
        gameId: 3, 
        score: isCompleted ? 100 : score,
        breathCrystals: isCompleted ? 100 : crystals,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        alert(`Harika! Oyun Tamamlandı! Kazanılan Kristal: ${crystals} 💎 \nMenüye dönülüyor...`);
      } catch (error) {
        alert(`Oyun Tamamlandı! Kazanılan Kristal: ${crystals} 💎 \nMenüye dönülüyor...`);
      }
    }
    
    navigate('/cocuk-paneli');
  };

  const themeColors = { 
    bg: cpTheme.bg.softBlue, 
    text: cpTheme.text.dark, 
    card: cpTheme.card.white, 
    border: cpTheme.elements.border, 
    accent: cpTheme.primary.teal 
  };

  const btnStyleStart = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.teal, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)' };
  const btnStyleStop = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.coral, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' };
  const btnStyleExit = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: '#9E9E9E', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(158, 158, 158, 0.4)' };

  const isBlurred = gamePhase === 'inhale' || gamePhase === 'prepare_exhale';

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)', 
      overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.0} theme="lightBg" customStyle={{ top: '48%' }} />

      {/* Gökyüzü Süslemeleri (Sabit) */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', fontSize: '80px', filter: 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.5))' }}>☀️</div>
      <div style={{ position: 'absolute', top: '20%', left: '10%', fontSize: '50px', opacity: 0.8 }}>☁️</div>
      <div style={{ position: 'absolute', top: '30%', left: '50%', fontSize: '60px', opacity: 0.6 }}>☁️</div>
      <div style={{ position: 'absolute', top: '15%', left: '80%', fontSize: '40px', opacity: 0.7 }}>☁️</div>
      <div style={{ position: 'absolute', top: '25%', left: '30%', fontSize: '30px', opacity: 0.8 }}>🦅</div>
      <div style={{ position: 'absolute', top: '18%', left: '35%', fontSize: '20px', opacity: 0.6 }}>🦅</div>

      <style>
        {`
          @keyframes bobbing {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes shaking {
            0% { transform: translateY(0px) rotate(-10deg); }
            25% { transform: translateY(-15px) rotate(15deg); }
            50% { transform: translateY(10px) rotate(-15deg); }
            75% { transform: translateY(-5px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(-10deg); }
          }
          @keyframes floatCloud {
            0% { transform: translateX(0); }
            50% { transform: translateX(50px); }
            100% { transform: translateX(0); }
          }
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
        
        {/* Desibel Performans Göstergesi */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>Nefes Gücü</h3>
          <div style={{ 
            width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, 
            borderRadius: '10px', overflow: 'hidden', position: 'relative',
            opacity: phaseRef.current === 'exhale' ? 1 : 0.4,
            filter: phaseRef.current === 'exhale' ? 'none' : 'blur(1px) grayscale(50%)',
            transition: 'all 0.4s ease'
          }}>
            <div style={{ position: 'absolute', left: '15%', width: '45%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', zIndex: 1 }} />
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 60 ? cpTheme.primary.coral : themeColors.accent, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '300px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>⛵ Yelkeni Yüzdür</h2>
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

      {/* 2. OYUN ALANI: Deniz, Yelkenli ve Liman */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', height: '40%',
        background: 'linear-gradient(to bottom, #0288D1, #01579B)', 
        borderTop: '5px solid #4FC3F7',
        zIndex: 0,
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.5s ease'
      }}></div>

      <div style={{
        position: 'absolute', bottom: '15%', width: '100%', height: '40%',
        display: 'flex', alignItems: 'flex-end', zIndex: 5,
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.5s ease'
      }}>
        
        {/* Hedef Liman (Sağ Kenar) */}
        <div style={{
          position: 'absolute', right: '0', bottom: '-20px', width: '15%', height: '100px',
          backgroundColor: '#795548', borderRadius: '20px 0 0 0', border: '5px solid #5D4037',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '10px',
          fontSize: '40px', zIndex: 0
        }}>
          🏝️
        </div>

        {/* Yelkenli Gemi */}
        <div style={{
          position: 'absolute',
          left: `${boatPosition * 0.8}%`, 
          bottom: '0px',
          fontSize: '120px',
          zIndex: 10,
          animation: waveIntensity > 0 ? 'shaking 0.5s infinite' : 'bobbing 3s ease-in-out infinite',
          transition: 'left 0.1s linear',
          filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'
        }}>
          ⛵
        </div>

        {/* Çok Hızlı Üfleme Uyarı Görseli (Dalgalar) */}
        {waveIntensity > 0 && (
          <div style={{
            position: 'absolute', left: `${(boatPosition * 0.8) + 5}%`, bottom: '-10px',
            fontSize: '60px', zIndex: 11, animation: 'bobbing 0.5s infinite alternate'
          }}>
            🌊🌊
          </div>
        )}
      </div>

      {isListening && dbPercentage >= 15 && phaseRef.current === 'exhale' && (
        <div style={{
          position: 'absolute', left: `${(boatPosition * 0.8) - 10}%`, bottom: '25%',
          fontSize: '50px', opacity: 0.6, transform: 'scaleX(-1)' 
        }}>
          💨
        </div>
      )}

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

export default SailboatGame;
