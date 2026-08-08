import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const FinalAdventureGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // 4 Aşamalı Büyük Final (1: Derin Nefes, 2: Nefes Tut, 3: Kontrollü Üfle, 4: Patlayıcı Güç)
  const [phaseIndex, setPhaseIndex] = useState(0); 
  const [phaseProgress, setPhaseProgress] = useState(0); // Her aşama için 0-100 arası dolum
  
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);

  const blowIntensityRef = useRef(0);
  const phaseIndexRef = useRef(0);
  const warningGiven = useRef(false);

  // Referansları güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    phaseIndexRef.current = phaseIndex;
    
    // Desibel hesaplama (Max 100)
    const currentDb = Math.min(Math.round((blowIntensity / 100) * 100), 100);
    setDbPercentage(currentDb);
  }, [blowIntensity, phaseIndex]);

  // Sesli Yönlendirme (Büyük Final Kombinasyonu)
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
      } else if (type === 'encourage') {
        message = "Pes etme, harika gidiyorsun! Nefesine odaklan.";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      setTimeout(() => { warningGiven.current = false; }, 6000);
    }
  };

  // Oyun başladığında ilk komutu ver
  useEffect(() => {
    if (isListening && phaseIndex === 0) playAudioPrompt('start_phase0');
  }, [isListening]);

  // Tüm Becerileri Birleştiren Final Motoru
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver && phaseIndex < 4) {
      gameLoop = setInterval(() => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 100) * 100), 100);

        setPhaseProgress((prev) => {
          let newProgress = prev;
          
          // AŞAMA 1: DERİN NEFES ALMA (Diyafram/Torakal Mobilite: %5 - %25 DB)
          if (phaseIndexRef.current === 0) {
            newProgress -= 0.5; // Düşme efekti
            if (currentDb >= 5 && currentDb <= 25) newProgress += 1.5;
          }
          // AŞAMA 2: NEFES TUTMA (İnspiratuvar Hold: < %8 DB)
          else if (phaseIndexRef.current === 1) {
            if (currentDb < 8) newProgress += 2.5; // Yaklaşık 4 saniyede dolar
            else newProgress -= 1; // Ses çıkarsa yavaşça geriler (Ceza yok, telafi var)
          }
          // AŞAMA 3: UZUN ÜFLEME (Endurans: %15 - %40 DB)
          else if (phaseIndexRef.current === 2) {
            newProgress -= 0.5;
            if (currentDb >= 15 && currentDb <= 40) newProgress += 1.2;
          }
          // AŞAMA 4: GÜÇLÜ ÜFLEME (PEF/Güç Üret: > %50 DB)
          else if (phaseIndexRef.current === 3) {
            newProgress -= 2; // Çok hızlı düşer
            if (currentDb > 50) newProgress += (currentDb / 5); // Güce bağlı çok hızlı dolar
          }

          if (newProgress < 0) newProgress = 0;

          // AŞAMA TAMAMLANDIĞINDA:
          if (newProgress >= 100) {
            const nextPhase = phaseIndexRef.current + 1;
            setPhaseIndex(nextPhase);
            
            setScore((s) => {
              const newScore = s + 100;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });

            // Yeni aşamanın sesli komutunu tetikle
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

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 8, // 8. Hafta: Büyük Final
      score: score,
      breathCrystals: crystals + (phaseIndex === 4 ? 5 : 0), // Final bonusu
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`TEBRİKLER! GERÇEK BİR NEFES KAHRAMANISIN! Toplam: ${crystals + 5} Kristal 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`MÜTHİŞ! Final Tamamlandı! Kazanılan Kristal: ${crystals + 5} 💎`);
    }
  };

  // Aşamalara Göre Dinamik Gösterge Metinleri ve Renkleri
  const phaseDetails = [
    { title: "1. Aşama: Derin Nefes Al", color: "#00E676", target: [5, 25], icon: "🌸" },
    { title: "2. Aşama: Nefesini Tut", color: "#FFEA00", target: [0, 8], icon: "🤫" },
    { title: "3. Aşama: Uzun Üfle", color: "#00E5FF", target: [15, 40], icon: "⛵" },
    { title: "4. Aşama: Tüm Gücünle Üfle", color: "#FF3D00", target: [50, 100], icon: "🚀" },
    { title: "BÜYÜK FİNAL TAMAMLANDI!", color: "#E040FB", target: [0, 0], icon: "🏆" }
  ];

  const currentDetails = phaseDetails[phaseIndex];

  // Yüksek Kontrast Teması (Destansı Final)
  const themeColors = { 
    bg: '#000000', // Tam Siyah (Uzay/Final)
    text: '#FFFFFF', 
    card: '#1A237E', 
    border: currentDetails.color,
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text, transition: 'background-color 0.5s ease'
    }}>
      
      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Dinamik Hedef Göstergesi */}
        {phaseIndex < 4 && (
          <div style={{
            backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
            border: `3px solid ${themeColors.border}`, boxShadow: `0 8px 20px ${themeColors.border}40`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'border 0.5s'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.border }}>
              {currentDetails.icon} {currentDetails.title}
            </h3>
            <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
              
              {/* Dinamik Hedef Aralığı Kutusu */}
              <div style={{ 
                position: 'absolute', 
                left: `${currentDetails.target[0]}%`, 
                width: `${currentDetails.target[1] - currentDetails.target[0]}%`, 
                height: '100%', backgroundColor: `${themeColors.border}60`, zIndex: 1 
              }} />
              
              <div style={{ 
                width: `${dbPercentage}%`, height: '100%', 
                backgroundColor: themeColors.border, 
                transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
              }} />
            </div>
            <span style={{ marginTop: '5px', fontWeight: 'bold' }}>%{dbPercentage}</span>
          </div>
        )}

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: `0 8px 20px ${themeColors.border}40`,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>👑 8. Bölüm: Büyük Final</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>
            Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: '#00E676', color: '#000', marginTop: '15px'}}>▶️ FİNALİ BAŞLAT</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Büyük Nefes Kristali Birleştirme */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* Parçalanmış Kristal Efekti (Fazlara göre birleşir) */}
        <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {phaseIndex === 4 ? (
            // KAZANILDI - TAM VE DEV KRİSTAL
            <div style={{ 
              fontSize: '250px', zIndex: 10, animation: 'float 2s infinite, glowPulse 1.5s infinite alternate',
              filter: 'drop-shadow(0px 0px 100px #E040FB)'
            }}>
              💎
            </div>
          ) : (
            // DEVAM EDİYOR - PARÇALAR
            <>
              {/* Ortadaki Kristal Özü (İlerlemeye göre parlar) */}
              <div style={{
                position: 'absolute', width: `${100 + phaseProgress}px`, height: `${100 + phaseProgress}px`,
                backgroundColor: currentDetails.color, borderRadius: '50%', opacity: 0.2 + (phaseProgress/200),
                boxShadow: `0 0 ${phaseProgress}px ${currentDetails.color}`, transition: 'all 0.2s', zIndex: 1
              }} />
              
              {/* Faz Sayısına Göre Görünen Kristal Parçaları */}
              <div style={{ fontSize: '80px', position: 'absolute', top: '20px', left: '20px', opacity: phaseIndex >= 1 ? 1 : 0.2 }}>💎</div>
              <div style={{ fontSize: '80px', position: 'absolute', top: '20px', right: '20px', opacity: phaseIndex >= 2 ? 1 : 0.2 }}>💎</div>
              <div style={{ fontSize: '80px', position: 'absolute', bottom: '20px', left: '20px', opacity: phaseIndex >= 3 ? 1 : 0.2 }}>💎</div>
              <div style={{ fontSize: '80px', position: 'absolute', bottom: '20px', right: '20px', opacity: phaseIndex >= 4 ? 1 : 0.2 }}>💎</div>
            </>
          )}

        </div>

        {/* Görev Başlık Metni */}
        {phaseIndex < 4 && (
          <div style={{
            marginTop: '40px', fontSize: '30px', fontWeight: 'bold', color: currentDetails.color,
            textShadow: '0 5px 15px rgba(0,0,0,0.8)', letterSpacing: '2px'
          }}>
            {currentDetails.title}
          </div>
        )}
      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ (Yanda Bekleyen Çocuk Avatarı) */}
      <div style={{
        position: 'absolute', bottom: '30px', left: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 100
      }}>
        <div style={{
          width: '120px', height: '120px', backgroundColor: '#FFF', borderRadius: '50%',
          border: `4px solid ${currentDetails.color}`, display: 'flex', justifyContent: 'center',
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.8)', transition: 'border 0.5s'
        }}>
          👦🏻
        </div>
        
        {/* Karakterin Konuşma Balonu */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '300px', textAlign: 'center'
          }}>
            💬 {
              phaseIndex === 0 ? 'Önce derin bir nefes...' :
              phaseIndex === 1 ? 'Şimdi nefesini tut (Sessiz)...' :
              phaseIndex === 2 ? 'Dudaklarını büz ve uzun nefes ver...' :
              phaseIndex === 3 ? 'Tüm gücünle tek seferde üfle!' :
              'MUHTEŞEM! GERÇEK BİR NEFES KAHRAMANISIN!'
            }
          </div>
        )}
      </div>

      {/* CSS Efektleri */}
      <style>
        {`
          @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
          @keyframes glowPulse { 0% { filter: drop-shadow(0px 0px 50px #E040FB); } 100% { filter: drop-shadow(0px 0px 150px #E040FB) brightness(1.5); } }
        `}
      </style>
    </div>
  );
};

const btnStyle = { 
  padding: '12px 24px', fontSize: '18px', border: 'none', 
  borderRadius: '12px', cursor: 'pointer', fontWeight: '900', width: '100%',
  textTransform: 'uppercase', boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
};

export default FinalAdventureGame;