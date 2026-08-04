import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PhysiotherapistPanel = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [aiReport, setAiReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal stateleri
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    diagnosisType: 'SPASTIK',
    gmfcsLevel: 1,
    dateOfBirth: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [addError, setAddError] = useState('');

  // Hastaları çekme fonksiyonu
  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const token = localStorage.getItem('nefes_token');
      const response = await axios.get('http://localhost:8080/api/fizyo/my-patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
      if (response.data.length > 0 && !selectedPatient) {
        setSelectedPatient(response.data[0]);
      }
    } catch (err) {
      console.error('Hasta listesi alınamadı:', err);
      setPatientsError('Hasta listesi yüklenirken hata oluştu.');
    } finally {
      setPatientsLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // GERÇEK YAPAY ZEKA API İSTEĞİ
  const generateClinicalReport = async () => {
    if (!selectedPatient) return;
    setIsLoading(true);
    setError(null);
    setAiReport('');

    const requestData = {
        patientName: selectedPatient.fullName,
        age: selectedPatient.dateOfBirth
          ? Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
          : '—',
        cpType: selectedPatient.diagnosisType || 'Belirtilmemiş',
        gmfcsLevel: `Seviye ${selectedPatient.gmfcsLevel}`,
        compliance: '—',
        avgDb: '—',
        lastModule: '—',
        totalTime: '—'
    };

    try {
        const response = await axios.post('http://localhost:8080/api/ai/generate-clinical-report', requestData);
        setAiReport(response.data);
    } catch (err) {
        console.error("Klinik AI API Hatası:", err);
        setError("Yapay zeka sunucusuna ulaşılamıyor. Lütfen Spring Boot backend sisteminin çalıştığından emin olun.");
    } finally {
        setIsLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setAiReport("");
    setError(null);
  };

  // Yeni Hasta Ekleme
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);
    try {
      const token = localStorage.getItem('nefes_token');
      const response = await axios.post('http://localhost:8080/api/fizyo/add-patient', addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddSuccess(`Hasta eklendi! Şifre (Aileye mail atıldı): ${response.data.generatedPassword}`);
      fetchPatients();
      
      // Formu temizle ve 4 saniye sonra modalı kapat
      setAddForm({ fullName: '', email: '', diagnosisType: 'SPASTIK', gmfcsLevel: 1, dateOfBirth: '' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess('');
      }, 4000);
    } catch (err) {
      setAddError(err.response?.data || 'Kayıt sırasında hata oluştu.');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 75px)', backgroundColor: '#F0F4F8', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* SOL MENÜ */}
      <div style={{ width: '320px', backgroundColor: '#1A365D', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid #2A4365' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#90CDF4', fontWeight: 'bold' }}>Klinik Panel</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#A0AEC0' }}>Fizyoterapist Veri Merkezi</p>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2A4365' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Hastalar
          </span>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: '#3182CE', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            ➕ Yeni Ekle
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {patientsLoading && <div style={{ padding: '20px', color: '#A0AEC0', textAlign: 'center' }}>⏳ Yükleniyor...</div>}
          {patientsError && <div style={{ padding: '20px', color: '#FC8181', fontSize: '13px' }}>⚠️ {patientsError}</div>}
          {!patientsLoading && !patientsError && patients.length === 0 && (
            <div style={{ padding: '20px', color: '#A0AEC0', fontSize: '13px', textAlign: 'center' }}>
              Henüz hiç hastanız yok. "Yeni Ekle" ile hasta ekleyin.
            </div>
          )}
          {patients.map(patient => (
            <div 
              key={patient.id}
              onClick={() => handlePatientSelect(patient)}
              style={{
                padding: '18px 20px', cursor: 'pointer',
                borderLeft: selectedPatient?.id === patient.id ? '5px solid #4299E1' : '5px solid transparent',
                backgroundColor: selectedPatient?.id === patient.id ? '#2A4365' : 'transparent',
                transition: 'all 0.2s ease', borderBottom: '1px solid #2A4365'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '17px', display: 'flex', justifyContent: 'space-between' }}>
                {patient.fullName}
                <span style={{ fontSize: '11px', color: '#90CDF4', background: 'rgba(66,153,225,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                  Aile
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#A0AEC0', marginTop: '6px' }}>
                {patient.diagnosisType || 'Tanı girilmemiş'} | GMFCS {patient.gmfcsLevel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAĞ İÇERİK */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {!selectedPatient ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A0AEC0', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>👈</span>
            <p style={{ fontSize: '18px' }}>Sol menüden bir hasta seçin veya yeni hasta ekleyin</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 style={{ margin: '0 0 15px 0', color: '#2D3748', fontSize: '34px', fontWeight: '900' }}>{selectedPatient.fullName}</h1>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <span style={badgeStyle('#EBF4FF', '#2B6CB0')}>
                    {selectedPatient.dateOfBirth
                      ? `Yaş: ${Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))}`
                      : 'Yaş girilmemiş'}
                  </span>
                  <span style={badgeStyle('#FEFCBF', '#B7791F')}>{selectedPatient.diagnosisType || 'Tanı yok'}</span>
                  <span style={badgeStyle('#F0FFF4', '#2F855A')}>GMFCS Seviye {selectedPatient.gmfcsLevel}</span>
                  <span style={badgeStyle('#FAF5FF', '#6B46C1')}>{selectedPatient.email}</span>
                </div>
              </div>
              <button style={{ backgroundColor: '#2B6CB0', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                📄 Medikal PDF İndir
              </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', borderTop: '5px solid #2B6CB0' }}>
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
              {error && <div style={{ color: '#C53030', backgroundColor: '#FED7D7', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>⚠️ {error}</div>}
              <div style={{ backgroundColor: '#F7FAFC', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #3182CE', minHeight: '100px' }}>
                {!aiReport && !isLoading && !error && <p style={{ margin: 0, color: '#718096', fontStyle: 'italic' }}>Hastanın klinik raporunu oluşturmak için yukarıdaki "Hastayı Analiz Et" butonuna tıklayın.</p>}
                {aiReport && !isLoading && (
                  <div style={{ color: '#2D3748', fontSize: '16px', lineHeight: '1.8' }}>
                    {aiReport.split('\n').map((line, index) => <p key={index} style={{ margin: '0 0 10px 0' }}>{line}</p>)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* YENİ HASTA EKLE MODALI */}
      {isAddModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2D3748' }}>Yeni Hasta Ekle</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#A0AEC0' }}>✖</button>
            </div>
            
            {addSuccess && <div style={{ background: '#F0FFF4', color: '#2F855A', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #C6F6D5', fontSize: '14px', fontWeight: 'bold' }}>✅ {addSuccess}</div>}
            {addError && <div style={{ background: '#FFF5F5', color: '#C53030', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #FED7D7', fontSize: '14px' }}>⚠️ {addError}</div>}

            <form onSubmit={handleAddPatient}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '5px' }}>Ad Soyad (Veli veya Çocuk)</label>
                <input required type="text" value={addForm.fullName} onChange={(e) => setAddForm({...addForm, fullName: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '5px' }}>E-posta Adresi (Giriş için)</label>
                <input required type="email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '5px' }}>Tanı</label>
                  <select value={addForm.diagnosisType} onChange={(e) => setAddForm({...addForm, diagnosisType: e.target.value})} style={inputStyle}>
                    <option value="SPASTIK">Spastik</option>
                    <option value="DISKINETIK">Diskinetik</option>
                    <option value="ATAKSIK">Ataksik</option>
                    <option value="KARMA">Karma</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '5px' }}>GMFCS Seviyesi</label>
                  <select value={addForm.gmfcsLevel} onChange={(e) => setAddForm({...addForm, gmfcsLevel: parseInt(e.target.value)})} style={inputStyle}>
                    {[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>Seviye {level}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '5px' }}>Çocuğun Doğum Tarihi</label>
                <input type="date" value={addForm.dateOfBirth} onChange={(e) => setAddForm({...addForm, dateOfBirth: e.target.value})} style={inputStyle} />
              </div>
              <button type="submit" disabled={addLoading} style={{ width: '100%', padding: '12px', background: '#3182CE', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: addLoading ? 'not-allowed' : 'pointer' }}>
                {addLoading ? '⏳ Ekleniyor...' : 'Kayıt Oluştur ve Şifre Gönder'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', boxSizing: 'border-box', fontSize: '14px'
};

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