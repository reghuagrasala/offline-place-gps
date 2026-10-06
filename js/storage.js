/**
 * Simple IndexedDB wrapper for offline-first storage
 * Falls back to localStorage if IndexedDB is unavailable
 */
const STORAGE = (() => {
  const DB_NAME = "PlaceDataDB";
  const DB_VERSION = 1;
  const STORE = "kv";
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return dbPromise;
  }

  async function set(key, value) {
    const db = await openDB();
    if (!db) {
      try { localStorage.setItem("pd_" + key, JSON.stringify(value)); } catch {}
      return;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async function get(key) {
    const db = await openDB();
    if (!db) {
      try {
        const raw = localStorage.getItem("pd_" + key);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async function remove(key) {
    const db = await openDB();
    if (!db) {
      try { localStorage.removeItem("pd_" + key); } catch {}
      return;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async function clearAll() {
    const db = await openDB();
    if (!db) {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("pd_") || k.startsWith("placeData_")) localStorage.removeItem(k);
      });
      return;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  return { set, get, remove, clearAll };
})();

window.STORAGE = STORAGE;
