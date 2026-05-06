import { useState } from 'react';
import { X, Edit, Trash2, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AdminPanel() {
  const { products, orders, addProduct, updateProduct, deleteProduct } = useApp();
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products' или 'orders'

  const categoryNames = {
    outerwear: 'Верхняя одежда',
    dresses: 'Платья',
    suits: 'Костюмы',
    accessories: 'Аксессуары',
    shoes: 'Обувь'
  };
  const genderNames = {
    women: 'Женское',
    men: 'Мужское',
    unisex: 'Унисекс'
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const handleSave = (data) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div className="container">
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 40
        }}>
          <StatCard label="Товаров" value={products.length} />
          <StatCard label="Заказов" value={orders.length} />
          <StatCard label="Выручка" value={formatPrice(orders.reduce((sum, o) => sum + o.total, 0))} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('products')}
            style={{ 
              ...tabStyle, 
              borderBottomColor: activeTab === 'products' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'products' ? 'var(--fg)' : 'var(--fg-muted)'
            }}
          >
            Товары
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ 
              ...tabStyle, 
              borderBottomColor: activeTab === 'orders' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'orders' ? 'var(--fg)' : 'var(--fg-muted)'
            }}
          >
            Заказы
          </button>
        </div>

        {/* Content */}
        {activeTab === 'products' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: 24 }}>Список товаров</h2>
              <button 
                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                className="btn btn-primary btn-sm"
              >
                Добавить товар
              </button>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>Товар</th>
                    <th style={thStyle}>Бренд</th>
                    <th style={thStyle}>Категория</th>
                    <th style={thStyle}>Пол</th>
                    <th style={thStyle}>Цена</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 48, height: 56, background: 'var(--bg)', overflow: 'hidden' }}>
                            {product.image ? (
                              <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 12 }}>SP</div>
                            )}
                          </div>
                          <span style={{ fontSize: 14 }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>{product.brand || 'Без бренда'}</td>
                      <td style={tdStyle}>{categoryNames[product.category]}</td>
                      <td style={tdStyle}>{genderNames[product.gender] || 'Унисекс'}</td>
                      <td style={{ ...tdStyle, color: 'var(--accent)' }}>{formatPrice(product.price)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', marginRight: 8 }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-display" style={{ fontSize: 24, marginBottom: 24 }}>Список заказов</h2>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--fg-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Package size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p>Заказов пока нет</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Клиент</p>
                        <p style={{ fontSize: 15, fontWeight: 500 }}>{order.userName}</p>
                        <p style={{ fontSize: 13, color: 'var(--accent)' }}>{order.userEmail}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Дата</p>
                        <p style={{ fontSize: 13 }}>{order.date}</p>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '10px 0', marginBottom: 12, display: 'grid', gap: 6 }}>
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Доставка: <span style={{ color: 'var(--fg)' }}>{deliveryName(order.deliveryService)} ({formatPrice(order.deliveryCost || 0)})</span></p>
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Оплата: <span style={{ color: 'var(--fg)' }}>{paymentName(order.paymentMethod)}</span></p>
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Адрес: <span style={{ color: 'var(--fg)' }}>{order.address || 'Не указан'}</span></p>
                      <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Телефон: <span style={{ color: 'var(--fg)' }}>{order.phone || 'Не указан'}</span></p>
                      {order.comment ? <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Комментарий: <span style={{ color: 'var(--fg)' }}>{order.comment}</span></p> : null}
                    </div>
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span>{item.name} x {item.quantity}</span>
                          <span style={{ color: 'var(--fg-muted)' }}>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <span style={{ fontWeight: 500 }}>Итого:</span>
                      <span className="font-display" style={{ fontSize: 18, color: 'var(--accent)' }}>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal 
          product={editingProduct}
          onSave={handleSave}
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20 }}>
      <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>{label}</p>
      <p className="font-display" style={{ fontSize: 28, color: 'var(--accent)' }}>{value}</p>
    </div>
  );
}

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: '', gender: 'unisex', price: '', description: '', material: '', features: '', size: '', isNew: false, isActive: true,
    ...product
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('name', form.name || '');
    payload.append('brand', form.brand || '');
    payload.append('category', form.category || '');
    payload.append('gender', form.gender || 'unisex');
    payload.append('price', String(parseInt(form.price, 10) || 0));
    payload.append('description', form.description || '');
    payload.append('material', form.material || '');
    payload.append('features', form.features || '');
    payload.append('size', form.size || '');
    payload.append('isNew', String(!!form.isNew));
    payload.append('isActive', String(!!form.isActive));
    payload.append('popularity', String(form.popularity || 0));
    payload.append('rating', String(form.rating || 0));
    payload.append('reviews', JSON.stringify(form.reviews || []));
    payload.append('existingImages', JSON.stringify(form.images || []));
    selectedFiles.forEach((file) => payload.append('images', file));
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display" style={{ fontSize: 20 }}>{product ? 'Редактировать' : 'Новый товар'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Название</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Категория</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                <option value="">Выберите...</option>
                <option value="outerwear">Верхняя одежда</option>
                <option value="dresses">Платья</option>
                <option value="suits">Костюмы</option>
                <option value="accessories">Аксессуары</option>
                <option value="shoes">Обувь</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Бренд</label>
              <input type="text" className="input" value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Например: Montblanc" />
            </div>
            <div>
              <label style={labelStyle}>Цена (₽)</label>
              <input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required min="0" />
            </div>
            <div>
              <label style={labelStyle}>Пол</label>
              <select className="input" value={form.gender || 'unisex'} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="women">Женское</option>
                <option value="men">Мужское</option>
                <option value="unisex">Унисекс</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Загрузить изображения (можно несколько)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="input"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              />
              <p style={{ marginTop: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
                {selectedFiles.length > 0 ? `Выбрано файлов: ${selectedFiles.length}` : 'Если выберете файлы, они будут загружены в MinIO в папку товара.'}
              </p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Описание</label>
              <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Материал</label>
              <input type="text" className="input" value={form.material || ''} onChange={e => setForm({ ...form, material: e.target.value })} placeholder="Например: 80% хлопок, 20% полиэстер" />
            </div>
            <div>
              <label style={labelStyle}>Размер</label>
              <input type="text" className="input" value={form.size || ''} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Например: XS-S-M-L или One size" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Особенности</label>
              <textarea className="input" value={form.features || ''} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="Введите через запятую: драпировка, карманы, съемный пояс" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isNew} onChange={e => setForm({ ...form, isNew: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: 13 }}>Новинка</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: 13 }}>Активен</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" className="btn btn-primary">Сохранить</button>
            <button type="button" onClick={onClose} className="btn btn-ghost">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const tabStyle = {
  padding: '12px 0',
  background: 'none',
  border: 'none',
  borderBottomWidth: 2,
  borderBottomStyle: 'solid',
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const thStyle = { textAlign: 'left', padding: 16, fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 };
const tdStyle = { padding: 16, fontSize: 13, color: 'var(--fg)' };
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 };

function deliveryName(type) {
  if (type === 'courier') return 'Курьер';
  if (type === 'cdek') return 'СДЭК';
  if (type === 'pickup') return 'Самовывоз';
  return 'Стандарт';
}

function paymentName(type) {
  if (type === 'cash') return 'При получении';
  if (type === 'sbp') return 'СБП';
  return 'Карта онлайн';
}