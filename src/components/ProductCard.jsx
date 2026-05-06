import { ShoppingBag, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function ProductCard({ product, onOpenDetails, isRecommended = false, recommendationReason = '' }) {
  const { addToCart } = useApp();
  const [showReason, setShowReason] = useState(false);
  const mainImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '';

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const categoryNames = {
    outerwear: 'Верхняя одежда',
    dresses: 'Платья',
    suits: 'Костюмы',
    accessories: 'Аксессуары',
    shoes: 'Обувь'
  };

  return (
    <div className="product-card" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
    }}>
      {/* Image */}
      <div className="product-card-image" style={{
        aspectRatio: '4/5',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)'
      }}>
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--fg-muted)',
            opacity: 0.3
          }}>
            <span className="font-display" style={{ fontSize: 48 }}>SP</span>
          </div>
        )}
        
        {product.isNew && (
          <span style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'var(--accent)',
            color: 'var(--bg)',
            padding: '4px 10px',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}>
            NEW
          </span>
        )}

        {isRecommended && (
          <span className="recommended-badge">
            Рекомендовано вам
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <p style={{ 
          fontSize: 11, 
          color: 'var(--fg-muted)', 
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {categoryNames[product.category]}
        </p>
        
        <h3 style={{ 
          fontSize: 15, 
          fontWeight: 500, 
          marginBottom: 8,
          color: 'var(--fg)'
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Star size={14} fill="currentColor" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, color: 'var(--fg)' }}>{Number(product.rating || 0).toFixed(1)}</span>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>({(product.reviews || []).length} отзывов)</span>
        </div>

        <p style={{
          fontSize: 12,
          color: 'var(--fg-muted)',
          marginBottom: 14,
          lineHeight: 1.45,
          minHeight: 34
        }}>
          {product.description ? `${product.description.slice(0, 70)}${product.description.length > 70 ? '...' : ''}` : 'Элегантная вещь премиального качества для вашего образа.'}
        </p>
        
        <p style={{ 
          color: 'var(--accent)', 
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 12,
          marginTop: 'auto'
        }}>
          {formatPrice(product.price)}
        </p>

        <div style={{ display: 'grid', gap: 8 }}>
          {isRecommended && recommendationReason ? (
            <>
              <button
                onClick={() => setShowReason((prev) => !prev)}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%' }}
              >
                Почему рекомендовано?
              </button>
              {showReason ? (
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.45 }}>
                  {recommendationReason}
                </p>
              ) : null}
            </>
          ) : null}

          <button
            onClick={() => onOpenDetails?.(product)}
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
          >
            Подробнее
          </button>

          <button 
            onClick={() => addToCart(product.id)}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%' }}
          >
            <ShoppingBag size={14} />
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}