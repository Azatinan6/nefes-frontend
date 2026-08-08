import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const CrystalGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // --- Oyun Durumları ---
  const [gamePhase, setGamePhase] = useState('inhale'); // 'inhale' (nefes al), 'hold' (nefes tut), 'success' (kelebek kondu)
  const [crystalGlow, setCrystalGlow] = useState(0); // 0 ile 100 arası parlaklık
  const [holdProgress, setHoldProgress] = useState(0); // Nefes tutma süresi (0-100)
  
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Derin bir nefesle kristali doldur, sonra nefesini tut!");

  // --- Referanslar ---
  const intensityRef = useRef(0);
  const phaseRef = useRef('inhale');
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);

  // Ses Şiddetini Hesapla (Gürültü filtreli)
  useEffect(() => {
    intensityRef.current = blowIntensity;
    
    // Gürültü filtresi eklendi (Örn: klavye sesi)
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // Nefes alma veya hafif üfleme
    const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity, gamePhase]);

  // --- Sesli Yönlendirme ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Derin bir nefes alarak kristali parlat, sonra sihirli kelebeğin gelmesi için nefesini tut!";
      } else if (type === 'hold_now') {
        message = "Harika! Şimdi nefesini tut ve hiç ses çıkarma, kelebek geliyor...";
      } else if (type === 'scared') {
        message = "Ah! Sesten ürktü. Tekrar kristali parlatıp sessizce bekleyelim.";
      } else if (type === 'success') {
        message = "Muhteşem! Kelebek kondu. Nefesini harika kontrol ediyorsun!";
      }

      setPromptMessage(message);

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      
      warningGiven.current = true;
      setTimeout(() => { warningGiven.current = false; }, 6000);
    }
  };

  useEffect(() => {
    if (isListening) playAudioPrompt('start');
  }, [isListening]);

  // Component unmount olduğunda sesi kes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Oyun Motoru ---
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 100) * 100), 100);

        // AŞAMA 1: NEFES AL VE KRİSTALİ PARLAT
        if (phaseRef.current === 'inhale') {
          setCrystalGlow((prev) => {
            let newGlow = prev - 0.5; // Nefes alınmadığında sönmeye başlar
            
            // Yeşil Alan: %5 - %50
            if (currentDb >= 5 && currentDb <= 50) {
              newGlow = prev + 1.5; 
              setScore(s => s + 1);
            }
            
            if (newGlow <= 0) newGlow = 0;
            
            // Tamamen Parladıysa:
            if (newGlow >= 100) {
              setGamePhase('hold');
              phaseRef.current = 'hold';
              playAudioPrompt('hold_now');
              return 100;
            }
            return newGlow;
          });
        }

        // AŞAMA 2: NEFESİNİ TUT (Sessizlik)
        else if (phaseRef.current === 'hold') {
          // Sessizlik Beklentisi: (Gürültü filtresinden sonra %0-25 arası tolerans)
          if (currentDb <= 25) {
            setHoldProgress((prev) => {
              const newProgress = prev + 0.5; // Yaklaşık 3.5 saniyede dolar (60fps * 0.5 = saniyede 30 birim)
              
              if (newProgress >= 100) {
                setGamePhase('success');
                phaseRef.current = 'success';
                setScore(s => s + 50);
                setCrystals(c => c + 1);
                playAudioPrompt('success');
                
                // 4 saniye sonra yeni tur
                setTimeout(() => {
                  setGamePhase('inhale');
                  phaseRef.current = 'inhale';
                  setCrystalGlow(0);
                  setHoldProgress(0);
                }, 4000);
                
                return 100;
              }
              return newProgress;
            });
          } 
          // Ses çıkarsa / nefes verirse
          else if (currentDb > 25) {
            setHoldProgress((prev) => {
              const newProgress = prev - 1.5; // Ses yapınca kelebek hemen kaçmaz, yavaşça geriler (tolerans)
              
              if (newProgress <= 0) {
                // Tamamen sıfırlanırsa başa döner
                setGamePhase('inhale');
                phaseRef.current = 'inhale';
                setCrystalGlow(40); // Tamamen sönmez, oyuncuya şans tanır
                
                if (!warningGiven.current) {
                  playAudioPrompt('scared'); 
                }
                return 0;
              }
              return newProgress;
            });
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

  // --- Oyunu Bitir ---
  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! Nefesini harika kontrol ettin.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 4, 
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`Oyun Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // --- TASARIM SİSTEMİ ---
  const styles = {
    container: {
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      background: 'radial-gradient(circle at center, #1E1E2C 0%, #0B0B10 100%)', // Mağara karanlığı
      overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif",
      color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    glassCard: {
      background: 'rgba(20, 20, 35, 0.6)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '24px',
      border: '1px solid rgba(0, 229, 255, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    },
    topPanel: {
      position: 'absolute', top: '20px', width: '90%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10,
    },
    statBox: {
      padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    sceneContainer: {
      position: 'absolute', top: '55%', left: '50%',
      transform: 'translate(-50%, -50%)', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none',
    },
    aiCoach: {
      position: 'absolute', bottom: '30px', left: '30px',
      display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 10,
    },
    coachAvatar: {
      width: '100px', height: '100px', backgroundColor: '#FFF',
      borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '50px', boxShadow: '0 10px 25px rgba(0, 229, 255, 0.3)', border: '4px solid #00E5FF',
    },
    chatBubble: {
      marginBottom: '30px', padding: '15px 25px', backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '20px 20px 20px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      maxWidth: '350px', fontWeight: '600', color: '#111', fontSize: '16px', lineHeight: '1.5',
    },
    btnStart: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: '#000',
      background: 'linear-gradient(45deg, #00E5FF 0%, #00B0FF 100%)',
      border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0, 229, 255, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    },
    btnStop: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: '#fff',
      background: 'linear-gradient(45deg, #FF1744 0%, #D50000 100%)',
      border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(255, 23, 68, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. ÜST PANEL */}
      <div style={styles.topPanel}>
        
        {/* Nefes Sesi Göstergesi */}
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#00E5FF' }}>🎙️ Nefes Kontrolü</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            
            {/* Hedef Göstergeleri: 'inhale' için Mavi alan, 'hold' için Sarı sessizlik alanı */}
            {gamePhase === 'inhale' ? (
              <div style={{ position: 'absolute', left: '5%', width: '45%', height: '100%', backgroundColor: 'rgba(0, 229, 255, 0.3)', zIndex: 1 }} />
            ) : (
              <div style={{ position: 'absolute', left: '0%', width: '5%', height: '100%', backgroundColor: 'rgba(255, 234, 0, 0.5)', zIndex: 1 }} />
            )}
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 50 ? '#FF1744' : '#00E5FF', 
              transition: 'width 0.1s linear, background-color 0.3s', zIndex: 2, position: 'relative',
              borderRadius: '8px'
            }} />
          </div>
          <span style={{ marginTop: '8px', fontWeight: 'bold', color: '#FFF' }}>
            {gamePhase === 'hold' ? '🤫 Sessiz Ol...' : `%${dbPercentage}`}
          </span>
        </div>

        {/* Skor Paneli */}
        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#00E5FF', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>💎 4. Bölüm: Kristal Mağara</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px', color: '#E0F7FA' }}>
            Skor: {Math.floor(score)} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={styles.btnStart} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ▶️ BAŞLA
            </button>
          ) : (
            <button onClick={handleFinishGame} style={styles.btnStop} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ⏹️ BİTİR
            </button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI */}
      <div style={styles.sceneContainer}>
        
        {/* Parlayan Kristal */}
        <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Kristal Arkası Aura */}
          <div style={{
            position: 'absolute', width: '150px', height: '150px', borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0, 229, 255, ${crystalGlow / 100}) 0%, rgba(0,0,0,0) 70%)`,
            transform: `scale(${1 + (crystalGlow / 50)})`,
            transition: 'all 0.1s linear', zIndex: 1
          }} />

          {/* Kristal İkonu */}
          <div style={{ 
            fontSize: '120px', zIndex: 2,
            filter: `drop-shadow(0px 0px ${crystalGlow / 3}px rgba(0, 229, 255, 1))`,
            transform: `scale(${1 + (crystalGlow / 200)})`,
            transition: 'all 0.2s ease',
            animation: gamePhase === 'success' ? 'pulse 1s infinite' : 'none'
          }}>
            💎
          </div>

          {/* Sihirli Kelebek */}
          <div style={{
            position: 'absolute', fontSize: '80px', zIndex: 3,
            top: gamePhase === 'success' ? '-20px' : '-200px',
            left: gamePhase === 'success' ? '40px' : `${200 - holdProgress * 2}px`,
            opacity: gamePhase === 'inhale' ? 0.3 : 1,
            transform: gamePhase === 'success' ? 'scale(1)' : `scale(${0.5 + (holdProgress/200)}) rotate(${Math.sin(Date.now() / 200) * 20}deg)`,
            transition: 'all 0.3s ease-out',
            filter: 'drop-shadow(0px 5px 15px rgba(255, 234, 0, 0.8))'
          }}>
            🦋
          </div>
        </div>
        
        {/* Nefes Tutma (Sessizlik) Çubuğu */}
        {gamePhase === 'hold' && (
          <div style={{ position: 'absolute', bottom: '25%', width: '300px', height: '15px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden', border: '2px solid #FFEA00', boxShadow: '0 0 10px rgba(255,234,0,0.5)' }}>
            <div style={{ width: `${holdProgress}%`, height: '100%', backgroundColor: '#FFEA00', transition: 'width 0.1s linear', boxShadow: '0 0 10px #FFEA00' }} />
          </div>
        )}
      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ */}
      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>
          🧚‍♀️ {/* Peri Kızı konsepti */}
        </div>
        
        <div style={styles.chatBubble}>
          {promptMessage}
        </div>
      </div>

      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1.5); filter: drop-shadow(0px 0px 50px rgba(0, 229, 255, 1)); }
            50% { transform: scale(1.6); filter: drop-shadow(0px 0px 80px rgba(0, 229, 255, 1)); }
            100% { transform: scale(1.5); filter: drop-shadow(0px 0px 50px rgba(0, 229, 255, 1)); }
          }
        `}
      </style>

    </div>
  );
};

export default CrystalGame;