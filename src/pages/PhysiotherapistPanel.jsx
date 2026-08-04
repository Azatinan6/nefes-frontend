import React, { useState } from 'react';
import axios from 'axios';

const PhysiotherapistPanel = () => {
  // Hastaların Ham Verileri (Sol menüde listelemek için)
  const [patients] = useState([
    { 
      id: 1, 
      name: "Ali Yılmaz", 
      age: 8, 
      cpType: "Spastik SP", 
      gmfcs: "Seviye 2", 
      totalTime: "120 dk", 
      compliance: 85,
      avgDb: 72,
      sessionsCompleted: 8,
      lastModule: "Yelkenli (Kontrollü Ekspirasyon)"
    },
    { 
      id: 2, 
      name: "Zeynep Kaya", 
      age: 10, 
      cpType: "Diskinetik SP", 
      gmfcs: "Seviye 3", 
      totalTime: "90 dk", 
      compliance: 45,
      avgDb: 40,
      sessionsCompleted: 6,
      lastModule: "Çiçek Koklama (Derin İnspirasyon)"
    },
    { 
      id: 3, 
      name: "Burak Demir", 
      age: 12, 
      cpType: "Ataksik SP", 
      gmfcs: "Seviye 2", 
      totalTime: "150 dk", 
      compliance: 92,
      avgDb: 88,
      sessionsCompleted: 10,
      lastModule: "Roket (Patlayıcı Güç / Zirve Ekspirasyon)"
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [aiReport, setAiReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // GERÇEK YAPAY ZEKA API İSTEĞİ (Axios ile)
  const generateClinicalReport = async () => {
    setIsLoading(true);
    setError(null);
    setAiReport('');

    // FRONTEND MOCK VERİ PAKETİ (Sadece hasta verilerini Backend'e yolluyoruz)
    const requestData = {
        patientName: selectedPatient.name,
        age: selectedPatient.age,
        cpType: selectedPatient.cpType,
        gmfcsLevel: selectedPatient.gmfcs,
        compliance: selectedPatient.compliance,
        avgDb: selectedPatient.avgDb,
        lastModule: selectedPatient.lastModule,
        totalTime: selectedPatient.totalTime
    };

    try {
        // Backend (Spring Boot) endpointine istek atılıyor
        const response = await axios.post('http://localhost:8080/api/ai/generate-clinical-report', requestData);
        setAiReport(response.data);
    } catch (err) {
        console.error("Klinik AI API Hatası:", err);
        setError("Yapay zeka sunucusuna ulaşılamıyor. Lütfen Spring Boot backend sisteminin çalıştığından emin olun.");
    } finally {
        setIsLoading(false);
    }
  };

  // Sol menüden yeni hasta seçildiğinde mevcut raporu temizler
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setAiReport("");
    setError(null);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 75px)', backgroundColor: '#F0F4F8', fontFamily: 'sans-serif' }}>
      
      {/* SOL MENÜ (HASTA LİSTESİ) */}
      <div style={{ width: '320px', backgroundColor: '#1A365D', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid #2A4365' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#90CDF4', fontWeight: 'bold' }}>Klinik Panel</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#A0AEC0' }}>Fizyoterapist Veri Merkezi</p>
        </div>
        
        <div style={{ padding: '20px', fontSize: '14px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Hastalar
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {patients.map(patient => (
            <div 
              key={patient.id}
              onClick={() => handlePatientSelect(patient)}
              style={{
                padding: '18px 20px', cursor: 'pointer', borderLeft: selectedPatient.id === patient.id ? '5px solid #4299E1' : '5px solid transparent',
                backgroundColor: selectedPatient.id === patient.id ? '#2A4365' : 'transparent',
                transition: 'all 0.2s ease', borderBottom: '1px solid #2A4365'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '17px', display: 'flex', justifyContent: 'space-between' }}>
                {patient.name}
                <span style={{ fontSize: '12px', color: patient.compliance >= 80 ? '#68D391' : patient.compliance >= 60 ? '#F6AD55' : '#FC8181' }}>
                  %{patient.compliance} Uyum
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#A0AEC0', marginTop: '6px' }}>{patient.cpType} | GMFCS {patient.gmfcs}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SAĞ İÇERİK (DOKTOR EKRANI) */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Üst Başlık ve Hasta Özeti */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: '0 0 15px 0', color: '#2D3748', fontSize: '34px', fontWeight: '900' }}>{selectedPatient.name}</h1>
            <div style={{ display: 'flex', gap: '15px' }}>
              <span style={badgeStyle('#EBF4FF', '#2B6CB0')}>Yaş: {selectedPatient.age}</span>
              <span style={badgeStyle('#FEFCBF', '#B7791F')}>{selectedPatient.cpType}</span>
              <span style={badgeStyle('#F0FFF4', '#2F855A')}>GMFCS {selectedPatient.gmfcs}</span>
            </div>
          </div>
          <button style={{ backgroundColor: '#2B6CB0', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            📄 Medikal PDF İndir
          </button>
        </div>

        {/* Metrik Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <MetricCard title="Tedaviye Uyum" value={`%${selectedPatient.compliance}`} icon="📈" color={selectedPatient.compliance > 70 ? "#38A169" : "#E53E3E"} />
          <MetricCard title="Ortalama Desibel" value={`${selectedPatient.avgDb} dB`} icon="🎙️" color="#D69E2E" />
          <MetricCard title="Toplam Süre" value={selectedPatient.totalTime} icon="⏱️" color="#3182CE" />
          <MetricCard title="Son Modül" value={selectedPatient.lastModule.split(' ')[0]} icon="✅" color="#805AD5" />
        </div>

        {/* YAPAY ZEKA KLİNİK DEĞERLENDİRMESİ */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', marginBottom: '40px', borderTop: '5px solid #2B6CB0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#2D3748', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>🧠</span> N.E.F.E.S. AI Klinik Asistanı
            </h3>
            
            <button 
                onClick={generateClinicalReport} 
                style={isLoading ? disabledBtnStyle : primaryBtnStyle}
                disabled={isLoading}
            >
                {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={spinnerStyle}></div> Analiz Ediliyor...
                    </span>
                ) : '✨ Hastayı Analiz Et (AI)'}
            </button>
          </div>

          {error && (
              <div style={{ color: '#C53030', backgroundColor: '#FED7D7', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
                  ⚠️ {error}
              </div>
          )}
          
          <div style={{ 
            backgroundColor: '#F7FAFC', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #3182CE',
            minHeight: '100px'
          }}>
            {!aiReport && !isLoading && !error && (
              <p style={{ margin: 0, color: '#718096', fontStyle: 'italic' }}>
                Hastanın klinik raporunu oluşturmak için yukarıdaki "Hastayı Analiz Et" butonuna tıklayın.
              </p>
            )}

            {/* Backend'den gelen düz metni paragraf paragraf ayırarak yazdırıyoruz */}
            {aiReport && !isLoading && (
              <div style={{ color: '#2D3748', fontSize: '16px', lineHeight: '1.8' }}>
                {aiReport.split('\n').map((line, index) => (
                    <p key={index} style={{ margin: '0 0 10px 0' }}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Spinner Animasyonu */}
      <style>
        {`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
};

// --- YARDIMCI BİLEŞENLER VE STİLLER ---

const MetricCard = ({ title, value, icon, color }) => (
  <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: `${color}15`, color: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ overflow: 'hidden' }}>
      <div style={{ fontSize: '13px', color: '#718096', fontWeight: 'bold', marginBottom: '5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ fontSize: '26px', color: '#2D3748', fontWeight: '900' }}>{value}</div>
    </div>
  </div>
);

const badgeStyle = (bg, color) => ({
  backgroundColor: bg, color: color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: `1px solid ${color}40`
});

const primaryBtnStyle = {
    padding: '10px 20px', fontSize: '15px', backgroundColor: '#3182CE', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
    transition: 'background 0.3s', boxShadow: '0 4px 10px rgba(49, 130, 206, 0.3)'
};

const disabledBtnStyle = {
    ...primaryBtnStyle, backgroundColor: '#90CDF4', cursor: 'not-allowed', boxShadow: 'none'
};

const spinnerStyle = {
    width: '14px', height: '14px', border: '2px solid white', borderTop: '2px solid transparent', 
    borderRadius: '50%', animation: 'spin 1s linear infinite'
};

export default PhysiotherapistPanel;