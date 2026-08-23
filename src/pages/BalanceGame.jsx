import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
import api from '../services/api';
const BalanceGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // --- Oyun ve Fizyolojik Durumlar ---
  const [progress, setProgress] = useState(0); // 0 (Köprü Başı) ile 100 (Hazine) arası
  const [sway, setSway] = useState(0); // Köprünün sallantı derecesi
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [treasureOpened, setTreasureOpened] = useState(false);
  const [promptMessage, setPromptMessage] = useState("Dengeli ve ritmik nefes alarak köprüyü geç.");

  // --- Referanslar ---
  const intensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);
  const animationFrameId = useRef(null);
  const initRef = useRef(false);

  // Ses Şiddetini Hesapla (Gürültü filtreli)
  useEffect(() => {
    intensityRef.current = blowIntensity;
    
    // Gürültü Filtresi: Arka plan seslerini ve klavye tıkırtılarını yok sayar
    const noiseThreshold = 30; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // Dengeli (Ritmik) solunum hedefleniyor
    const currentDb = Math.min(Math.round((validIntensity / 160) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 5) {
      lastBreathTime.current = Date.now();
    }
  }, [blowIntensity]);

  // --- Sesli Yönlendirme ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOverRef.current && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Gizemli ormana hoş geldin! Karşıdaki hazineye ulaşmak için çok sakin ve dengeli nefes almalısın.";
      } else if (type === 'encourage') {
        message = "Harika adımlar! Ritmik nefes almaya devam et, hazineye az kaldı.";
      } else if (type === 'swaying') {
        message = "Güzeldi ama bir kez daha deneyelim, köprüyü geçmek için daha yavaş ve sakin nefes alabilirsin.";
      } else if (type === 'success') {
        message = "Mükemmel denge! Köprüyü geçtin ve kayıp kristale ulaştın.";
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
      warningGiven.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Entegrasyon Motoru (Köprü Geçişi ve Denge) ---
  useEffect(() => {
    if (isListening && !gameOverRef.current && !treasureOpened) {
      const updateGame = () => {
        const noiseThreshold = 30; 
        let validIntensity = intensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;
        const currentDb = Math.min(Math.round((validIntensity / 160) * 100), 100);

        setProgress((prev) => {
          let newProgress = prev;
          
          // İDEAL RİTMİK NEFES (%5 - %45 Arası) -> Karakter yürür, köprü sabittir
          if (currentDb >= 5 && currentDb <= 45) {
            newProgress += 0.15; // 60 FPS'de saniyede 9 birim (yaklaşık 11 saniyede karşıya geçer)
            setSway((s) => Math.max(s - 0.5, 0)); // Sallantı yavaşça azalır
            setScore(s => s + 1);
          } 
          // ÇOK GÜÇLÜ/PANİK NEFESİ (> %45) -> Köprü şiddetle sallanır, yürüme durur
          else if (currentDb > 45) {
            setSway((s) => Math.min(s + 1, 15)); // Maksimum sallantı 15 derece
            if (!warningGiven.current) playAudioPrompt('swaying');
          }
          // NEFES YOK -> Karakter durur
          else {
            setSway((s) => Math.max(s - 0.2, 0));
          }

          // HAZİNEYE ULAŞMA
          if (newProgress >= 100) {
            setTreasureOpened(true);
            setScore((s) => s + 200);
            setCrystals(c => c + 1);
            playAudioPrompt('success');
            
            // 6 Saniye sonra yeni tura hazırla
            setTimeout(() => {
              setTreasureOpened(false);
              setProgress(0);
              setSway(0);
            }, 6000);
            
            return 100;
          }

          return newProgress;
        });

        // Uzun süre hareketsiz kalırsa motive et
        const timeSinceLastBreath = Date.now() - lastBreathTime.current;
        if (timeSinceLastBreath > 6000 && !warningGiven.current && sway === 0) {
          playAudioPrompt('encourage');
        }

        animationFrameId.current = requestAnimationFrame(updateGame);
      };

      animationFrameId.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isListening, gameOver, treasureOpened, sway]);

  // --- Oyunu Bitir ---
  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    gameOverRef.current = true;
    
    // HATA DÜZELTMESİ (Konuşmayı kesin keser)
    warningGiven.current = true;
    window.speechSynthesis.cancel();

    setPromptMessage("Oyun Bitti! Harika bir denge kurdun.");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 7, 
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await api.post('/progress/save', progressData);
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
      background: cpTheme.bg.mintGreen,
      overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif",
      color: cpTheme.text.dark, display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
    },
    topPanel: {
      position: 'absolute', top: '20px', width: '90%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10,
    },
    statBox: {
      padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    aiCoach: {
      position: 'absolute', bottom: '30px', left: '30px',
      display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 10,
    },
    coachAvatar: {
      width: '100px', height: '100px', backgroundColor: '#FFF',
      borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '50px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: `4px solid ${cpTheme.elements.border}`,
    },
    chatBubble: {
      marginBottom: '30px', padding: '15px 25px', backgroundColor: cpTheme.card.white,
      borderRadius: '20px 20px 20px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '350px', fontWeight: '600', color: cpTheme.text.dark, fontSize: '16px', lineHeight: '1.5',
    },
    btnStart: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: cpTheme.text.light,
      background: cpTheme.primary.emerald,
      border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    },
    btnStop: {
      padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', color: cpTheme.text.light,
      background: cpTheme.primary.coral,
      border: 'none', borderRadius: '12px', cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', marginTop: '10px', transition: 'transform 0.2s',
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide 
        isListening={isListening} 
        blowIntensity={blowIntensity} 
        customStyle={{ top: '100px', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' }}
      />

      
      {/* 1. ÜST PANEL */}
      <div style={styles.topPanel}>
        
        {/* Denge Göstergesi */}
        <div style={{ ...styles.glassCard, ...styles.statBox }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: cpTheme.primary.teal }}>🎙️ Denge Ritmi</h3>
          <div style={{ width: '200px', height: '16px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Ritmik Nefes Aralığı (%5 - %45) */}
            <div style={{ position: 'absolute', left: '5%', width: '40%', height: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 45 ? cpTheme.primary.coral : cpTheme.primary.emerald, 
              transition: 'width 0.1s linear, background-color 0.3s', zIndex: 2, position: 'relative',
              borderRadius: '8px'
            }} />
          </div>
          <span style={{ marginTop: '8px', fontWeight: 'bold', color: cpTheme.text.dark }}>
            {sway > 3 ? '⚠️ Köprü Sallanıyor!' : `%${dbPercentage}`}
          </span>
        </div>

        {/* Skor Paneli */}
        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: cpTheme.text.dark }}>🌉 Cesaret Köprüsü</h2>
          <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '5px', color: cpTheme.text.muted }}>
            İlerleme: %{Math.floor(progress)} | Skor: {Math.floor(score)} | 💎 Kristal: {crystals}
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

      {/* 2. OYUN ALANI (Ortalanmış ve Geliştirilmiş Animasyonlar) */}
      <div style={{
        position: 'absolute', top: '50%', width: '100%', height: '250px',
        display: 'flex', alignItems: 'center', transform: 'translateY(-50%)'
      }}>
        
        {/* Sis Efekti */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, rgba(27,94,32,0.8) 0%, rgba(27,94,32,0) 20%, rgba(27,94,32,0) 80%, rgba(27,94,32,0.8) 100%)',
          zIndex: 15, pointerEvents: 'none'
        }} />

        {/* Asma Köprü */}
        <div style={{
          position: 'absolute', top: '50%', left: '10%', right: '10%', height: '30px',
          backgroundColor: 'rgba(93, 64, 55, 0.9)', borderRadius: '15px',
          borderBottom: '20px dashed #3E2723', // Tahta görünümü
          transform: `translateY(-50%) rotate(${Math.sin(Date.now() / 220) * sway}deg)`, // Dinamik Sallantı
          transition: 'transform 0.1s linear',
          boxShadow: '0 30px 50px rgba(0,0,0,0.8)',
          zIndex: 5,
        }}>
          {/* Köprü ipleri */}
          <div style={{ position: 'absolute', top: '-60px', left: 0, right: 0, height: '100px', borderBottom: '5px solid rgba(255,255,255,0.2)', borderRadius: '50%', zIndex: 4 }} />
        </div>

        {/* Başlangıç Platformu */}
        <div style={{
          position: 'absolute', left: '-5%', width: '15%', height: '250px',
          background: 'linear-gradient(to bottom, #4E342E 0%, #212121 100%)', borderRadius: '30px', zIndex: 6,
          boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
        }} />

        {/* Bitiş Platformu ve Hazine */}
        <div style={{
          position: 'absolute', right: '-5%', width: '15%', height: '250px',
          background: 'linear-gradient(to bottom, #4E342E 0%, #212121 100%)', borderRadius: '30px', zIndex: 6,
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ 
            fontSize: '90px', marginTop: '-70px', zIndex: 10,
            animation: treasureOpened ? 'openChest 1s forwards' : 'pulse 2s infinite alternate',
            filter: treasureOpened ? 'drop-shadow(0px 0px 40px #FFEA00)' : 'drop-shadow(0px 15px 15px rgba(0,0,0,0.6))',
            transition: 'all 0.5s ease'
          }}>
            {treasureOpened ? '💎' : '🧰'}
          </div>
        </div>

        {/* Yürüyen Çocuk Karakteri */}
        <div style={{
          position: 'absolute',
          left: `calc(10% + ${progress * 0.75}%)`, // Köprü üzerinde hareket
          bottom: '80px', // Çocuğun köprü üzerinde durması için yukarı çekildi
          fontSize: '110px',
          zIndex: 10,
          animation: (dbPercentage >= 5 && dbPercentage <= 45) ? 'walk 0.6s infinite alternate' : 'none',
          transition: 'left 0.1s linear',
          filter: 'drop-shadow(0px 15px 15px rgba(0,0,0,0.6))',
          transform: `rotate(${Math.sin(Date.now() / 220) * sway}deg)` // Köprüyle birlikte sallanır
        }}>
          🚶🏻
        </div>

      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ */}
      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>
          🦉 {/* Bilge Baykuş konsepti */}
        </div>
        
        <div style={styles.chatBubble}>
          {promptMessage}
        </div>
      </div>

      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes walk {
            0% { transform: translateY(0px) rotate(-5deg); }
            100% { transform: translateY(-15px) rotate(5deg); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
          @keyframes openChest {
            0% { transform: scale(1); filter: brightness(1) drop-shadow(0px 15px 15px rgba(0,0,0,0.6)); }
            50% { transform: scale(1.3) translateY(-20px); filter: brightness(1.5) drop-shadow(0px 0px 60px #FFEA00); }
            100% { transform: scale(1.2); filter: brightness(1.2) drop-shadow(0px 0px 40px #FFEA00); }
          }
        `}
      </style>
    </div>
  );
};

export default BalanceGame;
