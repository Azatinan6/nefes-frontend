import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import api from '../services/api';
const AwarenessGame = () => {
  // Nefes sensöründen gelen veriler ve kontroller
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // --- Oyun Durumları (States) ---
  const [progress, setProgress] = useState(0); // Balonun doluluk yüzdesi (0-100)
  const [score, setScore] = useState(0); // Toplam puan
  const [crystals, setCrystals] = useState(0); // Kazanılan nefes kristalleri
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false); // Oyunun bitip bitmediği
  const [isPopped, setIsPopped] = useState(false); // Balon patlama efekti için
  const [dbPercentage, setDbPercentage] = useState(0); // Anlık üfleme şiddeti yüzdesi
  const [promptMessage, setPromptMessage] = useState("Omuzlarını rahatlat ve zürafa gibi dik dur! Başlamak için butona bas."); // Ekranda görünen asistan mesajı

  // --- Referanslar (Refs) ---
  // Ritim ve zamanlama takibi için state yerine ref kullanıyoruz (gereksiz render'ı önlemek için)
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);
  const initRef = useRef(false);
  const intensityRef = useRef(0);

  // Anlık nefes şiddetini ref'e kaydet (Game loop içinde kullanmak için)
  useEffect(() => {
    intensityRef.current = blowIntensity;
    
    // Desibel Yüzdesi Hesaplama (Gürültü filtresi eklendi)
    // Ortam gürültüsü genelde 0-40 arasıdır. Gerçek üfleme 50-250 arası değer üretir.
    const noiseThreshold = 40; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // Kalan şiddeti (0 ile ~150 arası) 0-100% aralığına çevir
    const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 10) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Yeni Sözel Komut Havuzu (Hafta 1)
  const promptsPool = {
    start: [
      "Elini karnına koy, burundan nefes alırken ve ağzından nefes verirken karnının hareketini hisset.",
      "Hadi bakalım, nefes alıp verirken dik durmayı deniyelim.",
      "Başını yukarı doğru yavaşça uzat."
    ],
    idle: [
      "Elini karnına koy, burundan nefes alırken ve ağzından nefes verirken karnının hareketini hisset."
    ],
    active: [
      "Şimdi ekrandaki balona odaklan, karnını bir balon gibi şişir, burundan nefes al ve ekrandaki balonu şişir ağızdan nefes ver.",
      "Bu şekilde durarak şimdi karnındaki balonu tekrar şişirmeye çalış."
    ],
    motivational: [
      "Harika görünüyorsun!",
      "Süpersin, harika gidiyorsun!"
    ],
    pop: [
      "Tebrikler, harika şişirdin!"
    ]
  };

  // --- Sesli Yönlendirme (Web Speech API) ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOverRef.current && isListening) {
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
      
      // Belirli bir süre aynı uyarıyı tekrar etmesini engelle (Cooldown)
      setTimeout(() => { warningGiven.current = false; }, 8000);
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
        if (isPopped) return; // Balon patlıyorsa büyütmeyi durdur

        setProgress((prevProgress) => {
          let newProgress = prevProgress;
          
          // Güncel hesaplamayı burada da aynı mantıkla yapıyoruz
          const noiseThreshold = 40; 
          let validIntensity = intensityRef.current - noiseThreshold;
          if (validIntensity < 0) validIntensity = 0;
          const currentDb = Math.min(Math.round((validIntensity / 180) * 100), 100);

          // Gerçekten üfleniyorsa balon üfleme şiddetiyle orantılı olarak büyüsün
          if (currentDb > 15) {
            // Şiddete göre büyüme hızı: Ne kadar güçlü üflerse o kadar hızlı büyür (Ama çok abartılı değil)
            newProgress += (currentDb / 160) * 1.5; 
            
            // Puan artışı
            setScore(s => s + 1);
          } else {
            // Üfleme yoksa balon biraz daha hızlı inmeye başlasın ki çocuk nefesi kesmesin
            if (newProgress > 0) newProgress -= 0.3;
          }

          // Balon %100'e ulaşırsa patlat ve kristal kazandır
          if (newProgress >= 100) {
            handleBalloonPop();
            newProgress = 100; 
          }

          // Periyodik motivasyon / yönlendirme (eğer o an sesli komut çalmıyorsa)
          if (!warningGiven.current && newProgress > 20 && newProgress < 90) {
             // 1/150 ihtimalle (~her 2-3 saniyede bir dener, yani ortalama 10sn'de bir tetiklenir)
             if (Math.random() < 0.005) {
               if (currentDb > 15) {
                 // Üflüyorsa
                 playAudioPrompt(Math.random() > 0.5 ? 'motivational' : 'active');
               } else {
                 // Bekliyorsa
                 playAudioPrompt('idle');
               }
             }
          }

          return Math.max(0, newProgress); // 0'ın altına düşmesin
        });

        // Hareketsizlik kontrolü (Postür ve teşvik uyarıları)
        const timeSinceLastBreath = Date.now() - lastBreathTime.current;
        if (timeSinceLastBreath > 6000 && !warningGiven.current) {
          playAudioPrompt('idle'); // Dik duruş hatırlatması
        } else if (timeSinceLastBreath > 4000 && !warningGiven.current) {
          playAudioPrompt('start'); // Tekrar nefes almaya teşvik
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.speechSynthesis.cancel(); // Sayfadan çıkılırsa veya oyun biterse sesi kes
    };
  }, [isListening, gameOver, isPopped]);

  // --- Balon Patlatma İşlemi ---
  const handleBalloonPop = () => {
    setIsPopped(true);
    playAudioPrompt('pop');
    
    // Kristal ekle
    setCrystals(c => c + 1);

    // Animasyon süresi kadar bekle, sonra yeni balona geç
    setTimeout(() => {
      setIsPopped(false);
      setProgress(0);
    }, 1000); // 1 saniye patlama efekti beklemesi
  };

  // --- Oyunu Bitirme ve Veri Kaydetme ---
  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    
    // Oyun bitince arkada devam eden konuşmaları hemen sustur
    window.speechSynthesis.cancel();
    
    setPromptMessage("Oyun Bitti! Harika bir iş çıkardın.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 1, // 1. Hafta Oyunu: Dik Dur Güçlen
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await api.post('/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`Oyun Tamamlandı! Kazanılan Kristal: ${crystals} 💎\n(Sunucuya bağlanılamadı)`);
    }
  };

  // --- Dinamik Stil Ayarları (Tasarım Sistemi) ---
  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)',
      background: cpTheme.bg.softBlue, // CP-friendly arka plan
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: cpTheme.text.dark,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
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
    balloonContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -40%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '400px',
      height: '500px',
    },
    balloon: {
      // Progress 0'da 1 kat, Progress 100'de 2.5 kat büyüklük
      transform: `scale(${isPopped ? 3 : 1 + (progress / 60)})`, 
      opacity: isPopped ? 0 : 1, // Patladığında görünmez olur
      transition: isPopped ? 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s linear',
      fontSize: '120px',
      filter: 'drop-shadow(0px 15px 20px rgba(0,0,0,0.2))',
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
      backgroundColor: '#fff',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '50px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      border: '4px solid #fff',
    },
    chatBubble: {
      marginBottom: '30px',
      padding: '15px 25px',
      backgroundColor: '#fff',
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
        
        {/* Nefes Desibel (Şiddet) Göstergesi */}
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#555' }}>💨 Nefes Gücü</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            {/* İdeal Üfleme Aralığı Rehberi (%10 - %80) */}
            <div style={{ position: 'absolute', left: '10%', width: '70%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 80 ? cpTheme.primary.coral : cpTheme.primary.emerald, 
              transition: 'width 0.1s linear, background-color 0.3s', zIndex: 2, position: 'relative',
              borderRadius: '8px'
            }} />
          </div>
        </div>

        {/* Skor, Kristaller ve Başla/Bitir Butonu */}
        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: cpTheme.text.dark }}>🎈 Dik Dur, Gücünü Hisset!</h2>
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

      {/* --- 2. OYUN ALANI: Büyüyen Balon --- */}
      <div style={styles.balloonContainer}>
        {/* Balonun etrafındaki parlama efekti (şişme oranına göre artar) */}
        <div style={{
          position: 'absolute',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${progress/100}) 0%, rgba(255,255,255,0) 70%)`,
          transform: `scale(${1 + (progress / 160)})`,
          transition: 'all 0.2s linear',
          zIndex: 0
        }} />
        
        {/* Balon İkonu (Emoji kullanıldı, SVG de eklenebilir) */}
        <div style={{...styles.balloon, zIndex: 1}}>
          🎈
        </div>
        
        {/* Patlama Efekti Eklentisi (Sadece isPopped true olduğunda görünür) */}
        {isPopped && (
          <div style={{
            position: 'absolute',
            fontSize: '80px',
            animation: 'pop-animation 0.5s ease-out forwards',
            zIndex: 2
          }}>
            ✨💥✨
          </div>
        )}
      </div>

      {/* --- 3. AI EĞİTMEN KARAKTERİ: Sesli ve Görsel Yönergeler --- */}
      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>
          🦒 {/* Zürafa imgesi postür eğitimine gönderme yapar */}
        </div>
        
        <div style={styles.chatBubble}>
          {promptMessage}
        </div>
      </div>

      {/* Inline CSS Keyframes (Patlama animasyonu için) */}
      <style>
        {`
          @keyframes pop-animation {
            0% { transform: scale(0.5); opacity: 1; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}
      </style>

    </div>
  );
};

export default AwarenessGame;
