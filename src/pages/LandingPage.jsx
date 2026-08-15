import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'sp', 'solunum', 'proje' veya null

  // PDF'den alınan detaylı içerik verileri
  const modalContent = {
    sp: {
      title: "Serebral Palsi (SP) Nedir?",
      color: "#E91E63",
      body: (
        <div style={modalBodyStyle}>
          <p><strong>Serebral Palsi (SP)</strong>, gelişmekte olan beyindeki ilerleyici olmayan bir hasarın neden olduğu, kalıcı hareket ve duruş bozuklukları grubunu tanımlayan bir terimdir. Çocuklarda fiziksel engelliliğin en yaygın nedenidir. Buna ek olarak, Serebral Palsili bireylerde epilepsi ile bilişsel, iletişim, beslenme, görme veya işitme sorunlarının yanı sıra ikincil kas-iskelet sistemi problemleri de görülebilir. Görülme sıklığı her 1000 canlı doğumda yaklaşık 2'dir.</p>

          <h4 style={{ color: '#E91E63', marginTop: '20px', marginBottom: '10px' }}>SP'nin 3 Ana Tipi</h4>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>Spastik SP:</strong> Kas tonusunda artış (sertlik) ve patolojik reflekslerin varlığı ile karakterizedir.</li>
            <li><strong>Diskinetik SP:</strong> İstem dışı, kontrol edilemeyen, tekrarlayan ve bazen stereotipik hareketlerle kendini gösterir.</li>
            <li><strong>Ataksik SP:</strong> Normal kas koordinasyonunun kaybıdır. Hareketlerde güç, ritim ve isabetlilik (hedefi tutturamama gibi) sorunları yaşanır.</li>
          </ul>

          <h4 style={{ color: '#E91E63', marginTop: '20px', marginBottom: '10px' }}>Hareket Seviyeleri (GMFCS)</h4>
          <p>Hareketlilik (mobilite) ve kendi başlattığı hareket yetenekleri, Kaba Motor Fonksiyon Sınıflandırma Sistemine (GMFCS) göre 5 seviyede sınıflandırılabilir:</p>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>Seviye 1:</strong> Sadece ileri düzey kaba motor becerilerde (koşma, zıplama) kısıtlılık vardır.</li>
            <li><strong>Seviye 2:</strong> Desteksiz yürüyebilir; ancak dışarıda ve evin doğrudan çevresinde yürümede kısıtlılık yaşar.</li>
            <li><strong>Seviye 3:</strong> Yardımcı yürüme cihazı ile yürür; dışarıda hareket kısıtlılığı vardır.</li>
            <li><strong>Seviye 4:</strong> Bağımsız hareket kısıtlıdır; çocuklar manuel veya akülü tekerlekli sandalye ile taşınır/kullanır.</li>
            <li><strong>Seviye 5:</strong> Yardımcı cihazlar kullanılsa dahi bağımsız hareket ciddi şekilde kısıtlıdır.</li>
          </ul>

          <h4 style={{ color: '#E91E63', marginTop: '20px', marginBottom: '10px' }}>Neden Erken Müdahale?</h4>
          <p>En iyi sonuçları, çocuğun ve ailenin ihtiyaçlarına göre uyarlanmış, bireyselleştirilmiş erken tedavi verir. Amaç, günlük yaşama en uygun düzeyde katılımdır.</p>
        </div>
      )
    },
    solunum: {
      title: "Solunum ve Postürün Önemi",
      color: "#03A9F4",
      body: (
        <div style={modalBodyStyle}>
          <p>SP'li çocuklarda, solunum kaslarının yetersiz kullanımı ve hatalı postüral alışkanlıklar, enerji verimliliğini düşürebilir ve yorgunluk döngüsünü daha da arttırabilir.</p>
          <p>Bu durum, çocukların fiziksel aktivite düzeyinin azalmasına ve inaktivite ile birlikte günlük yaşama katılımlarının kısıtlanarak solunum fonksiyonlarında ve postural kontrolde bozulmalara neden olabilmektedir.</p>
          <p>Bu nedenle projede solunum ve postür farkındalık eğitiminin bir arada ele alınması ile SP'li çocukların günlük yaşam aktivitelerine daha aktif ve bağımsız katılımlarını desteklemek hedeflenmektedir.</p>
          
          <h4 style={{ color: '#03A9F4', marginTop: '20px', marginBottom: '10px' }}>Oyunlaştırılmış Eğitim Modelinin Etkisi</h4>
          <p>Oyunlaştırılmış Solunum ve Postür Farkındalık Eğitim Modeli'nin içerdiği oyunlaştırılmış solunum egzersiz eğitiminin solunum fonksiyonlarını ve fonksiyonel kapasiteyi iyileştirmesini, postural imgeleme egzersizlerinin ise bu çocuklarda postür farkındalığını arttırarak, aktivite katılımlarını ve yaşam kaliteleri üzerindeki etkilerinin ölçülmesi hedeflenmektedir.</p>
          <p>Ayrıca projede, geliştirilen bu modelin solunum, fonksiyonel kapasite, postür, öğrenme, yaşam kalitesi, aktivite ve sosyal katılım üzerine etkilerini ölçmek amaçlanmıştır.</p>
        </div>
      )
    },
    proje: {
      title: "Projemiz: N.E.F.E.S. - SP",
      color: "#FF9800",
      body: (
        <div style={modalBodyStyle}>
          <h4 style={{ color: '#FF9800', marginTop: '0', marginBottom: '15px' }}>Nitelikli Eğitimle Farkındalık, Erişilebilir Solunum: Serebral Palsi</h4>
          
          <h4 style={{ color: '#FF9800', marginTop: '20px', marginBottom: '10px' }}>Amacımız Nedir?</h4>
          <p>Serebral Palsili (SP) çocuklar, aileleri ve eğitimciler için mevcut klinik merkezli uygulamaların ötesine geçiyoruz. Öğrenme odaklı, aktif katılımı esas alan ve dijital teknoloji ile desteklenmiş oyunlaştırılmış bir solunum ve postür eğitim modeli sunarak çocukların motivasyonunu ve egzersiz uyumunu artırmayı hedefliyoruz.</p>
          
          <h4 style={{ color: '#FF9800', marginTop: '20px', marginBottom: '10px' }}>Nasıl Uyguluyoruz?</h4>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>İnteraktif Egzersizler:</strong> Mum üfleme, gemi yüzdürme ve triflo simülasyonları gibi görsel/işitsel uyaranlarla desteklenen solunum egzersizleri ve postüral imgeleme teknikleri kullanıyoruz.</li>
            <li><strong>Uygulamalı Atölyeler:</strong> Türkiye Spastik Çocuklar Vakfı'nda (TSÇV) eğitmen eşliğinde haftada iki gün olmak üzere toplam 8 haftalık bir program yürütüyoruz.</li>
            <li><strong>Ev Programı ve Dijital Süreklilik:</strong> Çocukların evde de aktif katılımını teşvik etmek için eğitici dijital oyunlar ve öyküleme videoları hazırlıyoruz.</li>
            <li><strong>Farkındalık Seminerleri:</strong> Aileler, eğitimciler ve proje ekipleri için bilgilendirici çalıştaylar ve kapanış seminerleri düzenliyoruz.</li>
          </ul>

          <h4 style={{ color: '#FF9800', marginTop: '20px', marginBottom: '10px' }}>Hedef Kitlemiz Kimler?</h4>
          <p>Projemizin merkezinde SP'li çocuklar, onların kıymetli aileleri ve bu süreçte rol alan eğitimciler yer alıyor.</p>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>TSÇV'de rehabilitasyon alan,</li>
            <li>Okuma yazma bilen,</li>
            <li>6-18 yaş arası 40 çocuk projemize (aile onayıyla) dahil edilmektedir.</li>
          </ul>

          <h4 style={{ color: '#FF9800', marginTop: '20px', marginBottom: '10px' }}>Yenilikçi ve Özgün Yönümüz</h4>
          <p>N.E.F.E.S. modelinin en büyük farkı; solunum ve postür eğitimini yorucu bir klinik rutin olmaktan çıkarıp, oyun temelli, eğitsel ve sürdürülebilir bir öğrenme deneyimi dönüşümüdür. Modelimiz, çocukların solunum fonksiyonları, beden farkındalığı, sosyal katılımı ve yaşam kalitesi üzerindeki etkileri standart ölçüm yöntemleriyle değerlendirilecek şekilde tasarlanmıştır. Ayrıca diğer özel gereksinimli gruplara da uyarlanabilir yapısıyla toplumsal katkıyı en üst düzeye çıkarmayı amaçlar.</p>
        </div>
      )
    },
    bizkimiz: {
      title: "Biz Kimiz? Proje Ekibi",
      color: "#9C27B0",
      body: (
        <div style={modalBodyStyle}>
          <h4 style={{ color: '#9C27B0', marginTop: '0', marginBottom: '10px' }}>Proje Yürütücüsü</h4>
          <p>Prof. Dr. Fizyoterapist Rasmi Muammer (Yeditepe Üniversitesi)</p>

          <h4 style={{ color: '#9C27B0', marginTop: '20px', marginBottom: '10px' }}>Proje Araştırmacıları</h4>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Doç. Dr. Fizyoterapist Başar Öztürk (Fenerbahçe Üniversitesi)</li>
            <li>Dr. Fizyoterapist Kıymet Muammer (İstanbul Üniversitesi-Cerrahpaşa)</li>
            <li>Dr. Fizyoterapist Aslı Yeral (Yeditepe Üniversitesi)</li>
            <li>Dr. Fizyoterapist Baha Naci (Fenerbahçe Üniversitesi)</li>
            <li>Uzman Fizyoterapist Deniz Aslan (Yeditepe Üniversitesi)</li>
          </ul>

          <h4 style={{ color: '#9C27B0', marginTop: '20px', marginBottom: '10px' }}>Eğitmenler</h4>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Prof. Dr. Esra Pehlivan (Sağlık Bilimleri Üniversitesi)</li>
            <li>Dr. Fizyoterapist Elif Develi (Yeditepe Üniversitesi)</li>
            <li>Uzman Fizyoterapist Ayça Yağcıoğlu (Yeditepe Üniversitesi)</li>
            <li>Uzman Fizyoterapist Turgay Arık (TSÇV)</li>
            <li>Uzman Fizyoterapist Irmak Sıla Çetinel (Yeditepe Üniversitesi)</li>
            <li>Fizyoterapist Zeynep İnan (Yeditepe Üniversitesi)</li>
            <li>Fizyoterapist Burak Şevket Vuran (TSÇV)</li>
            <li>Fizyoterapist Yüksel Çolaker (TSÇV)</li>
          </ul>

          <h4 style={{ color: '#9C27B0', marginTop: '20px', marginBottom: '10px' }}>Yazılım ve Teknik Ekip</h4>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Mühendis Azat İnan (Haliç Üniversitesi)</li>
            <li>Mühendis Mehmet Eren Çakmak (Haliç Üniversitesi)</li>
          </ul>
        </div>
      )
    }
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F0F8FF', fontFamily: 'sans-serif' }}>
      
      {/* 1. ÜST KISIM - KAHRAMAN ALANI (HERO SECTION) */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '70px 20px', backgroundColor: '#E8F5E9', borderBottom: '5px solid #C8E6C9'
      }}>
        <h1 style={{ fontSize: '50px', color: '#2E7D32', fontWeight: '900', margin: '0 0 15px 0', textAlign: 'center' }}>
          Nefes Ormanı'na Adım At!
        </h1>
        <p style={{ fontSize: '20px', color: '#555', maxWidth: '650px', textAlign: 'center', marginBottom: '35px', lineHeight: '1.6' }}>
          N.E.F.E.S-SP ile nefes ve postür farkındalığını eğlenceli oyunlarla keşfet.
        </p>
        <button 
          onClick={() => navigate('/cocuk-paneli')}
          className="hero-btn"
          style={{
            padding: '16px 45px', fontSize: '22px', backgroundColor: '#2E7D32', color: '#FFF',
            border: 'none', borderRadius: '35px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 10px 25px rgba(46, 125, 50, 0.4)', transition: 'all 0.3s ease'
          }}
        >
          🌲 Nefes Ormanı'nı Keşfet
        </button>
      </div>

      {/* 2. BİLGİLENDİRME KARTLARI */}
      <div style={{ padding: '70px 20px', maxWidth: '1500px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '38px', color: '#1565C0', marginBottom: '50px', fontWeight: '800' }}>Neden N.E.F.E.S Projesi?</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '35px', flexWrap: 'wrap' }}>
          
          {/* KART 3: Projemiz */}
          <div className="hover-card" style={cardStyle}>
            <div style={{ fontSize: '65px', marginBottom: '15px' }}>🌲</div>
            <h3 style={{ color: '#333', fontSize: '22px', marginBottom: '15px', fontWeight: 'bold' }}>Projemiz Hakkında</h3>
            <p style={{ color: '#666', fontSize: '15px', flex: 1, lineHeight: '1.5' }}>Öğrenme odaklı, aktif katılımı esas alan ve dijital teknoloji ile desteklenmiş oyunlaştırılmış solunum eğitim modeli.</p>
            <button onClick={() => setActiveModal('proje')} className="card-btn" style={{...cardBtnStyle, backgroundColor: '#FF9800'}}>Projeyi İncele</button>
          </div>

          {/* KART 1: SP Nedir? */}
          <div className="hover-card" style={cardStyle}>
            <div style={{ fontSize: '65px', marginBottom: '15px' }}>🧠</div>
            <h3 style={{ color: '#333', fontSize: '22px', marginBottom: '15px' }}>SP Nedir?</h3>
            <p style={{ color: '#666', fontSize: '15px', flex: 1, lineHeight: '1.5' }}>Serebral Palsi (SP), gelişmekte olan beyindeki ilerleyici olmayan bir hasarın neden olduğu hareket bozuklukları grubudur.</p>
            <button onClick={() => setActiveModal('sp')} className="card-btn" style={{...cardBtnStyle, backgroundColor: '#E91E63'}}>Detaylı Bilgi</button>
          </div>

          {/* KART 2: Solunum Önemi */}
          <div className="hover-card" style={cardStyle}>
            <div style={{ fontSize: '65px', marginBottom: '15px' }}>🫁</div>
            <h3 style={{ color: '#333', fontSize: '22px', marginBottom: '15px' }}>Neden Solunum?</h3>
            <p style={{ color: '#666', fontSize: '15px', flex: 1, lineHeight: '1.5' }}>Solunum kaslarının yetersiz kullanımı ve hatalı postüral alışkanlıklar yorgunluk döngüsünü artırabilir.</p>
            <button onClick={() => setActiveModal('solunum')} className="card-btn" style={{...cardBtnStyle, backgroundColor: '#03A9F4'}}>Detaylı Bilgi</button>
          </div>

          {/* KART 4: Biz Kimiz? */}
          <div className="hover-card" style={cardStyle}>
            <div style={{ fontSize: '65px', marginBottom: '15px' }}>👥</div>
            <h3 style={{ color: '#333', fontSize: '22px', marginBottom: '15px', fontWeight: 'bold' }}>Biz Kimiz?</h3>
            <p style={{ color: '#666', fontSize: '15px', flex: 1, lineHeight: '1.5' }}>Projemize değer katan yürütücülerimiz, araştırmacılarımız, eğitmenlerimiz ve teknik ekibimiz.</p>
            <button onClick={() => setActiveModal('bizkimiz')} className="card-btn" style={{...cardBtnStyle, backgroundColor: '#9C27B0'}}>Detaylı Bilgi</button>
          </div>

        </div>
      </div>

      {/* 3. SİSTEM NASIL ÇALIŞIR? */}
      <div style={{ padding: '70px 20px', backgroundColor: '#E3F2FD', textAlign: 'center' }}>
        <h2 style={{ fontSize: '38px', color: '#1565C0', marginBottom: '50px', fontWeight: '800' }}>Sistem Nasıl Çalışır?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
          <Step icon="👤" title="1. Kayıt ve Değerlendirme" />
          <Step icon="👩‍⚕️" title="2. Fiziksel Eğitim" />
          <Step icon="💻" title="3. Dijital Entegrasyon" />
          <Step icon="📈" title="4. Takip ve Gelişim" />
        </div>
      </div>

      {/* MODAL (BİLGİ PENCERESİ) */}
      {activeModal && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Kapatma Butonu */}
            <button onClick={() => setActiveModal(null)} className="close-btn" style={closeBtnStyle}>✖</button>
            
            {/* Dinamik İçerik Başlığı */}
            <h2 style={{ color: modalContent[activeModal].color, borderBottom: `2px solid ${modalContent[activeModal].color}40`, paddingBottom: '15px', marginTop: 0 }}>
              {modalContent[activeModal].title}
            </h2>
            
            {/* PDF'den Alınan Detaylı İçerik */}
            {modalContent[activeModal].body}
          </div>
        </div>
      )}

      {/* CSS HOVER VE ANİMASYON EFEKTLERİ */}
      <style>{`
        .hover-card {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
        }
        .hover-card:hover {
          transform: translateY(-12px) scale(1.02) !important;
          box-shadow: 0 20px 35px rgba(0,0,0,0.15) !important;
          border: 2px solid rgba(46, 125, 50, 0.3);
        }
        .card-btn {
          transition: all 0.25s ease-in-out !important;
        }
        .card-btn:hover {
          filter: brightness(1.15);
          transform: scale(1.04);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .hero-btn:hover {
          transform: scale(1.06) !important;
          background-color: #1B5E20 !important;
          box-shadow: 0 15px 30px rgba(46, 125, 50, 0.5) !important;
        }
        .step-icon {
          transition: all 0.3s ease !important;
        }
        .step-container:hover .step-icon {
          transform: translateY(-8px) rotate(5deg) scale(1.1);
          box-shadow: 0 10px 20px rgba(21, 101, 192, 0.2) !important;
          color: #1565C0;
        }
        .close-btn:hover {
          color: #E91E63 !important;
          transform: rotate(90deg) scale(1.1);
          transition: all 0.3s ease;
        }
      `}</style>

    </div>
  );
};

