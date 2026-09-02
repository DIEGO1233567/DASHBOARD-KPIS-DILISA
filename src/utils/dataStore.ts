import { KpiRecord } from '../types';

const DB_NAME = 'kpi_dashboard_db';
const DB_VERSION = 1;
const STORE_NAME = 'synced_records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves current active records to IndexedDB
 */
export async function saveRecordsToStorage(records: KpiRecord[], sourceName?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear previous data
    store.clear();

    // Store batch
    store.put({
      id: 'current_dataset',
      records,
      sourceName: sourceName || 'Google Sheets',
      timestamp: Date.now(),
      count: records.length,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save records to IndexedDB:', err);
  }
}

/**
 * Loads cached records from IndexedDB if available
 */
export async function loadRecordsFromStorage(): Promise<{
  records: KpiRecord[];
  sourceName: string;
  timestamp: number;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current_dataset');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && Array.isArray(request.result.records) && request.result.records.length > 0) {
          resolve({
            records: request.result.records,
            sourceName: request.result.sourceName || 'Google Sheets',
            timestamp: request.result.timestamp || Date.now(),
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Could not load records from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears cached records
 */
export async function clearRecordsStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Could not clear records storage:', err);
  }
}
