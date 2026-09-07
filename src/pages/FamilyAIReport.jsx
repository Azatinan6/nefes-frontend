import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FamilyPanel = () => {
  const [userData, setUserData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoading(true);
      try {
        // 1. Kullanıcı bilgilerini LocalStorage'dan al
        const storedUser = localStorage.getItem('nefes_user');
        let userId = null;

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          // KRİTİK DÜZELTME: localStorage'daki JSON verisinde id yerine userId bulunuyor!
          userId = parsedUser.userId || parsedUser.id; 
        }

        if (!userId) {
          setError("Kullanıcı kimliği bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.");
          setIsLoading(false);
          return;
        }

        // 2. Senin ProgressController'daki mevcut endpoint'ine ID ile istek atıyoruz
        const response = await api.get(`/progress/user/${userId}`); 
        
        // Sadece son 5 oyunu al ve en yeni en üstte olacak şekilde tersine çevir
        const allGames = response.data || [];
        const last5Games = allGames.slice(-5).reverse(); 
        
        setProgressData(last5Games);
      } catch (err) {
        console.error("Veriler alınamadı:", err);
        setError("Oyun verileri yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, []);

  // Gerçek Yapay Zeka Raporunu Çeken Fonksiyon
  const generateFamilyInsight = async () => {
    setAiLoading(true);
    setAiInsight("");
    try {
      // 1. Kullanıcının kimliğini al
      const currentUserId = userData.userId || userData.id;

      // 2. URL'yi senin yazdığın "/generate-report" ile değiştirdik
      // 3. Gönderilen veriyi senin ReportRequest (userId) sınıfına eşitledik
      const res = await api.post('/ai/generate-report', { 
        userId: currentUserId 
      });
      
      setAiInsight(res.data);
    } catch (err) {
      console.error("AI API Hatası:", err);
      setAiInsight("Şu anda yapay zeka asistanına ulaşılamıyor. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#4A5568', fontWeight: '600', marginTop: '15px' }}>Gerçek Oyun Verileri Yüklüyor...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        
        {/* Karşılama Alanı */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Hoş Geldiniz, {userData ? userData.fullName : 'Değerli Ailemiz'} 👋</h1>
            <p style={styles.subtitle}>Çocuğunuzun N.E.F.E.S. gelişim tablosu ve yapay zeka analizi aşağıdadır.</p>
          </div>
          <button style={styles.actionButton}>🎮 Oyuna Başla</button>
        </div>

        {/* N.E.F.E.S. AI Gelişim Asistanı */}
        <div style={styles.aiCard}>
          <div style={styles.aiHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={styles.aiIcon}>✨</span>
              <h2 style={styles.aiTitle}>N.E.F.E.S. AI Gelişim Asistanı</h2>
            </div>
            <button 
              onClick={generateFamilyInsight} 
              disabled={aiLoading || progressData.length === 0}
              style={aiLoading ? styles.aiButtonDisabled : styles.aiButton}
            >
              {aiLoading ? 'Analiz Ediliyor...' : 'Yapay Zekaya Sor'}
            </button>
          </div>
          
          <div style={styles.aiContentBox}>
            {!aiInsight && !aiLoading && <p style={{ color: '#A0AEC0', fontStyle: 'italic', margin: 0 }}>Çocuğunuzun son oyun verilerini yapay zekaya yorumlatmak için butona tıklayın.</p>}
            {aiInsight && <p style={styles.aiText}>{aiInsight}</p>}
          </div>
        </div>

        {/* Son Oyunlar ve Puanlar (Modern Tablo Görünümü) */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={styles.sectionTitle}>🏆 Son 5 Oyunun Özeti</h3>
          
          {error && <div style={styles.errorBox}>{error}</div>}
          
          <div style={styles.tableContainer}>
            {/* Tablo Başlıkları */}
            <div style={styles.tableHeader}>
              <div style={{ flex: 2 }}>OYUN (ID)</div>
              <div style={{ flex: 1, textAlign: 'center' }}>SKOR</div>
              <div style={{ flex: 1, textAlign: 'right' }}>KAZANILAN KRİSTAL</div>
            </div>

            {/* Tablo Satırları */}
            {progressData.length === 0 && !error ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
                Henüz oynanmış bir oyun bulunmuyor.
              </div>
            ) : (
              progressData.map((game, index) => (
                <div key={index} style={styles.tableRow}>
                  <div style={{ flex: 2, fontWeight: '700', color: '#2D3748' }}>
                    Oyun: {game.game?.name || 'Bilinmiyor'}
                   </div>
                  <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', color: '#3182CE', fontSize: '18px' }}>
                    {game.score}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <span style={styles.crystalBadge}>
                      💎 +{game.breathCrystals || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// --- YENİ NESİL STİLLER (iOS & Frosted Glass Temalı Tablo) ---
const styles = {
  pageBackground: {
    minHeight: 'calc(100vh - 75px)',
    background: 'linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 100%)',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: { maxWidth: '1000px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F0F4F8' },
  spinner: { width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid #3182CE', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  title: { fontSize: '32px', fontWeight: '900', color: '#2D3748', margin: '0 0 5px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '16px', color: '#718096', margin: 0 },
  actionButton: { background: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(49, 130, 206, 0.3)' },
  
  aiCard: { background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.8)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' },
  aiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  aiIcon: { fontSize: '28px' },
  aiTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#2D3748' },
  aiButton: { background: '#805AD5', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  aiButtonDisabled: { background: '#D6BCFA', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed' },
  aiContentBox: { background: '#F7FAFC', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #805AD5' },
  aiText: { margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#4A5568', fontWeight: '500' },
  
  sectionTitle: { fontSize: '22px', fontWeight: '800', color: '#2D3748', marginBottom: '20px' },
  errorBox: { background: '#FED7D7', color: '#C53030', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' },
  
  // Tablo Stilleri (Satır Satır Modern Görünüm)
  tableContainer: { background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)', border: '1px solid #EDF2F7', overflow: 'hidden' },
  tableHeader: { display: 'flex', background: '#F7FAFC', padding: '15px 20px', fontSize: '12px', fontWeight: '800', color: '#A0AEC0', letterSpacing: '1px', borderBottom: '1px solid #EDF2F7' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid #EDF2F7', transition: 'background 0.2s', ':hover': { background: '#F7FAFC' } },
  crystalBadge: { background: '#F0FFF4', color: '#2F855A', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' },
};

export default FamilyPanel;