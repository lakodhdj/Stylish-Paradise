import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [page, setPage] = useState('home');
  const [category, setCategory] = useState('all');
  const [gender, setGender] = useState('all');
  const [brand, setBrand] = useState('all');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [styleProfile, setStyleProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('styleProfile') || 'null') || {
        vibe: 'minimal',
        occasion: 'office',
        colorMood: 'neutral',
        budget: 'mid'
      };
    } catch {
      return {
        vibe: 'minimal',
        occasion: 'office',
        colorMood: 'neutral',
        budget: 'mid'
      };
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const API = '/api';

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      showToast('Ошибка загрузки товаров');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      showToast('Ошибка загрузки заказов');
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('styleProfile', JSON.stringify(styleProfile));
  }, [styleProfile]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = async (email, password) => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      showToast('Неверные данные');
      return false;
    }

    const user = await res.json();
    setCurrentUser(user);
    setIsAuthOpen(false);
    showToast(`Привет, ${user.name}!`);
    return true;
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      showToast('Email уже занят');
      return false;
    }

    const user = await res.json();
    setCurrentUser(user);
    setIsAuthOpen(false);
    showToast('Аккаунт создан');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setPage('home');
    showToast('До встречи!');
  };

  const addToCart = (productId) => {
    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      setCart(cart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
    showToast('Добавлено в корзину');
  };

  const updateCartQuantity = (productId, delta) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.productId !== productId));
    } else {
      setCart(cart.map((i) => i.productId === productId ? { ...i, quantity: newQty } : i));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const createOrder = async (checkoutData = {}) => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      showToast('Войдите для оформления');
      return;
    }
    if (cart.length === 0) return;

    const items = cart.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : 'Товар удален',
        price: product ? product.price : 0,
        quantity: item.quantity
      };
    });

    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        total: checkoutData.total ?? cartTotal,
        subtotal: checkoutData.subtotal ?? cartTotal,
        deliveryCost: checkoutData.deliveryCost ?? 0,
        deliveryService: checkoutData.deliveryService ?? 'standard',
        paymentMethod: checkoutData.paymentMethod ?? 'card',
        address: checkoutData.address ?? '',
        phone: checkoutData.phone ?? '',
        comment: checkoutData.comment ?? '',
        promoCode: checkoutData.promoCode ?? '',
        items
      })
    });

    if (!res.ok) {
      showToast('Ошибка оформления заказа');
      return;
    }

    const newOrder = await res.json();
    setOrders([newOrder, ...orders]);
    setCart([]);
    setIsCartOpen(false);
    showToast('Заказ успешно оформлен!');
  };

  const addProduct = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });
    if (!res.ok) { showToast('Ошибка добавления товара'); return; }
    const product = await res.json();
    setProducts([...products, product]);
    showToast('Товар добавлен');
  };

  const updateProduct = async (id, data) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API}/products/${id}`, {
      method: 'PUT',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });
    if (!res.ok) { showToast('Ошибка обновления'); return; }
    const updated = await res.json();
    setProducts(products.map((p) => p.id === id ? updated : p));
    showToast('Сохранено');
  };

  const deleteProduct = async (id) => {
    const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Ошибка удаления'); return; }
    setProducts(products.filter((p) => p.id !== id));
    showToast('Удалено');
  };

  const addProductReview = async (productId, data) => {
    const res = await fetch(`${API}/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      showToast('Не удалось добавить отзыв');
      return null;
    }

    const updatedProduct = await res.json();
    setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)));
    showToast('Отзыв добавлен');
    return updatedProduct;
  };

  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (gender !== 'all' && (p.gender || 'unisex') !== gender) return false;
    if (brand !== 'all' && (p.brand || 'Без бренда') !== brand) return false;
    if (category === 'all') return true;
    if (category === 'new') return p.isNew;
    return p.category === category;
  });
  const availableBrands = Array.from(
    new Set(products.map((p) => (p.brand || 'Без бренда')).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'ru'));

  const value = {
    products,
    cart,
    orders,
    currentUser,
    page,
    category,
    gender,
    brand,
    availableBrands,
    theme,
    styleProfile,
    isCartOpen,
    isAuthOpen,
    toast,
    productsLoading,
    filteredProducts,
    cartTotal,
    cartCount,
    setPage,
    setCategory,
    setGender,
    setBrand,
    toggleTheme,
    setStyleProfile,
    setIsCartOpen,
    setIsAuthOpen,
    login,
    register,
    logout,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    createOrder,
    addProductReview,
    addProduct,
    updateProduct,
    deleteProduct
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
