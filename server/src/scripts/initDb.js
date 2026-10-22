import { openDb } from '../db.js';
import { DEFAULT_DB_PATH } from '../config.js';

const db = openDb();
const items = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
console.log(`База данных готова: ${process.env.DB_PATH || DEFAULT_DB_PATH}`);
console.log(`Товаров в каталоге: ${items}`);
db.close();
