export interface DatasetMetadata {
  id?: string;
  name: string;
  description?: string;
  values?: any[];
  columns?: string[];
  source?: string;
  uploadDate?: string;
  lastModified?: string;
  fileSize?: number;
  type?: string;
  compatibleCharts?: string[];
  dataTypes?: Record<string, string>;
  isSample?: boolean;
  transformed?: boolean;
}

export type DatasetValues = any[]; 