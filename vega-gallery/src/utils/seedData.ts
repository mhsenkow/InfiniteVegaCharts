import { storeDataset, getAllDatasets } from './indexedDB';
import { sampleDatasets } from './sampleData';

/**
 * Seeds the database with sample datasets if no datasets exist
 * Returns true if datasets were seeded, false otherwise
 */
export const seedDatabaseWithSampleData = async (): Promise<boolean> => {
  try {
    // Check if datasets already exist
    const existingDatasets = await getAllDatasets();
    
    if (existingDatasets.length === 0) {
      console.log('No datasets found, seeding database with sample data...');
      
      // Load each sample dataset into the database
      for (const key of Object.keys(sampleDatasets)) {
        const dataset = sampleDatasets[key];
        
        // Make sure dataset has proper metadata
        const datasetWithMetadata = {
          ...dataset,
          uploadDate: new Date().toISOString(),
          source: 'Sample Dataset',
          isSample: true // Mark as sample dataset for UI differentiation
        };
        
        // Store in database
        await storeDataset(datasetWithMetadata);
        console.log(`Stored sample dataset: ${dataset.name}`);
      }
      
      console.log('Database seeding complete');
      return true;
    } else {
      console.log('Datasets already exist, skipping seed process');
      return false;
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

/**
 * Updates sample datasets with new versions
 * Useful for updating when the app has new samples available
 */
export const updateSampleDatasets = async (): Promise<boolean> => {
  try {
    // Get all existing datasets
    const existingDatasets = await getAllDatasets();
    
    // Filter to find sample datasets
    const sampleDatasetIds = existingDatasets
      .filter(dataset => dataset.isSample)
      .map(dataset => dataset.id);
    
    // Update each sample dataset
    for (const key of Object.keys(sampleDatasets)) {
      const dataset = sampleDatasets[key];
      
      if (sampleDatasetIds.includes(dataset.id)) {
        // Update existing sample dataset
        const updatedDataset = {
          ...dataset,
          uploadDate: new Date().toISOString(),
          source: 'Sample Dataset',
          isSample: true,
          lastUpdated: new Date().toISOString()
        };
        
        await storeDataset(updatedDataset);
        console.log(`Updated sample dataset: ${dataset.name}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating sample datasets:', error);
    return false;
  }
}; 