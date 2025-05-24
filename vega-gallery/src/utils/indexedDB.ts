import { DatasetMetadata } from '../types/dataset';
import { Dashboard } from '../types/dashboard';

const DB_NAME = 'vegaGalleryDB';
const DATASETS_STORE = 'datasets';
const SNAPSHOTS_STORE = 'snapshots';
const CANVAS_STORE = 'canvases';
const DASHBOARD_STORE = 'dashboards';
const DB_VERSION = 3; // Increased version to trigger onupgradeneeded

// Custom error class for IndexedDB operations
class IndexedDBError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'IndexedDBError';
  }
}

// Function to reset the database - useful for recovery when the database is corrupted
export const resetDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        reject(new IndexedDBError('IndexedDB is not supported in this browser'));
        return;
      }
      
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      
      deleteRequest.onerror = (event) => {
        console.error('Failed to delete database:', deleteRequest.error);
        reject(new IndexedDBError('Failed to delete database', deleteRequest.error));
      };
      
      deleteRequest.onsuccess = () => {
        console.log('Database successfully deleted, now recreating it');
        // After deletion, try to recreate the database
        initDB()
          .then(() => {
            console.log('Database successfully reset');
            resolve();
          })
          .catch((error) => {
            console.error('Failed to recreate database after reset:', error);
            reject(new IndexedDBError('Failed to recreate database after reset', error));
          });
      };
      
      deleteRequest.onblocked = () => {
        console.error('Database deletion was blocked');
        reject(new IndexedDBError('Database deletion was blocked. Close all other tabs using this application and try again.'));
      };
    } catch (error) {
      reject(new IndexedDBError('Unexpected error resetting database', error));
    }
  });
};

// Function to initialize the database with retry mechanism
export const initDB = async (retryCount = 3, delay = 500): Promise<IDBDatabase> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        try {
          // Check if IndexedDB is available
          if (!window.indexedDB) {
            reject(new IndexedDBError('IndexedDB is not supported in this browser'));
            return;
          }
          
          // Check if we're in private browsing mode (Safari/iOS issue)
          const testDb = window.indexedDB.open('test');
          testDb.onerror = () => {
            if (testDb.error && testDb.error.name === 'QuotaExceededError') {
              reject(new IndexedDBError('Quota exceeded or private browsing mode detected. Storage might be restricted.'));
              return;
            }
          };
          
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onerror = (event) => {
            const errorName = request.error ? request.error.name : 'Unknown';
            const errorMessage = request.error ? request.error.message : 'No details available';
            console.error(`Database error (${errorName}): ${errorMessage}`);
            
            if (errorName === 'QuotaExceededError') {
              reject(new IndexedDBError('Storage quota exceeded. Try clearing some browser data or allowing more storage.', request.error));
            } else if (errorName === 'VersionError') {
              reject(new IndexedDBError('Database version conflict. Try closing other tabs of this application.', request.error));
            } else {
              reject(new IndexedDBError(`Failed to open database: ${errorMessage}`, request.error));
            }
          };
          
          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const oldVersion = event.oldVersion;
            
            try {
              console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
              
              // Create object stores if they don't exist
              if (!db.objectStoreNames.contains(DATASETS_STORE)) {
                console.log(`Creating ${DATASETS_STORE} store`);
                db.createObjectStore(DATASETS_STORE, { keyPath: 'id' });
              }
              
              if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
                console.log(`Creating ${SNAPSHOTS_STORE} store`);
                db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
              }
              
              if (!db.objectStoreNames.contains(CANVAS_STORE)) {
                console.log(`Creating ${CANVAS_STORE} store`);
                db.createObjectStore(CANVAS_STORE, { keyPath: 'id' });
              }
              
              if (!db.objectStoreNames.contains(DASHBOARD_STORE)) {
                console.log(`Creating ${DASHBOARD_STORE} store`);
                db.createObjectStore(DASHBOARD_STORE, { keyPath: 'id' });
              }
            } catch (error) {
              reject(new IndexedDBError('Failed to create object store', error));
            }
          };

          request.onsuccess = () => {
            const db = request.result;
            
            // Add error handler to the database
            db.onerror = (event) => {
              console.error('Database error:', event);
            };
            
            resolve(db);
          };
        } catch (error) {
          reject(new IndexedDBError('Unexpected error initializing database', error));
        }
      });
    } catch (error) {
      lastError = error;
      
      // Log the error but don't fail yet if we have retries left
      console.warn(`Database initialization attempt ${attempt + 1} failed:`, error);
      
      if (attempt < retryCount - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for next retry (exponential backoff)
        delay *= 2;
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
};

// Dataset operations
export const storeDataset = async (dataset: DatasetMetadata): Promise<void> => {
  if (!dataset || !dataset.id) {
    throw new Error('Invalid dataset: Dataset or dataset ID is missing');
  }

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(DATASETS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DATASETS_STORE);
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
        const transaction = db.transaction(DATASETS_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DATASETS_STORE);
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
        const transaction = db.transaction(DATASETS_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DATASETS_STORE);
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
        const transaction = db.transaction(DATASETS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DATASETS_STORE);
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
        const transaction = db.transaction(DATASETS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DATASETS_STORE);
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

// Snapshot type definition
export interface Snapshot {
  id: string;
  name: string;
  description?: string;
  chartId: string;
  spec: any; // The Vega-Lite spec
  datasetId?: string;
  datasetFingerprint?: string; // Reference to the original data fingerprint at time of creation
  datasetMetadata?: Partial<DatasetMetadata>; // For frozen historical context
  createdAt: string;
  updatedAt?: string;
  thumbnail?: string; // Base64 encoded image
  source?: string; // Source information for data lineage
  notes?: string; // Additional notes about data source
  tags?: string[]; // Tags for categorization and filtering
}

// Snapshot operations
export const storeSnapshot = async (snapshot: Snapshot): Promise<void> => {
  if (!snapshot || !snapshot.id) {
    throw new Error('Invalid snapshot: Snapshot or snapshot ID is missing');
  }

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(SNAPSHOTS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(SNAPSHOTS_STORE);
        const putRequest = store.put(snapshot);

        putRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to store snapshot: ${snapshot.id}`, putRequest.error));
        };
        
        putRequest.onsuccess = () => {
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
      throw new IndexedDBError('Failed to store snapshot', error);
    }
  }
};

export const getSnapshot = async (id: string): Promise<Snapshot | null> => {
  if (!id) {
    throw new Error('Invalid snapshot ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(SNAPSHOTS_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(SNAPSHOTS_STORE);
        const getRequest = store.get(id);

        getRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to get snapshot: ${id}`, getRequest.error));
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
      throw new IndexedDBError(`Failed to get snapshot: ${id}`, error);
    }
  }
};

