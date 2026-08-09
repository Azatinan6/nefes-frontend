import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';

const FrogGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  const [energy, setEnergy] = useState(0); // 0 to 100
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Hazır mısın? Kurbağayı zıplatalım!");
  
  const [frogPos, setFrogPos] = useState({ x: 50, y: 50 });
  const [isJumping, setIsJumping] = useState(false);

  const intensityRef = useRef(0);
  const phaseTimerRef = useRef(null);
  const animationFrameId = useRef(null);
  const energyRef = useRef(0);

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
      // Başlangıç komutları
      playAudioPrompt("Hazır mısın? Kurbağayı zıplatalım! Dik oturalım.");
      
      setTimeout(() => {
        playAudioPrompt("Derin bir nefesi burnundan al ve enerji dol.");
      }, 5000);

      setTimeout(() => {
        playAudioPrompt("Şimdi yavaşça burundan derin nefes al ve devam et almaya.");
      }, 12000);
    }
  }, [isListening, gameOver]);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOver) {
      let lastPromptTime = Date.now();

      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

        if (!isJumping) {
          // Nefes alarak enerji doldur (Sessiz ama hava akımı var)
          if (currentDb >= 5 && currentDb <= 50) {
            energyRef.current += 0.2;
            if (energyRef.current > 100) energyRef.current = 100;
            
            // Motivasyon komutları (rastgele ve aralıklı)
            if (Date.now() - lastPromptTime > 6000) {
              if (energyRef.current > 30 && energyRef.current < 60) {
                playAudioPrompt("Devam et… Kurbağamız hazırlanıyor!");
              } else if (energyRef.current >= 60 && energyRef.current < 90) {
                playAudioPrompt("Biraz daha… Çok güzel! Ne kadar uzun derin nefes alırsan, kurbağa daha ileri zıplar!");
              }
              lastPromptTime = Date.now();
            }

          } else if (currentDb > 50) {
            // Yanlış nefes
            energyRef.current -= 0.1;
            if (energyRef.current < 0) energyRef.current = 0;
          } else {
            // Nefes yok
            energyRef.current -= 0.05;
            if (energyRef.current < 0) energyRef.current = 0;
          }

          setEnergy(energyRef.current);

          // Enerji dolduğunda zıpla
          if (energyRef.current >= 100) {
            triggerJump();
            lastPromptTime = Date.now();
          }
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, isJumping]);

  const triggerJump = () => {
    setIsJumping(true);
    playAudioPrompt("Harika! Kurbağa zıpladı!");
    setScore(s => s + 50);

    // Zıplama animasyonu ve resetleme
    setTimeout(() => {
      playAudioPrompt("Şimdi dinlen ve rahatça ağızdan nefes ver.");
      setFrogPos(prev => ({ x: prev.x === 50 ? 20 : (prev.x === 20 ? 80 : 50), y: prev.y })); // Yeni nilüfere geçtiğini simüle etmek için
    }, 2000);

    setTimeout(() => {
      playAudioPrompt("Haydi nefes verelim.");
    }, 6000);

    setTimeout(() => {
      playAudioPrompt("Bravo! Kurbağa çok iyi zıpladı. Hazırsan tekrar yavaşça nefes çek. Kurbağanın hareketini izle.");
      setIsJumping(false);
      energyRef.current = 0;
      setEnergy(0);
    }, 10000);
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! Süpersin.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 5,
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
      background: '#81C784', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif",
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
    statBox: {
      padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    water: {
      position: 'absolute', bottom: '0', width: '100%', height: '50%',
      background: '#4FC3F7', borderTop: '5px solid #29B6F6',
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase="inhale" />
      
      <div style={styles.topPanel}>
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
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

        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Kurbağayı Zıplat!</h2>
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

      <div style={styles.water}>
        {/* Nilüfer Yaprakları */}
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '150px', height: '50px', background: '#2E7D32', borderRadius: '50%', transform: 'translate(-50%, 0)' }}></div>
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '180px', height: '60px', background: '#2E7D32', borderRadius: '50%', transform: 'translate(-50%, 0)' }}></div>
        <div style={{ position: 'absolute', top: '25%', left: '80%', width: '140px', height: '45px', background: '#2E7D32', borderRadius: '50%', transform: 'translate(-50%, 0)' }}></div>
      </div>

      {/* Kurbağa ve Enerji */}
      <div style={{
        position: 'absolute',
        top: isJumping ? '40%' : '60%', // Zıplarken yukarı
        left: `${frogPos.x}%`,
        transform: `translate(-50%, -50%) scale(${1 + (energy / 100) * 0.5})`, // Enerji doldukça hafif şişer
        transition: 'top 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s linear, left 0.5s ease',
        zIndex: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <div style={{ fontSize: '100px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))' }}>🐸</div>
        
        {/* Enerji Çubuğu (Kurbağanın Altında) */}
        {!isJumping && (
          <div style={{ width: '100px', height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px', marginTop: '10px', overflow: 'hidden', border: '2px solid white' }}>
            <div style={{ width: `${energy}%`, height: '100%', background: '#FFEB3B', transition: 'width 0.1s linear' }} />
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '30px', display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 10 }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', border: '3px solid #ccc' }}>👧🏻</div>
        <div style={{ marginBottom: '20px', padding: '15px 20px', backgroundColor: '#fff', borderRadius: '20px 20px 20px 0', maxWidth: '300px', fontWeight: 'bold' }}>{promptMessage}</div>
      </div>
    </div>
  );
};

export default FrogGame;