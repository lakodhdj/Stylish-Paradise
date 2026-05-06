import { useState } from 'react';
import { X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export default function Catalog() {
  const { filteredProducts, category, setCategory, gender, setGender, brand, setBrand, availableBrands, productsLoading, styleProfile, setStyleProfile } = useApp();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [dropSeed, setDropSeed] = useState(0);

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'new', label: 'Новинки' },
    { id: 'outerwear', label: 'Верхняя одежда' },
    { id: 'dresses', label: 'Платья' },
    { id: 'suits', label: 'Костюмы' },
    { id: 'accessories', label: 'Аксессуары' },
    { id: 'shoes', label: 'Обувь' }
  ];
  const query = searchQuery.trim().toLowerCase();
  const scoreProductByStyle = (product) => {
    let score = 0;
    const text = `${product.name} ${product.description || ''} ${product.features || ''}`.toLowerCase();
    const price = Number(product.price || 0);

    if (styleProfile.occasion === 'office' && (product.category === 'suits' || product.category === 'outerwear')) score += 2;
    if (styleProfile.occasion === 'evening' && (product.category === 'dresses' || text.includes('вечер'))) score += 2;
    if (styleProfile.occasion === 'daily' && (product.category === 'outerwear' || product.category === 'accessories' || product.category === 'shoes')) score += 2;

    if (styleProfile.vibe === 'minimal' && (text.includes('minimal') || text.includes('класс') || text.includes('чист'))) score += 2;
    if (styleProfile.vibe === 'classic' && (text.includes('костюм') || text.includes('пальто') || text.includes('элегант'))) score += 2;
    if (styleProfile.vibe === 'statement' && (text.includes('акцент') || text.includes('ярк') || text.includes('драп'))) score += 2;

    if (styleProfile.budget === 'low' && price <= 25000) score += 2;
    if (styleProfile.budget === 'mid' && price > 25000 && price <= 45000) score += 2;
    if (styleProfile.budget === 'high' && price > 45000) score += 2;

    if (styleProfile.colorMood === 'neutral' && (text.includes('minimal') || text.includes('класс'))) score += 1;
    if (styleProfile.colorMood === 'warm' && (text.includes('золот') || text.includes('кашемир') || text.includes('беж'))) score += 1;
    if (styleProfile.colorMood === 'bold' && (text.includes('акцент') || text.includes('драп'))) score += 1;

    return score;
  };

  const buildRecommendationReason = (product) => {
    const reasons = [];
    const text = `${product.name} ${product.description || ''} ${product.features || ''}`.toLowerCase();
    const price = Number(product.price || 0);

    if (styleProfile.occasion === 'office' && (product.category === 'suits' || product.category === 'outerwear')) {
      reasons.push('подходит под ваш сценарий "Офис"');
    }
    if (styleProfile.occasion === 'evening' && (product.category === 'dresses' || text.includes('вечер'))) {
      reasons.push('подходит для вечерних образов');
    }
    if (styleProfile.occasion === 'daily' && (product.category === 'outerwear' || product.category === 'accessories' || product.category === 'shoes')) {
      reasons.push('хорошо работает для повседневного гардероба');
    }
    if (styleProfile.vibe === 'minimal') reasons.push('соответствует минималистичному стилю');
    if (styleProfile.vibe === 'classic' && (text.includes('костюм') || text.includes('пальто') || text.includes('элегант'))) {
      reasons.push('соответствует классическому стилю');
    }
    if (styleProfile.vibe === 'statement' && (text.includes('акцент') || text.includes('ярк') || text.includes('драп'))) {
      reasons.push('имеет выразительные акцентные детали');
    }
    if (styleProfile.budget === 'low' && price <= 25000) reasons.push('в вашем целевом бюджете');
    if (styleProfile.budget === 'mid' && price > 25000 && price <= 45000) reasons.push('оптимален по бюджету');
    if (styleProfile.budget === 'high' && price > 45000) reasons.push('из премиального ценового сегмента');

    return reasons.slice(0, 2).join(', ') || 'подобран по вашему Style DNA профилю';
  };

  const visibleProducts = filteredProducts
    .filter((product) => {
      if (!query) return true;
      return `${product.name} ${product.description || ''} ${product.material || ''}`.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sortBy === 'price') return Number(a.price) - Number(b.price);
      if (sortBy === 'new') return Number(b.isNew) - Number(a.isNew) || Number(b.id) - Number(a.id);
      if (sortBy === 'personal') return scoreProductByStyle(b) - scoreProductByStyle(a);
      return Number(b.popularity || (b.reviews || []).length) - Number(a.popularity || (a.reviews || []).length);
    });
  const personalDrop = filteredProducts
    .filter((product) => scoreProductByStyle(product) >= 4)
    .sort((a, b) => {
      const base = scoreProductByStyle(b) - scoreProductByStyle(a);
      if (base !== 0) return base;
      const noiseA = Math.sin((Number(a.id) + 1) * (dropSeed + 1)) * 0.5;
      const noiseB = Math.sin((Number(b.id) + 1) * (dropSeed + 1)) * 0.5;
      return noiseB - noiseA;
    })
    .slice(0, 6);

  return (
    <div style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 className="font-display" style={{ fontSize: 32, marginBottom: 8 }}>Каталог</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            {visibleProducts.length} товаров
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, textAlign: 'center' }}>
            Выберите направление
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <button
              className="gender-split-card"
              onClick={() => setGender('women')}
              style={{ borderColor: gender === 'women' ? 'var(--accent)' : 'var(--border)' }}
            >
              <span className="font-display" style={{ fontSize: 24 }}>Женское</span>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Платья, аксессуары, сезонные новинки</span>
            </button>
            <button
              className="gender-split-card"
              onClick={() => setGender('men')}
              style={{ borderColor: gender === 'men' ? 'var(--accent)' : 'var(--border)' }}
            >
              <span className="font-display" style={{ fontSize: 24 }}>Мужское</span>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Костюмы, верхняя одежда, смарт casual</span>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setGender('all')}>Показать все</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setGender('unisex')}>Унисекс</button>
          </div>
        </div>

        {/* Category filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 40
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '10px 20px',
                background: category === cat.id ? 'var(--accent)' : 'transparent',
                border: '1px solid ' + (category === cat.id ? 'var(--accent)' : 'var(--border)'),
                color: category === cat.id ? 'var(--bg)' : 'var(--fg-muted)',
                fontSize: 12,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: 16,
          marginBottom: 20
        }}>
          <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Style DNA: персональный подбор
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            <select className="input" value={styleProfile.vibe} onChange={(e) => setStyleProfile({ ...styleProfile, vibe: e.target.value })}>
              <option value="minimal">Минимализм</option>
              <option value="classic">Классика</option>
              <option value="statement">Акцентный стиль</option>
            </select>
            <select className="input" value={styleProfile.occasion} onChange={(e) => setStyleProfile({ ...styleProfile, occasion: e.target.value })}>
              <option value="office">Офис</option>
              <option value="evening">Вечер</option>
              <option value="daily">На каждый день</option>
            </select>
            <select className="input" value={styleProfile.colorMood} onChange={(e) => setStyleProfile({ ...styleProfile, colorMood: e.target.value })}>
              <option value="neutral">Нейтральная палитра</option>
              <option value="warm">Теплые тона</option>
              <option value="bold">Смелые акценты</option>
            </select>
            <select className="input" value={styleProfile.budget} onChange={(e) => setStyleProfile({ ...styleProfile, budget: e.target.value })}>
              <option value="low">До 25 000 ₽</option>
              <option value="mid">25 000 - 45 000 ₽</option>
              <option value="high">От 45 000 ₽</option>
            </select>
          </div>
        </div>

        {!productsLoading && personalDrop.length > 0 ? (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Ваш персональный дроп
                </p>
                <h2 className="font-display" style={{ fontSize: 24 }}>Подборка от вашего Style DNA</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDropSeed((prev) => prev + 1)}
              >
                Пересобрать дроп
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {personalDrop.map((product) => (
                <ProductCard
                  key={`drop-${product.id}`}
                  product={product}
                  onOpenDetails={setSelectedProduct}
                  isRecommended
                  recommendationReason={buildRecommendationReason(product)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          marginBottom: 24
        }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            placeholder="Поиск: название, описание, материал..."
          />
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popularity">Сначала популярные</option>
            <option value="personal">Рекомендовано вам</option>
            <option value="new">Сначала новинки</option>
            <option value="price">По цене (возрастание)</option>
          </select>
          <select
            className="input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="all">Все бренды</option>
            {availableBrands.map((brandName) => (
              <option key={brandName} value={brandName}>{brandName}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {productsLoading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20
          }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="product-card-skeleton">
                <div className="skeleton shimmer" style={{ aspectRatio: '3/4' }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton shimmer" style={{ height: 10, width: '40%', marginBottom: 10 }} />
                  <div className="skeleton shimmer" style={{ height: 16, width: '70%', marginBottom: 10 }} />
                  <div className="skeleton shimmer" style={{ height: 42, marginBottom: 12 }} />
                  <div className="skeleton shimmer" style={{ height: 12, width: '35%', marginBottom: 12 }} />
                  <div className="skeleton shimmer" style={{ height: 34 }} />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20
          }}>
            {visibleProducts.map((product, index) => (
              <div
                key={product.id}
                className="catalog-card-enter"
                style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
              >
                <ProductCard
                  product={product}
                  onOpenDetails={setSelectedProduct}
                  isRecommended={scoreProductByStyle(product) >= 4}
                  recommendationReason={buildRecommendationReason(product)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)' }}>
            Товары не найдены
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onProductUpdated={setSelectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

function ProductDetailsModal({ product, onClose, onProductUpdated }) {
  const { addToCart, currentUser, addProductReview } = useApp();
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState(currentUser?.name || '');
  const [submittingReview, setSubmittingReview] = useState(false);
  const gallery = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
  const featuresList = (product.features || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setSubmittingReview(true);
    const updated = await addProductReview(product.id, {
      author: reviewAuthor.trim() || currentUser?.name || 'Гость',
      rating: reviewRating,
      text: reviewText.trim()
    });
    setSubmittingReview(false);
    if (updated) {
      onProductUpdated?.(updated);
      setReviewText('');
      setReviewRating(5);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-product" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))' }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)', minHeight: 520 }}>
            {gallery.length > 0 ? (
              <img
                src={gallery[activeImageIndex] || gallery[0]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg)' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                minHeight: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--fg-muted)',
                opacity: 0.4,
                fontSize: 48
              }}>
                <span className="font-display">SP</span>
              </div>
            )}
            {gallery.length > 1 ? (
              <div style={{ display: 'flex', gap: 8, padding: 8, overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
                {gallery.map((image, idx) => (
                  <button
                    key={image + idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      border: idx === activeImageIndex ? '1px solid var(--accent)' : '1px solid var(--border)',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      minWidth: 54,
                      height: 68,
                      overflow: 'hidden'
                    }}
                  >
                    <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ padding: 28, position: 'relative' }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--fg-muted)'
              }}
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>

            <p style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--fg-muted)',
              marginBottom: 10
            }}>
              {categoryNames[product.category] || 'Коллекция'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>
              {(product.brand || 'Без бренда').toUpperCase()}
            </p>

            <h2 className="font-display" style={{ fontSize: 30, marginBottom: 12 }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: 'var(--accent)', fontSize: 16 }}>{renderStars(product.rating || 0)}</span>
              <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                {Number(product.rating || 0).toFixed(1)} ({reviews.length} отзывов)
              </span>
            </div>

            <p style={{ color: 'var(--accent)', fontSize: 22, marginBottom: 18 }}>
              {formatPrice(product.price)}
            </p>

            <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>
              {product.description || 'Стильная модель из актуальной коллекции. Подойдет для повседневного и вечернего образа.'}
            </p>

            <div style={{
              display: 'grid',
              gap: 14,
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              padding: '16px 0',
              marginBottom: 20
            }}>
              <InfoRow label="Материал" value={product.material || 'Материал уточняется'} />
              <InfoRow label="Размер" value={product.size || 'Размеры уточняются'} />
              <div>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>Особенности</p>
                {featuresList.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--fg)', fontSize: 13, lineHeight: 1.5 }}>
                    {featuresList.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--fg)', fontSize: 13 }}>Особенности будут добавлены позже</p>
                )}
              </div>
            </div>

            <button
              onClick={() => addToCart(product.id)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Добавить в корзину
            </button>

            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8 }}>Отзывы покупателей</p>
              {reviews.length > 0 ? (
                <div style={{ display: 'grid', gap: 10, maxHeight: 170, overflowY: 'auto', paddingRight: 4 }}>
                  {reviews.map((review, index) => (
                    <div key={`${review.author}-${index}`} style={{ border: '1px solid var(--border)', padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 13 }}>{review.author || 'Гость'}</p>
                        <p style={{ fontSize: 12, color: 'var(--accent)' }}>{renderStars(review.rating || 0)}</p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.45 }}>{review.text || 'Отзыв без текста'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Пока нет отзывов</p>
              )}

              <form onSubmit={submitReview} style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                <input
                  className="input"
                  placeholder="Ваше имя"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  maxLength={40}
                />
                <select
                  className="input"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                >
                  <option value={5}>5 - Отлично</option>
                  <option value={4}>4 - Хорошо</option>
                  <option value={3}>3 - Нормально</option>
                  <option value={2}>2 - Слабо</option>
                  <option value={1}>1 - Плохо</option>
                </select>
                <textarea
                  className="input"
                  placeholder="Напишите отзыв о товаре..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={500}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm"
                  disabled={submittingReview}
                  style={{ width: '100%' }}
                >
                  {submittingReview ? 'Отправка...' : 'Оставить отзыв'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderStars(value) {
  const rounded = Math.round(Number(value || 0));
  return `${'★'.repeat(Math.min(5, rounded))}${'☆'.repeat(Math.max(0, 5 - rounded))}`;
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--fg)', textAlign: 'right' }}>{value}</p>
    </div>
  );
}