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
  const pausedRef = useRef(false);
  const timeoutsRef = useRef([]);
  const hasMotivatedRef = useRef(false);

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
      clearAllTimeouts();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isListening && !gameOver && gamePhase === 'start' && !pausedRef.current) {
      gameOverRef.current = false;
      scheduleTimeout(() => startCycle(crystals), 1000);
    }
  }, [isListening, gameOver, crystals, gamePhase]);

  const startCycle = (cycle) => {
    if (gameOverRef.current || pausedRef.current) return;
    
    setProgress(0);
    setIsPopped(false);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';
    hasMotivatedRef.current = false;

    playAudioPrompt("Öncelikle öğrendiğimiz gibi dik duralım.");

    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      playAudioPrompt("Ekrandaki balona bak.");
    }, 2500);

    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      playAudioPrompt("Burundan nefes al, sanki çicek koklar gibi karnını kocaman şişir.");
    }, 4500);

    scheduleTimeout(() => { if (!gameOverRef.current && !pausedRef.current) setHoldTimer(1) }, 8500);
    scheduleTimeout(() => { if (!gameOverRef.current && !pausedRef.current) setHoldTimer(2) }, 9500);
    scheduleTimeout(() => { if (!gameOverRef.current && !pausedRef.current) setHoldTimer(3) }, 10500);

    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      setHoldTimer(0);
      setGamePhase('pre-exhale');
      phaseRef.current = 'pre-exhale';
      
      playAudioPrompt("Şimdi balon şişirir gibi ağzından yavaşça nefes ver.");

      scheduleTimeout(() => {
        if (!gameOverRef.current && !pausedRef.current && phaseRef.current === 'pre-exhale') {
          setGamePhase('exhale');
          phaseRef.current = 'exhale';
        }
      }, 3500);
    }, 11500);
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
              
              if (newProgress >= 30 && !hasMotivatedRef.current) {
                hasMotivatedRef.current = true;
                playAudioPrompt("Süpersin, harika gidiyorsun!");
              }
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

    playAudioPrompt("Harika!");
    
    const newScore = score + 10;
    setScore(newScore);
    const newCrystals = crystals + 1;
    setCrystals(newCrystals);
      
    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) {
        setGamePhase('start');
        phaseRef.current = 'start';
        return;
      }
      if (newCrystals >= 10) {
        handleFinishGame(true, newScore);
      } else {
        startCycle(newCrystals);
      }
    }, 3000);
  };

  const handlePauseGame = () => {
    stopListening();
    pausedRef.current = true;
    clearAllTimeouts();
    setGamePhase('start');
    phaseRef.current = 'start';
    setProgress(0);
    setHoldTimer(0);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun duraklatıldı. Devam etmek için başla tuşuna basın.");
  };

  const handleStartGame = () => {
    pausedRef.current = false;
    startListening();
  };

  const handleFinishGame = async (isCompleted = false, finalScore = score) => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    clearAllTimeouts();
    window.speechSynthesis.cancel();
    
    // Skor 0'dan büyükse kaydetmeyi dene (İlk oyundaki mantık)
    if (finalScore > 0) {
      if (isCompleted) {
        setPromptMessage("Harika! Çok güzel yaptın!");
        const speech = new SpeechSynthesisUtterance("Harika! Çok güzel yaptın!");
        speech.lang = 'tr-TR';
        speech.rate = 1.0;
        speech.pitch = 1.1;
        window.speechSynthesis.speak(speech);
      } else {
        setPromptMessage(`Oyun bitirildi. Toplanan Kristal: ${finalScore}`);
        const speech = new SpeechSynthesisUtterance(`Çok iyi çabaladın! Kazandığın kristal: ${finalScore}`);
        speech.lang = 'tr-TR';
        window.speechSynthesis.speak(speech);
      }

      // Local Storage'dan 'nefes_user' objesini çekip parse ediyoruz
      const userStorage = localStorage.getItem('nefes_user');
      const userData = userStorage ? JSON.parse(userStorage) : null;
      
      // Parse edilen objeden userId'yi alıyoruz
      const currentUserId = userData ? userData.userId : (localStorage.getItem('patientId') || localStorage.getItem('userId'));

      const progressData = {
        userId: currentUserId,
        gameId: 2, // Eğlenceli Balon ID'si
        score: finalScore,
        breathCrystals: crystals,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        setTimeout(() => {
          alert(`Tebrikler! ${finalScore} Kristal Kazandın! 💎 Menüye dönülüyor...`);
          navigate('/cocuk-paneli');
        }, 500);
        return;
      } catch (error) {
        setTimeout(() => {
          alert(`Skor: ${finalScore} (Kaydedilemedi) \nMenüye dönülüyor...`);
          navigate('/cocuk-paneli');
        }, 500);
        return;
      }
    }
    
    // Skor 0 ise hiç veritabanını meşgul etmeden çık
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
      transform: `scale(${isPopped ? 3 : (gamePhase === 'start' ? 2 : (gamePhase === 'inhale' ? 2 - (holdTimer * 0.33) : 1)) + (progress / 60)})`, 
      opacity: isPopped ? 0 : 1, 
      transition: isPopped ? 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : (gamePhase === 'inhale' ? 'transform 1s linear' : 'transform 0.1s linear'),
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
  };

  const btnStyleStart = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.teal, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)' };
  const btnStyleStop = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.coral, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' };
  const btnStyleExit = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: '#9E9E9E', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(158, 158, 158, 0.4)' };

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
        <div style={{ ...styles.glassCard, ...styles.statBox,
          filter: (gamePhase !== 'exhale' && gamePhase !== 'success') ? 'blur(4px)' : 'none',
          transition: 'filter 0.3s ease'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: cpTheme.text.dark }}>💨 Nefes Gücü</h3>
          <div style={{ 
            width: '200px', height: '20px', backgroundColor: cpTheme.elements.progressBg, 
            borderRadius: '10px', overflow: 'hidden', position: 'relative',
            opacity: gamePhase === 'inhale' ? 0.4 : 1,
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
            Kristal: {Math.floor(score)} | Tekrar Sayısı: {crystals}/10
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {!isListening ? (
              <button onClick={handleStartGame} style={btnStyleStart}>▶️ BAŞLA</button>
            ) : (
              <button onClick={handlePauseGame} style={btnStyleStop}>⏸️ DURDUR</button>
            )}
            <button onClick={() => handleFinishGame(false)} style={btnStyleExit}>🚪 ÇIKIŞ</button>
          </div>
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