export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  values: any[];  // Always an array of data
  dataTypes?: Record<string, string>;
  source?: 'sample' | 'upload' | 'Tesseract OCR' | 'Cloud Vision API';
  uploadDate: string;  // ISO string format
  rowCount: number;
  columnCount: number;
  columns: string[];
  metadata: {
    fields: Array<{
      name: string;
      type: string;
    }>;
  };
  displayMetadata?: {
    name: string;
    rows: number;
    columns: number;
    uploadDate: string;
  };
} 