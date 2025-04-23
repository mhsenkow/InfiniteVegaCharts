import {
  initDB,
  storeDataset,
  getDataset,
  getAllDatasets,
  deleteDataset
} from '../utils/indexedDB';
import { DatasetMetadata } from '../types/dataset';

// Mock indexedDB
const mockIndexedDB = () => {
  const stores: Record<string, Record<string, any>> = {};
  
  const mockIDBRequest = {
    result: null as any,
    error: null as any,
    onsuccess: null as Function | null,
    onerror: null as Function | null,
    onupgradeneeded: null as Function | null,
    
    dispatchSuccess(result: any) {
      this.result = result;
      if (this.onsuccess) this.onsuccess({ target: this });
    },
    
    dispatchError(error: any) {
      this.error = error;
      if (this.onerror) this.onerror({ target: this });
    }
  };
  
  const mockObjectStore = {
    name: '',
    data: {} as Record<string, any>,
    
    put(value: any) {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        try {
          if (!value.id) {
            request.dispatchError(new Error('No ID provided'));
            return;
          }
          this.data[value.id] = value;
          stores[this.name] = this.data;
          request.dispatchSuccess(value.id);
        } catch (error) {
          request.dispatchError(error);
        }
      }, 0);
      return request;
    },
    
    get(id: string) {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        try {
          request.dispatchSuccess(this.data[id] || null);
        } catch (error) {
          request.dispatchError(error);
        }
      }, 0);
      return request;
    },
    
    getAll() {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        try {
          request.dispatchSuccess(Object.values(this.data));
        } catch (error) {
          request.dispatchError(error);
        }
      }, 0);
      return request;
    },
    
    delete(id: string) {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        try {
          delete this.data[id];
          request.dispatchSuccess(undefined);
        } catch (error) {
          request.dispatchError(error);
        }
      }, 0);
      return request;
    },
    
    clear() {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        try {
          this.data = {};
          stores[this.name] = {};
          request.dispatchSuccess(undefined);
        } catch (error) {
          request.dispatchError(error);
        }
      }, 0);
      return request;
    }
  };
  
  const mockIDBTransaction = {
    objectStore(name: string) {
      const store = { ...mockObjectStore, name };
      store.data = stores[name] || {};
      return store;
    },
    oncomplete: null as Function | null,
    onerror: null as Function | null,
    
    complete() {
      if (this.oncomplete) this.oncomplete();
    }
  };
  
  const mockDB = {
    objectStoreNames: {
      contains: (name: string) => !!stores[name]
    },
    createObjectStore(name: string, options: { keyPath: string }) {
      stores[name] = {};
      return { ...mockObjectStore, name };
    },
    transaction(storeNames: string[], mode: string) {
      return { ...mockIDBTransaction };
    },
    close() {}
  };
  
  // Replace global indexedDB with mock
  global.indexedDB = {
    open: jest.fn().mockImplementation(() => {
      const request = { ...mockIDBRequest };
      
      setTimeout(() => {
        if (!stores['datasets']) {
          // Trigger onupgradeneeded first
          request.onupgradeneeded?.({ target: { result: mockDB } });
        }
        
        request.dispatchSuccess(mockDB);
      }, 0);
      
      return request;
    }),
    deleteDatabase: jest.fn()
  } as any;
  
  return { stores, mockDB };
};

describe('IndexedDB Tests', () => {
  beforeEach(() => {
    // Setup mock IndexedDB
    mockIndexedDB();
  });
  
  test('initializes database successfully', async () => {
    const db = await initDB();
    expect(db).toBeDefined();
  });
  
  test('stores and retrieves a dataset', async () => {
    const testDataset: DatasetMetadata = {
      id: 'test-123',
      name: 'Test Dataset',
      description: 'A test dataset',
      values: [{ id: 1, value: 10 }],
      rowCount: 1,
      columnCount: 2,
      columns: ['id', 'value'],
      metadata: {
        fields: [
          { name: 'id', type: 'nominal' },
          { name: 'value', type: 'quantitative' }
        ]
      },
      uploadDate: new Date().toISOString()
    };
    
    // Store dataset
    await storeDataset(testDataset);
    
    // Retrieve dataset
    const retrieved = await getDataset('test-123');
    
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-123');
    expect(retrieved?.name).toBe('Test Dataset');
  });
  
  test('gets all datasets', async () => {
    // Store multiple datasets
    const dataset1: DatasetMetadata = {
      id: 'test-1',
      name: 'Test Dataset 1',
      description: 'Test dataset 1',
      values: [{ id: 1, value: 10 }],
      rowCount: 1,
      columnCount: 2,
      columns: ['id', 'value'],
      metadata: {
        fields: [
          { name: 'id', type: 'nominal' },
          { name: 'value', type: 'quantitative' }
        ]
      },
      uploadDate: new Date().toISOString()
    };
    
    const dataset2: DatasetMetadata = {
      id: 'test-2',
      name: 'Test Dataset 2',
      description: 'Test dataset 2',
      values: [{ id: 2, value: 20 }],
      rowCount: 1,
      columnCount: 2,
      columns: ['id', 'value'],
      metadata: {
        fields: [
          { name: 'id', type: 'nominal' },
          { name: 'value', type: 'quantitative' }
        ]
      },
      uploadDate: new Date().toISOString()
    };
    
    await storeDataset(dataset1);
    await storeDataset(dataset2);
    
    // Get all datasets
    const datasets = await getAllDatasets();
    
    expect(datasets.length).toBe(2);
    expect(datasets.find(d => d.id === 'test-1')).toBeDefined();
    expect(datasets.find(d => d.id === 'test-2')).toBeDefined();
  });
  
  test('deletes a dataset', async () => {
    // Store a dataset
    const testDataset: DatasetMetadata = {
      id: 'test-delete',
      name: 'Test Delete Dataset',
      description: 'A dataset to delete',
      values: [{ id: 1, value: 10 }],
      rowCount: 1,
      columnCount: 2,
      columns: ['id', 'value'],
      metadata: {
        fields: [
          { name: 'id', type: 'nominal' },
          { name: 'value', type: 'quantitative' }
        ]
      },
      uploadDate: new Date().toISOString()
    };
    
    await storeDataset(testDataset);
    
    // Delete the dataset
    await deleteDataset('test-delete');
    
    // Check if dataset is deleted
    const retrieved = await getDataset('test-delete');
    expect(retrieved).toBeNull();
  });
}); 