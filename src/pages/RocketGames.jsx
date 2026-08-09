import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';

const RocketGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [gamePhase, setGamePhase] = useState('start'); // start, inhale, ready, blow, fly, rest
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Haydi yeniden dik duralım. Kollarını yukarı uzat ve aşağı indir.");
  
  const [rocketY, setRocketY] = useState(80); // 80% (yerde) -> 0% (uzayda)
  const [firePower, setFirePower] = useState(0); // 0 -> 100

  const intensityRef = useRef(0);
  const phaseRef = useRef('start');
  const animationFrameId = useRef(null);
  
  // Döngü için timer referansları
  const phaseTimer1 = useRef(null);
  const phaseTimer2 = useRef(null);

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

  const startSequence = () => {
    // 1. Start
    setGamePhase('start');
    phaseRef.current = 'start';
    setRocketY(80);
    setFirePower(0);
    playAudioPrompt("Hazır mısın? Roketi fırlatalım!");
    
    // 2. Inhale
    phaseTimer1.current = setTimeout(() => {
      setGamePhase('inhale');
      phaseRef.current = 'inhale';
      playAudioPrompt("Derin ve güçlü bir nefesi burnundan al.");
    }, 4000);

    // 3. Ready
    phaseTimer2.current = setTimeout(() => {
      setGamePhase('ready');
      phaseRef.current = 'ready';
      playAudioPrompt("Roket hazır! Şimdi tek seferde güçlü üfle!");
    }, 9000);
  };

  useEffect(() => {
    if (isListening && !gameOver) {
      // İlk yönlendirmeler
      playAudioPrompt("Haydi yeniden dik duralım. Kollarını yukarı uzat ve aşağı indir.");
      setTimeout(() => {
        startSequence();
      }, 7000);
    }
    return () => {
      if (phaseTimer1.current) clearTimeout(phaseTimer1.current);
      if (phaseTimer2.current) clearTimeout(phaseTimer2.current);
    };
  }, [isListening, gameOver]);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

        if (phaseRef.current === 'ready' || phaseRef.current === 'blow') {
          // Güçlü üfleme bekleniyor (> %50)
          if (currentDb > 50) {
            setGamePhase('blow');
            phaseRef.current = 'blow';
            setFirePower(prev => {
              const next = prev + 5;
              if (next >= 100) {
                // Roketi fırlat
                triggerLaunch();
                return 100;
              }
              return next;
            });
          }
        }
        
        // Uçuş sırasında
        if (phaseRef.current === 'fly') {
          setRocketY(prev => {
            if (prev > -20) return prev - 2; // Yukarı doğru uçar
            return prev;
          });
        }
        
        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver]);

  const triggerLaunch = () => {
    setGamePhase('fly');
    phaseRef.current = 'fly';
    playAudioPrompt("Vuuu! Roket fırladı! Harika! Roketi uzaya gönderdin!");
    setScore(s => s + 100);

    setTimeout(() => {
      setGamePhase('rest');
      phaseRef.current = 'rest';
      playAudioPrompt("Şimdi biraz dinlen.");
    }, 6000);

    setTimeout(() => {
      playAudioPrompt("Hazırsan bir roket daha fırlatalım!");
      setTimeout(() => {
        startSequence();
      }, 4000);
    }, 12000);
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! Süpersin.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 7,
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
      background: 'linear-gradient(to top, #4FC3F7 0%, #1565C0 50%, #000000 100%)', // Yere yakın gökyüzü, yukarıda uzay
      overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif",
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
    },
    ground: {
      position: 'absolute', bottom: '0', width: '100%', height: '10%',
      background: '#795548', borderTop: '5px solid #4CAF50',
    }
  };

  return (
    <div style={styles.container}>
      {/* Gökyüzü ve Uzay Görselleri */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '40px' }}>⭐</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '50px' }}>🌍</div>
      <div style={{ position: 'absolute', top: '5%', right: '40%', fontSize: '30px' }}>✨</div>
      <div style={{ position: 'absolute', top: '30%', left: '30%', fontSize: '40px', opacity: 0.8 }}>☁️</div>
      <div style={{ position: 'absolute', top: '40%', right: '25%', fontSize: '50px', opacity: 0.9 }}>☁️</div>

      <div style={styles.ground}>
        {/* Fırlatma Rampası */}
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '20px', background: '#9E9E9E', borderRadius: '5px 5px 0 0' }}></div>
        <div style={{ position: 'absolute', bottom: '100%', left: '45%', width: '10px', height: '60px', background: '#616161' }}></div>
        <div style={{ position: 'absolute', bottom: '100%', right: '45%', width: '10px', height: '60px', background: '#616161' }}></div>
      </div>

      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase === 'blow' ? 'exhale' : 'inhale'} />
      
      <div style={styles.topPanel}>
        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: cpTheme.primary.teal }}>🎙️ Üfleme Gücü</h3>
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
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Roketi Fırlat!</h2>
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

      {/* Roket */}
      <div style={{
        position: 'absolute',
        top: `${rocketY}%`,
        left: '50%',
        transform: 'translate(-50%, -100%)', // Roketin altı y ekseninde hizalansın
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 5
      }}>
        <div style={{ fontSize: '120px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))' }}>🚀</div>
        
        {/* Ateş */}
        {(gamePhase === 'blow' || gamePhase === 'fly') && (
          <div style={{ fontSize: '60px', marginTop: '-20px', animation: 'fire 0.2s infinite alternate' }}>🔥</div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '30px', display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 10 }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', border: '3px solid #ccc' }}>🧑‍🚀</div>
        <div style={{ marginBottom: '20px', padding: '15px 20px', backgroundColor: '#fff', borderRadius: '20px 20px 20px 0', maxWidth: '300px', fontWeight: 'bold' }}>{promptMessage}</div>
      </div>

      <style>
        {`
          @keyframes fire {
            from { transform: scale(1) translateY(0); opacity: 0.8; }
            to { transform: scale(1.2) translateY(10px); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default RocketGame;