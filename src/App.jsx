import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Admin from './pages/Admin';

function AppContent() {
  const { page, toast } = useApp();
  const year = new Date().getFullYear();
  const socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com/stylishparadise' },
    { label: 'Telegram', href: 'https://t.me/stylishparadise' },
    { label: 'Pinterest', href: 'https://pinterest.com/stylishparadise' },
    { label: 'VK', href: 'https://vk.com/stylishparadise' }
  ];
  const shopLinks = ['Новинки', 'Бестселлеры', 'Подарочные карты', 'Коллекции'];
  const supportLinks = ['Доставка и оплата', 'Возврат', 'FAQ', 'Контакты'];

  return (
    <>
      <Header />
      <Cart />
      <AuthModal />
      
      <main>
        {page === 'home' && <Home />}
        {page === 'catalog' && <Catalog />}
        {page === 'admin' && <Admin />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '56px 0 32px',
        marginTop: 'auto'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.4fr) repeat(3, minmax(160px, 1fr))',
            gap: 26,
            marginBottom: 36
          }}>
            <div>
              <span className="font-display" style={{ fontSize: 22 }}>Stylish Paradise</span>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 10, maxWidth: 280, lineHeight: 1.6 }}>
                Концепт-стор современной одежды и аксессуаров с акцентом на премиальные материалы и вневременной стиль.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      border: '1px solid var(--border)',
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--fg)',
                      textDecoration: 'none'
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <FooterLinkColumn title="Каталог" links={shopLinks} />
            <FooterLinkColumn title="Поддержка" links={supportLinks} />

            <div>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Контакты
              </p>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <a href="tel:+78001234567" style={{ color: 'var(--fg)', textDecoration: 'none' }}>+7 (800) 123-45-67</a>
                <a href="mailto:info@stylishparadise.ru" style={{ color: 'var(--fg)', textDecoration: 'none' }}>info@stylishparadise.ru</a>
                <p style={{ color: 'var(--fg-muted)' }}>Ежедневно с 10:00 до 22:00</p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border)',
            paddingTop: 18
          }}>
            <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              Stylish Paradise © {year}. Все права защищены.
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <a href="#" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>Политика конфиденциальности</a>
              <a href="#" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>Публичная оферта</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: `translateX(-50%) translateY(${toast ? 0 : 100}px)`,
        background: 'var(--bg-card)',
        border: '1px solid var(--accent)',
        padding: '12px 24px',
        fontSize: 13,
        zIndex: 200,
        transition: 'transform 0.3s ease'
      }}>
        {toast}
      </div>
    </>
  );
}

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {title}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {links.map((link) => (
          <a
            key={link}
            href="#"
            style={{ fontSize: 13, color: 'var(--fg)', textDecoration: 'none' }}
          >
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}