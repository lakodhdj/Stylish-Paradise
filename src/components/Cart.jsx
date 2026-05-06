import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function Cart() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    products, 
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    createOrder // Импортируем новую функцию
  } = useApp();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Москва');
  const [phone, setPhone] = useState('');
  const [deliveryService, setDeliveryService] = useState('courier');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [comment, setComment] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const deliveryCostMap = {
    courier: 490,
    cdek: 390,
    pickup: 0
  };
  const deliveryCost = deliveryCostMap[deliveryService] ?? 0;
  const discountedSubtotal = promoCode.trim().toUpperCase() === 'STYLISH10'
    ? Math.round(cartTotal * 0.9)
    : cartTotal;
  const finalTotal = discountedSubtotal + deliveryCost;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const formatPhoneRu = (raw) => {
    const digits = raw.replace(/\D/g, '').replace(/^8/, '7').replace(/^9/, '79').slice(0, 11);
    const normalized = digits.startsWith('7') ? digits : `7${digits}`.slice(0, 11);
    const p1 = normalized.slice(1, 4);
    const p2 = normalized.slice(4, 7);
    const p3 = normalized.slice(7, 9);
    const p4 = normalized.slice(9, 11);
    let result = '+7';
    if (p1) result += ` (${p1}`;
    if (p1.length === 3) result += ')';
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;
    return result;
  };

  const handleCheckout = () => {
    createOrder({
      address: `${city}, ${address}`.trim(),
      phone,
      deliveryService,
      paymentMethod,
      comment,
      promoCode,
      subtotal: discountedSubtotal,
      deliveryCost,
      total: finalTotal
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 90,
          opacity: isCartOpen ? 1 : 0,
          visibility: isCartOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
      />

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        maxWidth: 470,
        height: '100vh',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        zIndex: 100,
        transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 className="font-display" style={{ fontSize: 20 }}>Корзина</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {cart.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              paddingTop: 60, 
              color: 'var(--fg-muted)' 
            }}>
              <p>Корзина пуста</p>
            </div>
          ) : (
            cart.map(item => {
              const product = products.find(p => p.id === item.productId);
              if (!product) return null;

              return (
                <div 
                  key={item.productId}
                  style={{
                    display: 'flex',
                    gap: 12,
                    paddingBottom: 16,
                    marginBottom: 16,
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{
                    width: 70,
                    height: 84,
                    background: 'var(--bg)',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--fg-muted)'
                      }}>SP</div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 13, marginBottom: 4 }}>{product.name}</h4>
                    <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 8 }}>
                      {formatPrice(product.price)}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        onClick={() => updateCartQuantity(item.productId, -1)}
                        style={qtyBtnStyle}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, width: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateCartQuantity(item.productId, 1)}
                        style={qtyBtnStyle}
                      >
                        <Plus size={12} />
                      </button>

                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        style={{ 
                          marginLeft: 'auto', 
                          background: 'none', 
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--fg-muted)'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout */}
        {cart.length > 0 && (
          <div style={{
            padding: 20,
            borderTop: '1px solid var(--border)'
          }}>
            <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
              <input className="input" placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input" placeholder="Адрес доставки" value={address} onChange={(e) => setAddress(e.target.value)} />
              <input
                className="input"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(formatPhoneRu(e.target.value))}
              />
              <select className="input" value={deliveryService} onChange={(e) => setDeliveryService(e.target.value)}>
                <option value="courier">Курьер (490 ₽)</option>
                <option value="cdek">СДЭК (390 ₽)</option>
                <option value="pickup">Самовывоз (бесплатно)</option>
              </select>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="card">Оплата картой онлайн</option>
                <option value="cash">Оплата при получении</option>
                <option value="sbp">СБП</option>
              </select>
              <input className="input" placeholder="Промокод (например STYLISH10)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <textarea className="input" placeholder="Комментарий к заказу" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 6
            }}>
              <span style={{ color: 'var(--fg-muted)' }}>Товары</span>
              <span style={{ color: 'var(--fg)' }}>{formatPrice(discountedSubtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--fg-muted)' }}>Доставка</span>
              <span style={{ color: 'var(--fg)' }}>{formatPrice(deliveryCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: 'var(--fg-muted)' }}>Итого</span>
              <span className="font-display" style={{ fontSize: 18, color: 'var(--accent)' }}>
                {formatPrice(finalTotal)}
              </span>
            </div>
            <button 
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Подтвердить заказ
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const qtyBtnStyle = {
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
  cursor: 'pointer',
  fontSize: 12
};