export const getAllSnapshots = async (): Promise<Snapshot[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(SNAPSHOTS_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(SNAPSHOTS_STORE);
        const getAllRequest = store.getAll();

        getAllRequest.onerror = () => {
          reject(new IndexedDBError('Failed to get all snapshots', getAllRequest.error));
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
      throw new IndexedDBError('Failed to get all snapshots', error);
    }
  }
};

export const deleteSnapshot = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Invalid snapshot ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(SNAPSHOTS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(SNAPSHOTS_STORE);
        const deleteRequest = store.delete(id);

        deleteRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to delete snapshot: ${id}`, deleteRequest.error));
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
      throw new IndexedDBError(`Failed to delete snapshot: ${id}`, error);
    }
  }
};

// Add Canvas interface definition below the Snapshot interface

// Canvas type definition
export interface Canvas {
  id: string;
  name: string;
  description?: string;
  slots: CanvasSlot[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string; // Base64 encoded image of the canvas
}

export interface CanvasSlot {
  id: string;
  position: number; // Position in the grid (0-3 for a 2x2 grid)
  snapshotId: string | null; // Reference to a snapshot or null if empty
}

// Canvas operations
export const storeCanvas = async (canvas: Canvas): Promise<void> => {
  if (!canvas || !canvas.id) {
    throw new Error('Invalid canvas: Canvas or canvas ID is missing');
  }

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(CANVAS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(CANVAS_STORE);
        const putRequest = store.put(canvas);

        putRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to store canvas: ${canvas.id}`, putRequest.error));
        };
        
        putRequest.onsuccess = () => {
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
      throw new IndexedDBError('Failed to store canvas', error);
    }
  }
};

export const getCanvas = async (id: string): Promise<Canvas | null> => {
  if (!id) {
    throw new Error('Invalid canvas ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(CANVAS_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(CANVAS_STORE);
        const getRequest = store.get(id);

        getRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to get canvas: ${id}`, getRequest.error));
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
      throw new IndexedDBError(`Failed to get canvas: ${id}`, error);
    }
  }
};

export const getAllCanvases = async (): Promise<Canvas[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(CANVAS_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(CANVAS_STORE);
        const getAllRequest = store.getAll();

        getAllRequest.onerror = () => {
          reject(new IndexedDBError('Failed to get all canvases', getAllRequest.error));
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
      throw new IndexedDBError('Failed to get all canvases', error);
    }
  }
};

export const deleteCanvas = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Invalid canvas ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(CANVAS_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(CANVAS_STORE);
        const deleteRequest = store.delete(id);

        deleteRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to delete canvas: ${id}`, deleteRequest.error));
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
      throw new IndexedDBError(`Failed to delete canvas: ${id}`, error);
    }
  }
};

// Dashboard operations
export const storeDashboard = async (dashboard: Dashboard): Promise<void> => {
  if (!dashboard || !dashboard.id) {
    throw new Error('Invalid dashboard: Dashboard or dashboard ID is missing');
  }

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(DASHBOARD_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DASHBOARD_STORE);
        const putRequest = store.put(dashboard);

        putRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to store dashboard: ${dashboard.id}`, putRequest.error));
        };
        
        putRequest.onsuccess = () => {
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
      throw new IndexedDBError('Failed to store dashboard', error);
    }
  }
};

export const getDashboard = async (id: string): Promise<Dashboard | null> => {
  if (!id) {
    throw new Error('Invalid dashboard ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(DASHBOARD_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DASHBOARD_STORE);
        const getRequest = store.get(id);

        getRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to get dashboard: ${id}`, getRequest.error));
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
      throw new IndexedDBError(`Failed to get dashboard: ${id}`, error);
    }
  }
};

export const getAllDashboards = async (): Promise<Dashboard[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(DASHBOARD_STORE, 'readonly');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DASHBOARD_STORE);
        const getAllRequest = store.getAll();

        getAllRequest.onerror = () => {
          reject(new IndexedDBError('Failed to get all dashboards', getAllRequest.error));
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
      throw new IndexedDBError('Failed to get all dashboards', error);
    }
  }
};

export const deleteDashboard = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Invalid dashboard ID: ID is missing');
  }
  
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(DASHBOARD_STORE, 'readwrite');
        
        transaction.onerror = () => {
          reject(new IndexedDBError('Transaction failed', transaction.error));
        };
        
        const store = transaction.objectStore(DASHBOARD_STORE);
        const deleteRequest = store.delete(id);

        deleteRequest.onerror = () => {
          reject(new IndexedDBError(`Failed to delete dashboard: ${id}`, deleteRequest.error));
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
      throw new IndexedDBError(`Failed to delete dashboard: ${id}`, error);
    }
  }
}; 