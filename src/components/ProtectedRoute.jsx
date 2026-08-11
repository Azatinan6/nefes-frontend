import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Korunan Rota Bileşeni — Giriş ve rol kontrolü yapar.
 *
 * Kullanım:
 *   <ProtectedRoute>                          → Giriş yapılmış olması yeterli
 *   <ProtectedRoute roles={['ROLE_ADMIN']}>   → Sadece admin erişebilir
 *   <ProtectedRoute roles={['ROLE_ADMIN', 'ROLE_FIZYO']}> → Admin ve fizyo erişebilir
 *
 * @param {React.ReactNode} children Korunacak sayfa bileşeni
 * @param {string[]} roles İzin verilen roller (boşsa herhangi bir giriş yeterli)
 */
const ProtectedRoute = ({ children, roles = [], redirectTo = "/giris" }) => {
  const { isAuthenticated, hasRole } = useAuth();

  // Kullanıcı giriş yapmamışsa login sayfasına (veya belirtilen yola) yönlendir
  if (!isAuthenticated()) {
    // replace=true → tarayıcı geçmişinde "/login" üzerine yazar, geri tuşu sorun yaratmaz
    return <Navigate to={redirectTo} replace />;
  }

  // Yetkilendirme: Belirli roller tanımlanmışsa kullanıcının rolünü kontrol et
  if (roles.length > 0 && !hasRole(roles)) {
    // Kullanıcı giriş yapmış ama bu sayfaya erişim yetkisi yok
    return <Navigate to="/yetkisiz" replace />;
  }

  // Tüm kontroller geçildi — sayfayı göster
  return children;
};

export default ProtectedRoute;
