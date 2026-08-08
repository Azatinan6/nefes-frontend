import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const BalanceGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [progress, setProgress] = useState(0); // 0 (Köprü Başı) ile 100 (Hazine) arası
  const [sway, setSway] = useState(0); // Köprünün sallantı derecesi
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [treasureOpened, setTreasureOpened] = useState(false);

  const blowIntensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);

  // Referansları ve Desibel Yüzdesini güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    
    // Dengeli (Ritmik) solunum hedefleniyor
    const currentDb = Math.min(Math.round((blowIntensity / 60) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 5) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Fonksiyonel Entegrasyon ve Ritim odaklı)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Macera köprüsüne hoş geldin! Karşıya geçmek ve hazineye ulaşmak için dengeli ve ritmik nefes al.";
      } else if (type === 'encourage') {
        message = "Harika adımlar! Nefesini kontrol etmeye devam et.";
      } else if (type === 'swaying') {
        message = "Köprü biraz sallanıyor. Dik dur ve nefesini sakinleştir.";
      } else if (type === 'success') {
        message = "İnanılmaz! Köprüyü geçtin ve hazineyi buldun.";
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

  useEffect(() => {
    if (isListening) playAudioPrompt('start');
  }, [isListening]);

  // Entegrasyon Motoru (Köprü Geçişi ve Denge)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver && !treasureOpened) {
      gameLoop = setInterval(() => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 60) * 100), 100);

        setProgress((prev) => {
          let newProgress = prev;
          
          // İDEAL RİTMİK NEFES (%15 - %40 Arası) -> Karakter yürür, köprü sabittir
          if (currentDb >= 15 && currentDb <= 40) {
            newProgress += 0.3; // Yaklaşık 30 saniyelik kontrollü bir parkur
            setSway((s) => Math.max(s - 2, 0)); // Sallantı azalır
          } 
          // ÇOK GÜÇLÜ/PANİK NEFESİ (> %40) -> Köprü şiddetle sallanır, yürüme durur
          else if (currentDb > 40) {
            setSway((s) => Math.min(s + 5, 20)); // Maksimum sallantı 20
            playAudioPrompt('swaying');
          }
          // NEFES YOK -> Karakter durur
          else {
            setSway((s) => Math.max(s - 1, 0));
          }

          if (newProgress >= 100) {
            setTreasureOpened(true);
            setScore((s) => {
              const newScore = s + 100;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
            playAudioPrompt('success');
            
            // 5 Saniye sonra yeni tura hazırla
            setTimeout(() => {
              setTreasureOpened(false);
              setProgress(0);
            }, 5000);
            
            return 100;
          }

          // Düzenli ilerleme puanı
          if (currentDb >= 15 && currentDb <= 40) {
            setScore((s) => s + 1);
          }

          return newProgress;
        });

        // Uzun süre hareketsiz kalırsa motive et
        if (Date.now() - lastBreathTime.current > 5000) {
          playAudioPrompt('encourage');
        }

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver, treasureOpened]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 7, // 7. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`7. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Yüksek Kontrast Teması (Vahşi Orman ve Ahşap Köprü)
  const themeColors = { 
    bg: '#1B5E20', // Koyu Orman Yeşili
    text: '#FFFFFF', // Beyaz
    card: '#2E7D32', 
    border: '#FFB300', // Hazine Sarısı/Altın
    bridge: '#5D4037' // Ahşap Kahverengi
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      
      {/* CSS Animasyonları */}
      <style>
        {`
          @keyframes walk {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes openChest {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.2); filter: brightness(1.5); }
            100% { transform: scale(1.1); filter: brightness(1.2); }
          }
        `}
      </style>

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Desibel Performans Göstergesi (Denge Hassasiyeti) */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.border }}>🎙️ Denge Ritmi</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Ritmik Nefes Aralığı (%15 - %40) */}
            <div style={{ position: 'absolute', left: '15%', width: '25%', height: '100%', backgroundColor: 'rgba(255, 179, 0, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 40 ? '#FF1744' : '#FFB300', // Panik nefesinde kırmızı
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>🌉 7. Bölüm: Macera Köprüsü</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#FFF' }}>
            İlerleme: %{Math.floor(progress)} | Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: themeColors.border, color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#D50000', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Asma Köprü, Karakter ve Hazine */}
      <div style={{
        position: 'absolute', top: '50%', width: '100%', height: '200px',
        display: 'flex', alignItems: 'center', transform: 'translateY(-50%)'
      }}>
        
        {/* Asma Köprü */}
        <div style={{
          position: 'absolute', left: '10%', right: '10%', height: '40px',
          backgroundColor: themeColors.bridge, borderRadius: '10px',
          borderBottom: '15px dashed #3E2723', // Köprü tahtaları
          transform: `rotate(${Math.sin(Date.now() / 100) * sway}deg)`, // Sallantı mekaniği
          transition: 'transform 0.1s ease',
          boxShadow: '0 20px 30px rgba(0,0,0,0.5)',
          zIndex: 5
        }} />

        {/* Başlangıç Platformu */}
        <div style={{
          position: 'absolute', left: '-5%', width: '15%', height: '150px',
          backgroundColor: '#4E342E', borderRadius: '20px', zIndex: 4
        }} />

        {/* Bitiş Platformu ve Hazine */}
        <div style={{
          position: 'absolute', right: '-5%', width: '15%', height: '150px',
          backgroundColor: '#4E342E', borderRadius: '20px', zIndex: 4,
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
        }}>
          <div style={{ 
            fontSize: '80px', marginTop: '-60px', zIndex: 10,
            animation: treasureOpened ? 'openChest 1s forwards' : 'none',
            filter: treasureOpened ? 'drop-shadow(0px 0px 30px #FFEA00)' : 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'
          }}>
            {treasureOpened ? '💎' : '🧰'}
          </div>
        </div>

        {/* Yürüyen Çocuk Karakteri */}
        <div style={{
          position: 'absolute',
          left: `calc(10% + ${progress * 0.75}%)`, // Köprü üzerinde %10 ile %85 arası hareket
          bottom: '20px', // Köprünün üstünde durur
          fontSize: '100px',
          zIndex: 10,
          // Karakter ilerlerken yürüme animasyonu, dururken sabit
          animation: (dbPercentage >= 15 && dbPercentage <= 40) ? 'walk 0.5s infinite alternate' : 'none',
          transition: 'left 0.2s linear',
          filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'
        }}>
          🏃🏻
        </div>

      </div>

      {/* 3. AI EĞİTMEN KARAKTERİ (Yanda Bekleyen Çocuk Avatarı) */}
      <div style={{
        position: 'absolute', bottom: '30px', left: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 100
      }}>
        <div style={{
          width: '120px', height: '120px', backgroundColor: '#FFF', borderRadius: '50%',
          border: `4px solid ${themeColors.border}`, display: 'flex', justifyContent: 'center',
          alignItems: 'center', fontSize: '60px', boxShadow: '0 10px 20px rgba(0,0,0,0.8)',
        }}>
          👦🏻
        </div>
        
        {/* Karakterin Konuşma Balonu */}
        {isListening && (
          <div style={{
            marginTop: '15px', backgroundColor: '#FFF', color: '#000', padding: '10px 20px',
            borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            maxWidth: '250px', textAlign: 'center'
          }}>
            💬 {
              treasureOpened ? 'Muazzam bir denge, tebrikler!' :
              sway > 5 ? 'Köprü sallanıyor, dik dur ve sakinleş!' : 
              'Ritmik nefes almaya devam et...'
            }
          </div>
        )}
      </div>

    </div>
  );
};

const btnStyle = { 
  padding: '12px 24px', fontSize: '18px', border: 'none', 
  borderRadius: '12px', cursor: 'pointer', fontWeight: '900', width: '100%',
  textTransform: 'uppercase', boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
};

export default BalanceGame;