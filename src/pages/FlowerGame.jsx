import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';

const FlowerGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // gamePhase: start, inhale, hold, exhale, success
  const [gamePhase, setGamePhase] = useState('start');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Öncelikle öğrendiğimiz gibi dik duralım!");
  
  const [flowerOpen, setFlowerOpen] = useState(0); // 0 (kapalı) - 100 (tam açık)
  const [holdTimer, setHoldTimer] = useState(0); // 0, 1, 2, 3

  const intensityRef = useRef(0);
  const phaseRef = useRef('start');
  const animationFrameId = useRef(null);

  useEffect(() => {
    intensityRef.current = blowIntensity;
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
    const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity]);

  const playAudioPrompt = (message) => {
    if (!gameOver && isListening) {
      setPromptMessage(message);
      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.1;
      window.speechSynthesis.speak(speech);
    }
  };

  useEffect(() => {
    if (isListening && !gameOver) {
      const scheduleSequence = () => {
        // Start phase
        playAudioPrompt("Öncelikle öğrendiğimiz gibi dik duralım! Hazır mısın? Çiçeğimizi koklayalım!");
        
        setTimeout(() => {
          setGamePhase('inhale');
          phaseRef.current = 'inhale';
          playAudioPrompt("Burnundan yavaşça nefes al. Çiçeği kokla… Mis gibi!");
        }, 7000);
      };
      
      scheduleSequence();
    }
  }, [isListening, gameOver]);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

        if (phaseRef.current === 'inhale') {
          // Nefes alarak çiçeği aç (sessiz nefes alma)
          if (currentDb >= 5 && currentDb <= 50) {
            setFlowerOpen(prev => {
              const next = prev + 0.5;
              if (next >= 100) {
                // Çiçek tam açıldı, hold fazına geç
                phaseRef.current = 'hold';
                setGamePhase('hold');
                triggerHoldPhase();
                return 100;
              }
              return next;
            });
          } else {
            // Nefes almayı bırakırsa biraz kapanabilir
            setFlowerOpen(prev => (prev > 0 ? prev - 0.2 : 0));
          }
        }
        
        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver]);

  const triggerHoldPhase = () => {
    playAudioPrompt("Şimdi nefesini tut.");
    
    setTimeout(() => {
      playAudioPrompt("Tut… 1");
      setHoldTimer(1);
    }, 2000);
    
    setTimeout(() => {
      playAudioPrompt("2");
      setHoldTimer(2);
    }, 3500);

    setTimeout(() => {
      playAudioPrompt("3");
      setHoldTimer(3);
    }, 5000);

    setTimeout(() => {
      setGamePhase('exhale');
      phaseRef.current = 'exhale';
      playAudioPrompt("Harika! Şimdi yavaşça ağzından nefes ver.");
    }, 6500);

    setTimeout(() => {
      setGamePhase('success');
      phaseRef.current = 'success';
      playAudioPrompt("Çiçeğimiz canlandı! Bravo! Çok güzel yaptın!");
      setScore(s => s + 100);
      
      setTimeout(() => {
        setFlowerOpen(0);
        setHoldTimer(0);
        setGamePhase('start');
        phaseRef.current = 'start';
        playAudioPrompt("Hazır mısın? Çiçeğimizi tekrar koklayalım!");
        setTimeout(() => {
          setGamePhase('inhale');
          phaseRef.current = 'inhale';
          playAudioPrompt("Burnundan yavaşça nefes al. Çiçeği kokla… Mis gibi!");
        }, 5000);
      }, 5000);
    }, 10000);
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! Süpersin.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 6,
      score: score,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! Oyun Tamamlandı! Skor: ${score}`);
    } catch (error) {
      alert(`Oyun Tamamlandı! Skor: ${score}`);
    }
  };

  const styles = {
    container: {
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      background: '#FFF3E0', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    glassCard: {
      background: cpTheme.card.white, backdropFilter: 'blur(10px)',
      borderRadius: '24px', border: `1px solid ${cpTheme.elements.border}`,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    },
    topPanel: {
      position: 'absolute', top: '20px', width: '90%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10,
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} />
      
      <div style={styles.topPanel}>
        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: cpTheme.primary.teal }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 50 ? cpTheme.primary.coral : cpTheme.primary.emerald, 
              transition: 'width 0.1s linear', borderRadius: '8px'
            }} />
          </div>
          <span style={{ marginTop: '8px', fontWeight: 'bold' }}>%{dbPercentage}</span>
        </div>

        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Çiçeği Kokla!</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px' }}>
            Skor: {Math.floor(score)}
          </div>
          {!isListening ? (
            <button onClick={startListening} style={{ padding: '10px 20px', background: cpTheme.primary.teal, color: '#fff', border: 'none', borderRadius: '12px', marginTop: '10px', cursor: 'pointer' }}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{ padding: '10px 20px', background: cpTheme.primary.coral, color: '#fff', border: 'none', borderRadius: '12px', marginTop: '10px', cursor: 'pointer' }}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Çiçek ve Yıldızlar */}
        <div style={{ position: 'relative', fontSize: '150px', 
          transform: `scale(${0.8 + (flowerOpen / 200)})`, // nefes aldıkça büyür
          filter: gamePhase === 'success' || gamePhase === 'exhale' ? 'drop-shadow(0px 0px 30px #FFEB3B)' : 'none',
          animation: gamePhase === 'exhale' || gamePhase === 'success' ? 'shake 2s ease-in-out infinite' : 'none',
          transition: 'transform 0.1s linear'
        }}>
          {flowerOpen > 80 ? '🌻' : flowerOpen > 40 ? '🌷' : '🌱'}

          {/* Yıldızlar (Hold Fazı) */}
          {gamePhase === 'hold' && holdTimer >= 1 && <div style={{ position: 'absolute', top: '-20px', left: '-20px', fontSize: '50px', animation: 'blink 1s infinite' }}>✨</div>}
          {gamePhase === 'hold' && holdTimer >= 2 && <div style={{ position: 'absolute', top: '10px', right: '-40px', fontSize: '60px', animation: 'blink 1.2s infinite' }}>✨</div>}
          {gamePhase === 'hold' && holdTimer >= 3 && <div style={{ position: 'absolute', bottom: '20px', left: '-40px', fontSize: '55px', animation: 'blink 0.8s infinite' }}>✨</div>}
        </div>

        {/* Sayaç Görseli */}
        {gamePhase === 'hold' && (
          <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#FF9800', marginTop: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
            {holdTimer}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '30px', display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 10 }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', border: '3px solid #ccc' }}>👧🏻</div>
        <div style={{ marginBottom: '20px', padding: '15px 20px', backgroundColor: '#fff', borderRadius: '20px 20px 20px 0', maxWidth: '300px', fontWeight: 'bold' }}>{promptMessage}</div>
      </div>

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
        `}
      </style>
    </div>
  );
};

export default FlowerGame;