import { ShoppingCart, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function Header() {
  const { 
    currentUser, 
    cartCount, 
    setIsCartOpen, 
    setIsAuthOpen, 
    logout, 
    setPage,
    isCartOpen,
    theme,
    toggleTheme
  } = useApp();
  
  const [dropdown, setDropdown] = useState(false);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64
      }}>
        {/* Logo */}
        <button 
          onClick={() => setPage('home')}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'baseline',
            gap: 8
          }}
        >
          <span className="font-display" style={{ fontSize: 22, color: 'var(--fg)' }}>
            Stylish
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)', letterSpacing: 2 }}>
            PARADISE
          </span>
        </button>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 32 }}>
          <button 
            onClick={() => setPage('home')}
            style={navBtnStyle}
          >
            Главная
          </button>
          <button 
            onClick={() => setPage('catalog')}
            style={navBtnStyle}
          >
            Каталог
          </button>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={toggleTheme}
            aria-label="Сменить тему"
            title="Сменить тему"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Cart */}
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            style={{ 
              position: 'relative', 
              background: 'none', 
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg)',
              padding: 8
            }}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontSize: 10,
                fontWeight: 600,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* User */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setDropdown(!dropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--fg)'
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bg)',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {currentUser.name[0]}
                </div>
              </button>
              
              {dropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  minWidth: 180
                }}>
                    {currentUser.isAdmin && (
                      <button 
                        onClick={() => { setPage('admin'); setDropdown(false); }}
                        style={dropdownItemStyle}
                      >
                        <Settings size={16} />
                        Админ-панель
                      </button>
                    )}
                    <button 
                      onClick={() => { logout(); setDropdown(false); }}
                      style={{ ...dropdownItemStyle, color: 'var(--error)' }}
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                )}
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--fg-muted)',
                fontSize: 13
              }}
            >
              <User size={18} />
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const navBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--fg-muted)',
  fontSize: 13,
  cursor: 'pointer',
  padding: '8px 0',
  transition: 'color 0.2s'
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '12px 16px',
  background: 'none',
  border: 'none',
  color: 'var(--fg)',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left'
};