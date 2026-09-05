import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// 10 Farklı Kristal Topu
const CRYSTALS = [
  { id: 1, color: '#EF4444', emoji: '🔴' },
  { id: 2, color: '#F97316', emoji: '🟠' },
  { id: 3, color: '#F59E0B', emoji: '🟡' },
  { id: 4, color: '#10B981', emoji: '🟢' },
  { id: 5, color: '#0EA5E9', emoji: '🔵' },
  { id: 6, color: '#6366F1', emoji: '🔷' },
  { id: 7, color: '#8B5CF6', emoji: '🟣' },
  { id: 8, color: '#92400E', emoji: '🟤' },
  { id: 9, color: '#64748B', emoji: '⚪' },
  { id: 10, color: '#EC4899', emoji: '💠' }
];

const SUCCESS_PHRASES = ["Harika!", "Çok güzel yaptın!", "Süpersin!", "Bravo!", "Başardın!"];

const FinalAdventureGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState('start'); // start, inhale, pre-exhale, exhale, success, complete
  const [energy, setEnergy] = useState(0); // 0 ile 100 arası
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // 10 tekrar
  const [promptMessage, setPromptMessage] = useState("");
  const [holdTimer, setHoldTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const blowIntensityRef = useRef(0);
  const gameOverRef = useRef(false);
  const phaseRef = useRef('start');
  const isPausedRef = useRef(false);
  const timeoutsRef = useRef([]);
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

    setEnergy(0);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';

    const messages = ["Dik dur.", "Hazır mısın?", "Burnundan derin bir nefes al."];

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

      playAudioPrompt("Şimdi nefesini ver.");

      // Mesaj tamamlanınca üfleme kısmı açılır (blur kalkar)
      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        setGamePhase('exhale');
        phaseRef.current = 'exhale';
      }, 1800);
    }, inhaleEnd + 3000);
  };

  // Oyun Döngüsü (Sadece nefes verme anında kristal şarj olur)
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

        setEnergy((prev) => {
          let newEnergy = prev;

          if (currentDb >= 10 && currentDb <= 85) {
            newEnergy += 0.3;
          } else if (currentDb > 85) {
            newEnergy += 0.05;
          } else {
            newEnergy = Math.max(prev - 0.2, 0);
          }

          return Math.min(newEnergy, 100);
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
    if (energy >= 100 && phaseRef.current === 'exhale') {
      handleCrystalCollected();
    }
  }, [energy]);

  const handleCrystalCollected = () => {
    phaseRef.current = 'success';
    setGamePhase('success');

    const randomMsg = SUCCESS_PHRASES[Math.floor(Math.random() * SUCCESS_PHRASES.length)];
    playAudioPrompt(randomMsg);

    const newScore = Math.min(score + 10, 100);
    const newCrystals = Math.min(crystals + 10, 100);
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
    setEnergy(0);
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
        setGamePhase('complete');
        phaseRef.current = 'complete';
        setPromptMessage("Tebrikler! Nefes Macerasını Tamamladın!");

        const finalSpeech = new SpeechSynthesisUtterance("Tebrikler! Nefes Macerasını Tamamladın!");
        finalSpeech.lang = 'tr-TR';
        finalSpeech.rate = 1.0;
        finalSpeech.pitch = 1.2;
        window.speechSynthesis.speak(finalSpeech);
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
        gameId: 8,
        score: finalScore,
        breathCrystals: finalLaps,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        if (!isCompleted) {
          setTimeout(() => {
            alert(`Harika çaba! Kazanılan Kristal: ${finalLaps} 💎 \nMenüye dönülüyor...`);
            navigate('/cocuk-paneli');
          }, 500);
          return;
        }
      } catch (error) {
        if (!isCompleted) {
          setTimeout(() => {
            alert(`Skor: ${finalLaps} (Kaydedilemedi) \nMenüye dönülüyor...`);
            navigate('/cocuk-paneli');
          }, 500);
          return;
        }
      }

      if (isCompleted) {
        setShowCelebration(true);
        return;
      }
    }

    navigate('/cocuk-paneli');
  };

  // Yüksek Kontrast Teması (Gizemli Mağara / Macera)
  const themeColors = {
    bg: '#1E1B4B',
    text: cpTheme.text.light,
    card: 'rgba(255, 255, 255, 0.1)',
    border: '#8B5CF6',
    accent: '#A78BFA'
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
      {/* Arka Plan Işık Efektleri */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', backgroundColor: '#8B5CF6', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', backgroundColor: '#3B82F6', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>

      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.0} theme="darkBg" customStyle={{ top: '75%' }} />

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
          }
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>

      {/* 1, 2, 3 Animasyonu */}
      {gamePhase === 'inhale' && holdTimer > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '120px', fontWeight: 'bold', color: '#A78BFA',
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
        {!gameOver && (
          <div style={{
            backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
            border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            backdropFilter: 'blur(10px)',
            opacity: gamePhase === 'exhale' || gamePhase === 'success' ? 1 : 0.4,
            filter: gamePhase === 'exhale' || gamePhase === 'success' ? 'none' : 'blur(1px) grayscale(50%)',
            transition: 'all 0.4s ease'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>💨 Nefes Gücü</h3>
            <div style={{ width: '200px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>

              {/* İdeal Üfleme Aralığı (%10 - %85) */}
              <div style={{ position: 'absolute', left: '10%', width: '75%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.6)', zIndex: 1 }} />

              <div style={{
                width: `${dbPercentage}%`, height: '100%',
                backgroundColor: dbPercentage > 85 ? '#F59E0B' : themeColors.accent,
                transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
              }} />
            </div>
            <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
          </div>
        )}

        {/* Kristal ve Tekrar */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '300px',
          backdropFilter: 'blur(10px)',
          marginLeft: gameOver ? 'auto' : '0'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFF' }}>💎 Nefes Kristalleri Macerası</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#CBD5E1' }}>
            💎 Kristal: {crystals} | 🔄 Tekrar: {laps}/10
          </div>

          {!gameOver && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', width: '100%', justifyContent: 'flex-end' }}>
              {!isListening ? (
                <button onClick={handleStartGame} style={btnStyleStart}>▶️ BAŞLA</button>
              ) : (
                <button onClick={handlePauseGame} style={btnStyleStop}>⏸️ DURDUR</button>
              )}
              <button onClick={() => handleFinishGame(false)} style={btnStyleExit}>🚪 ÇIKIŞ</button>
            </div>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Kristaller */}

      {!gameOver ? (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '18px',
          zIndex: 10,
          filter: isBlurred ? 'blur(8px)' : 'none',
          transition: 'filter 0.5s ease'
        }}>
          {CRYSTALS.map((crystal, index) => {
            const isCollected = index < laps;
            const isCurrent = index === laps;

            return (
              <div key={crystal.id} style={{
                position: 'relative',
                width: '60px', height: '60px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '42px',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isCollected ? 'scale(1.2)' : isCurrent ? 'scale(1.1) translateY(-10px)' : 'scale(0.8)',
                opacity: isCollected ? 1 : isCurrent ? 0.8 : 0.3,
                filter: isCollected ? `drop-shadow(0 0 15px ${crystal.color})` : 'grayscale(80%)'
              }}>
                {crystal.emoji}

                {/* Şarj olan kristalin etrafındaki enerji halkası */}
                {isCurrent && gamePhase === 'exhale' && energy > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80px', height: '80px',
                    borderRadius: '50%',
                    border: `3px solid ${crystal.color}`,
                    opacity: energy / 100,
                    boxShadow: `0 0 ${energy / 2}px ${crystal.color}`
                  }}></div>
                )}
              </div>
            );
          })}
        </div>
      ) : showCelebration && (
        /* OYUN BİTTİ EKRANI (Büyük Kristal ve Madalya) */
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 50
        }}>
          <h1 style={{ color: '#FCD34D', fontSize: '44px', textShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center', margin: '0 20px 20px 20px', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            Tebrikler!<br/>Nefes Macerasını Tamamladın!
          </h1>

          <div style={{
            position: 'relative',
            fontSize: '150px',
            filter: 'drop-shadow(0 0 50px rgba(255, 215, 0, 0.8))',
            animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}>
            💎
            <div style={{
              position: 'absolute',
              bottom: '-30px', right: '-30px',
              fontSize: '100px',
              animation: 'bounce 2s infinite'
            }}>
              🏅
            </div>
          </div>

          <p style={{ color: '#E9D5FF', fontSize: '20px', fontWeight: 'bold', marginTop: '20px' }}>
            Kazandığın Kristal: 100 💎
          </p>

          <button
            onClick={() => navigate('/cocuk-paneli')}
            style={{ ...btnStyleStart, marginTop: '20px', padding: '14px 36px', fontSize: '18px' }}
          >
            🏠 Menüye Dön
          </button>
        </div>
      )}

      {/* 3. AI EĞİTMEN KARAKTERİ */}
      {!gameOver && (
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
      )}

    </div>
  );
};

export default FinalAdventureGame;