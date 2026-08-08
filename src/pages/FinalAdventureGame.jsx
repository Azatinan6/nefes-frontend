import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import BellyBreathGuide from '../components/BellyBreathGuide';
import axios from 'axios';
import { cpTheme } from '../theme/colors';
const FinalAdventureGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // 4 Aşamalı Büyük Final (1: Derin Nefes, 2: Nefes Tut, 3: Kontrollü Üfle, 4: Patlayıcı Güç)
  const [phaseIndex, setPhaseIndex] = useState(0); 
  const [phaseProgress, setPhaseProgress] = useState(0); // Her aşama için 0-100 arası dolum
  
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [promptMessage, setPromptMessage] = useState("Kayıp kristalleri birleştirmek için tüm teknikleri kullan!");

  const blowIntensityRef = useRef(0);
  const phaseIndexRef = useRef(0);
  const warningGiven = useRef(false);

  // Referansları ve Desibeli güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    phaseIndexRef.current = phaseIndex;
    
    // Gürültü Filtresi: 20db altını yoksayar
    const noiseThreshold = 20; 
    let validIntensity = blowIntensity - noiseThreshold;
    if (validIntensity < 0) validIntensity = 0;

    // HASSASİYET AZALTILDI: Bölen 150 yapılarak nefesin daha kontrollü (yavaş) algılanması sağlandı
    const currentDb = Math.min(Math.round((validIntensity / 220) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity, phaseIndex]);

  // --- Sesli Yönlendirme ---
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start_phase0') {
        message = "Büyük finale hoş geldin! Nefes kristalini birleştirmek için önce derin ve sakin bir nefes al.";
      } else if (type === 'start_phase1') {
        message = "Harika! Şimdi nefesini tut ve sessizce bekle.";
      } else if (type === 'start_phase2') {
        message = "Çok iyi! Şimdi dudaklarını büzerek yavaşça ve uzun bir nefes ver.";
      } else if (type === 'start_phase3') {
        message = "Son adım! Tüm gücünle tek seferde devasa bir rüzgar üfle!";
      } else if (type === 'success') {
        message = "Başardın! Sen artık gerçek bir Nefes Kahramanısın!";
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
    if (isListening && phaseIndex === 0) playAudioPrompt('start_phase0');
  }, [isListening]);

  // HATA DÜZELTMESİ (Component unmount olunca sesi kes)
  useEffect(() => {
    return () => {
      warningGiven.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Tüm Becerileri Birleştiren Final Motoru ---
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver && phaseIndex < 4) {
      gameLoop = setInterval(() => {
        const noiseThreshold = 20; 
        let validIntensity = blowIntensityRef.current - noiseThreshold;
        if (validIntensity < 0) validIntensity = 0;

        // Hassasiyet Azaltıldı (150'ye bölüyoruz ki bar anında fırlamasın, kontrollü dolsun)
        const currentDb = Math.min(Math.round((validIntensity / 220) * 100), 100);

        setPhaseProgress((prev) => {
          let newProgress = prev;
          const currentPhase = phaseIndexRef.current;
          
          // AŞAMA 1: DERİN NEFES ALMA (%5 - %50 DB)
          if (currentPhase === 0) {
            newProgress -= 0.5; // Düşme efekti
            if (currentDb >= 5 && currentDb <= 50) newProgress += 1.5;
          }
          // AŞAMA 2: NEFES TUTMA (Sessizlik: < %15 DB)
          else if (currentPhase === 1) {
            if (currentDb < 15) newProgress += 2.5; // Çok hızlı dolar
            else newProgress -= 1; // Hata payı daha az düşürür
          }
          // AŞAMA 3: UZUN ÜFLEME (%15 - %70 DB)
          else if (currentPhase === 2) {
            newProgress -= 0.5;
            if (currentDb >= 15 && currentDb <= 70) newProgress += 1.2;
          }
          // AŞAMA 4: GÜÇLÜ ÜFLEME (> %30 DB yeterli)
          else if (currentPhase === 3) {
            newProgress -= 1.5; 
            if (currentDb > 30) newProgress += (currentDb / 5); 
          }

          if (newProgress < 0) newProgress = 0;

          // AŞAMA TAMAMLANDIĞINDA:
          if (newProgress >= 100) {
            const nextPhase = currentPhase + 1;
            setPhaseIndex(nextPhase);
            
            setScore((s) => {
              const newScore = s + 100;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });

            if (nextPhase === 1) playAudioPrompt('start_phase1');
            else if (nextPhase === 2) playAudioPrompt('start_phase2');
            else if (nextPhase === 3) playAudioPrompt('start_phase3');
            else if (nextPhase === 4) playAudioPrompt('success');

            return 0; // İlerlemeyi sıfırla
          }

          return newProgress;
        });

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver, phaseIndex]);

  // --- Oyunu Bitir ---
  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);

    warningGiven.current = true;
    window.speechSynthesis.cancel();
    setPromptMessage("Muhteşem bir mücadeleydi!");

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 8,
      score: score,
      breathCrystals: crystals + (phaseIndex === 4 ? 5 : 0),
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`TEBRİKLER! GERÇEK BİR NEFES KAHRAMANISIN! Toplam: ${crystals + (phaseIndex===4?5:0)} Kristal 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`MÜTHİŞ! Final Tamamlandı! Kazanılan Kristal: ${crystals + (phaseIndex===4?5:0)} 💎`);
    }
  };

  // --- TASARIM VE FAZ BİLGİLERİ ---
  const phaseDetails = [
    { title: "1. Aşama: Derin Nefes Al", color: "#69F0AE", target: [5, 50], icon: "🌸" },
    { title: "2. Aşama: Nefesini Tut", color: "#FFD54F", target: [0, 15], icon: "🤫" },
    { title: "3. Aşama: Uzun Üfle", color: "#4DD0E1", target: [15, 70], icon: "⛵" },
    { title: "4. Aşama: Tüm Gücünle Üfle", color: "#FF8A65", target: [30, 100], icon: "🚀" },
    { title: "BÜYÜK FİNAL TAMAMLANDI!", color: "#E040FB", target: [0, 0], icon: "🏆" }
  ];

  const currentDetails = phaseDetails[phaseIndex];

  // --- PREMIUM TASARIM STİLLERİ ---
  const styles = {
    container: {
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      background: cpTheme.bg.lavender, // Uzay boşluğu
      overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif",
      color: cpTheme.text.dark, display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    glassCard: {
      background: cpTheme.card.white,
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      borderRadius: '24px',
      border: `1px solid ${currentDetails.color}`,
      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.1)`,
      transition: 'border 0.5s ease',
    },
    topPanel: {
      position: 'absolute', top: '20px', width: '92%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10,
    },
    statBox: {
      padding: '20px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    aiCoach: {
      position: 'absolute', bottom: '30px', left: '30px',
      display: 'flex', alignItems: 'flex-end', gap: '20px', zIndex: 10,
    },
    coachAvatar: {
      width: '110px', height: '110px', backgroundColor: cpTheme.card.white,
      borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '60px', boxShadow: `0 15px 35px rgba(0,0,0,0.1)`, border: `4px solid ${currentDetails.color}`,
      transition: 'all 0.5s ease'
    },
    chatBubble: {
      marginBottom: '35px', padding: '18px 25px', backgroundColor: cpTheme.card.white,
      borderRadius: '25px 25px 25px 0', boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
      maxWidth: '380px', fontWeight: '700', color: cpTheme.text.dark, fontSize: '17px', lineHeight: '1.5',
    },
    btnStart: {
      padding: '14px 35px', fontSize: '16px', fontWeight: 'bold', color: cpTheme.text.light,
      background: cpTheme.primary.teal,
      border: 'none', borderRadius: '15px', cursor: 'pointer',
      boxShadow: `0 8px 20px rgba(0, 131, 143, 0.4)`, marginTop: '15px', transition: 'all 0.3s ease',
    },
    btnStop: {
      padding: '14px 35px', fontSize: '16px', fontWeight: 'bold', color: cpTheme.text.light,
      background: cpTheme.primary.coral,
      border: 'none', borderRadius: '15px', cursor: 'pointer',
      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)', marginTop: '15px', transition: 'all 0.3s ease',
    }
  };

  return (
    <div style={styles.container}>
      <BellyBreathGuide isListening={isListening} blowIntensity={blowIntensity} />

      
      {/* Arka Plan Yıldız Efektleri */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', fontSize: '20px', opacity: 0.5, animation: 'float 3s infinite' }}>✨</div>
      <div style={{ position: 'absolute', top: '30%', right: '15%', fontSize: '30px', opacity: 0.3, animation: 'float 4s infinite 1s' }}>🌟</div>
      <div style={{ position: 'absolute', bottom: '20%', right: '30%', fontSize: '15px', opacity: 0.6, animation: 'float 2s infinite' }}>✨</div>

      {/* 1. ÜST PANEL */}
      <div style={styles.topPanel}>
        
        {/* Görev ve Nefes Barı */}
        {phaseIndex < 4 ? (
          <div style={{ ...styles.glassCard, ...styles.statBox }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '19px', color: currentDetails.color, transition: 'color 0.5s' }}>
              {currentDetails.icon} {currentDetails.title}
            </h3>
            <div style={{ width: '280px', height: '22px', backgroundColor: cpTheme.elements.progressBg, borderRadius: '11px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,0.1)' }}>
              
              {/* İdeal Nefes Alanı */}
              <div style={{ 
                position: 'absolute', 
                left: `${currentDetails.target[0]}%`, 
                width: `${currentDetails.target[1] - currentDetails.target[0]}%`, 
                height: '100%', backgroundColor: `${currentDetails.color}60`, zIndex: 1,
                transition: 'all 0.5s ease'
              }} />
              
              {/* Canlı İlerleme */}
              <div style={{ 
                width: `${dbPercentage}%`, height: '100%', 
                backgroundColor: currentDetails.color, 
                transition: 'width 0.15s ease-out, background-color 0.5s', zIndex: 2, position: 'relative',
                borderRadius: '11px'
              }} />
            </div>
            <span style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '16px', color: cpTheme.text.dark }}>%{dbPercentage}</span>
          </div>
        ) : <div />}

        {/* Skor Paneli */}
        <div style={{ ...styles.glassCard, ...styles.statBox, alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: cpTheme.text.dark }}>👑 Büyük Hazine Peşinde</h2>
          <div style={{ fontSize: '19px', fontWeight: 'bold', marginTop: '8px', color: cpTheme.text.muted }}>
            Skor: {Math.floor(score)} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={styles.btnStart} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ▶️ FİNALİ BAŞLAT
            </button>
          ) : (
            <button onClick={handleFinishGame} style={styles.btnStop} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              ⏹️ BİTİR
            </button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Parçalanmış Kristal Geometrisi */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* Merkez Kristal Düzeneği */}
        <div style={{ position: 'relative', width: '350px', height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {phaseIndex === 4 ? (
            // KAZANILDI - TAM VE DEV KRİSTAL
            <div style={{ 
              fontSize: '280px', zIndex: 10, animation: 'float 3s ease-in-out infinite, finalGlow 2s infinite alternate',
              filter: 'drop-shadow(0px 0px 100px #E040FB)'
            }}>
              💎
            </div>
          ) : (
            // DEVAM EDİYOR - 4 KÖŞEDE PARÇALAR VE ORTADA ÇEKİRDEK
            <>
              {/* Ortadaki Parlayan Büyü Çekirdeği */}
              <div style={{
                position: 'absolute', width: `${100 + (phaseProgress * 1.5)}px`, height: `${100 + (phaseProgress * 1.5)}px`,
                backgroundColor: currentDetails.color, borderRadius: '50%', opacity: 0.15 + (phaseProgress/150),
                boxShadow: `0 0 ${50 + phaseProgress}px ${currentDetails.color}, inset 0 0 50px rgba(255,255,255,0.5)`, 
                transition: 'all 0.2s linear', zIndex: 1
              }} />
              
              {/* Dört Ana Parça - Kristaller */}
              <div style={{ fontSize: '90px', position: 'absolute', top: '10px', left: '10px', opacity: phaseIndex >= 1 ? 1 : 0.15, transform: phaseIndex >= 1 ? 'scale(1.1)' : 'scale(0.8)', transition: 'all 1s ease', animation: 'float 2s infinite alternate' }}>💎</div>
              <div style={{ fontSize: '90px', position: 'absolute', top: '10px', right: '10px', opacity: phaseIndex >= 2 ? 1 : 0.15, transform: phaseIndex >= 2 ? 'scale(1.1)' : 'scale(0.8)', transition: 'all 1s ease', animation: 'float 2.5s infinite alternate-reverse' }}>💎</div>
              <div style={{ fontSize: '90px', position: 'absolute', bottom: '10px', left: '10px', opacity: phaseIndex >= 3 ? 1 : 0.15, transform: phaseIndex >= 3 ? 'scale(1.1)' : 'scale(0.8)', transition: 'all 1s ease', animation: 'float 3s infinite alternate' }}>💎</div>
              <div style={{ fontSize: '90px', position: 'absolute', bottom: '10px', right: '10px', opacity: phaseIndex >= 4 ? 1 : 0.15, transform: phaseIndex >= 4 ? 'scale(1.1)' : 'scale(0.8)', transition: 'all 1s ease', animation: 'float 2.2s infinite alternate-reverse' }}>💎</div>
            </>
          )}

        </div>

        {/* Görev Başlık Metni (Altta ortalanmış) */}
        {phaseIndex < 4 && (
          <div style={{
            marginTop: '60px', fontSize: '35px', fontWeight: '900', color: currentDetails.color,
            textShadow: `0 5px 20px ${currentDetails.color}80, 0 2px 4px rgba(0,0,0,0.8)`, letterSpacing: '2px',
            animation: 'pulseText 2s infinite alternate'
          }}>
            {currentDetails.title}
          </div>
        )}
      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ */}
      <div style={styles.aiCoach}>
        <div style={styles.coachAvatar}>
          👦🏻
        </div>
        
        {isListening && (
          <div style={styles.chatBubble}>
            💬 {promptMessage}
          </div>
        )}
      </div>

      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes float { 
            0% { transform: translateY(0px); } 
            100% { transform: translateY(-15px); } 
          }
          @keyframes finalGlow { 
            0% { filter: drop-shadow(0px 0px 80px #E040FB); transform: scale(1); } 
            100% { filter: drop-shadow(0px 0px 200px #E040FB) brightness(1.3); transform: scale(1.05); } 
          }
          @keyframes pulseText {
            0% { opacity: 0.8; transform: scale(1); }
            100% { opacity: 1; transform: scale(1.03); }
          }
        `}
      </style>
    </div>
  );
};

export default FinalAdventureGame;