import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const BalloonGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  const [gamePhase, setGamePhase] = useState('start'); // start, inhale, exhale, success
  const [progress, setProgress] = useState(0); 
  const [score, setScore] = useState(0); 
  const [crystals, setCrystals] = useState(0); 
  const [gameOver, setGameOver] = useState(false); 
  const [isPopped, setIsPopped] = useState(false); 
  const [dbPercentage, setDbPercentage] = useState(0); 
  const [promptMessage, setPromptMessage] = useState("Öncelikle öğrendiğimiz gibi dik duralım!"); 
  const [holdTimer, setHoldTimer] = useState(0); // 0, 1, 2, 3

  const animationFrameId = useRef(null);
  const intensityRef = useRef(0);
  const gameOverRef = useRef(false);
  const phaseRef = useRef('start');

  useEffect(() => {
    intensityRef.current = blowIntensity;
    const noiseThreshold = 55; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
    
    // Anlık nefes gücü (Çorba / Çiçek oyunu ile aynı mantık)
    const currentDb = Math.min(Math.round((validIntensity / 150) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  const playAudioPrompt = (message) => {
    if (!gameOverRef.current && isListening) {
      setPromptMessage(message);
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.1;
      window.speechSynthesis.speak(speech);
    }
  };

  // Sayfadan çıkıldığında veya oyun bittiğinde konuşmayı sustur
  useEffect(() => {
    gameOverRef.current = false;
    return () => {
      gameOverRef.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    if (isListening && !gameOver && crystals === 0 && gamePhase === 'start') {
      gameOverRef.current = false;
      timeoutId = setTimeout(() => startCycle(0), 1000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isListening, gameOver, crystals, gamePhase]);

  const startCycle = (cycle) => {
    if (gameOverRef.current) return;
    
    setProgress(0);
    setIsPopped(false);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';

    if (cycle === 0) {
      playAudioPrompt("Burnundan derin bir nefes al.");
    } else {
      playAudioPrompt("Nefes al.");
    }

    setTimeout(() => setHoldTimer(1), 1000);
    setTimeout(() => setHoldTimer(2), 2000);
    setTimeout(() => setHoldTimer(3), 3000);

    setTimeout(() => {
      if (gameOverRef.current) return;
      setHoldTimer(0);
      setGamePhase('exhale');
      phaseRef.current = 'exhale';
      
      if (cycle === 0) {
        playAudioPrompt("Şimdi ağzından yavaşça nefes ver.");
      } else {
        playAudioPrompt("Nefes ver.");
      }

      setTimeout(() => {
        if (!gameOverRef.current && phaseRef.current === 'exhale') {
          playAudioPrompt("İyi gidiyor, devam et...");
        }
      }, 3000);
    }, 4000);
  };

  useEffect(() => {
    if (isListening && !gameOverRef.current) {
      const updateGame = () => {
        if (isPopped) return;

        const noiseThreshold = 55; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 150) * 100), 100);

        if (phaseRef.current === 'exhale') {
          setProgress((prevProgress) => {
            let newProgress = prevProgress;
            if (currentDb >= 5) {
              newProgress += 0.4; // Balon şişme hızı
              setScore(s => s + 1); // Puan artışı
            } else {
              if (newProgress > 0) newProgress -= 0.15; // Sönme hızı
            }

            if (newProgress >= 100) {
              return 100;
            }
            return Math.max(0, newProgress);
          });
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, isPopped]);

  useEffect(() => {
    if (progress >= 100 && phaseRef.current === 'exhale' && !isPopped) {
      handleBalloonPop();
    }
  }, [progress, isPopped]);

  const handleBalloonPop = () => {
    setIsPopped(true);
    phaseRef.current = 'success';
    setGamePhase('success');

    if (crystals === 0) {
      playAudioPrompt("Harika! Balonu patlattın!");
    } else {
      playAudioPrompt("Harika!");
    }
    
    setScore(s => s + 100);
    const newCrystals = crystals + 1;
    setCrystals(newCrystals);
      
    setTimeout(() => {
      if (newCrystals >= 5) {
        handleFinishGame(true);
      } else {
        startCycle(newCrystals);
      }
    }, 3000);
  };

  const handleFinishGame = async (isCompleted = false) => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    window.speechSynthesis.cancel();
    
    if (isCompleted) {
      setPromptMessage("Oyun Bitti! İlerlemen kaydedildi.");
      const progressData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        gameId: 2, 
        score: score,
        breathCrystals: crystals,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        alert(`Tebrikler! ${crystals} Nefes Kristali Kazandın! 💎 Menüye dönülüyor...`);
      } catch (error) {
        alert(`Tebrikler! Kazanılan Kristal: ${crystals} 💎\nMenüye dönülüyor...`);
      }
    }
    
    navigate('/cocuk-paneli');
  };

  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)',
      background: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: cpTheme.text.dark,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    },
    topPanel: {
      position: 'absolute',
      top: '20px',
      width: '90%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      zIndex: 10,
    },
    statBox: {
      padding: '15px 25px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    balloonContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -40%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '400px',
      height: '500px',
    },
    balloon: {
      transform: `scale(${isPopped ? 3 : 1 + (progress / 60)})`, 
      opacity: isPopped ? 0 : 1, 
      transition: isPopped ? 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s linear',
      fontSize: '120px',
      filter: 'drop-shadow(0px 15px 20px rgba(0,0,0,0.2))',
    },
    aiCoach: {
      position: 'absolute',
      bottom: '30px',
      left: '30px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '15px',
      zIndex: 10,
    },
    coachAvatar: {
      width: '100px',
      height: '100px',
      backgroundColor: cpTheme.card.white,
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '50px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      border: `4px solid ${cpTheme.elements.border}`,
    },
    chatBubble: {
      marginBottom: '30px',
      padding: '15px 25px',
      backgroundColor: cpTheme.card.white,
      borderRadius: '20px 20px 20px 0',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '300px',
      fontWeight: '600',
      color: cpTheme.text.dark,
      fontSize: '16px',
      lineHeight: '1.5',
    },
    btnStart: {
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: cpTheme.text.light,
      background: cpTheme.primary.teal,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)',
      marginTop: '10px',
      transition: 'transform 0.2s',
    },
    btnStop: {
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: cpTheme.text.light,
      background: cpTheme.primary.coral,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
      marginTop: '10px',
      transition: 'transform 0.2s',
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.0} theme="lightBg" customStyle={{ top: '48%' }} />

      {/* Gökyüzü ve Park Süslemeleri */}
      <div style={{ position: 'absolute', top: '10%', right: '20%', fontSize: '70px', filter: 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.6))' }}>☀️</div>
      <div style={{ position: 'absolute', top: '15%', left: '15%', fontSize: '60px', opacity: 0.8 }}>☁️</div>
      <div style={{ position: 'absolute', top: '30%', left: '70%', fontSize: '70px', opacity: 0.6 }}>☁️</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '10%', fontSize: '40px', opacity: 0.6 }}>🎈</div>
      <div style={{ position: 'absolute', bottom: '40%', left: '30%', fontSize: '30px', opacity: 0.4 }}>🎈</div>
      <div style={{ position: 'absolute', bottom: '15%', left: '80%', fontSize: '50px', opacity: 0.5 }}>🎈</div>

      <div style={styles.topPanel}>
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>💨 Üfleme Gücü</h3>
          <div style={{ 
            width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, 
            borderRadius: '10px', overflow: 'hidden', position: 'relative',
            opacity: gamePhase === 'inhale' ? 0.4 : 1,
            filter: gamePhase === 'inhale' ? 'blur(1px) grayscale(50%)' : 'none',
            transition: 'all 0.4s ease'
          }}>
            <div style={{ position: 'absolute', left: '15%', width: '50%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.4)', zIndex: 1 }} />
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 65 ? cpTheme.primary.coral : '#FF5722', 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: cpTheme.text.dark }}>%{dbPercentage}</span>
        </div>

        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: cpTheme.text.dark }}>🎈 Eğlenceli Balon</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px', color: cpTheme.text.muted }}>
            Skor: {Math.floor(score)} | 💎 Kristal: {crystals}/5
          </div>
          
          {!isListening ? (
            <button 
              onClick={startListening} 
              style={styles.btnStart}
            >
              ▶️ OYUNA BAŞLA
            </button>
          ) : (
            <button 
              onClick={() => handleFinishGame(false)} 
              style={styles.btnStop}
            >
              ⏹️ BİTİR
            </button>
          )}
        </div>
      </div>

      <div style={styles.balloonContainer}>
        <div style={{
          position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${progress/100}) 0%, rgba(255,255,255,0) 70%)`,
          transform: `scale(${1 + (progress / 160)})`, transition: 'all 0.2s linear', zIndex: 0
        }} />
        
        <div style={{...styles.balloon, zIndex: 1}}>🎈</div>
        
        {isPopped && (
          <div style={{ position: 'absolute', fontSize: '80px', animation: 'pop-animation 0.5s ease-out forwards', zIndex: 2 }}>✨💥✨</div>
        )}
      </div>

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

      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>🦒</div>
        <div style={styles.chatBubble}>{promptMessage}</div>
      </div>

      <style>
        {`
          @keyframes pop-animation {
            0% { transform: scale(0.5); opacity: 1; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>
    </div>
  );
};

export default BalloonGame;