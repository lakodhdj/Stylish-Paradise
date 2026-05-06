import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AuthModal() {
  const { isAuthOpen, setIsAuthOpen, login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin && !agreedToTerms) {
      alert('Пожалуйста, подтвердите что вы прочитали пользовательское соглашение');
      return;
    }
    if (isLogin) {
      login(form.email, form.password);
    } else {
      register(form.name, form.email, form.password);
    }
  };

  const openTermsDocument = () => {
    window.open('/Пользовательское_соглашение.pdf', '_blank');
  };

  if (!isAuthOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsAuthOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 className="font-display" style={{ fontSize: 20 }}>
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <button 
            onClick={() => setIsAuthOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
                Имя
              </label>
              <input 
                type="text"
                className="input"
                placeholder="Ваше имя"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
              Email
            </label>
            <input 
              type="email"
              className="input"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
              Пароль
            </label>
            <input 
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: 24, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <input 
                  type="checkbox"
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ marginRight: 8, cursor: 'pointer', width: 18, height: 18 }}
                />
                <label htmlFor="terms-agreement" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--fg)' }}>
                  Я прочитал и согласен с пользовательским соглашением
                </label>
              </div>
              <button 
                type="button"
                onClick={openTermsDocument}
                style={{ 
                  background: 'none', 
                  border: '1px solid var(--accent)', 
                  color: 'var(--accent)', 
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 4
                }}
              >
                Ознакомиться
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 16, opacity: !isLogin && !agreedToTerms ? 0.5 : 1 }} disabled={!isLogin && !agreedToTerms}>
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--accent)', 
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              {isLogin ? 'Регистрация' : 'Войти'}
            </button>
          </p>
        </form>

        <div style={{ 
          padding: 16, 
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
            Демо: admin@shop.ru / admin123
          </p>
        </div>
      </div>
    </div>
  );
}