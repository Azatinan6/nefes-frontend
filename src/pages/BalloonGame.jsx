import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import { useNavigate } from 'react-router-dom';

const BalloonGame = () => {
  // Nefes sensöründen gelen veriler ve kontroller
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  const navigate = useNavigate();
  
  // --- Oyun Durumları (States) ---
  const [progress, setProgress] = useState(0); // Balonun doluluk yüzdesi (0-100)
  const [score, setScore] = useState(0); // Toplam puan
  const [crystals, setCrystals] = useState(0); // Kazanılan nefes kristalleri
  const [gameOver, setGameOver] = useState(false); // Oyunun bitip bitmediği
  const [isPopped, setIsPopped] = useState(false); // Balon patlama efekti için
  const [dbPercentage, setDbPercentage] = useState(0); // Anlık üfleme şiddeti yüzdesi
  const [promptMessage, setPromptMessage] = useState("Öncelikle öğrendiğimiz gibi dik duralım!"); // Ekranda görünen asistan mesajı

  // --- Referanslar (Refs) ---
  // Ritim ve zamanlama takibi için state yerine ref kullanıyoruz (gereksiz render'ı önlemek için)
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);
  const intensityRef = useRef(0);
  const gameOverRef = useRef(false);

  // Anlık nefes şiddetini ref'e kaydet (Game loop içinde kullanmak için)
  useEffect(() => {
    intensityRef.current = blowIntensity;
    
    // Desibel Yüzdesi Hesaplama
    const currentDb = Math.min(Math.round((blowIntensity / 160) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 5) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // --- Sesli Yönlendirme (Web Speech API) ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOverRef.current && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Şimdi balon şişirme zamanı! Ağzından yavaşça nefes vererek ekrandaki balonu şişir.";
      } else if (type === 'encourage') {
        message = "Süpersin, harika gidiyorsun!";
      } else if (type === 'posture') {
        message = "Dik durmayı unutma, karnındaki balonu şişiriyorsun gibi düşün.";
      } else if (type === 'pop') {
        message = "Harika!";
      }

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

  // Sayfadan çıkıldığında veya oyun bittiğinde konuşmayı sustur
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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
          const currentDb = Math.min(Math.round((intensityRef.current / 160) * 100), 100);

          // İdeal üfleme aralığı: Kontrollü ve ritmik (Çok sert değil, çok yavaş değil)
          if (currentDb >= 10 && currentDb <= 80) {
            newProgress += (currentDb * 0.008); // Balon nefes şiddetiyle orantılı kontrollü büyür
            
            // Puan artışı
            setScore(s => s + 2);
          } else if (currentDb > 80) {
            // Çok sert üfleme (Yanlış teknik)
            newProgress += 0.1; // Büyüme yavaşlar, kontrollü olması teşvik edilir
          } else {
            // Üfleme yoksa balon sönmeye başlasın (gerçekçi sönme etkisi)
            if (newProgress > 0) newProgress -= 0.3;
          }

          // Balon %100'e ulaşırsa patlatmayı useEffect devralacak
          if (newProgress >= 100) {
            return 100;
          }

          return Math.max(0, newProgress); // 0'ın altına düşmesin
        });

        // Hareketsizlik kontrolü (Postür ve teşvik uyarıları)
        const timeSinceLastBreath = Date.now() - lastBreathTime.current;
        if (timeSinceLastBreath > 6000 && !warningGiven.current) {
          playAudioPrompt('posture'); // Dik duruş hatırlatması
        } else if (timeSinceLastBreath > 4000 && !warningGiven.current) {
          playAudioPrompt('encourage');
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, isPopped]);

  // Strict Mode'da state güncelleyicisi içinde yan etki(side-effect) oluşmasını önlemek için
  useEffect(() => {
    if (progress >= 100 && !isPopped) {
      handleBalloonPop();
    }
  }, [progress, isPopped]);

  // --- Balon Patlatma İşlemi ---
  const handleBalloonPop = () => {
    setIsPopped(true);
    playAudioPrompt('pop');
    
    // Kristal ekle
    setCrystals(c => {
      const newC = c + 1;
      
      if (newC >= 5) {
        setTimeout(() => {
          finishGameWithCrystals(newC);
        }, 1500);
      } else {
        // Animasyon süresi kadar bekle, sonra yeni balona geç
        setTimeout(() => {
          setIsPopped(false);
          setProgress(0);
        }, 1000);
      }
      return newC;
    });
  };

  const finishGameWithCrystals = async (finalCrystals) => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    window.speechSynthesis.cancel();
    setPromptMessage("Oyun Bitti! İlerlemen kaydedildi.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 2, // 2. Hafta Oyunu: Balon Şişirme
      score: score,
      breathCrystals: finalCrystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Tebrikler! ${finalCrystals} Nefes Kristali Kazandın! 💎 Menüye dönülüyor...`);
    } catch (error) {
      alert(`Tebrikler! Kazanılan Kristal: ${finalCrystals} 💎\nMenüye dönülüyor...`);
    }
    
    // Haritaya geri dön
    navigate('/cocuk-paneli');
  };

  const handleFinishGame = () => finishGameWithCrystals(crystals);

  // --- Dinamik Stil Ayarları (Tasarım Sistemi) ---
  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 70px)',
      background: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)', // Renkli Gökyüzü
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
      backgroundColor: cpTheme.card.white,
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
        <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} scale={2.0} theme="lightBg" customStyle={{ top: '48%' }} />

        {/* Gökyüzü ve Park Süslemeleri */}
        <div style={{ position: 'absolute', top: '10%', right: '20%', fontSize: '70px', filter: 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.6))' }}>☀️</div>
        <div style={{ position: 'absolute', top: '15%', left: '15%', fontSize: '60px', opacity: 0.8 }}>☁️</div>
        <div style={{ position: 'absolute', top: '30%', left: '70%', fontSize: '70px', opacity: 0.6 }}>☁️</div>
        
        {/* Arka Planda Uçan Renkli Balonlar (Sabit) */}
        <div style={{ position: 'absolute', bottom: '20%', left: '10%', fontSize: '40px', opacity: 0.6 }}>🎈</div>
        <div style={{ position: 'absolute', bottom: '40%', left: '30%', fontSize: '30px', opacity: 0.4 }}>🎈</div>
        <div style={{ position: 'absolute', bottom: '15%', left: '80%', fontSize: '50px', opacity: 0.5 }}>🎈</div>

        <style>
          {`
            @keyframes floatCloud {
              0% { transform: translateX(0); }
              50% { transform: translateX(50px); }
              100% { transform: translateX(0); }
            }
            @keyframes floatUp {
              0% { transform: translateY(0) rotate(-5deg); }
              50% { transform: translateY(-300px) rotate(5deg); }
              100% { transform: translateY(-600px) rotate(-5deg); opacity: 0; }
            }
          `}
        </style>
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
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: cpTheme.text.dark }}>🎈 Eğlenceli Balon</h2>
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

export default BalloonGame;