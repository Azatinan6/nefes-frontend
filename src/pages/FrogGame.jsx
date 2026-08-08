import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
const FrogGame = () => {
  // Nefes sensöründen gelen veriler
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // --- Oyun Durumları (States) ---
  const [bellyScale, setBellyScale] = useState(1); // Kurbağanın karın büyüklüğü (1 ile 3 arası)
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0); // Anlık ses düzeyi yüzdesi
  const [promptMessage, setPromptMessage] = useState("Kollarını aç, göğsünü esnet ve kurbağa ile birlikte sessizce derin bir nefes al.");
  const [dragonWarning, setDragonWarning] = useState(false); // Ses çok yüksekse ejderha uyanma tehlikesi
  const [isSuccess, setIsSuccess] = useState(false); // Başarı animasyonu için

  // --- Referanslar (Refs) ---
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);
  const intensityRef = useRef(0);

  // Anlık ses şiddetini güncelle (İnspirasyon - Nefes Alma - Çok düşük ses çıkarır)
  useEffect(() => {
    intensityRef.current = blowIntensity;
    
    // Gürültü Filtresi: Arka plan seslerini veya hafif konuşmaları yok sayar (Örn: 30)
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // Duyarlılığı azalttık (bölen sayıyı 60'tan 120'ye çıkardık, böylece %100'e ulaşmak daha zor)
    const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 2) {
      lastBreathTime.current = Date.now();
    }
  }, [blowIntensity]);

  // Yeni Sözel Komut Havuzu (Hafta 2 - Çiçek Koklama)
  const promptsPool = {
    start: [
      "Hazır mısın? Hadi çiçeği koklayalım! Ekrandaki çiçeklere bakalım. Onları canlandırmak için burnumuzdan derin ve yavaş bir nefes alalım.",
      "Şimdi burnundan yavaşça nefes al ve çiçeği kokladığını düşün.",
      "Göğüs kafesini yavaşça açalım."
    ],
    idle: [
      "Bir kez daha derin ve yavaş bir nefes alalım.",
      "Çiçeği güzelce kokla… Mis gibi!"
    ],
    active: [
      "Şimdi nefesini yavaşça ve uzun bir şekilde ver.",
      "Nefes verirken çiçeklerin yapraklarının hareket ettiğini düşün."
    ],
    motivational: [
      "Harika! Çiçekleri çok güzel canlandırıyorsun.",
      "Çok güzel nefes aldın, süpersin!"
    ],
    warning: [
      "Ejderhayı uyandırmamak için nefesini daha sessiz ve yavaş alabilirsin."
    ],
    success: [
      "Çok güzel nefes aldın, süpersin!"
    ]
  };

  // --- Sesli Yönlendirme (Web Speech API) ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      
      if (promptsPool[type] && promptsPool[type].length > 0) {
        // Rastgele bir cümle seç
        const randomIndex = Math.floor(Math.random() * promptsPool[type].length);
        message = promptsPool[type][randomIndex];
      }

      if (!message) return;

      setPromptMessage(message);

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.1;
      window.speechSynthesis.speak(speech);
      
      warningGiven.current = true;
      
      // Cooldown (6 saniye)
      setTimeout(() => { warningGiven.current = false; }, 6000);
    }
  };

  // Oyun başladığında ilk yönlendirme
  useEffect(() => {
    if (isListening) {
      playAudioPrompt('start');
    }
  }, [isListening]);

  // --- Ana Oyun Döngüsü (Game Loop) ---
  useEffect(() => {
    if (isListening && !gameOver) {
      const updateGame = () => {
        if (isSuccess) return; // Başarı anında büyüme durur

        setBellyScale((prevScale) => {
          let newScale = prevScale;
          
          // Güncel hesaplamayı burada da aynı mantıkla yapıyoruz
          const noiseThreshold = 30; 
          let validIntensity = intensityRef.current - noiseThreshold;
          if (validIntensity < 0) validIntensity = 0;
          const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

          // İDEAL YAVAŞ NEFES ALMA (Sessiz ve Derin) -> Yeşil Alan (%5 - %50) (Eşik genişletildi)
          if (currentDb >= 5 && currentDb <= 50) {
            newScale += 0.015; // Karın yavaşça ve huzurla şişer
            setDragonWarning(false);
            setScore(s => s + 1);
          } 
          // ÇOK GÜÇLÜ VE SESLİ NEFES/ÜFLEME -> Kırmızı Alan (> %50)
          else if (currentDb > 50) {
            // Yanlış teknik: Sesli üflemek veya çok hızlı nefes çekmek
            newScale -= 0.02; // Büyümez, hatta biraz küçülür
            setDragonWarning(true);
            
            if (!warningGiven.current) {
              playAudioPrompt('warning');
            }
          } 
          // NEFES YOK (Sessizlik) -> %0 - %5
          else {
            if (newScale > 1) newScale -= 0.01; // Yavaşça normal boyuta döner
            setDragonWarning(false);
          }

          // Maksimum boyuta ulaşıldığında (Görev başarıldı)
          if (newScale >= 2.5) {
            handleSuccess();
            return 1; // Sıfırla
          }

          return Math.max(1, newScale); // 1'in altına inmesin
        });

        // 5 saniye hareketsizlikte teşvik mesajı (Sadece sesli uyarılarda)
        const timeSinceLastBreath = Date.now() - lastBreathTime.current;
        if (timeSinceLastBreath > 6000 && !warningGiven.current && !dragonWarning) {
          playAudioPrompt('idle');
        } else if (timeSinceLastBreath > 4000 && !warningGiven.current && !dragonWarning) {
          playAudioPrompt('start');
        }
        
        // Ara sıra nefes verirken motivasyon
        if (currentDb > 10 && !warningGiven.current && !dragonWarning) {
           if (Math.random() < 0.005) {
             playAudioPrompt(Math.random() > 0.5 ? 'motivational' : 'active');
           }
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, isSuccess, dragonWarning]);

  // --- Başarılı Nefes İşlemi ---
  const handleSuccess = () => {
    setIsSuccess(true);
    playAudioPrompt('success');
    setCrystals(c => c + 1);
    
    // Ekstra skor bonusu
    setScore(s => s + 100);

    // Animasyon beklemesi
    setTimeout(() => {
      setIsSuccess(false);
      setBellyScale(1);
    }, 2000);
  };

  // --- Oyunu Bitirme ---
  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! Huzurlu bir seans oldu.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 2, 
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

  // Komponent unmount olduğunda sesi kes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Dinamik Stil Ayarları (Tasarım Sistemi) ---
  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)',
      background: cpTheme.bg.mintGreen, // Koyu gizemli bataklık gecesi
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: cpTheme.text.dark,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    glassCard: {
      background: cpTheme.card.white,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '24px',
      border: `1px solid ${cpTheme.elements.border}`, // Fosforlu yeşil detaylar
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
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
    frogContainer: {
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '400px',
      height: '400px',
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
      backgroundColor: cpTheme.card.white, // Orman yeşili
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
    btnStart: {
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: cpTheme.text.light,
      background: cpTheme.primary.teal,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0, 131, 143, 0.4)',
      marginTop: '10px',
      transition: 'transform 0.2s',
    },
    btnStop: {
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: cpTheme.text.light,
      background: cpTheme.primary.coral,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
      marginTop: '10px',
      transition: 'transform 0.2s',
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} />

      
      {/* --- 1. ÜST PANEL: İstatistikler ve Kontroller --- */}
      <div style={styles.topPanel}>
        
        {/* Nefes Sesi (Diyafram Hassasiyeti) Göstergesi */}
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: cpTheme.primary.teal }}>🎙️ Nefes Sesi (Sessizlik)</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Sessiz Nefes Aralığı Rehberi (%5 - %50) */}
            <div style={{ position: 'absolute', left: '5%', width: '45%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 50 ? cpTheme.primary.coral : cpTheme.primary.emerald, // Çok sesliyse kırmızı, normalse yeşil
              transition: 'width 0.1s linear, background-color 0.3s', zIndex: 2, position: 'relative',
              borderRadius: '8px'
            }} />
          </div>
          {dragonWarning && (
            <span style={{ marginTop: '8px', color: cpTheme.primary.coral, fontSize: '13px', fontWeight: 'bold' }}>⚠️ Çok Sesli!</span>
          )}
        </div>

        {/* Skor, Kristaller ve Başla/Bitir Butonu */}
        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: cpTheme.text.dark }}>🐸 Kurbağa ile Zıpla!</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px', color: cpTheme.text.muted }}>
            Skor: {Math.floor(score)} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button 
              onClick={startListening} 
              style={styles.btnStart}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ▶️ OYUNA BAŞLA
            </button>
          ) : (
            <button 
              onClick={handleFinishGame} 
              style={styles.btnStop}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⏹️ BİTİR
            </button>
          )}
        </div>
      </div>

      {/* --- 2. OYUN ALANI: Nilüfer Yaprağı, Kurbağa ve Ejderha --- */}
      <div style={styles.frogContainer}>
        
        {/* Arka Planda Uyuyan Ejderha */}
        <div style={{ 
          position: 'absolute', top: '-180px', right: '-150px', 
          fontSize: '100px', 
          opacity: dragonWarning ? 0.8 : 0.2, // Ses yapınca ejderha uyanır gibi belirginleşir
          transition: 'all 0.5s ease',
          filter: dragonWarning ? 'grayscale(0%)' : 'grayscale(100%) blur(2px)',
          animation: dragonWarning ? 'shake 0.5s infinite' : 'breathe 4s infinite'
        }}>
          🐉{dragonWarning ? '💢' : '💤'}
        </div>

        {/* Başarı Anında Çıkan Çiçekler (Çiçeği Kokla Konsepti) */}
        {isSuccess && (
          <div style={{ position: 'absolute', fontSize: '60px', animation: 'float-up 2s ease-out forwards', zIndex: 5 }}>
            🌸🌺🌼
          </div>
        )}

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Kurbağanın Şişen Karnı (Yeşil Daire) */}
          <div style={{
            position: 'absolute', top: '45%', left: '50%',
            width: '60px', height: '60px', 
            backgroundColor: 'rgba(118, 255, 3, 0.8)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${bellyScale})`,
            transition: 'transform 0.1s linear',
            boxShadow: `0 0 ${15 * bellyScale}px rgba(118, 255, 3, 0.6)`,
            zIndex: 1
          }} />

          {/* Kurbağa Emojisi */}
          <div style={{ 
            fontSize: '140px', 
            zIndex: 2,
            filter: 'drop-shadow(0px 20px 15px rgba(0,0,0,0.6))',
            animation: 'float 3s ease-in-out infinite'
          }}>
            🐸
          </div>
          
          {/* Nilüfer Yaprağı */}
          <div style={{
            position: 'absolute', bottom: '-20px', left: '50%',
            transform: 'translateX(-50%)',
            width: '220px', height: '50px', 
            backgroundColor: '#1B5E20',
            borderRadius: '50%', zIndex: 0,
            boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.5), 0 15px 25px rgba(0,0,0,0.8)'
          }} />

        </div>
      </div>

      {/* --- 3. AI EĞİTMEN KARAKTERİ --- */}
      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>
          👧🏻 {/* Çiçeği koklayan çocuk imgesi */}
        </div>
        
        <div style={styles.chatBubble}>
          {promptMessage}
        </div>
      </div>

      {/* Inline CSS Keyframes */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes breathe {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
          @keyframes float-up {
            0% { transform: translateY(0px) scale(0.5); opacity: 1; }
            100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
          }
        `}
      </style>

    </div>
  );
};

export default FrogGame;