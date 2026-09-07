import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';

const PhysiotherapistPanel = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [aiReport, setAiReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientProgress, setPatientProgress] = useState([]);

  // Modal stateleri 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    password: '', 
    diagnosisType: 'SPASTIK',
    gmfcsLevel: 1,
    dateOfBirth: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [addError, setAddError] = useState('');

  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const token = localStorage.getItem('nefes_token');
      const response = await api.get('/fizyo/my-patients', {
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

  const generateClinicalReport = async () => {
    if (!selectedPatient) return;
    setIsLoading(true);
    setError(null);
    setAiReport('');

    const requestData = {
        patientName: selectedPatient.fullName,
        age: selectedPatient.dateOfBirth ? Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000)) : '—',
        cpType: selectedPatient.diagnosisType || 'Belirtilmemiş',
        gmfcsLevel: `Seviye ${selectedPatient.gmfcsLevel}`
    };

    try {
        const response = await api.post('/ai/generate-clinical-report', requestData, { timeout: 30000 });
        setAiReport(response.data);
    } catch (err) {
        console.error("Klinik AI API Hatası:", err);
        setError("Yapay zeka raporu oluşturulamıyor. Lütfen backend sunucusunu kontrol edin.");
    } finally {
        setIsLoading(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setAiReport("");
    setError(null);
    setPatientProgress([]); 
    
    try {
        const response = await api.get(`/progress/user/${patient.id}`);
        setPatientProgress(response.data);
    } catch (err) {
        console.error("Hastanın oyun verileri çekilemedi:", err);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);
    try {
      const token = localStorage.getItem('nefes_token');
      await api.post('/fizyo/add-patient', addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAddSuccess(`Hasta eklendi! Aile, belirlediğiniz şifre (${addForm.password}) ile giriş yapabilir.`);
      fetchPatients();
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess('');
        setAddForm({ fullName: '', email: '', password: '', diagnosisType: 'SPASTIK', gmfcsLevel: 1, dateOfBirth: '' });
      }, 3000);
    } catch (err) {
      setAddError(err.response?.data || 'Kayıt sırasında hata oluştu.');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 75px)', backgroundColor: '#F0F4F8', fontFamily: 'sans-serif' }}>
      
      {/* SOL MENÜ */}
      <div style={{ width: '320px', backgroundColor: '#1A365D', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid #2A4365' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#90CDF4', fontWeight: 'bold' }}>Klinik Panel</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#A0AEC0' }}>Fizyoterapist Veri Merkezi</p>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2A4365' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>Hastalar</span>
          <button onClick={() => setIsAddModalOpen(true)} style={{ background: '#3182CE', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            ➕ Yeni Ekle
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {patientsLoading && <div style={{ padding: '20px', color: '#A0AEC0', textAlign: 'center' }}>⏳ Yükleniyor...</div>}
          {patients.map(patient => (
            <div 
              key={patient.id} onClick={() => handlePatientSelect(patient)}
              style={{
                padding: '18px 20px', cursor: 'pointer',
                borderLeft: selectedPatient?.id === patient.id ? '5px solid #4299E1' : '5px solid transparent',
                backgroundColor: selectedPatient?.id === patient.id ? '#2A4365' : 'transparent',
                borderBottom: '1px solid #2A4365'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '17px' }}>{patient.fullName}</div>
              <div style={{ fontSize: '12px', color: '#A0AEC0', marginTop: '6px' }}>{patient.diagnosisType} | GMFCS {patient.gmfcsLevel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SAĞ İÇERİK */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {!selectedPatient ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A0AEC0', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px' }}>👈</span>
            <p>Sol menüden bir hasta seçin veya yeni hasta ekleyin</p>
          </div>
        ) : (
          <>
            {/* 1. HASTA BİLGİLERİ BAŞLIĞI */}
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 10px 0', color: '#2D3748', fontSize: '34px', fontWeight: '900' }}>{selectedPatient.fullName}</h1>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span style={badgeStyle('#FEFCBF', '#B7791F')}>{selectedPatient.diagnosisType}</span>
                <span style={badgeStyle('#F0FFF4', '#2F855A')}>GMFCS Seviye {selectedPatient.gmfcsLevel}</span>
              </div>
            </div>

            {/* 2. OYUN VE SKOR GEÇMİŞİ */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2D3748' }}>🎮 Oyun ve Gelişim Tablosu</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                
                {patientProgress.length === 0 ? (
                    <div style={{ color: '#A0AEC0', padding: '10px 0', gridColumn: '1 / -1' }}>Bu hastanın henüz oyun verisi bulunmuyor.</div>
                ) : (
                    patientProgress.map((prog, index) => (
                    <div key={index} style={{ padding: '15px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F7FAFC' }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '5px' }}>Oyun ID: {prog.gameId}</div>
                        <div style={{ fontWeight: 'bold', color: '#2B6CB0', marginBottom: '10px' }}>Skor: {prog.score} Puan</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ background: '#F0FFF4', color: '#2F855A', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            💎 {prog.breathCrystals || 0} Kristal
                        </span>
                        </div>
                    </div>
                    ))
                )}

              </div>
            </div>

            {/* 3. YAPAY ZEKA KLİNİK RAPORU */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', borderTop: '5px solid #2B6CB0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#2D3748' }}>🧠 N.E.F.E.S. AL Klinik Asistanı</h3>
                <button onClick={generateClinicalReport} style={isLoading ? disabledBtnStyle : primaryBtnStyle} disabled={isLoading}>
                  {isLoading ? 'Analiz Ediliyor...' : '✨ Hastayı Analiz Et (AI)'}
                </button>
              </div>
              
              {error && <div style={{ color: '#C53030', backgroundColor: '#FED7D7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>⚠️ {error}</div>}
              
              <div style={{ backgroundColor: '#F7FAFC', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #3182CE', minHeight: '100px' }}>
                {!aiReport && !isLoading && !error && <p style={{ color: '#718096', fontStyle: 'italic' }}>Hastanın tüm oyun verilerini yorumlamak için Analiz Et butonuna tıklayın.</p>}
                {aiReport && !isLoading && (
                  <div style={{ color: '#2D3748', lineHeight: '1.8' }}>
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '450px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#2D3748' }}>Yeni Hasta Ekle</h2>
            {addSuccess && <div style={{ background: '#F0FFF4', color: '#2F855A', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>✅ {addSuccess}</div>}
            
            <form onSubmit={handleAddPatient}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Ad Soyad (Veli veya Çocuk)</label>
                <input required type="text" value={addForm.fullName} onChange={(e) => setAddForm({...addForm, fullName: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>E-posta Adresi (Giriş için)</label>
                <input required type="email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} style={inputStyle} />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Geçici Şifre (Aileye Verilecek)</label>
                <input required type="text" placeholder="Örn: Nefes123" value={addForm.password} onChange={(e) => setAddForm({...addForm, password: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tanı</label>
                  <select value={addForm.diagnosisType} onChange={(e) => setAddForm({...addForm, diagnosisType: e.target.value})} style={inputStyle}>
                    <option value="SPASTIK">Spastik</option>
                    <option value="DISKINETIK">Diskinetik</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>GMFCS</label>
                  <select value={addForm.gmfcsLevel} onChange={(e) => setAddForm({...addForm, gmfcsLevel: parseInt(e.target.value)})} style={inputStyle}>
                    <option value={1}>Seviye 1</option>
                    <option value={2}>Seviye 2</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#3182CE', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Kaydet ve Yetkilendir
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Stiller
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4A5568', marginBottom: '5px' };
const badgeStyle = (bg, color) => ({ backgroundColor: bg, color: color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' });
const primaryBtnStyle = { padding: '10px 20px', fontSize: '15px', backgroundColor: '#3182CE', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const disabledBtnStyle = { ...primaryBtnStyle, backgroundColor: '#90CDF4', cursor: 'not-allowed' };

export default PhysiotherapistPanel;