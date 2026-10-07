// Camada de Armazenamento Seguro Offline (IndexedDB com fallback para localStorage)
// Evita o erro QuotaExceededError (5MB) permitindo salvar dezenas de milhares de cartas offline

const DB_NAME = 'pokecard_db';
const DB_VERSION = 1;
const STORE_CARDS = 'cards_metadata';
const CACHE_LOCAL_KEY = 'pokecard_saved_metadata';

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB não suportado neste navegador, usando localStorage como fallback.');
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_CARDS)) {
          db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        dbInstance = e.target.result;
        // Migra dados legados do localStorage para IndexedDB de forma transparente
        migrateLegacyLocalStorage(dbInstance).catch(console.error);
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        console.warn('Erro ao abrir IndexedDB, usando fallback:', e.target.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('Falha na inicialização do IndexedDB:', err);
      resolve(null);
    }
  });
}

// Migra metadados que estavam no localStorage para o IndexedDB na primeira execução
async function migrateLegacyLocalStorage(db) {
  try {
    const raw = localStorage.getItem(CACHE_LOCAL_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const keys = Object.keys(parsed);
    if (keys.length === 0) return;

    const tx = db.transaction(STORE_CARDS, 'readwrite');
    const store = tx.objectStore(STORE_CARDS);
    for (const key of keys) {
      const card = parsed[key];
      if (card && card.id) {
        store.put(card);
      }
    }

    await new Promise((resolve) => {
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });

    console.info(`Migradas ${keys.length} cartas do localStorage para IndexedDB.`);
    // Mantém versão compacta para segurança, mas reduz sobrecarga
  } catch (err) {
    console.warn('Erro ao migrar dados legados:', err);
  }
}

/**
 * Obtém todos os metadados de cartas salvos
 * @returns {Promise<Record<string, any>>}
 */
export async function getAllCardMetadata() {
  const db = await openDB();

  if (!db) {
    try {
      const saved = localStorage.getItem(CACHE_LOCAL_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CARDS, 'readonly');
      const store = tx.objectStore(STORE_CARDS);
      const req = store.getAll();

      req.onsuccess = () => {
        const result = {};
        const items = req.result || [];
        for (const item of items) {
          if (item && item.id) {
            result[item.id] = item;
          }
        }
        resolve(result);
      };

      req.onerror = () => {
        resolve({});
      };
    } catch (err) {
      console.warn('Erro ao buscar cartas do IndexedDB:', err);
      resolve({});
    }
  });
}

/**
 * Salva metadados de uma carta individual
 * @param {any} card
 */
export async function saveCardMetadata(card) {
  if (!card || !card.id || card.id === 'undefined') return;

  const db = await openDB();
  if (!db) {
    try {
      const raw = localStorage.getItem(CACHE_LOCAL_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[card.id] = card;
      localStorage.setItem(CACHE_LOCAL_KEY, JSON.stringify(data));
    } catch (e) {}
    return;
  }

  try {
    const tx = db.transaction(STORE_CARDS, 'readwrite');
    const store = tx.objectStore(STORE_CARDS);
    store.put(card);
  } catch (err) {
    console.warn('Erro ao salvar carta no IndexedDB:', err);
  }
}

/**
 * Salva múltiplos metadados em lote (otimizado para 1 única transação)
 * @param {Record<string, any>} cardsMap
 */
export async function saveAllCardMetadata(cardsMap) {
  if (!cardsMap || typeof cardsMap !== 'object') return;

  const db = await openDB();
  if (!db) {
    try {
      localStorage.setItem(CACHE_LOCAL_KEY, JSON.stringify(cardsMap));
    } catch (e) {}
    return;
  }

  try {
    const tx = db.transaction(STORE_CARDS, 'readwrite');
    const store = tx.objectStore(STORE_CARDS);
    for (const card of Object.values(cardsMap)) {
      if (card && card.id) {
        store.put(card);
      }
    }
  } catch (err) {
    console.warn('Erro ao salvar cartas em lote no IndexedDB:', err);
  }
}
