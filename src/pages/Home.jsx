import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { products, setPage } = useApp();
  const featured = products.filter(p => p.isActive).slice(0, 4);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        paddingTop: 64
      }}>
        <div style={{ maxWidth: 600 }}>
          <p style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            color: 'var(--accent)',
            marginBottom: 16,
            textTransform: 'uppercase'
          }}>
            Designer Collection
          </p>
          
          <h1 className="font-display" style={{
            fontSize: 'clamp(36px, 8vw, 64px)',
            lineHeight: 1.1,
            marginBottom: 24
          }}>
            Стиль — это способ сказать, кто ты
          </h1>
          
          <p style={{
            fontSize: 15,
            color: 'var(--fg-muted)',
            marginBottom: 32,
            maxWidth: 480,
            marginInline: 'auto'
          }}>
            Авторская одежда для тех, кто ценит качество и индивидуальность
          </p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('catalog')} className="btn btn-primary">
              Смотреть каталог
            </button>
            <button onClick={() => setPage('catalog')} className="btn btn-ghost">
              Новая коллекция
            </button>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            marginBottom: 32
          }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>
                Избранное
              </p>
              <h2 className="font-display" style={{ fontSize: 28 }}>Популярные модели</h2>
            </div>
            <button 
              onClick={() => setPage('catalog')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--fg-muted)', 
                fontSize: 13, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Все товары →
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20
          }}>
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section style={{ 
        padding: '60px 0', 
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 48,
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>
                О нас
              </p>
              <h2 className="font-display" style={{ fontSize: 28, marginBottom: 16 }}>
                Философия бренда
              </h2>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.7 }}>
                Мы создаём одежду для людей, которые понимают ценность деталей. 
                Каждая вещь в нашей коллекции — это баланс между комфортом и эстетикой.
              </p>
            </div>
            <div style={{
              aspectRatio: '1',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="font-display" style={{ fontSize: 80, color: 'var(--fg)', opacity: 0.1 }}>SP</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}