import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  // Hangi modal'ın açık olduğunu tutan state
  const [activeModal, setActiveModal] = useState(null); 

  // Modal kapatma fonksiyonu
  const closeModal = () => setActiveModal(null);

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#F4F9F9', color: '#333', minHeight: '100vh', position: 'relative' }}>
      
      {/* CSS Animasyonları */}
      <style>
        {`
          .hover-btn { transition: all 0.3s ease; }
          .hover-btn:hover { transform: translateY(-5px) scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important; }
          .hover-card { transition: all 0.3s ease; }
          .hover-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.15) !important; border-color: #4CAF50 !important; }
          .step-icon { transition: all 0.3s ease; }
          .step-box:hover .step-icon { transform: scale(1.1) rotate(5deg); background-color: #FFCA28 !important; }
          
          /* Modal Giriş Animasyonu */
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .modal-content { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        `}
      </style>

      {/* KAHRAMAN (HERO) BÖLÜMÜ */}
      <header style={{ 
        background: 'linear-gradient(135deg, #29B6F6 0%, #0288D1 100%)', 
        color: 'white', padding: '100px 40px', textAlign: 'center', 
        borderBottom: '8px solid #FFCA28', position: 'relative', overflow: 'hidden'
      }}>
        <h1 style={{ fontSize: '54px', fontWeight: '900', margin: '0 0 20px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          Nefes Ormanı'na Adım At!
        </h1>
        <p style={{ fontSize: '22px', maxWidth: '800px', margin: '0 auto 40px auto', lineHeight: '1.6', fontWeight: '500' }}>
          Serebral Palsili çocuklar için öğrenme odaklı, aktif katılımı esas alan ve dijital teknoloji ile desteklenmiş oyunlaştırılmış solunum eğitim modeli.
        </p>
        <button 
          className="hover-btn"
          onClick={() => navigate('/cocuk-paneli')}
          style={{ 
            backgroundColor: '#FFCA28', color: '#333', padding: '18px 45px', 
            fontSize: '22px', fontWeight: '900', border: 'none', borderRadius: '40px', 
            cursor: 'pointer', boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
          }}>
          ✨ Nefes Ormanı'nı Keşfet ✨
        </button>
      </header>

      {/* BİLGİLENDİRME KARTLARI */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', color: '#0288D1', marginBottom: '50px', fontWeight: '800' }}>Neden N.E.F.E.S. AI?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          
          <Card 
            emoji="🧠"
            title="SP Nedir?" 
            text="Gelişmekte olan beyindeki ilerleyici olmayan hasarın neden olduğu hareket ve duruş bozuklukları."
            btnColor="#E91E63"
            onOpen={() => setActiveModal('sp')}
          />
          <Card 
            emoji="🫁"
            title="Neden Solunum?" 
            text="Solunum kaslarının yetersiz kullanımı ve hatalı postüral alışkanlıklar yorgunluk döngüsünü artırabilir."
            btnColor="#00BCD4"
            onOpen={() => setActiveModal('solunum')}
          />
          <Card 
            emoji="🎮"
            title="Oyunlaştırılmış Solunum" 
            text="Klinik rutinleri görsel ve işitsel uyaranlarla desteklenen eğlenceli ve interaktif bir maceraya dönüştürüyoruz."
            btnColor="#FF9800"
            onOpen={() => setActiveModal('oyun')}
          />

        </div>
      </section>

      {/* NASIL ÇALIŞIR ŞEMASI */}
      <section style={{ backgroundColor: '#E1F5FE', padding: '80px 40px', textAlign: 'center', borderRadius: '40px 40px 0 0' }}>
        <h2 style={{ fontSize: '36px', color: '#0288D1', marginBottom: '60px', fontWeight: '800' }}>Sistem Nasıl Çalışır?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap' }}>
          <StepBox step="1" icon="📝" title="Kayıt & Değerlendirme" />
          <StepBox step="2" icon="🏃‍♂️" title="Fiziksel Eğitim" subtitle="(15 Dakika)" />
          <StepBox step="3" icon="💻" title="Dijital Entegrasyon" subtitle="(15 Dakika)" />
          <StepBox step="4" icon="📈" title="Takip & Yapay Zeka" />
        </div>
      </section>

      {/* --- MODAL (AÇILIR PENCERE) ALANI --- */}
      {activeModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', /* Arka planı hafif buğulu yapar */
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
          }} 
          onClick={closeModal} // Boşluğa tıklayınca kapanır
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: '#FFF', padding: '50px 40px', borderRadius: '24px',
              maxWidth: '650px', width: '90%', maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative', textAlign: 'left'
            }} 
            onClick={(e) => e.stopPropagation()} // İçeriğe tıklayınca kapanmayı engeller
          >
            {/* Kapatma Çarpısı */}
            <button 
              onClick={closeModal} 
              style={{
                position: 'absolute', top: '20px', right: '25px', background: 'none',
                border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999', transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#333'}
              onMouseOut={(e) => e.target.style.color = '#999'}
            >
              ✖
            </button>

            {/* MODAL 1: SP NEDİR? */}
            {activeModal === 'sp' && (
              <div>
                <h2 style={{ color: '#E91E63', fontSize: '32px', marginTop: 0, borderBottom: '3px solid #FCE4EC', paddingBottom: '15px' }}>🧠 Serebral Palsi (SP) Nedir?</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#444' }}>
                  <strong>Serebral Palsi (SP)</strong>, gelişmekte olan beyindeki ilerleyici olmayan bir hasarın neden olduğu, kalıcı hareket ve duruş bozuklukları grubunu tanımlayan bir terimdir. Çocuklarda fiziksel engelliliğin en yaygın nedenidir.
                </p>
                <h3 style={{ color: '#333', marginTop: '25px' }}>📌 3 Ana Tipi Vardır:</h3>
                <ul style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
                  <li style={{ marginBottom: '10px' }}><strong style={{ color: '#E91E63' }}>Spastik SP:</strong> Kas tonusunda artış (sertlik) ve patolojik reflekslerin varlığı ile karakterizedir.</li>
                  <li style={{ marginBottom: '10px' }}><strong style={{ color: '#E91E63' }}>Diskinetik SP:</strong> İstem dışı, kontrol edilemeyen, tekrarlayan hareketlerle kendini gösterir.</li>
                  <li><strong style={{ color: '#E91E63' }}>Ataksik SP:</strong> Normal kas koordinasyonunun kaybıdır. Hareketlerde güç, ritim ve isabetlilik sorunları yaşanır.</li>
                </ul>
                <h3 style={{ color: '#333', marginTop: '25px' }}>🚶‍♂️ Hareket Seviyeleri (GMFCS):</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
                  SP'li çocuklar, sadece ileri düzey motor becerilerde kısıtlılıktan, akülü tekerlekli sandalye kullanımına kadar uzanan 5 farklı seviyede sınıflandırılır. Amacımız erken müdahale ile günlük yaşama en uygun düzeyde katılımı sağlamaktır.
                </p>
              </div>
            )}

            {/* MODAL 2: NEDEN SOLUNUM? */}
            {activeModal === 'solunum' && (
              <div>
                <h2 style={{ color: '#00BCD4', fontSize: '32px', marginTop: 0, borderBottom: '3px solid #E0F7FA', paddingBottom: '15px' }}>🫁 Solunum ve Postürün Önemi</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#444' }}>
                  SP'li çocuklarda, solunum kaslarının yetersiz kullanımı ve hatalı postüral alışkanlıklar, <strong>enerji verimliliğini düşürebilir</strong> ve yorgunluk döngüsünü daha da artırabilir.
                </p>
                <div style={{ backgroundColor: '#E0F7FA', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                  <h4 style={{ color: '#00838F', margin: '0 0 10px 0', fontSize: '18px' }}>Hedefimiz Nedir?</h4>
                  <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#006064' }}>
                    Bu durum fiziksel aktivite düzeyinin azalmasına ve günlük yaşama katılımın kısıtlanmasına neden olur. Projemizde <strong>solunum ve postür farkındalık eğitimini bir arada ele alarak</strong>, çocukların günlük yaşam aktivitelerine daha aktif ve bağımsız katılımlarını desteklemeyi hedefliyoruz.
                  </p>
                </div>
              </div>
            )}

            {/* MODAL 3: OYUNLAŞTIRILMIŞ SOLUNUM */}
            {activeModal === 'oyun' && (
              <div>
                <h2 style={{ color: '#FF9800', fontSize: '32px', marginTop: 0, borderBottom: '3px solid #FFF3E0', paddingBottom: '15px' }}>🎮 N.E.F.E.S. Eğitim Modeli</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#444' }}>
                  Mevcut klinik merkezli uygulamaların ötesine geçiyoruz! Öğrenme odaklı, aktif katılımı esas alan ve dijital teknoloji ile desteklenmiş oyunlaştırılmış bir model sunuyoruz.
                </p>
                <ul style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '20px' }}>
                  <li style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#E65100' }}>İnteraktif Egzersizler:</strong> Mum üfleme, gemi yüzdürme ve triflo simülasyonları gibi görsel/işitsel uyaranlarla desteklenen teknolojik altyapı.
                  </li>
                  <li style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#E65100' }}>Dijital Süreklilik:</strong> Sadece klinikte değil, çocukların evde de aktif katılımını teşvik eden eğitici oyunlar.
                  </li>
                  <li>
                    <strong style={{ color: '#E65100' }}>Yenilikçi Yaklaşım:</strong> N.E.F.E.S. modelinin en büyük farkı; solunum eğitimini yorucu bir rutin olmaktan çıkarıp, eğitsel ve sürdürülebilir bir maceraya dönüştürmesidir.
                  </li>
                </ul>
              </div>
            )}

          </div>
        </div>
      )}

      <footer style={{ backgroundColor: '#263238', color: '#ECEFF1', padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: '#FFCA28', marginBottom: '20px' }}>Destekleyiciler & Proje Bilgisi</h3>
        <p style={{ fontSize: '15px', opacity: 0.9 }}>TÜBİTAK 4008 | Yeditepe Üniversitesi | Cerebral Palsy Türkiye</p>
        <div style={{ marginTop: '20px', fontSize: '13px', opacity: 0.6 }}>© 2026 N.E.F.E.S. Projesi - Tüm Hakları Saklıdır.</div>
      </footer>

    </div>
  );
};

