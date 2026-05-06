import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { Client as MinioClient } from 'minio';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Подаем статические файлы из папки dist для production
app.use(express.static(path.join(__dirname, 'dist')));

const DB_FILE = process.env.DB_FILE || './database.sqlite';
const PASSWORD_HASH_PREFIX = 'scrypt$';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'products';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = Number(process.env.MINIO_PORT || 9000);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 12 }
});

const minioClient = new MinioClient({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
});

function promisifyDb(db) {
  const originalRun = db.run.bind(db);
  const originalGet = db.get.bind(db);
  const originalAll = db.all.bind(db);
  const originalExec = db.exec.bind(db);
  
  return {
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        originalRun(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        originalGet(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        originalAll(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    exec: (sql) => {
      return new Promise((resolve, reject) => {
        originalExec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
}

function openDb() {
  const db = new sqlite3.Database(DB_FILE);
  return promisifyDb(db);
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(`${PASSWORD_HASH_PREFIX}${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedPassword) {
  return new Promise((resolve) => {
    if (!storedPassword) {
      resolve(false);
      return;
    }

    if (!storedPassword.startsWith(PASSWORD_HASH_PREFIX)) {
      resolve(password === storedPassword);
      return;
    }

    const parts = storedPassword.split('$');
    if (parts.length !== 3) {
      resolve(false);
      return;
    }

    const [, salt, hash] = parts;
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        resolve(false);
        return;
      }
      const storedBuffer = Buffer.from(hash, 'hex');
      const derivedBuffer = Buffer.from(derivedKey);
      if (storedBuffer.length !== derivedBuffer.length) {
        resolve(false);
        return;
      }
      resolve(crypto.timingSafeEqual(storedBuffer, derivedBuffer));
    });
  });
}

function parseReviews(rawReviews) {
  if (!rawReviews) return [];
  if (Array.isArray(rawReviews)) return rawReviews;
  try {
    const parsed = JSON.parse(rawReviews);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseImages(rawImages) {
  if (!rawImages) return [];
  if (Array.isArray(rawImages)) return rawImages.filter(Boolean);
  try {
    const parsed = JSON.parse(rawImages);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    return [];
  }
  return [];
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

function buildMinioPublicUrl(objectName) {
  const encodedPath = objectName.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${encodedPath}`;
}

function isMinioImageUrl(url) {
  if (!url) return false;
  return typeof url === 'string' && url.includes(`/${MINIO_BUCKET}/product-`);
}

async function ensureMinioBucket() {
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1');
  }
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`]
      }
    ]
  };
  await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
}

async function uploadImagesToMinio(files, productId) {
  if (!files || files.length === 0) return [];
  const uploaded = [];
  for (const file of files) {
    const objectName = `product-${productId}/${Date.now()}-${sanitizeFilename(file.originalname)}`;
    await minioClient.putObject(MINIO_BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype || 'application/octet-stream'
    });
    uploaded.push(buildMinioPublicUrl(objectName));
  }
  return uploaded;
}

function normalizeProduct(product) {
  if (!product) return product;
  const reviews = parseReviews(product.reviews);
  const averageRating = reviews.length > 0
    ? Number((reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1))
    : Number(product.rating || 0);

  return {
    ...product,
    brand: product.brand || 'Без бренда',
    isNew: !!product.isNew,
    isActive: !!product.isActive,
    gender: product.gender || inferGenderByCategory(product.category),
    images: parseImages(product.images),
    popularity: Number(product.popularity || reviews.length || 0),
    rating: averageRating,
    reviews
  };
}

function inferGenderByCategory(category) {
  if (category === 'dresses') return 'women';
  if (category === 'suits') return 'men';
  return 'unisex';
}

async function expandCatalogIfNeeded(db) {
  const currentProducts = await db.all('SELECT id, name FROM products');
  if (currentProducts.length >= 36) return;

  const existingNames = new Set(currentProducts.map((product) => product.name));
  const nextId = currentProducts.reduce((max, product) => Math.max(max, Number(product.id || 0)), 0) + 1;

  const additionalProducts = [
    { name: 'Оправа Meisterstück', brand: 'Montblanc', category: 'accessories', gender: 'unisex', price: 31500, description: 'Титановая оправа для оптических линз', material: 'Титан, ацетат', features: 'Легкий вес,Сменные носоупоры,Премиальная посадка', size: 'One size', popularity: 141, rating: 4.8, image: '', isNew: 1, isActive: 1 },
    { name: 'Хлопковая бейсболка', brand: 'Paul & Shark', category: 'accessories', gender: 'men', price: 25250, description: 'Бейсболка из плотного хлопка', material: '100% хлопок', features: 'Регулируемая застежка,Вышитый логотип,Дышащая ткань', size: 'One size', popularity: 122, rating: 4.6, image: '', isNew: 0, isActive: 1 },
    { name: 'Хлопковая толстовка DG', brand: 'Dolce & Gabbana', category: 'outerwear', gender: 'unisex', price: 68900, description: 'Премиальная толстовка из мягкого футера', material: '95% хлопок, 5% эластан', features: 'Объемный крой,Вышивка на груди,Капюшон с кулиской', size: 'S-M-L-XL', popularity: 150, rating: 4.9, image: '', isNew: 1, isActive: 1 },
    { name: 'Кеды Court Classic', brand: 'Saint Laurent', category: 'shoes', gender: 'unisex', price: 74500, description: 'Кожаные кеды в минималистичном стиле', material: 'Натуральная кожа', features: 'Плоская подошва,Мягкая стелька,Лаконичный силуэт', size: '40-45', popularity: 133, rating: 4.7, image: '', isNew: 0, isActive: 1 },
    { name: 'Лоферы Gommino', brand: 'Tod’s', category: 'shoes', gender: 'men', price: 59800, description: 'Замшевые лоферы для smart casual', material: 'Замша', features: 'Ручная строчка,Гибкая подошва,Классический верх', size: '41-45', popularity: 110, rating: 4.5, image: '', isNew: 0, isActive: 1 },
    { name: 'Туфли Satin Slingback', brand: 'Jimmy Choo', category: 'shoes', gender: 'women', price: 93900, description: 'Вечерние туфли с ремешком на пятке', material: 'Сатин, натуральная кожа', features: 'Каблук 8 см,Стелька из кожи,Премиальная фурнитура', size: '36-40', popularity: 159, rating: 4.9, image: '', isNew: 1, isActive: 1 },
    { name: 'Шерстяное пальто', brand: 'Max Mara', category: 'outerwear', gender: 'women', price: 118000, description: 'Длинное пальто прямого кроя', material: '90% шерсть, 10% кашемир', features: 'Пояс в комплекте,Подкладка из вискозы,Мягкая линия плеч', size: 'XS-S-M-L', popularity: 172, rating: 4.8, image: '', isNew: 1, isActive: 1 },
    { name: 'Бомбер Tech Shell', brand: 'Zegna', category: 'outerwear', gender: 'men', price: 87500, description: 'Легкий бомбер для города', material: 'Технический нейлон', features: 'Водоотталкивающая ткань,Двусторонняя молния,Эластичные манжеты', size: 'M-L-XL', popularity: 99, rating: 4.4, image: '', isNew: 0, isActive: 1 },
    { name: 'Солнцезащитные очки Pilot', brand: 'Tom Ford', category: 'accessories', gender: 'unisex', price: 38200, description: 'Авиаторы с дымчатыми линзами', material: 'Металл, ацетат', features: 'UV400 защита,Градиентные линзы,Фирменные дужки', size: 'One size', popularity: 129, rating: 4.7, image: '', isNew: 0, isActive: 1 },
    { name: 'Кашемировый джемпер', brand: 'Brunello Cucinelli', category: 'outerwear', gender: 'men', price: 96500, description: 'Джемпер тонкой вязки для многослойных образов', material: '100% кашемир', features: 'Мягкая пряжа,Классическая посадка,Усиленный ворот', size: 'S-M-L-XL', popularity: 144, rating: 4.8, image: '', isNew: 1, isActive: 1 },
    { name: 'Сумка Le 5 à 7', brand: 'Saint Laurent', category: 'accessories', gender: 'women', price: 154000, description: 'Иконическая сумка из гладкой кожи', material: 'Натуральная кожа', features: 'Магнитный клапан,Регулируемый ремень,Подкладка из замши', size: 'One size', popularity: 136, rating: 4.7, image: '', isNew: 0, isActive: 1 },
    { name: 'Кожаные дерби', brand: 'Prada', category: 'shoes', gender: 'men', price: 82100, description: 'Классические дерби с массивной подошвой', material: 'Полированная кожа', features: 'Шнуровка на 5 люверсов,Фирменная стелька,Прочная подошва', size: '40-45', popularity: 109, rating: 4.5, image: '', isNew: 0, isActive: 1 }
  ];

  let idCursor = nextId;
  for (const product of additionalProducts) {
    if (existingNames.has(product.name)) continue;
    const generatedReviews = JSON.stringify([
      { author: 'Клиент', rating: Math.max(4, Number(product.rating || 4.5) - 0.1), text: 'Качество и посадка на высоте.' },
      { author: 'Покупатель', rating: Number(product.rating || 4.5), text: 'Отлично смотрится в образе.' }
    ]);
    await db.run(
      'INSERT INTO products (id, name, brand, category, gender, price, description, material, features, size, popularity, rating, reviews, image, images, isNew, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [idCursor, product.name, product.brand || 'Без бренда', product.category, product.gender || inferGenderByCategory(product.category), product.price, product.description, product.material, product.features, product.size, product.popularity, product.rating, generatedReviews, product.image || '', JSON.stringify(product.image ? [product.image] : []), product.isNew, product.isActive]
    );
    idCursor += 1;
  }
}

async function initDb() {
  const db = openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      category TEXT,
      price REAL,
      description TEXT,
      image TEXT,
      isNew INTEGER,
      isActive INTEGER
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      isAdmin INTEGER
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      userName TEXT,
      userEmail TEXT,
      total REAL,
      subtotal REAL,
      deliveryCost REAL,
      deliveryService TEXT,
      paymentMethod TEXT,
      address TEXT,
      phone TEXT,
      comment TEXT,
      promoCode TEXT,
      date TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,
      orderId INTEGER,
      productId INTEGER,
      name TEXT,
      price REAL,
      quantity INTEGER
    );
  `);

  const productColumns = await db.all('PRAGMA table_info(products)');
  const hasMaterial = productColumns.some((column) => column.name === 'material');
  const hasFeatures = productColumns.some((column) => column.name === 'features');
  const hasSize = productColumns.some((column) => column.name === 'size');
  const hasPopularity = productColumns.some((column) => column.name === 'popularity');
  const hasRating = productColumns.some((column) => column.name === 'rating');
  const hasReviews = productColumns.some((column) => column.name === 'reviews');
  const hasGender = productColumns.some((column) => column.name === 'gender');
  const hasImages = productColumns.some((column) => column.name === 'images');
  const hasBrand = productColumns.some((column) => column.name === 'brand');

  if (!hasMaterial) {
    await db.run('ALTER TABLE products ADD COLUMN material TEXT');
  }
  if (!hasFeatures) {
    await db.run('ALTER TABLE products ADD COLUMN features TEXT');
  }
  if (!hasSize) {
    await db.run('ALTER TABLE products ADD COLUMN size TEXT');
  }
  if (!hasPopularity) {
    await db.run('ALTER TABLE products ADD COLUMN popularity INTEGER DEFAULT 0');
  }
  if (!hasRating) {
    await db.run('ALTER TABLE products ADD COLUMN rating REAL DEFAULT 0');
  }
  if (!hasReviews) {
    await db.run('ALTER TABLE products ADD COLUMN reviews TEXT');
  }
  if (!hasGender) {
    await db.run("ALTER TABLE products ADD COLUMN gender TEXT DEFAULT 'unisex'");
  }
  if (!hasImages) {
    await db.run('ALTER TABLE products ADD COLUMN images TEXT');
  }
  if (!hasBrand) {
    await db.run("ALTER TABLE products ADD COLUMN brand TEXT DEFAULT 'Без бренда'");
  }

  const productsCount = await db.get('SELECT COUNT(*) as cnt FROM products');
  if (productsCount.cnt === 0) {
    const defaultProducts = [
      { id: 1, name: 'Пальто Milano', category: 'outerwear', price: 45000, description: 'Кашемировое пальто свободного кроя', material: '80% кашемир, 20% шерсть', features: 'Пояс на талии,Премиальная подкладка,Скрытые карманы', size: 'XS-S-M-L', popularity: 184, rating: 4.8, reviews: JSON.stringify([{ author: 'Анна', rating: 5, text: 'Очень теплое и легкое, выглядит дорого.' }, { author: 'Мария', rating: 4.6, text: 'Посадка отличная, ткань премиальная.' }]), image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop', isNew: 1, isActive: 1 },
      { id: 2, name: 'Платье Athena', category: 'dresses', price: 28000, description: 'Шёлковое платье миди', material: '100% шелк', features: 'Легкая драпировка,Акцент на талии,Воздушный силуэт', size: 'S-M-L', popularity: 143, rating: 4.7, reviews: JSON.stringify([{ author: 'Екатерина', rating: 4.8, text: 'Очень женственный силуэт.' }, { author: 'Ольга', rating: 4.6, text: 'Идеально для вечера и фотосессий.' }]), image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop', isNew: 1, isActive: 1 },
      { id: 3, name: 'Костюм Noble', category: 'suits', price: 52000, description: 'Двубортный костюм из шерсти', material: '70% шерсть, 28% вискоза, 2% эластан', features: 'Приталенный жакет,Брюки высокой посадки,Двубортная застежка', size: 'S-M-L-XL', popularity: 126, rating: 4.9, reviews: JSON.stringify([{ author: 'София', rating: 5, text: 'Крой безупречный, сразу сел по фигуре.' }, { author: 'Ирина', rating: 4.8, text: 'Идеальный костюм для деловых встреч.' }]), image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop', isNew: 0, isActive: 1 },
      { id: 4, name: 'Сумка Minimal', category: 'accessories', price: 15000, description: 'Кожаная сумка-тоут', material: 'Натуральная кожа', features: 'Вместительный формат,Внутренний карман на молнии,Магнитная застежка', size: 'One size', popularity: 212, rating: 4.7, reviews: JSON.stringify([{ author: 'Юлия', rating: 4.7, text: 'Универсальная, ношу каждый день.' }, { author: 'Наталья', rating: 4.6, text: 'Качественная кожа и фурнитура.' }]), image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop', isNew: 1, isActive: 1 },
      { id: 5, name: 'Жакет Paris', category: 'outerwear', price: 25000, description: 'Укороченный жакет', material: '65% шерсть, 35% полиэстер', features: 'Структурные плечи,Металлические пуговицы,Акцентный воротник', size: 'XS-S-M', popularity: 98, rating: 4.5, reviews: JSON.stringify([{ author: 'Дарья', rating: 4.5, text: 'Стильный акцент для базового гардероба.' }, { author: 'Алёна', rating: 4.4, text: 'Отлично сочетается с джинсами и юбкой.' }]), image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop', isNew: 0, isActive: 1 },
      { id: 6, name: 'Платье Luna', category: 'dresses', price: 22000, description: 'Вечернее платье в пол', material: '95% полиэстер, 5% эластан', features: 'Открытая линия плеч,Элегантный разрез,Подкладка по всей длине', size: 'S-M', popularity: 156, rating: 4.8, reviews: JSON.stringify([{ author: 'Виктория', rating: 4.9, text: 'Получила много комплиментов на мероприятии.' }, { author: 'Полина', rating: 4.7, text: 'Красиво садится и не мнется.' }]), image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop', isNew: 0, isActive: 1 }
    ];

    for (const p of defaultProducts) {
      await db.run(
        `INSERT INTO products (id, name, category, price, description, material, features, size, popularity, rating, reviews, image, images, isNew, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [p.id, p.name, p.category, p.price, p.description, p.material, p.features, p.size, p.popularity, p.rating, p.reviews, p.image, JSON.stringify([p.image]), p.isNew, p.isActive]
      );
    }
  }
  await db.run("UPDATE products SET gender = ? WHERE category = 'dresses' AND (gender IS NULL OR gender = '' OR gender = 'unisex');", ['women']);
  await db.run("UPDATE products SET gender = ? WHERE category = 'suits' AND (gender IS NULL OR gender = '' OR gender = 'unisex');", ['men']);
  await db.run("UPDATE products SET gender = ? WHERE category IN ('outerwear', 'accessories') AND (gender IS NULL OR gender = '');", ['unisex']);
  await db.run("UPDATE products SET brand = 'Без бренда' WHERE brand IS NULL OR brand = '';");
  await db.run("UPDATE products SET images = json_array(image) WHERE (images IS NULL OR images = '') AND image IS NOT NULL AND image != '';");
  try {
    await ensureMinioBucket();
  } catch (error) {
    console.error('MinIO init warning:', error.message);
  }

  // Hard migration: keep only MinIO-hosted images, drop old external URLs.
  const productsForImageCleanup = await db.all('SELECT id, images, image FROM products');
  for (const product of productsForImageCleanup) {
    const images = parseImages(product.images).filter(isMinioImageUrl);
    const coverImage = images[0] || '';
    await db.run('UPDATE products SET images = ?, image = ? WHERE id = ?', [JSON.stringify(images), coverImage, product.id]);
  }
  await expandCatalogIfNeeded(db);

  const usersCount = await db.get('SELECT COUNT(*) as cnt FROM users');
  if (usersCount.cnt === 0) {
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');
    const defaultUsers = [
      { id: 1, name: 'Админ', email: 'admin@shop.ru', password: adminPassword, isAdmin: 1 },
      { id: 2, name: 'Пользователь', email: 'user@shop.ru', password: userPassword, isAdmin: 0 }
    ];
    for (const u of defaultUsers) {
      await db.run(`INSERT INTO users (id, name, email, password, isAdmin) VALUES (?, ?, ?, ?, ?);`, [u.id, u.name, u.email, u.password, u.isAdmin]);
    }
  }

  const orderColumns = await db.all('PRAGMA table_info(orders)');
  const ensureOrderColumn = async (name, definition) => {
    if (!orderColumns.some((column) => column.name === name)) {
      await db.run(`ALTER TABLE orders ADD COLUMN ${name} ${definition}`);
    }
  };
  await ensureOrderColumn('subtotal', 'REAL DEFAULT 0');
  await ensureOrderColumn('deliveryCost', 'REAL DEFAULT 0');
  await ensureOrderColumn('deliveryService', "TEXT DEFAULT 'standard'");
  await ensureOrderColumn('paymentMethod', "TEXT DEFAULT 'card'");
  await ensureOrderColumn('address', "TEXT DEFAULT ''");
  await ensureOrderColumn('phone', "TEXT DEFAULT ''");
  await ensureOrderColumn('comment', "TEXT DEFAULT ''");
  await ensureOrderColumn('promoCode', "TEXT DEFAULT ''");

  return db;
}

let dbPromise = null;

app.use(async (req, res, next) => {
  if (!dbPromise) dbPromise = initDb();
  req.db = await dbPromise;
  next();
});

app.get('/api/products', async (req, res) => {
  const products = await req.db.all('SELECT * FROM products');
  res.json(products.map(normalizeProduct));
});

app.post('/api/products', upload.array('images', 12), async (req, res) => {
  const { name, brand, category, gender, price, description, material, features, size, popularity, rating, reviews, image, isNew, isActive } = req.body;
  const parsedReviews = typeof reviews === 'string' ? JSON.parse(reviews || '[]') : (reviews || []);
  const result = await req.db.run(
    'INSERT INTO products (name, brand, category, gender, price, description, material, features, size, popularity, rating, reviews, image, images, isNew, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [
      name,
      (brand || 'Без бренда').toString().trim(),
      category,
      gender || inferGenderByCategory(category),
      Number(price) || 0,
      description || '',
      material || '',
      features || '',
      size || '',
      Number(popularity) || 0,
      Number(rating) || 0,
      JSON.stringify(parsedReviews),
      image || '',
      JSON.stringify([]),
      parseBoolean(isNew) ? 1 : 0,
      parseBoolean(isActive) ? 1 : 0
    ]
  );
  const productId = result.lastID;
  const uploadedImages = await uploadImagesToMinio(req.files, productId);
  const existingImages = image ? [image] : [];
  const images = [...existingImages, ...uploadedImages];
  const coverImage = images[0] || '';
  await req.db.run('UPDATE products SET image = ?, images = ? WHERE id = ?', [coverImage, JSON.stringify(images), productId]);

  const product = await req.db.get('SELECT * FROM products WHERE id = ?', [productId]);
  res.json(normalizeProduct(product));
});

app.put('/api/products/:id', upload.array('images', 12), async (req, res) => {
  const { id } = req.params;
  const { name, brand, category, gender, price, description, material, features, size, popularity, rating, reviews, image, existingImages, isNew, isActive } = req.body;
  const parsedReviews = typeof reviews === 'string' ? JSON.parse(reviews || '[]') : (reviews || []);
  const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
  const uploadedImages = await uploadImagesToMinio(req.files, id);
  const mergedImages = [...parsedExistingImages, ...uploadedImages];
  const coverImage = mergedImages[0] || image || '';
  await req.db.run(
    'UPDATE products SET name=?, brand=?, category=?, gender=?, price=?, description=?, material=?, features=?, size=?, popularity=?, rating=?, reviews=?, image=?, images=?, isNew=?, isActive=? WHERE id=?;',
    [
      name,
      (brand || 'Без бренда').toString().trim(),
      category,
      gender || inferGenderByCategory(category),
      Number(price) || 0,
      description || '',
      material || '',
      features || '',
      size || '',
      Number(popularity) || 0,
      Number(rating) || 0,
      JSON.stringify(parsedReviews),
      coverImage,
      JSON.stringify(mergedImages),
      parseBoolean(isNew) ? 1 : 0,
      parseBoolean(isActive) ? 1 : 0,
      id
    ]
  );
  const product = await req.db.get('SELECT * FROM products WHERE id = ?', [id]);
  res.json(normalizeProduct(product));
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { author, rating, text } = req.body;

  const product = await req.db.get('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = parseReviews(product.reviews);
  const normalizedRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const nextReview = {
    author: (author || 'Гость').toString().trim().slice(0, 40),
    rating: normalizedRating,
    text: (text || '').toString().trim().slice(0, 500),
    date: new Date().toLocaleDateString('ru-RU')
  };

  reviews.unshift(nextReview);
  const popularity = Number(product.popularity || 0) + 1;
  const averageRating = Number((reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1));

  await req.db.run(
    'UPDATE products SET reviews=?, popularity=?, rating=? WHERE id=?;',
    [JSON.stringify(reviews), popularity, averageRating, id]
  );

  const updatedProduct = await req.db.get('SELECT * FROM products WHERE id = ?', [id]);
  return res.json(normalizeProduct(updatedProduct));
});

app.delete('/api/products/:id', async (req, res) => {
  await req.db.run('DELETE FROM products WHERE id = ?;', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/orders', async (req, res) => {
  const orders = await req.db.all('SELECT * FROM orders ORDER BY id DESC');
  for (const order of orders) {
    order.items = await req.db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
  }
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const {
    userId,
    userEmail,
    userName,
    total,
    subtotal,
    deliveryCost,
    deliveryService,
    paymentMethod,
    address,
    phone,
    comment,
    promoCode,
    items
  } = req.body;
  const date = new Date().toLocaleString('ru-RU');
  const result = await req.db.run(
    'INSERT INTO orders (userId, userEmail, userName, total, subtotal, deliveryCost, deliveryService, paymentMethod, address, phone, comment, promoCode, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [userId, userEmail, userName, total, subtotal || total, deliveryCost || 0, deliveryService || 'standard', paymentMethod || 'card', address || '', phone || '', comment || '', promoCode || '', date, 'Новый']
  );
  const orderId = result.lastID;
  for (const item of items) {
    await req.db.run('INSERT INTO order_items (orderId, productId, name, price, quantity) VALUES (?, ?, ?, ?, ?);', [orderId, item.productId, item.name, item.price, item.quantity]);
  }
  const order = await req.db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  order.items = items;
  res.json(order);
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await req.db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  if (!user.password.startsWith(PASSWORD_HASH_PREFIX)) {
    const nextPassword = await hashPassword(password);
    await req.db.run('UPDATE users SET password = ? WHERE id = ?', [nextPassword, user.id]);
    user.password = nextPassword;
  }

  res.json({ ...user, isAdmin: !!user.isAdmin });
});

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Проверяем существует ли пользователь с таким email
    const existingUser = await req.db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const passwordHash = await hashPassword(password);
    const result = await req.db.run('INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?);', [name, email, passwordHash, 0]);
    const user = await req.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    return res.json({ ...user, isAdmin: !!user.isAdmin });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(400).json({ error: 'Registration error' });
  }
});

// API routes выше, статические файлы подаются express.static
// Fallback для React Router - возвращаем index.html только для HTML запросов
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(4000, () => {
  console.log('Server running on http://127.0.0.1:4000');
});
