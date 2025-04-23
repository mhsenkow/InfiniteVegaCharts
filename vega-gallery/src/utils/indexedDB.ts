import { DatasetMetadata } from '../types/dataset';

const DB_NAME = 'vegaGalleryDB';
const STORE_NAME = 'datasets';
const DB_VERSION = 1;

// Custom error class for IndexedDB operations
class IndexedDBError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'IndexedDBError';
  }
}

export const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        reject(new IndexedDBError('Failed to open database', request.error));
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        } catch (error) {
          reject(new IndexedDBError('Failed to create object store', error));
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    } catch (error) {
      reject(new IndexedDBError('Unexpected error initializing database', error));
    }
  });
};

export const storeDataset = async (dataset: DatasetMetadata): Promise<void> => {
  if (!dataset || !dataset.id) {
    throw new Error('Invalid dataset: Dataset or dataset ID is missing');
  }

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(STORE_NAME);
        const putRequest = store.put(dataset);

        putRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to store dataset: ${dataset.id}`, putRequest.error));
        };
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        // Add transaction complete handler to ensure transaction completes
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        reject(new IndexedDBError('Error in database transaction', error));
      }
    });
  } catch (error) {
    if (error instanceof IndexedDBError) {
      throw error;
    } else {
      throw new IndexedDBError('Failed to store dataset', error);
    }
  }
};

export const getDataset = async (id: string): Promise<DatasetMetadata | null> => {
  if (!id) {
    throw new Error('Invalid dataset ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to get dataset: ${id}`, getRequest.error));
        };
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        reject(new IndexedDBError('Error in database transaction', error));
      }
    });
  } catch (error) {
    if (error instanceof IndexedDBError) {
      throw error;
    } else {
      throw new IndexedDBError(`Failed to get dataset: ${id}`, error);
    }
  }
};

export const getAllDatasets = async (): Promise<DatasetMetadata[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();

        getAllRequest.onerror = () => {
          reject(new IndexedDBError('Failed to get all datasets', getAllRequest.error));
        };
        
        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || []);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        reject(new IndexedDBError('Error in database transaction', error));
      }
    });
  } catch (error) {
    if (error instanceof IndexedDBError) {
      throw error;
    } else {
      throw new IndexedDBError('Failed to get all datasets', error);
    }
  }
};

export const saveDataset = async (dataset: any) => {
  const db: IDBDatabase = await initDB() as IDBDatabase;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['datasets'], 'readwrite');
    const store = transaction.objectStore('datasets');
    const request = store.put(dataset);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteDataset = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Invalid dataset ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(STORE_NAME);
        const deleteRequest = store.delete(id);

        deleteRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to delete dataset: ${id}`, deleteRequest.error));
        };
        
        deleteRequest.onsuccess = () => {
          resolve();
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        reject(new IndexedDBError('Error in database transaction', error));
      }
    });
  } catch (error) {
    if (error instanceof IndexedDBError) {
      throw error;
    } else {
      throw new IndexedDBError(`Failed to delete dataset: ${id}`, error);
    }
  }
};

export const clearAllDatasets = async (): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(STORE_NAME);
        const clearRequest = store.clear();

        clearRequest.onerror = () => {
          reject(new IndexedDBError('Failed to clear all datasets', clearRequest.error));
        };
        
        clearRequest.onsuccess = () => {
          resolve();
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        reject(new IndexedDBError('Error in database transaction', error));
      }
    });
  } catch (error) {
    if (error instanceof IndexedDBError) {
      throw error;
    } else {
      throw new IndexedDBError('Failed to clear all datasets', error);
    }
  }
}; 