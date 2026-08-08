import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const RainbowGame = () => {
  // Nefes sensöründen gelen veriler
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // --- Oyun Durumları (States) ---
  const [progress, setProgress] = useState(0); // 0 (Bulutlu) ile 100 (Açık Gökyüzü ve Gökkuşağı)
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0); // Anlık nefes yüzdesi
  const [promptMessage, setPromptMessage] = useState("Kelebek gibi kollarını aç ve dudaklarını büzerek bulutları dağıt!");
  const [isSuccess, setIsSuccess] = useState(false); 
  const [stormWarning, setStormWarning] = useState(false); // Çok sert üfleyince fırtına uyarısı

  // --- Referanslar (Refs) ---
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);
  const intensityRef = useRef(0);

  // Anlık ses şiddetini hesapla (Büzük Dudak Solunumu)
  useEffect(() => {
    intensityRef.current = blowIntensity;
    
    // Gürültü Filtresi
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // Büzük dudak solunumu yavaş ve sabit bir ses üretir.
    const currentDb = Math.min(Math.round((validIntensity / 120) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 5) {
      lastBreathTime.current = Date.now();
    }
  }, [blowIntensity]);

  // --- Sesli Yönlendirme (Web Speech API) ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Sırtındaki kelebek kanatlarını kocaman aç! Şimdi dudaklarını büzerek uzun ve yavaş bir nefes ver. Bulutları dağıtıp gökkuşağını çıkaralım!";
      } else if (type === 'encourage') {
        message = "Harika! Uzun ve kesintisiz üflemeye devam et.";
      } else if (type === 'warning') {
        message = "Çok sert üfledin ve fırtına çıktı! Mum üfler gibi daha yavaş ve sakin üfle.";
      } else if (type === 'success') {
        message = "Muhteşem! Gökyüzü pırıl pırıl oldu ve gökkuşağı çıktı.";
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

  // Oyun başladığında ilk yönlendirme
  useEffect(() => {
    if (isListening) {
      playAudioPrompt('start');
    }
  }, [isListening]);

  // Component unmount olduğunda sesi kes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Ana Oyun Döngüsü (Game Loop) ---
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        if (isSuccess) return; 

        setProgress((prev) => {
          let newProgress = prev;
          
          const noiseThreshold = 30; 
          let validIntensity = intensityRef.current - noiseThreshold;
          if (validIntensity < 0) validIntensity = 0;
          const currentDb = Math.min(Math.round((validIntensity / 120) * 100), 100);
          
          // İDEAL NEFES: Uzun, kontrollü, büzük dudak (Yeşil Alan: %10 - %60)
          if (currentDb >= 10 && currentDb <= 60) {
            newProgress += 0.5; // Bulutlar kontrollü bir şekilde dağılır
            setStormWarning(false);
            setScore(s => s + 1);
          } 
          // ÇOK SERT ÜFLEME: (Kırmızı Alan: > %60)
          else if (currentDb > 60) {
            newProgress -= 0.3; // Sert üfleyince bulutlar geri gelir (Fırtına etkisi)
            setStormWarning(true);
            
            if (!warningGiven.current) {
              playAudioPrompt('warning');
            }
          } 
          // ÜFLEME YOK VEYA YETERSİZ: (< %10)
          else {
            if (newProgress > 0) newProgress -= 0.2; // Bulutlar yavaşça tekrar kapanır
            setStormWarning(false);
          }

          // Görev başarıldı
          if (newProgress >= 100) {
            handleSuccess();
            return 100;
          }

          return Math.max(0, newProgress);
        });

        // 5 saniye hareketsizlikte teşvik mesajı
        const timeSinceLastBreath = Date.now() - lastBreathTime.current;
        if (timeSinceLastBreath > 5000 && !warningGiven.current && !stormWarning) {
          playAudioPrompt('encourage');
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, isSuccess, stormWarning]);

  // --- Başarı Durumu ---
  const handleSuccess = () => {
    setIsSuccess(true);
    playAudioPrompt('success');
    setCrystals(c => c + 1);
    setScore(s => s + 100);

    setTimeout(() => {
      setIsSuccess(false);
      setProgress(0);
    }, 4000); // Gökkuşağını 4 saniye izlet, sonra yeni tur
  };

  // --- Oyunu Bitirme ---
  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! Kelebek kanatların çok güçlendi.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 3, 
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

  // --- Dinamik Tasarım Ayarları ---
  // progress'e göre arka plan rengi karanlık griden aydınlık gökyüzü mavisine geçiş yapar
  const r = Math.floor(69 + (progress / 100) * (41 - 69));   // 69 -> 41 (#45 -> #29)
  const g = Math.floor(90 + (progress / 100) * (182 - 90));  // 90 -> 182 (#5A -> #B6)
  const b = Math.floor(100 + (progress / 100) * (246 - 100)); // 100 -> 246 (#64 -> #F6)
  const skyColor = `rgb(${r}, ${g}, ${b})`;

  const styles = {
    container: {
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: skyColor, overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif",
      color: '#FFF', transition: 'background-color 0.2s linear',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    },
    topPanel: {
      position: 'absolute', top: '20px', width: '90%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10,
    },
    statBox: {
      padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    sceneContainer: {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none',
    },
    aiCoach: {
      position: 'absolute', bottom: '30px', left: '30px',
      display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 10,
    },
    coachAvatar: {
      width: '100px', height: '100px', backgroundColor: '#FFD54F',
      borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '4px solid #FFF',
    },
    chatBubble: {
      marginBottom: '30px', padding: '15px 25px', backgroundColor: '#FFF',
      borderRadius: '20px 20px 20px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      maxWidth: '350px', fontWeight: '600', color: '#333', fontSize: '16px', lineHeight: '1.5',
    },
    btnStart: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: '#000',
      background: 'linear-gradient(45deg, #FFCA28 0%, #FFB300 100%)',
      border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(255, 202, 40, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    },
    btnStop: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: '#fff',
      background: 'linear-gradient(45deg, #EF5350 0%, #E53935 100%)',
      border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 83, 80, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. ÜST PANEL: İstatistikler */}
      <div style={styles.topPanel}>
        {/* Nefes Sesi Göstergesi (Büzük Dudak) */}
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#FFF' }}>🎙️ Kontrollü Nefes Verme</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Uzun Nefes Aralığı Rehberi (%10 - %60) */}
            <div style={{ position: 'absolute', left: '10%', width: '50%', height: '100%', backgroundColor: 'rgba(255, 202, 40, 0.5)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 60 ? '#EF5350' : '#FFCA28', 
              transition: 'width 0.1s linear, background-color 0.3s', zIndex: 2, position: 'relative',
              borderRadius: '8px'
            }} />
          </div>
          {stormWarning && <span style={{ marginTop: '8px', color: '#FFCDD2', fontSize: '13px', fontWeight: 'bold' }}>⚠️ Çok Sert! Yavaşla</span>}
        </div>

        {/* Skor Paneli */}
        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#FFF', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>🌈 3. Bölüm: Gökkuşağı Çiz</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px', color: '#E1F5FE' }}>
            Skor: {Math.floor(score)} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={styles.btnStart} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ▶️ OYUNA BAŞLA
            </button>
          ) : (
            <button onClick={handleFinishGame} style={styles.btnStop} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ⏹️ BİTİR
            </button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Bulutlar ve Gökkuşağı */}
      <div style={styles.sceneContainer}>
        
        {/* Güneş (Gökkuşağının arkasında yavaşça parlar) */}
        <div style={{
          position: 'absolute', top: '15%',
          fontSize: '150px',
          opacity: Math.max((progress - 30) / 70, 0),
          transform: `scale(${0.5 + (progress / 100)})`,
          transition: 'all 0.2s ease',
          animation: 'spin-slow 20s linear infinite',
          zIndex: 1
        }}>
          ☀️
        </div>

        {/* Gökkuşağı */}
        <div style={{
          position: 'absolute',
          fontSize: '280px',
          opacity: Math.max(progress / 100, 0), 
          transform: `scale(${0.3 + (progress / 120)}) translateY(${50 - (progress * 0.5)}px)`, 
          transition: 'all 0.2s ease-out',
          zIndex: 2,
          filter: 'drop-shadow(0px 10px 30px rgba(255,255,255,0.6))'
        }}>
          🌈
        </div>

        {/* Başarı Durumunda Kelebekler Uçuşur */}
        {isSuccess && (
          <div style={{ position: 'absolute', fontSize: '60px', animation: 'fly-around 3s ease-in-out forwards', zIndex: 5 }}>
            🦋🦋🦋
          </div>
        )}

        {/* Sol Bulut (Fırtına uyarısında grileşir) */}
        <div style={{
          position: 'absolute', left: '35%', top: '35%',
          fontSize: '220px', zIndex: 3,
          transform: `translateX(-${progress * 6}px)`,
          opacity: 1 - (progress / 150), 
          transition: 'transform 0.2s linear, filter 0.3s ease',
          filter: stormWarning ? 'grayscale(80%) brightness(60%)' : `brightness(${60 + (progress * 0.4)}%)` 
        }}>
          ☁️
        </div>

        {/* Sağ Bulut */}
        <div style={{
          position: 'absolute', right: '35%', top: '35%',
          fontSize: '220px', zIndex: 3,
          transform: `translateX(${progress * 6}px)`,
          opacity: 1 - (progress / 150),
          transition: 'transform 0.2s linear, filter 0.3s ease',
          filter: stormWarning ? 'grayscale(80%) brightness(60%)' : `brightness(${60 + (progress * 0.4)}%)`
        }}>
          ☁️
        </div>
      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ */}
      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>
          🦋 {/* Kelebek konsepti */}
        </div>
        <div style={styles.chatBubble}>
          {promptMessage}
        </div>
      </div>

      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes spin-slow {
            100% { transform: rotate(360deg); }
          }
          @keyframes fly-around {
            0% { transform: translate(0px, 0px) scale(0.5); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translate(150px, -200px) scale(1.5); opacity: 0; }
          }
        `}
      </style>

    </div>
  );
};

export default RainbowGame;