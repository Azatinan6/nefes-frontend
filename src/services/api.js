import axios from 'axios';

/**
 * API Servisi — Tüm backend iletişimi bu modül üzerinden gerçekleşir.
 *
 * İki tip instance kullanılır:
 * 1. authAPI: Herkese açık endpoint'ler (login, register) — token gerekmez
 * 2. api: Korunan endpoint'ler — her istekte Authorization header'ı otomatik eklenir
 */

// Backend sunucusunun temel URL'si
const BASE_URL = '/api';// =============================================
// KORUNAN API — Her istekte JWT token eklenir
// =============================================
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * İstek Interceptor'ı — Her API isteğinden önce çalışır.
 * localStorage'dan token alınır ve Authorization başlığına eklenir.
 * Token yoksa istek header'sız gönderilir (güvenli endpoint'ler için).
 */
api.interceptors.request.use(
  (config) => {
    // localStorage'dan JWT token'ı al
    const token = localStorage.getItem('nefes_token');
    if (token) {
      // Bearer token formatı — Spring Security bu formatı bekler
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Yanıt Interceptor'ı — Backend'den gelen hatalı yanıtları yönetir.
 * 401 Unauthorized → Token süresi dolmuş, kullanıcıyı login'e yönlendir.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş — oturumu temizle ve login'e yönlendir
      localStorage.removeItem('nefes_token');
      localStorage.removeItem('nefes_user');
      // Sayfayı login'e yönlendir
      window.location.href = '/giris';
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH API — Token gerektirmeyen endpoint'ler
// =============================================
const authAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================
// KİMLİK DOĞRULAMA FONKSİYONLARI
// =============================================

/**
 * Giriş yap — E-posta ve şifre ile token alır.
 * @param {string} email Kullanıcı e-postası
 * @param {string} password Kullanıcı şifresi (düz metin — backend hashleyecek)
 * @returns {Promise} JWT token ve kullanıcı bilgilerini içeren yanıt
 */
export const login = (email, password) =>
  authAPI.post('/auth/login', { email, password });

/**
 * Fizyoterapist olarak kayıt ol.
 * Başvuru PENDING durumda oluşturulur — admin onayı beklenir.
 * @param {Object} data Kayıt bilgileri (fullName, email, password, licenseNumber, specialization)
 */
export const registerFizyo = (data) =>
  authAPI.post('/auth/register/fizyo', data);

/**
 * Hasta/Aile olarak kayıt ol.
 * Davet kodu zorunlu — fizyoterapiste otomatik bağlanır.
 * @param {Object} data Kayıt bilgileri (fullName, email, password, inviteCode, role)
 */
export const registerPatient = (data) =>
  authAPI.post('/auth/register/patient', data);

/**
 * Şifremi unuttum — E-posta ile sıfırlama bağlantısı gönderir.
 * @param {string} email Hesap e-postası
 */
export const forgotPassword = (email) =>
  authAPI.post('/auth/forgot-password', { email });

/**
 * Şifre sıfırlama — E-postadaki token ile yeni şifre belirler.
 * @param {string} token URL'den alınan sıfırlama token'ı
 * @param {string} newPassword Yeni şifre
 */
export const resetPassword = (token, newPassword) =>
  authAPI.post('/auth/reset-password', { token, newPassword });

// =============================================
// ADMİN FONKSİYONLARI
// =============================================

// Tüm kullanıcıları listele — Admin paneli için
export const getAllUsers = () => api.get('/admin/users');

// Onay bekleyen fizyoterapist başvurularını listele
export const getPendingFizyos = () => api.get('/admin/fizyo/pending');

// Fizyoterapist başvurusunu onayla
export const approveFizyo = (id) => api.post(`/admin/fizyo/${id}/approve`);

// Fizyoterapist başvurusunu reddet
export const rejectFizyo = (id) => api.post(`/admin/fizyo/${id}/reject`);

// Kullanıcıyı sil (geri alınamaz)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// =============================================
// FİZYOTERAPİST FONKSİYONLARI
// =============================================

// Kendi hastalarını listele
export const getMyPatients = () => api.get('/fizyo/my-patients');

// Davet kodunu görüntüle
export const getMyInviteCode = () => api.get('/fizyo/invite-code');

// Varsayılan export — korunan API instance'ı
export default api;
