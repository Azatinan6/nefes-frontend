import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const RocketGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState('start'); // start, inhale, pre-exhale, exhale, success
  const [energy, setEnergy] = useState(0); // 0 ile 100 arası
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // 10 tekrar
  const [promptMessage, setPromptMessage] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [holdTimer, setHoldTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
      scheduleTimeout(() => startCycle(), 1000);
    }
  }, [isListening, gameOver, gamePhase]);

  const startCycle = () => {
    if (gameOverRef.current || isPausedRef.current) return;

    setEnergy(0);
    setIsLaunching(false);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';

    const messages = ["Dik dur.", "Kollarını yukarı uzat.", "Hazır mısın?", "Burnundan derin bir nefes al."];

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

      playAudioPrompt("Roket hazır!");

      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        playAudioPrompt("Şimdi tek ve kontrollü bir üfleme yap.");
      }, 1800);

      // Son mesaj tamamlanınca üfleme kısmı açılır (blur kalkar)
      scheduleTimeout(() => {
        if (gameOverRef.current || isPausedRef.current) return;
        setGamePhase('exhale');
        phaseRef.current = 'exhale';
      }, 3600);
    }, inhaleEnd + 3000);
  };

  // Oyun Döngüsü (Sadece nefes verme anında enerji dolar)
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

          // Güçlü Üfleme Hedefi (%30 - %100)
          if (currentDb >= 30) {
            newEnergy += 0.5;
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
      handleLaunch();
    }
  }, [energy]);

  const handleLaunch = () => {
    phaseRef.current = 'success';
    setGamePhase('success');
    setIsLaunching(true);

    playAudioPrompt("Roket fırladı!");
    scheduleTimeout(() => {
      if (!gameOverRef.current && !isPausedRef.current) playAudioPrompt("Harika! Roketi uzaya gönderdin.");
    }, 1600);
    scheduleTimeout(() => {
      if (!gameOverRef.current && !isPausedRef.current) playAudioPrompt("Şimdi dinlen.");
    }, 4200);

    setScore((s) => Math.min(s + 10, 100));
    setCrystals((c) => Math.min(c + 10, 100));

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
        startCycle();
      }
    }, 6800);
  };

  const handlePauseGame = () => {
    stopListening();
    setIsPaused(true);
    isPausedRef.current = true;
    clearAllTimeouts();
    setGamePhase('start');
    phaseRef.current = 'start';
    setEnergy(0);
    setIsLaunching(false);
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
        gameId: 7,
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

  // Yüksek Kontrast Teması (Uzay)
  const themeColors = {
    bg: '#0F172A',
    text: cpTheme.text.light,
    card: 'rgba(255, 255, 255, 0.1)',
    border: '#38BDF8',
    accent: '#0EA5E9'
  };

  const btnStyleStart = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.teal, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)' };
  const btnStyleStop = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: cpTheme.primary.coral, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' };
  const btnStyleExit = { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: '#9E9E9E', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(158, 158, 158, 0.4)' };

  // Üfleme dışındaki hazırlık anlarında (sayaç, fırlatma sonrası dinlenme) ekran blurlu kalır; oyun başlamadan blurlu durmaz
  const isBlurred = gamePhase === 'inhale' || gamePhase === 'pre-exhale' || gamePhase === 'success';

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.0} theme="darkBg" customStyle={{ top: '48%', right: '30px' }} />

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>

      {/* 1, 2, 3 Animasyonu */}
      {gamePhase === 'inhale' && holdTimer > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '120px', fontWeight: 'bold', color: '#38BDF8',
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
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          backdropFilter: 'blur(10px)',
          opacity: gamePhase === 'exhale' ? 1 : 0.4,
          filter: gamePhase === 'exhale' ? 'none' : 'blur(1px) grayscale(50%)',
          transition: 'all 0.4s ease'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#FFF' }}>💨 Nefes Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>

            {/* İdeal Üfleme Aralığı (%30 - %100) (Güçlü Üfleme) */}
            <div style={{ position: 'absolute', left: '30%', width: '70%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.6)', zIndex: 1 }} />

            <div style={{
              width: `${dbPercentage}%`, height: '100%',
              backgroundColor: dbPercentage < 30 ? '#F59E0B' : themeColors.accent,
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Kristal ve Tekrar */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '300px',
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFF' }}>🚀 Güçlü Üfle, Roketi Fırlat!</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#CBD5E1' }}>
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

      {/* 2. OYUN ALANI: Fırlatma Rampası ve Roket */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.5s ease'
      }}>

        {/* Arka Plan Uzay Efektleri */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', fontSize: '40px', opacity: 0.8 }}>⭐</div>
        <div style={{ position: 'absolute', top: '50%', left: '80%', fontSize: '20px', opacity: 0.5 }}>⭐</div>
        <div style={{ position: 'absolute', top: '10%', left: '60%', fontSize: '30px', opacity: 0.9 }}>🌟</div>
        <div style={{ position: 'absolute', top: '40%', left: '20%', fontSize: '80px', opacity: 0.6 }}>🌍</div>
        <div style={{ position: 'absolute', top: '70%', left: '85%', fontSize: '100px', opacity: 0.3 }}>🪐</div>

        {/* Rampa Yüzeyi */}
        <div style={{
          position: 'absolute', bottom: 0, width: '100%', height: '15%',
          backgroundColor: '#475569',
          borderTop: '10px solid #334155',
          zIndex: 0
        }}></div>

        {/* Fırlatma Platformu */}
        <div style={{
          position: 'absolute', bottom: '15%', left: '50%',
          width: '200px', height: '20px', backgroundColor: '#94A3B8',
          transform: 'translateX(-50%)', borderRadius: '5px 5px 0 0',
          zIndex: 1
        }}></div>

        <div style={{
          position: 'absolute', bottom: '15%', left: '42%',
          width: '10px', height: '100px', backgroundColor: '#64748B',
          zIndex: 2
        }}></div>
        <div style={{
          position: 'absolute', bottom: '15%', left: '58%',
          width: '10px', height: '100px', backgroundColor: '#64748B',
          zIndex: 2
        }}></div>

        {/* Roket */}
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: isLaunching ? '150%' : '15%',
          fontSize: '150px',
          transform: `translate(-50%, 0)`,
          transition: isLaunching ? 'bottom 2.5s cubic-bezier(0.5, 0, 0.2, 1)' : 'none',
          zIndex: 10,
          filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.8))'
        }}>
          🚀
        </div>

        {/* Roket Ateşi (Sadece fırlarken veya enerji birikirken göster) */}
        {!isLaunching && energy > 0 && gamePhase === 'exhale' && (
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '15%',
            transform: 'translateX(-50%)',
            fontSize: `${50 + (energy)}px`,
            zIndex: 9,
            opacity: 0.8
          }}>
            🔥
          </div>
        )}
        {isLaunching && (
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '150%',
            transform: 'translate(-50%, 150px)',
            fontSize: '120px',
            zIndex: 9,
            transition: 'bottom 2.5s cubic-bezier(0.5, 0, 0.2, 1)'
          }}>
            🔥
          </div>
        )}
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

export default RocketGame;
