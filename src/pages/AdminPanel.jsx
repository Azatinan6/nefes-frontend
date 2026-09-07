import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getPendingFizyos, approveFizyo, rejectFizyo, deleteUser } from '../services/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [allUsers, setAllUsers] = useState([]);
  const [pendingFizyos, setPendingFizyos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  const handleApprove = async (id) => {
    try {
      await approveFizyo(id);
      showNotification('success', 'Fizyoterapist onaylandı ve davet kodu gönderildi.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Onaylama işlemi başarısız.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Bu başvuruyu reddetmek istediğinizden emin misiniz?')) return;
    try {
      await rejectFizyo(id);
      showNotification('success', 'Fizyoterapist başvurusu reddedildi.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Red işlemi başarısız.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) return;
    try {
      await deleteUser(id);
      showNotification('success', 'Kullanıcı başarıyla silindi.');
      fetchData();
    } catch (err) {
      showNotification('error', err.response?.data || 'Silme işlemi başarısız.');
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: allUsers.length,
    fizyo: allUsers.filter(u => u.role === 'ROLE_FIZYO').length,
    aile: allUsers.filter(u => u.role === 'ROLE_AILE').length,
    cocuk: allUsers.filter(u => u.role === 'ROLE_COCUK').length,
    pending: pendingFizyos.length,
  };

  const getRoleBadge = (role) => {
    const badges = {
      'ROLE_ADMIN': { label: 'Admin', color: '#5E5CE6', bg: '#E5E5EA' },
      'ROLE_FIZYO': { label: 'Fizyoterapist', color: '#007AFF', bg: '#E5F1FF' },
      'ROLE_AILE': { label: 'Aile', color: '#34C759', bg: '#E8F8EE' },
      'ROLE_COCUK': { label: 'Çocuk', color: '#FF9500', bg: '#FFF4E5' },
    };
    return badges[role] || { label: role, color: '#8E8E93', bg: '#F2F2F7' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': { label: 'Aktif', color: '#34C759', bg: '#E8F8EE' },
      'APPROVED': { label: 'Onaylı', color: '#34C759', bg: '#E8F8EE' },
      'PENDING': { label: 'Bekliyor', color: '#FF9500', bg: '#FFF4E5' },
      'REJECTED': { label: 'Reddedildi', color: '#FF3B30', bg: '#FFEBEA' },
    };
    return badges[status] || { label: status, color: '#8E8E93', bg: '#F2F2F7' };
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; }
        
        /* iOS tarzı Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C7C7CC; border-radius: 10px; }
        
        .ios-btn {
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
        }
        .ios-btn:active { transform: scale(0.96); opacity: 0.8; }
        
        .stat-card {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(0,0,0,0.06);
        }
        
        .search-input::placeholder { color: #8E8E93; }
        .search-input:focus { background: #fff; box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15); border-color: #007AFF; }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notification { animation: slideDown 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>

      {/* ===== HEADER (iOS Frosted Glass) ===== */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={styles.iconContainer}>🌿</div>
          <div>
            <h1 style={styles.headerTitle}>Yönetim Merkezi</h1>
            <p style={styles.headerSubtitle}>Hoş geldin, {user?.fullName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 
          <button onClick={() => navigate('/')} style={{...styles.actionBtn, background: '#F2F2F7', color: '#007AFF'}} className="ios-btn">
            Ana Sayfa
          </button>
          */}
          <button onClick={logout} style={{...styles.actionBtn, background: '#FFEBEA', color: '#FF3B30'}} className="ios-btn">
            Çıkış Yap
          </button>
        </div>
      </div>

      <div style={styles.content}>
        
        {notification.message && (
          <div className="notification" style={{
            ...styles.notification,
            backgroundColor: notification.type === 'success' ? '#E8F8EE' : '#FFEBEA',
            color: notification.type === 'success' ? '#34C759' : '#FF3B30',
          }}>
            {notification.message}
          </div>
        )}

        {/* ===== iOS SEGMENTED CONTROL (Tab Menü) ===== */}
        <div style={styles.segmentedControl}>
          {[
            { key: 'dashboard', label: 'Özet' },
            { key: 'pending', label: `Onay Bekleyen (${stats.pending})` },
            { key: 'users', label: 'Tüm Kullanıcılar' },
          ].map(tab => (
            <button
              key={tab.key}
              className="ios-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.segmentBtn,
                background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.key ? '#000000' : '#8E8E93',
                boxShadow: activeTab === tab.key ? '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'slideDown 0.3s ease-out' }}>
            <h2 style={styles.sectionTitle}>Sistem İstatistikleri</h2>
            <div style={styles.statsGrid}>
              <StatCard icon="👥" label="Toplam Kullanıcı" value={stats.total} color="#000000" />
              <StatCard icon="🩺" label="Fizyoterapist" value={stats.fizyo} color="#007AFF" />
              <StatCard icon="👨‍👩‍👧" label="Aile" value={stats.aile} color="#34C759" />
              <StatCard icon="👦" label="Çocuk/Hasta" value={stats.cocuk} color="#FF9500" />
              <StatCard icon="⏳" label="Onay Bekliyor" value={stats.pending} color="#FF3B30" />
            </div>

            {stats.pending > 0 && (
              <div style={styles.alertBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🔔</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#000' }}>İşlem Bekleyen Başvurular</strong>
                    <span style={{ color: '#8E8E93' }}>{stats.pending} yeni fizyoterapist onayınızı bekliyor.</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab('pending')} style={styles.alertBtn} className="ios-btn">
                  İncele
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== ONAY BEKLİYENLER ===== */}
        {activeTab === 'pending' && (
          <div style={{ animation: 'slideDown 0.3s ease-out' }}>
            <h2 style={styles.sectionTitle}>Fizyoterapist Başvuruları</h2>
            
            {loading && <div style={styles.emptyState}>Yükleniyor...</div>}
            
            {!loading && pendingFizyos.length === 0 && (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🎉</span>
                Bekleyen başvuru bulunmuyor.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingFizyos.map(fizyo => (
                <div key={fizyo.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: '#E5F1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        🩺
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '17px', color: '#000', marginBottom: '4px' }}>{fizyo.fullName}</div>
                        <div style={{ color: '#8E8E93', fontSize: '14px' }}>{fizyo.email} • {new Date(fizyo.createdAt).toLocaleDateString('tr-TR')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="ios-btn" onClick={() => handleReject(fizyo.id)} style={{ ...styles.actionBtn, background: '#F2F2F7', color: '#FF3B30' }}>
                        Reddet
                      </button>
                      <button className="ios-btn" onClick={() => handleApprove(fizyo.id)} style={{ ...styles.actionBtn, background: '#007AFF', color: '#fff' }}>
                        Onayla
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TÜM KULLANICILAR ===== */}
        {activeTab === 'users' && (
          <div style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Kullanıcı Listesi</h2>
              <div style={styles.searchWrapper}>
                <span style={{ position: 'absolute', left: '12px', color: '#8E8E93' }}>🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {loading && <div style={styles.emptyState}>Yükleniyor...</div>}

            {!loading && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Kullanıcı</th>
                      <th style={styles.th}>Rol</th>
                      <th style={styles.th}>Durum</th>
                      <th style={styles.th}>Tarih</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => {
                      const roleBadge = getRoleBadge(u.role);
                      const statusBadge = getStatusBadge(u.status);
                      return (
                        <tr key={u.id} style={{ ...styles.tableRow, borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid #E5E5EA' }}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '600', color: '#000', fontSize: '15px' }}>{u.fullName}</div>
                            <div style={{ color: '#8E8E93', fontSize: '13px', marginTop: '2px' }}>{u.email}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: roleBadge.bg, color: roleBadge.color }}>
                              {roleBadge.label}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: statusBadge.bg, color: statusBadge.color }}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ color: '#8E8E93', fontSize: '14px', fontWeight: '500' }}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', paddingRight: '24px' }}>
                            {u.role !== 'ROLE_ADMIN' && (
                              <button className="ios-btn" onClick={() => handleDelete(u.id, u.fullName)} style={styles.deleteBtn}>
                                Sil
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

// Alt Bileşen: İstatistik Kartı
const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={styles.card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: '800', color: color, letterSpacing: '-1px' }}>{value}</div>
    </div>
    <div style={{ fontSize: '15px', color: '#8E8E93', marginTop: '12px', fontWeight: '600' }}>{label}</div>
  </div>
);

// Stiller
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F2F2F7', paddingBottom: '60px' },
  header: {
    padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  iconContainer: { background: '#E8F8EE', borderRadius: '14px', width: '44px', height: '44px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' },
  headerTitle: { margin: 0, fontSize: '19px', fontWeight: '700', color: '#000', letterSpacing: '-0.5px' },
  headerSubtitle: { margin: '2px 0 0 0', fontSize: '13px', color: '#8E8E93', fontWeight: '500' },
  actionBtn: { padding: '8px 16px', border: 'none', borderRadius: '14px', fontWeight: '600', fontSize: '14px' },
  
  content: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  notification: { padding: '16px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' },
  
  segmentedControl: {
    display: 'flex', background: '#E3E3E8', padding: '4px', borderRadius: '14px', width: 'fit-content', margin: '0 auto 40px'
  },
  segmentBtn: {
    padding: '8px 24px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.3s ease'
  },
  
  sectionTitle: { fontSize: '22px', fontWeight: '700', color: '#000', marginBottom: '20px', letterSpacing: '-0.5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: { background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' },
  
  alertBox: { background: '#fff', borderRadius: '24px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #FFEBEA' },
  alertBtn: { background: '#F2F2F7', color: '#007AFF', padding: '10px 24px', borderRadius: '14px', fontWeight: '600', border: 'none', fontSize: '15px' },
  
  emptyState: { textAlign: 'center', padding: '80px 20px', color: '#8E8E93', fontSize: '16px', fontWeight: '500' },
  
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { padding: '10px 16px 10px 40px', borderRadius: '12px', border: '1px solid transparent', background: '#E3E3E880', fontSize: '15px', width: '280px', outline: 'none', transition: 'all 0.2s', fontWeight: '500' },
  
  tableWrapper: { background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { borderBottom: '1px solid #E5E5EA' },
  th: { padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#8E8E93' },
  tableRow: { transition: 'background 0.2s' },
  td: { padding: '16px 24px', verticalAlign: 'middle' },
  deleteBtn: { padding: '6px 16px', background: 'transparent', color: '#FF3B30', border: '1px solid #FF3B30', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }
};

export default AdminPanel;