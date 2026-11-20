import { createContext, useContext, useEffect, useState } from 'react';
import client, { storage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storage.getUser());
  const [checking, setChecking] = useState(!!storage.getToken());

  // Tải lại trang: hỏi backend token còn hợp lệ không
  useEffect(() => {
    if (!storage.getToken()) return;
    client.get('/api/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => { storage.clear(); setUser(null); })
      .finally(() => setChecking(false));
  }, []);

  // Lưu phiên từ kết quả đăng nhập { token, id, email, role, fullName } (mật khẩu, Google, Facebook)
  const signIn = (data) => {
    const { token, ...info } = data;
    storage.save(token, info);
    setUser(info);
    return info;
  };

  const login = async (email, password) => {
    const res = await client.post('/api/auth/login', { email, password });
    return signIn(res.data);
  };

  const logout = () => {
    storage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Trang đầu tiên sau khi đăng nhập: sinh viên vào trang chủ tìm việc, không đưa thẳng vào hồ sơ
export function homeOf(role) {
  if (role === 'EMPLOYER') return '/employer/jobs';
  if (role === 'ADMIN') return '/admin';
  return '/';
}
