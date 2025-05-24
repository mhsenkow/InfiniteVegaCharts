export interface DatasetMetadata {
  id: string; // UUID
  name: string;
  description?: string;
  values?: any[];
  columns?: string[];
  source?: string;
  origin?: string; // e.g., "URL", "internal export", "manual upload"
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  uploadDate?: string; // Legacy field, use createdAt instead
  lastModified?: string; // Legacy field, use updatedAt instead
  fileSize?: number;
  type?: string;
  compatibleCharts?: string[];
  dataTypes?: Record<string, string>;
  fieldTypes?: Record<string, "string" | "number" | "boolean" | "date">;
  isSample?: boolean;
  isSampled?: boolean; // Indicates if this dataset is a sample of a larger dataset
  transformed?: boolean;
  fingerprint?: string; // SHA-256 of raw data
  previewRows?: any[]; // First 5-10 rows
  rowCount?: number;
  columnCount?: number;
  linkedChartIds?: string[]; // For lineage graph
}

// Alias to make sure we're using the updated interface
export type DataAsset = DatasetMetadata;
export type DatasetValues = any[]; 