// --- STİL OBJELERİ ---

const cardStyle = {
  backgroundColor: '#FFF',
  width: '310px',
  padding: '35px 30px',
  borderRadius: '24px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  border: '2px solid transparent'
};

const cardBtnStyle = {
  marginTop: '25px',
  padding: '12px 25px',
  color: '#FFF',
  border: 'none',
  borderRadius: '25px',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
  fontSize: '16px'
};

const Step = ({ icon, title }) => (
  <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '160px', cursor: 'pointer' }}>
    <div className="step-icon" style={{ fontSize: '40px', backgroundColor: '#FFF', width: '90px', height: '90px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', boxShadow: '0 6px 15px rgba(0,0,0,0.08)', marginBottom: '15px' }}>
      {icon}
    </div>
    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px', textAlign: 'center' }}>{title}</div>
  </div>
);

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(5px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyle = {
  backgroundColor: '#FFF',
  width: '100%',
  maxWidth: '850px',
  maxHeight: '85vh',
  borderRadius: '24px',
  padding: '45px',
  position: 'relative',
  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  display: 'flex',
  flexDirection: 'column'
};

const modalBodyStyle = {
  overflowY: 'auto',
  paddingRight: '15px',
  color: '#444',
  fontSize: '16px',
  textAlign: 'left',
  lineHeight: '1.6'
};

const closeBtnStyle = {
  position: 'absolute',
  top: '25px',
  right: '30px',
  background: 'none',
  border: 'none',
  fontSize: '24px',
  color: '#888',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

export default LandingPage;