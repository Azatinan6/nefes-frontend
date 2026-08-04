import React from 'react';
import useBreathSensor from '../components/useBreathSensor';

const BreathTest = () => {
  const { blowIntensity, isListening, startListening, stopListening } = useBreathSensor();

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>🌬️ Üfleme Testi Ekranı</h2>
      <p>Mikrofona üfleyerek şiddeti test edebilirsiniz.</p>

      {/* Kontrol Butonları */}
      <div style={{ marginBottom: '30px' }}>
        {!isListening ? (
          <button 
            onClick={startListening}
            style={{ padding: '10px 20px', fontSize: '18px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Mikrofonu Aç ve Başla
          </button>
        ) : (
          <button 
            onClick={stopListening}
            style={{ padding: '10px 20px', fontSize: '18px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Durdur
          </button>
        )}
      </div>

      {/* Görsel Geri Bildirim (Bar) */}
      <div style={{ 
        width: '300px', 
        height: '40px', 
        backgroundColor: '#e0e0e0', 
        margin: '0 auto', 
        borderRadius: '20px', 
        overflow: 'hidden',
        border: '2px solid #ccc'
      }}>
        <div style={{
          height: '100%',
          width: `${blowIntensity}%`,
          backgroundColor: blowIntensity > 60 ? '#ffeb3b' : blowIntensity > 30 ? '#2196F3' : '#4CAF50',
          transition: 'width 0.1s ease-out, background-color 0.3s'
        }} />
      </div>
      
      <h3 style={{ marginTop: '20px' }}>Üfleme Şiddeti: {blowIntensity} %</h3>
    </div>
  );
};

export default BreathTest;