import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';

const FlowerGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  // gamePhase: start, inhale, hold, exhale, success
  const [gamePhase, setGamePhase] = useState('start');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Öncelikle öğrendiğimiz gibi dik duralım!");
  
  const [flowerOpen, setFlowerOpen] = useState(0); // 0 (kapalı) - 100 (tam açık)
  const [holdTimer, setHoldTimer] = useState(0); // 0, 1, 2, 3
  const [cycleCount, setCycleCount] = useState(0);

  const intensityRef = useRef(0);
  const phaseRef = useRef('start');
  const gameOverRef = useRef(false);
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
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isListening && !gameOver && cycleCount === 0 && gamePhase === 'start') {
      const scheduleSequence = () => {
        // Start phase
        playAudioPrompt("Hazır mısın?");
        
        setTimeout(() => {
          setGamePhase('inhale');
          phaseRef.current = 'inhale';
          playAudioPrompt("Çiçek koklar gibi burnundan derin nefes al.");
        }, 3000);
      };
      
      scheduleSequence();
    }
  }, [isListening]);

  // Oyun Döngüsü
  useEffect(() => {
    if (isListening && !gameOverRef.current) {
      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

        if (phaseRef.current === 'inhale') {
          // Nefes alarak çiçeği aç (sessiz nefes alma)
          if (currentDb >= 5 && currentDb <= 50) {
            setFlowerOpen(prev => (prev >= 100 ? 100 : prev + 0.5));
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

  // Çiçek tam açıldığında hold fazına geç (Strict Mode çift çağırmasını önler)
  useEffect(() => {
    if (flowerOpen >= 100 && phaseRef.current === 'inhale') {
      phaseRef.current = 'hold';
      setGamePhase('hold');
      triggerHoldPhase();
    }
  }, [flowerOpen]);

  const triggerHoldPhase = () => {
    playAudioPrompt("Karnının yükseldiğini hisset.");
    setGamePhase('hold');
    phaseRef.current = 'hold';
    
    // Hold 3 seconds
    setTimeout(() => {
      setGamePhase('exhale');
      phaseRef.current = 'exhale';
      playAudioPrompt("Şimdi balon şişirir gibi ağzından yavaşça nefes ver.");
    }, 3000);

    setTimeout(() => {
      setGamePhase('success');
      phaseRef.current = 'success';
      playAudioPrompt("Harika! Çok güzel yaptın!");
      setScore(s => s + 100);
      
      setCycleCount(c => {
        const nextCycle = c + 1;
        if (nextCycle >= 5) {
          // Finish game
          setTimeout(() => {
            handleFinishGame();
          }, 4000);
          return nextCycle;
        } else {
          // Next loop
          setTimeout(() => {
            setFlowerOpen(0);
            setHoldTimer(0);
            setGamePhase('start');
            phaseRef.current = 'start';
            playAudioPrompt("Hazır mısın?");
            setTimeout(() => {
              setGamePhase('inhale');
              phaseRef.current = 'inhale';
              playAudioPrompt("Çiçek koklar gibi burnundan derin nefes al.");
            }, 3000);
          }, 4000);
          return nextCycle;
        }
      });
    }, 7000);
  };

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
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
      alert(`Harika! Oyun Tamamlandı! Skor: ${score} \nMenüye dönülüyor...`);
    } catch (error) {
      alert(`Oyun Tamamlandı! Skor: ${score} \nMenüye dönülüyor...`);
    }

    navigate('/cocuk-paneli');
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
      {/* Arka Plan Dekoratif Çiçekleri (Sabit) */}
      <div style={{ position: 'absolute', top: '15%', left: '25%', fontSize: '60px', opacity: 0.3, transform: 'rotate(-20deg)' }}>🌸</div>
      <div style={{ position: 'absolute', top: '10%', right: '25%', fontSize: '50px', opacity: 0.4, transform: 'rotate(15deg)' }}>🌺</div>
      <div style={{ position: 'absolute', bottom: '20%', left: '30%', fontSize: '70px', opacity: 0.2, transform: 'rotate(-10deg)' }}>🌼</div>
      <div style={{ position: 'absolute', bottom: '25%', right: '15%', fontSize: '80px', opacity: 0.25, transform: 'rotate(20deg)' }}>🌸</div>
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', fontSize: '40px', opacity: 0.3, transform: 'rotate(5deg)' }}>🌻</div>
      <div style={{ position: 'absolute', top: '35%', right: '10%', fontSize: '50px', opacity: 0.35, transform: 'rotate(-15deg)' }}>🌼</div>

      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} phase={gamePhase} scale={2.2} customStyle={{ left: '14%', right: 'auto', top: '55%' }} />
      
      <div style={styles.topPanel}>
        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: cpTheme.primary.teal }}>🎙️ Nefes Sesi</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Üfleme Aralığı Rehberi (%5 - %50) */}
            <div style={{ position: 'absolute', left: '5%', width: '45%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', zIndex: 1 }} />
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 50 ? cpTheme.primary.coral : cpTheme.primary.emerald, 
              transition: 'width 0.1s linear', borderRadius: '8px', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '8px', fontWeight: 'bold' }}>%{dbPercentage}</span>
        </div>

        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Çiçeği Kokla!</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px' }}>
            Skor: {Math.floor(score)} | İlerleme: {cycleCount}/5
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
        <div style={{ 
          position: 'relative', width: '200px', height: '200px', perspective: '800px',
          transform: `scale(${0.8 + (flowerOpen / 200)})`, // nefes aldıkça büyür
          filter: gamePhase === 'success' || gamePhase === 'exhale' ? 'drop-shadow(0px 0px 30px rgba(255, 235, 59, 0.6))' : 'none',
          animation: gamePhase === 'exhale' || gamePhase === 'success' ? 'shake 3s ease-in-out infinite' : 'none',
          transition: 'transform 0.1s linear',
          zIndex: 5
        }}>
          {/* Çiçeğin Sapı */}
          <div style={{
            position: 'absolute', bottom: '-150px', left: '50%', width: '12px', height: '200px',
            background: 'linear-gradient(to right, #4CAF50, #81C784)',
            transform: 'translateX(-50%)', borderRadius: '6px', zIndex: 1,
            filter: `grayscale(${100 - flowerOpen}%)`
          }}></div>

          {/* Taç Yapraklar (Nefes aldıkça açılır ve renklenir) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '40px', height: '110px',
              background: 'linear-gradient(to top, #EC4899, #F472B6)',
              borderRadius: '50% 50% 20% 20%',
              transformOrigin: 'bottom center',
              // 85 derece ile yatık (kapalı) başlar, açıldıkça 0 dereceye (dik/açık) gelir
              transform: `translate(-50%, -100%) rotateZ(${angle}deg) rotateX(${85 - (flowerOpen * 0.85)}deg) translateY(${10 - (flowerOpen * 0.2)}px)`,
              transition: 'transform 0.1s linear',
              zIndex: 5,
              filter: `grayscale(${100 - flowerOpen}%)`,
              boxShadow: '0 0 15px rgba(244, 114, 182, 0.4)'
            }} />
          ))}

          {/* Çiçeğin Tohum (Orta) Kısmı */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: '60px', height: '60px',
            background: 'radial-gradient(circle, #FDE047, #EAB308)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${0.6 + (flowerOpen * 0.004)})`,
            transition: 'transform 0.1s linear',
            zIndex: 10,
            filter: `grayscale(${100 - flowerOpen}%)`,
            boxShadow: '0 0 25px rgba(250, 204, 21, 0.6)'
          }}></div>

          {/* Yıldızlar (Hold Fazı) */}
          {gamePhase === 'hold' && holdTimer >= 1 && <div style={{ position: 'absolute', top: '-60px', left: '-40px', fontSize: '50px', animation: 'blink 1s infinite', zIndex: 20 }}>✨</div>}
          {gamePhase === 'hold' && holdTimer >= 2 && <div style={{ position: 'absolute', top: '20px', right: '-80px', fontSize: '60px', animation: 'blink 1.2s infinite', zIndex: 20 }}>✨</div>}
          {gamePhase === 'hold' && holdTimer >= 3 && <div style={{ position: 'absolute', bottom: '-40px', left: '-60px', fontSize: '55px', animation: 'blink 0.8s infinite', zIndex: 20 }}>✨</div>}
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