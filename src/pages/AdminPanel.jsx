import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getPendingFizyos, approveFizyo, rejectFizyo, deleteUser } from '../services/api';

/**
 * Admin Paneli — Sistem yöneticisinin tüm kullanıcıları yönettiği merkez.
 *
 * Sekmeler:
 * 1. Dashboard     → Özet istatistikler (toplam kullanıcı, fizyo, bekleyen onaylar)
 * 2. Onay Bekliyor → PENDING fizyoterapist başvuruları (Onayla / Reddet)
 * 3. Tüm Kullanıcılar → Sistem genelinde arama, filtreleme, silme
 */
const AdminPanel = () => {
  const { user, logout } = useAuth();

  // Aktif sekme
  const [activeTab, setActiveTab] = useState('dashboard');

  // Veri state'leri
  const [allUsers, setAllUsers] = useState([]);
  const [pendingFizyos, setPendingFizyos] = useState([]);

  // Yükleme ve bildirim durumları
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Arama filtresi — kullanıcı listesinde isim/e-posta araması
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Bileşen ilk yüklendiğinde tüm verileri çek.
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Backend'den tüm kullanıcı verilerini çeker.
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes] = await Promise.all([
        getAllUsers(),
        getPendingFizyos(),
      ]);
      setAllUsers(usersRes.data);
      setPendingFizyos(pendingRes.data);
    } catch (err) {
      showNotification('error', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bildirim mesajı gösterir ve 3 saniye sonra gizler.
   * @param {string} type 'success' veya 'error'
   * @param {string} message Gösterilecek mesaj
   */
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  /**
   * Fizyoterapist başvurusunu onaylar.
   * Backend: durum APPROVED olur, davet kodu üretilir, e-posta gönderilir.
   */
  const handleApprove = async (id) => {
    try {
      await approveFizyo(id);
      showNotification('success', '✅ Fizyoterapist onaylandı ve davet kodu e-posta ile gönderildi.');
      fetchData(); // Listeyi güncelle
    } catch (err) {
      showNotification('error', '❌ Onaylama işlemi başarısız.');
    }
  };

  /**
   * Fizyoterapist başvurusunu reddeder.
   */
  const handleReject = async (id) => {
    if (!window.confirm('Bu başvuruyu reddetmek istediğinizden emin misiniz?')) return;
    try {
      await rejectFizyo(id);
      showNotification('success', '❌ Fizyoterapist başvurusu reddedildi.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Red işlemi başarısız.');
    }
  };

  /**
   * Kullanıcıyı sistemden kalıcı olarak siler.
   */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) return;
    try {
      await deleteUser(id);
      showNotification('success', '🗑️ Kullanıcı başarıyla silindi.');
      fetchData();
    } catch (err) {
      showNotification('error', err.response?.data || 'Silme işlemi başarısız.');
    }
  };

  // Arama filtresine göre kullanıcı listesini filtrele
  const filteredUsers = allUsers.filter(u =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Rol bazlı sayılar — dashboard istatistikleri için
  const stats = {
    total: allUsers.length,
    fizyo: allUsers.filter(u => u.role === 'ROLE_FIZYO').length,
    aile: allUsers.filter(u => u.role === 'ROLE_AILE').length,
    cocuk: allUsers.filter(u => u.role === 'ROLE_COCUK').length,
    pending: pendingFizyos.length,
  };

  // Rol etiketi rengi — tabloda görsel ayırt edicilik için
  const getRoleBadge = (role) => {
    const badges = {
      'ROLE_ADMIN': { label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' },
      'ROLE_FIZYO': { label: 'Fizyoterapist', color: '#0369a1', bg: '#e0f2fe' },
      'ROLE_AILE': { label: 'Aile', color: '#065f46', bg: '#d1fae5' },
      'ROLE_COCUK': { label: 'Çocuk', color: '#92400e', bg: '#fef3c7' },
    };
    return badges[role] || { label: role, color: '#374151', bg: '#f3f4f6' };
  };

  // Durum etiketi
  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': { label: 'Aktif', color: '#065f46', bg: '#d1fae5' },
      'APPROVED': { label: 'Onaylı', color: '#065f46', bg: '#d1fae5' },
      'PENDING': { label: 'Bekliyor', color: '#92400e', bg: '#fef3c7' },
      'REJECTED': { label: 'Reddedildi', color: '#991b1b', bg: '#fee2e2' },
    };
    return badges[status] || { label: status, color: '#374151', bg: '#f3f4f6' };
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        
        .admin-tab { padding: 12px 20px; border: none; border-radius: 10px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .admin-tab:hover { transform: translateY(-1px); }
        
        .stat-card { transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-4px); }
        
        .approve-btn { padding: 8px 16px; background: #16a34a; color: white; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; }
        .approve-btn:hover { background: #15803d; transform: translateY(-1px); }
        
        .reject-btn { padding: 8px 16px; background: #dc2626; color: white; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; margin-left: 8px; }
        .reject-btn:hover { background: #b91c1c; transform: translateY(-1px); }
        
        .delete-btn { padding: 7px 14px; background: transparent; color: #dc2626; border: 1.5px solid #dc2626;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; }
        .delete-btn:hover { background: #fef2f2; }
        
        .search-input { padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-family: 'Inter', sans-serif; background: #f8fafc; outline: none;
          transition: all 0.3s ease; width: 300px; }
        .search-input:focus { border-color: #2E7D32; box-shadow: 0 0 0 4px rgba(46,125,50,0.1); }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notification { animation: slideDown 0.3s ease; }
      `}</style>

      {/* ===== ÜST BAŞLIK (HEADER) ===== */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '32px' }}>🌿</span>
          <div>
            <h1 style={styles.headerTitle}>N.E.F.E.S. Admin Paneli</h1>
            <p style={styles.headerSubtitle}>Hoş geldiniz, {user?.fullName} 👋</p>
          </div>
        </div>
        <button
          onClick={logout}
          style={styles.logoutBtn}
        >
          Çıkış Yap
        </button>
      </div>

      <div style={styles.content}>
        
        {/* Bildirim mesajı — işlem sonrası gösterilir */}
        {notification.message && (
          <div
            className="notification"
            style={{
              ...styles.notification,
              backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
              color: notification.type === 'success' ? '#166534' : '#dc2626',
            }}
          >
            {notification.message}
          </div>
        )}

        {/* ===== SEKME MENÜSÜ ===== */}
        <div style={styles.tabBar}>
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'pending', label: `⏳ Onay Bekliyor ${stats.pending > 0 ? `(${stats.pending})` : ''}` },
            { key: 'users', label: '👥 Tüm Kullanıcılar' },
          ].map(tab => (
            <button
              key={tab.key}
              className="admin-tab"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, #2E7D32, #43A047)'
                  : '#fff',
                color: activeTab === tab.key ? '#fff' : '#374151',
                boxShadow: activeTab === tab.key
                  ? '0 4px 12px rgba(46,125,50,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== DASHBOARD SEKMESİ ===== */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={styles.sectionTitle}>Sistem Özeti</h2>
            <div style={styles.statsGrid}>
              <StatCard icon="👥" label="Toplam Kullanıcı" value={stats.total} color="#2E7D32" />
              <StatCard icon="🩺" label="Fizyoterapist" value={stats.fizyo} color="#0369a1" />
              <StatCard icon="👨‍👩‍👧" label="Aile" value={stats.aile} color="#065f46" />
              <StatCard icon="👦" label="Çocuk/Hasta" value={stats.cocuk} color="#92400e" />
              <StatCard icon="⏳" label="Onay Bekliyor" value={stats.pending} color="#dc2626" />
            </div>

            {/* Hızlı eylem kutusu */}
            {stats.pending > 0 && (
              <div style={styles.alertBox}>
                ⚠️ <strong>{stats.pending} fizyoterapist başvurusu</strong> onayınızı bekliyor.{' '}
                <button
                  onClick={() => setActiveTab('pending')}
                  style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                >
                  Hemen incele →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== ONAY BEKLİYENLER SEKMESİ ===== */}
        {activeTab === 'pending' && (
          <div>
            <h2 style={styles.sectionTitle}>Onay Bekleyen Fizyoterapist Başvuruları</h2>
            
            {loading && <div style={styles.emptyState}>⏳ Yükleniyor...</div>}
            
            {!loading && pendingFizyos.length === 0 && (
              <div style={styles.emptyState}>
                ✅ Onay bekleyen başvuru bulunmuyor.
              </div>
            )}

            {/* Her bekleyen fizyo için bir kart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingFizyos.map(fizyo => (
                <div key={fizyo.id} style={styles.pendingCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '32px' }}>🩺</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>
                            {fizyo.fullName}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '14px' }}>{fizyo.email}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        📅 Başvuru: {fizyo.createdAt ? new Date(fizyo.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                      </div>
                    </div>
                    {/* Onay / Red butonları */}
                    <div>
                      <button className="approve-btn" onClick={() => handleApprove(fizyo.id)}>
                        ✅ Onayla
                      </button>
                      <button className="reject-btn" onClick={() => handleReject(fizyo.id)}>
                        ❌ Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TÜM KULLANICILAR SEKMESİ ===== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Tüm Kullanıcılar ({filteredUsers.length})</h2>
              {/* Arama kutusu */}
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Ad veya e-posta ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading && <div style={styles.emptyState}>⏳ Yükleniyor...</div>}

            {/* Kullanıcı tablosu */}
            {!loading && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Ad Soyad</th>
                      <th style={styles.th}>E-posta</th>
                      <th style={styles.th}>Rol</th>
                      <th style={styles.th}>Durum</th>
                      <th style={styles.th}>Kayıt Tarihi</th>
                      <th style={styles.th}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const roleBadge = getRoleBadge(u.role);
                      const statusBadge = getStatusBadge(u.status);
                      return (
                        <tr key={u.id} style={styles.tableRow}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{u.fullName}</div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>{u.email}</div>
                          </td>
                          <td style={styles.td}>
                            {/* Rol etiketi */}
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                              fontWeight: '600', background: roleBadge.bg, color: roleBadge.color }}>
                              {roleBadge.label}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {/* Durum etiketi */}
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                              fontWeight: '600', background: statusBadge.bg, color: statusBadge.color }}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}
                            </div>
                          </td>
                          <td style={styles.td}>
                            {/* Admin kendi hesabını silemez */}
                            {u.role !== 'ROLE_ADMIN' && (
                              <button
                                className="delete-btn"
                                onClick={() => handleDelete(u.id, u.fullName)}
                              >
                                🗑️ Sil
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// İstatistik kartı bileşeni — dashboard'da tekrar kulllanılır
const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `2px solid ${color}20`,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '36px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '36px', fontWeight: '900', color }}>{value}</div>
    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>{label}</div>
  </div>
);

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
  header: {
    backgroundColor: '#fff', padding: '20px 40px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100,
  },
  headerTitle: { margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' },
  headerSubtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' },
  logoutBtn: {
    padding: '10px 20px', background: 'none', border: '2px solid #e2e8f0', borderRadius: '10px',
    color: '#64748b', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  content: { padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' },
  notification: {
    border: '1px solid', borderRadius: '12px', padding: '14px 20px',
    fontSize: '14px', fontWeight: '600', marginBottom: '24px',
  },
  tabBar: { display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' },
  sectionTitle: { fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  alertBox: {
    backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '12px',
    padding: '16px 20px', color: '#92400e', fontSize: '14px',
  },
  pendingCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
  },
  emptyState: {
    textAlign: 'center', padding: '60px', color: '#94a3b8',
    fontSize: '16px', backgroundColor: '#fff', borderRadius: '16px',
  },
  tableWrapper: { backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f8fafc' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableRow: { borderTop: '1px solid #f1f5f9', transition: 'background 0.2s' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
};

export default AdminPanel;
