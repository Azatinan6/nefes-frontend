import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
  const pausedRef = useRef(false);
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
    intensityRef.current = blowIntensity;
    const noiseThreshold = 55; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;
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
    let timeoutId;
    if (isListening && !gameOver && gamePhase === 'start' && !pausedRef.current) {
      timeoutId = setTimeout(() => startCycle(cycleCount), 1000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isListening, gameOver, cycleCount, gamePhase]);

  const startCycle = (cycle) => {
    if (gameOverRef.current || pausedRef.current) return;
    
    setFlowerOpen(0);
    setHoldTimer(0);
    setGamePhase('inhale');
    phaseRef.current = 'inhale';

    playAudioPrompt("Öncelikle öğrendiğimiz gibi dik duralım.");
    
    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      playAudioPrompt("Hazır mısın?");
    }, 2500);

    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      playAudioPrompt("Çiçek koklar gibi burnundan derin nefes al.");
    }, 4000);

    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      playAudioPrompt("Karnının yükseldiğini hisset.");
    }, 7000);

    // Animasyonlu 1, 2, 3 sayacı (Nefes alma süresi)
    scheduleTimeout(() => { if (!gameOverRef.current && !pausedRef.current) setHoldTimer(1) }, 9000);
    scheduleTimeout(() => { if (!gameOverRef.current && !pausedRef.current) setHoldTimer(2) }, 10000);
    scheduleTimeout(() => { if (!gameOverRef.current && !pausedRef.current) setHoldTimer(3) }, 11000);

    // pre-exhale fazına geç
    scheduleTimeout(() => {
      if (gameOverRef.current || pausedRef.current) return;
      setHoldTimer(0);
      setGamePhase('pre-exhale');
      phaseRef.current = 'pre-exhale';
      
      playAudioPrompt("Şimdi balon şişirir gibi ağzından yavaşça nefes ver.");

      // Komut bittikten sonra (yaklaşık 3.5s) exhale fazına geç (Bar aktifleşir, blur kalkar)
      scheduleTimeout(() => {
        if (!gameOverRef.current && !pausedRef.current && phaseRef.current === 'pre-exhale') {
          setGamePhase('exhale');
          phaseRef.current = 'exhale';
        }
      }, 3500);
    }, 12000);
  };

  // Oyun Döngüsü (Mikrofon ile barı kontrol etme)
  useEffect(() => {
    if (isListening && !gameOverRef.current) {
      const updateGame = () => {
        // Eşik değeri (daha hassas olması için düşürüldü)
        const noiseThreshold = 55; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        
        // Daha az üfleme gücüyle barın dolabilmesi için 150'ye bölüyoruz
        const currentDb = Math.min(Math.round((validIntensity / 150) * 100), 100);

        // YALNIZCA EXHALE (nefes ver) fazında bar dolacak
        if (phaseRef.current === 'exhale') {
          if (currentDb >= 5) {
            // Dolma hızını artırdık, daha kolay dolsun
            setFlowerOpen(prev => (prev >= 100 ? 100 : prev + 0.35));
          } else {
            // Üflemeyi bırakırsa daha yavaş kapansın
            setFlowerOpen(prev => (prev > 0 ? prev - 0.15 : 0));
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

  // Çiçek tam açıldığında başarı fazına geç
  useEffect(() => {
    if (flowerOpen >= 100 && phaseRef.current === 'exhale') {
      phaseRef.current = 'success';
      setGamePhase('success');
      triggerSuccessPhase();
    }
  }, [flowerOpen]);

  const triggerSuccessPhase = () => {
    playAudioPrompt("Harika!");
    const newScore = score + 10;
    setScore(newScore);
    
    scheduleTimeout(() => {
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);
      
      if (gameOverRef.current || pausedRef.current) {
        setGamePhase('start');
        phaseRef.current = 'start';
        return;
      }

      if (nextCycle >= 10) {
        // Oyun bitti
        handleFinishGame(true, newScore);
      } else {
        // Sonraki döngüye geç
        startCycle(nextCycle);
      }
    }, 3000); // 3 saniye tebrik mesajı bekle
  };

  const handlePauseGame = () => {
    stopListening();
    pausedRef.current = true;
    clearAllTimeouts();
    setGamePhase('start');
    phaseRef.current = 'start';
    setFlowerOpen(0);
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
    
    if (isCompleted) {
      setPromptMessage("Harika! Çok güzel yaptın!");
      
      const speech = new SpeechSynthesisUtterance("Harika! Çok güzel yaptın!");
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.1;
      window.speechSynthesis.speak(speech);

      const progressData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        gameId: 6,
        score: finalScore,
        dbPerformance: dbPercentage
      };

      try {
        await api.post('/progress/save', progressData);
        // Sesin çalabilmesi için alerti biraz geciktiriyoruz
        setTimeout(() => {
          alert(`Harika! Oyun Tamamlandı! Skor: ${finalScore} \nMenüye dönülüyor...`);
          navigate('/cocuk-paneli');
        }, 500);
        return;
      } catch (error) {
        setTimeout(() => {
          alert(`Oyun Tamamlandı! Skor: ${finalScore} \nMenüye dönülüyor...`);
          navigate('/cocuk-paneli');
        }, 500);
        return;
      }
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
        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center',
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

        <div style={{ ...styles.glassCard, padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Çiçek Kokla</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px' }}>
            Kristal: {Math.floor(score)} | Tekrar Sayısı: {cycleCount}/10
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {!isListening ? (
              <button onClick={handleStartGame} style={{ padding: '10px 20px', background: cpTheme.primary.teal, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>▶️ BAŞLA</button>
            ) : (
              <button onClick={handlePauseGame} style={{ padding: '10px 20px', background: cpTheme.primary.coral, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>⏸️ DURDUR</button>
            )}
            <button onClick={() => handleFinishGame(false)} style={{ padding: '10px 20px', background: '#9E9E9E', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>🚪 ÇIKIŞ</button>
          </div>
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

          {/* Yıldızlar (Nefes Alma Fazı) */}
          {gamePhase === 'inhale' && holdTimer >= 1 && <div style={{ position: 'absolute', top: '-60px', left: '-40px', fontSize: '50px', animation: 'blink 1s infinite', zIndex: 20 }}>✨</div>}
          {gamePhase === 'inhale' && holdTimer >= 2 && <div style={{ position: 'absolute', top: '20px', right: '-80px', fontSize: '60px', animation: 'blink 1.2s infinite', zIndex: 20 }}>✨</div>}
          {gamePhase === 'inhale' && holdTimer >= 3 && <div style={{ position: 'absolute', bottom: '-40px', left: '-60px', fontSize: '55px', animation: 'blink 0.8s infinite', zIndex: 20 }}>✨</div>}
        </div>

        {/* Sayaç Görseli */}
        {gamePhase === 'inhale' && (
          <div style={{ 
            fontSize: '80px', fontWeight: 'bold', color: '#FF9800', 
            marginTop: '30px', textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
            position: 'relative', zIndex: 100,
            animation: holdTimer > 0 ? 'blink 1s infinite' : 'none'
          }}>
            {holdTimer > 0 ? holdTimer : ''}
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