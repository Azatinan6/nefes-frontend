import React, { useState, useEffect, useRef } from 'react';
import useBreathSensor from '../components/useBreathSensor';
import axios from 'axios';

const SailboatGame = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();
  
  // Oyun ve Fizyolojik Durumlar
  const [boatPosition, setBoatPosition] = useState(0); // 0 (Başlangıç) ile 100 (Liman) arası
  const [waveIntensity, setWaveIntensity] = useState(0); // Sert üflemeye bağlı dalga/sarsıntı
  const [score, setScore] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dbPercentage, setDbPercentage] = useState(0);
  const [laps, setLaps] = useState(0); // Kaç kez limana ulaştı

  const blowIntensityRef = useRef(0);
  const lastBreathTime = useRef(Date.now());
  const warningGiven = useRef(false);

  // Referansları ve Desibel Yüzdesini güncel tutma
  useEffect(() => {
    blowIntensityRef.current = blowIntensity;
    
    // Üfleme (Ekspirasyon) olduğu için mikrofon daha yüksek ses alır. Duyarlılık azaltıldı (Bölen 150)
    const currentDb = Math.min(Math.round((blowIntensity / 150) * 100), 100);
    setDbPercentage(currentDb);

    if (currentDb > 5) {
      lastBreathTime.current = Date.now();
      warningGiven.current = false;
    }
  }, [blowIntensity]);

  // Sesli Yönlendirme (Dudak büzme ve kontrollü uzun nefes odaklı)
  const playAudioPrompt = (type) => {
    if (!warningGiven.current && !gameOver && isListening) {
      let message = "";
      if (type === 'start') {
        message = "Dudaklarını büz ve yelkenliyi yüzdürmek için uzun, yumuşak bir rüzgar gönder.";
      } else if (type === 'encourage') {
        message = "Harika! Uzun uzun üflemeye devam et, limana çok az kaldı.";
      } else if (type === 'calm_down') {
        message = "Çok güçlü bir rüzgar çıktı, gemi sallanıyor! Biraz daha yumuşak üfleyelim.";
      } else if (type === 'success') {
        message = "Süper! Yelkenli limana ulaştı, sen gerçek bir kaptansın.";
      }

      const speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'tr-TR';
      speech.rate = 1.0;
      speech.pitch = 1.2;
      window.speechSynthesis.speak(speech);
      warningGiven.current = true;
      
      setTimeout(() => { warningGiven.current = false; }, 6500);
    }
  };

  useEffect(() => {
    if (isListening) playAudioPrompt('start');
  }, [isListening]);

  // HATA DÜZELTMESİ (Component unmount olunca sesi kes)
  useEffect(() => {
    return () => {
      warningGiven.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  // Endurans Motoru (Yelkenli İlerletme)
  useEffect(() => {
    let gameLoop;
    
    if (isListening && !gameOver) {
      gameLoop = setInterval(() => {
        const currentDb = Math.min(Math.round((blowIntensityRef.current / 150) * 100), 100);

        setBoatPosition((prev) => {
          let newPosition = prev;
          
          // İDEAL UZUN ÜFLEME (%15 - %60 Arası Kontrollü Nefes Verme)
          if (currentDb >= 15 && currentDb <= 60) {
            newPosition += 0.4; // Yaklaşık 25 saniyelik sürekli üflemede 100'e ulaşır (Dayanıklılık)
            setWaveIntensity((w) => Math.max(w - 5, 0)); // Dalgalar sakinleşir
          } 
          // ÇOK SERT/HIZLI ÜFLEYİŞ (Gemi sallanır, ilerleme yavaşlar)
          else if (currentDb > 60) {
            newPosition += 0.1; // İlerleme cezası (Durmaz ama çok yavaşlar)
            setWaveIntensity(10); // Gemi şiddetle sallanır
            playAudioPrompt('calm_down');
          }
          // NEFES YOK (Rüzgar durur, gemi çok yavaş geriler veya durur)
          else {
            newPosition = Math.max(prev - 0.1, 0);
            setWaveIntensity((w) => Math.max(w - 2, 0));
          }

          // LİMANA ULAŞMA (Tamamlama)
          if (newPosition >= 100) {
            setScore((s) => {
              const newScore = s + 100;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
            setLaps((l) => l + 1);
            playAudioPrompt('success');
            return 0; // Gemiyi başa al, yeni tur başlasın
          }

          // Puanlama: İdeal aralıkta kaldıkça puan artar
          if (currentDb >= 15 && currentDb <= 60) {
            setScore((s) => {
              const newScore = s + 1;
              setCrystals(Math.floor(newScore / 200));
              return newScore;
            });
          }

          return newPosition;
        });

        // 5 Saniye boyunca üfleme yoksa teşvik edici prompt ver
        if (Date.now() - lastBreathTime.current > 5000) {
          playAudioPrompt('encourage');
        }

      }, 100); 
    }

    return () => clearInterval(gameLoop);
  }, [isListening, gameOver]);

  const handleFinishGame = async () => {
    stopListening();
    setGameOver(true);
    
    // HATA DÜZELTMESİ (Konuşmayı kesin keser)
    warningGiven.current = true;
    window.speechSynthesis.cancel();

    const progressData = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      gameId: 5, // 5. Hafta Oyunu
      score: score,
      breathCrystals: crystals,
      dbPerformance: dbPercentage
    };

    try {
      await axios.post('http://localhost:8080/api/progress/save', progressData);
      alert(`Harika! ${crystals} Nefes Kristali Kazandın! 💎`);
    } catch (error) {
      console.error("Skor kaydedilirken hata:", error);
      alert(`5. Bölüm Tamamlandı! Kazanılan Kristal: ${crystals} 💎`);
    }
  };

  // Yüksek Kontrast Teması (Açık Deniz)
  const themeColors = { 
    bg: '#01579B', // Derin Deniz Mavisi
    text: '#FFFFFF', // Beyaz
    card: '#0277BD', 
    border: '#FFCA28', // Güneş Sarısı
    accent: '#00E5FF' // Su Mavisi
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 70px)',
      backgroundColor: themeColors.bg, overflow: 'hidden', fontFamily: 'sans-serif',
      color: themeColors.text
    }}>
      
      {/* Dalga Efekti (Arka Plan CSS) */}
      <style>
        {`
          @keyframes bobbing {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes shaking {
            0% { transform: translateY(0px) rotate(-10deg); }
            25% { transform: translateY(-15px) rotate(15deg); }
            50% { transform: translateY(10px) rotate(-15deg); }
            75% { transform: translateY(-5px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(-10deg); }
          }
        `}
      </style>

      {/* 1. ÜST PANEL: Yüksek Kontrastlı Bilgi Kartı */}
      <div style={{
        position: 'absolute', top: '20px', right: '30px', left: '30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100
      }}>
        
        {/* Desibel Performans Göstergesi (Uzun Üfleme Hassasiyeti) */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 25px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.border }}>🎙️ Rüzgar Gücü</h3>
          <div style={{ width: '200px', height: '20px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            
            {/* İdeal Uzun Üfleme Aralığı (%15 - %60) */}
            <div style={{ position: 'absolute', left: '15%', width: '45%', height: '100%', backgroundColor: 'rgba(0, 229, 255, 0.4)', zIndex: 1 }} />
            
            <div style={{ 
              width: `${dbPercentage}%`, height: '100%', 
              backgroundColor: dbPercentage > 60 ? '#FF1744' : themeColors.accent, 
              transition: 'width 0.1s linear', zIndex: 2, position: 'relative'
            }} />
          </div>
          <span style={{ marginTop: '5px', fontWeight: 'bold', color: '#FFF' }}>%{dbPercentage}</span>
        </div>

        {/* Skor ve Kristal */}
        <div style={{
          backgroundColor: themeColors.card, padding: '15px 30px', borderRadius: '16px',
          border: `3px solid ${themeColors.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: themeColors.border }}>⛵ 5. Bölüm: Rüzgar Gölü</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#FFF' }}>
            Liman Seferi: {laps} | Skor: {score} | 💎 Kristal: {crystals}
          </div>
          
          {!isListening ? (
            <button onClick={startListening} style={{...btnStyle, backgroundColor: themeColors.border, color: '#000', marginTop: '15px'}}>▶️ BAŞLA</button>
          ) : (
            <button onClick={handleFinishGame} style={{...btnStyle, backgroundColor: '#FF1744', color: '#FFF', marginTop: '15px'}}>⏹️ BİTİR</button>
          )}
        </div>
      </div>

      {/* 2. OYUN ALANI: Deniz, Yelkenli ve Liman */}
      <div style={{
        position: 'absolute', bottom: '15%', width: '100%', height: '40%',
        display: 'flex', alignItems: 'flex-end', borderBottom: '20px solid #0288D1' // Deniz yüzeyi
      }}>
        
        {/* Hedef Liman (Sağ Kenar) */}
        <div style={{
          position: 'absolute', right: '0', bottom: '-20px', width: '15%', height: '100px',
          backgroundColor: '#795548', borderRadius: '20px 0 0 0', border: '5px solid #5D4037',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '10px',
          fontSize: '40px', zIndex: 0
        }}>
          🏝️
        </div>

        {/* Yelkenli Gemi */}
        <div style={{
          position: 'absolute',
          left: `${boatPosition * 0.8}%`, // Ekranda %80'lik alanda hareket eder, limana yanaşır
          bottom: '0px',
          fontSize: '120px',
          zIndex: 10,
          // Dalga yoğunluğuna göre animasyon değişir
          animation: waveIntensity > 0 ? 'shaking 0.5s infinite' : 'bobbing 3s ease-in-out infinite',
          transition: 'left 0.1s linear',
          filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'
        }}>
          ⛵
        </div>

        {/* Çok Hızlı Üfleme Uyarı Görseli (Dalgalar) */}
        {waveIntensity > 0 && (
          <div style={{
            position: 'absolute', left: `${(boatPosition * 0.8) + 5}%`, bottom: '-10px',
            fontSize: '60px', zIndex: 11, animation: 'bobbing 0.5s infinite alternate'
          }}>
            🌊🌊
          </div>
        )}

      </div>

      {/* Rüzgar Efektleri (Çocuk üfledikçe çıkan rüzgar ikonları) */}
      {isListening && dbPercentage >= 15 && (
        <div style={{
          position: 'absolute', left: `${(boatPosition * 0.8) - 10}%`, bottom: '25%',
          fontSize: '50px', opacity: 0.6, transform: 'scaleX(-1)' // Rüzgar gemiye doğru eser
        }}>
          💨
        </div>
      )}

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
              waveIntensity > 0 ? 'Gemi sallanıyor, yumuşak üfle!' : 
              boatPosition > 80 ? 'Limana çok az kaldı!' : 
              'Dudaklarını büz ve uzun üfle...'
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

export default SailboatGame;