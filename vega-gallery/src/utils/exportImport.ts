import { Snapshot, Canvas, getAllSnapshots, getAllCanvases, storeSnapshot, storeCanvas, getAllDatasets, getDataset, storeDataset } from './indexedDB';
import { DatasetMetadata } from '../types/dataset';

/**
 * Exports all user data (snapshots, canvases, and datasets) as a JSON file
 */
export const exportAllData = async (): Promise<void> => {
  try {
    // Get all user data
    const snapshots = await getAllSnapshots();
    const canvases = await getAllCanvases();
    const datasets = await getAllDatasets();
    
    // Create export object
    const exportData = {
      snapshots,
      canvases,
      datasets,
      exportDate: new Date().toISOString(),
      version: '1.1' // Upgraded version to indicate dataset support
    };
    
    // Convert to JSON and create download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create download link
    const exportFileName = `vega-gallery-export-${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export a single chart spec with its dataset metadata
 */
export const exportChartWithMetadata = async (spec: any, datasetId?: string): Promise<string> => {
  try {
    // Include dataset metadata if available
    let datasetMetadata: DatasetMetadata | null = null;
    if (datasetId) {
      datasetMetadata = await getDataset(datasetId);
    }
    
    // Create export object
    const exportData = {
      spec,
      dataset: datasetMetadata,
      exportDate: new Date().toISOString(),
      version: '1.1'
    };
    
    // Convert to JSON and return
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Export chart failed:', error);
    throw new Error(`Failed to export chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates the imported data structure
 */
const validateImportData = (data: any): boolean => {
  // Basic validation
  if (!data || typeof data !== 'object') return false;
  
  // Version 1.1 with datasets
  if (data.version === '1.1') {
    if (!Array.isArray(data.snapshots) || !Array.isArray(data.canvases) || !Array.isArray(data.datasets)) {
      return false;
    }
    return true;
  }
  
  // Legacy version 1.0
  if (data.version === '1.0') {
    if (!Array.isArray(data.snapshots) || !Array.isArray(data.canvases)) {
      return false;
    }
    return true;
  }
  
  // Unknown version
  console.warn('Import data version unknown, but attempting import anyway');
  return Array.isArray(data.snapshots) || Array.isArray(data.canvases);
};

/**
 * Imports user data from a JSON file
 */
export const importData = async (file: File): Promise<{ snapshots: number, canvases: number, datasets: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Failed to read file');
        }
        
        const data = JSON.parse(event.target.result);
        
        if (!validateImportData(data)) {
          throw new Error('Invalid import file format');
        }
        
        // Import snapshots
        const snapshotPromises = data.snapshots.map((snapshot: Snapshot) => storeSnapshot(snapshot));
        await Promise.all(snapshotPromises);
        
        // Import canvases
        const canvasPromises = data.canvases.map((canvas: Canvas) => storeCanvas(canvas));
        await Promise.all(canvasPromises);
        
        // Import datasets if available
        let datasetCount = 0;
        if (Array.isArray(data.datasets)) {
          const datasetPromises = data.datasets.map((dataset: DatasetMetadata) => {
            return getDataset(dataset.id)
              .then(existingDataset => {
                if (!existingDataset) {
                  return storeDataset(dataset);
                }
              });
          });
          await Promise.all(datasetPromises);
          datasetCount = data.datasets.length;
        }
        
        resolve({
          snapshots: data.snapshots.length,
          canvases: data.canvases.length,
          datasets: datasetCount
        });
      } catch (error) {
        console.error('Import failed:', error);
        reject(new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read import file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Calculate the approximate size of the database content in KB/MB
 */
export const calculateDatabaseSize = async (): Promise<{ sizeKB: number, sizeText: string }> => {
  try {
    // Get all user data
    const snapshots = await getAllSnapshots();
    const canvases = await getAllCanvases();
    const datasets = await getAllDatasets();
    
    // Create export object to estimate size
    const exportData = {
      snapshots,
      canvases,
      datasets
    };
    
    // Convert to JSON string to calculate size
    const dataStr = JSON.stringify(exportData);
    const sizeBytes = new Blob([dataStr]).size;
    const sizeKB = Math.round(sizeBytes / 1024);
    
    // Format the size text for display
    let sizeText = '';
    if (sizeKB < 1024) {
      sizeText = `${sizeKB} KB`;
    } else {
      const sizeMB = (sizeKB / 1024).toFixed(2);
      sizeText = `${sizeMB} MB`;
    }
    
    return { sizeKB, sizeText };
  } catch (error) {
    console.error('Failed to calculate database size:', error);
    return { sizeKB: 0, sizeText: 'Unknown' };
  }
}; 