// --- YARDIMCI BİLEŞENLER ---

const Card = ({ emoji, title, text, btnColor, onOpen }) => (
  <div className="hover-card" style={{ 
    backgroundColor: '#FFFFFF', border: '3px solid #E0E0E0', borderRadius: '24px', 
    padding: '40px 30px', width: '320px', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', boxShadow: '0 8px 15px rgba(0,0,0,0.05)', position: 'relative'
  }}>
    <div style={{ fontSize: '50px', marginBottom: '15px' }}>{emoji}</div>
    <h3 style={{ fontSize: '24px', color: '#333', marginBottom: '15px', fontWeight: '800' }}>{title}</h3>
    <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', textAlign: 'center', marginBottom: '30px' }}>{text}</p>
    
    <button 
      className="hover-btn" 
      onClick={onOpen} // Tıklandığında Modal'ı açar
      style={{ 
        marginTop: 'auto', backgroundColor: btnColor, color: '#FFFFFF', padding: '12px 25px', 
        border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' 
      }}
    >
      Detaylı Bilgi
    </button>
  </div>
);

const StepBox = ({ step, icon, title, subtitle }) => (
  <div className="step-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px', cursor: 'pointer' }}>
    <div className="step-icon" style={{ 
      width: '80px', height: '80px', backgroundColor: '#FFFFFF', color: '#0288D1', 
      borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
      fontSize: '36px', border: '4px solid #0288D1', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>
      {icon}
    </div>
    <div style={{ fontWeight: '800', color: '#333', fontSize: '18px', textAlign: 'center' }}>
      <span style={{ color: '#0288D1' }}>{step}.</span> {title}
    </div>
    {subtitle && <div style={{ color: '#78909C', fontSize: '14px', marginTop: '8px', fontWeight: 'bold' }}>{subtitle}</div>}
  </div>
);

export default LandingPage;