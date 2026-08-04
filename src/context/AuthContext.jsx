import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Kimlik Doğrulama Context'i — Tüm uygulamada kullanıcı oturumunu yönetir.
 *
 * Bu context sayesinde herhangi bir bileşen props zinciri olmadan
 * kullanıcı bilgilerine ve oturum fonksiyonlarına erişebilir.
 *
 * localStorage kullanımı: Token sayfa yenilendiğinde kaybolmaması için
 * tarayıcının yerel depolama alanına kaydedilir.
 */

// Context nesnesini oluştur — başlangıçta boş (null)
const AuthContext = createContext(null);

/**
 * AuthProvider — Uygulamayı saran sağlayıcı bileşen.
 * App.jsx'te en dışa sarılır, böylece tüm alt bileşenler erişebilir.
 */
export const AuthProvider = ({ children }) => {
  
  // Kullanıcı bilgisi — null ise oturum açık değil
  const [user, setUser] = useState(null);
  
  // Yükleme durumu — localStorage kontrolü yapılana kadar true
  // Bu olmadan sayfa yenilendiğinde kısa süreli oturumlu/oturumsuz çakışma yaşanır
  const [loading, setLoading] = useState(true);

  /**
   * Sayfa ilk yüklendiğinde localStorage'dan mevcut oturumu kontrol et.
   * Kullanıcı tarayıcıyı kapatıp açsa bile oturum devam eder (token süresine kadar).
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('nefes_token');
    const savedUser = localStorage.getItem('nefes_user');

    if (savedToken && savedUser) {
      try {
        // JSON formatındaki kullanıcı verisini parse et
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        // Bozuk veri varsa temizle — güvenli başlangıç
        localStorage.removeItem('nefes_token');
        localStorage.removeItem('nefes_user');
      }
    }
    
    // localStorage kontrolü tamamlandı — uygulamayı render et
    setLoading(false);
  }, []);

  /**
   * Giriş fonksiyonu — Backend'den alınan token ve kullanıcı bilgilerini kaydeder.
   * @param {Object} authData Backend'in döndürdüğü auth yanıtı (token, role, fullName, email, userId)
   */
  const login = (authData) => {
    // Token'ı localStorage'a kaydet — API servisinde header için kullanılacak
    localStorage.setItem('nefes_token', authData.token);
    
    // Kullanıcı bilgilerini localStorage'a kaydet — sayfa yenilemede korunur
    const userInfo = {
      userId: authData.userId,
      email: authData.email,
      fullName: authData.fullName,
      role: authData.role,
    };
    localStorage.setItem('nefes_user', JSON.stringify(userInfo));
    
    // State'i güncelle — ekrandaki bileşenler yeniden render olur
    setUser(userInfo);
  };

  /**
   * Çıkış fonksiyonu — Token ve kullanıcı bilgilerini temizler.
   * Çağrıldıktan sonra kullanıcı login sayfasına yönlendirilmeli.
   */
  const logout = () => {
    // localStorage'ı temizle
    localStorage.removeItem('nefes_token');
    localStorage.removeItem('nefes_user');
    // State'i sıfırla
    setUser(null);
  };

  /**
   * Oturum açık mı kontrolü.
   * @returns {boolean} Kullanıcı giriş yapmışsa true
   */
  const isAuthenticated = () => user !== null;

  /**
   * Kullanıcının belirli bir role sahip olup olmadığını kontrol eder.
   * Çoklu rol kontrolü için dizi kabul eder.
   * @param {string|string[]} roles Kontrol edilecek rol veya roller
   * @returns {boolean} Kullanıcı belirtilen rollerden birine sahipse true
   */
  const hasRole = (roles) => {
    if (!user) return false;
    // Tek string geldiyse diziye çevir
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  /**
   * localStorage'dan JWT token'ı döndürür.
   * API servisi her istekte bu token'ı Authorization header'a ekler.
   * @returns {string|null} JWT token metni
   */
  const getToken = () => localStorage.getItem('nefes_token');

  // Context'te paylaşılacak değerler ve fonksiyonlar
  const contextValue = {
    user,           // Kullanıcı bilgileri (null ise giriş yapılmamış)
    loading,        // Başlangıç yükleme durumu
    login,          // Giriş fonksiyonu
    logout,         // Çıkış fonksiyonu
    isAuthenticated, // Oturum kontrolü
    hasRole,        // Rol kontrolü
    getToken,       // Token erişimi
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Yükleme tamamlanana kadar bekle — boş sayfa gösterme */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook'u — Bileşenler bu hook ile context'e erişir.
 * AuthProvider dışında kullanılırsa hata fırlatır.
 *
 * Kullanım örneği:
 *   const { user, login, logout, hasRole } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth hook\'u yalnızca AuthProvider içinde kullanılabilir');
  }
  return context;
};

export default AuthContext;
