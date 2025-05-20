export interface DatasetMetadata {
  values: any[];
  dataTypes?: Record<string, string>;
  id?: string;
  name?: string;
  description?: string;
  source?: string;
  uploadDate?: string;
  columns?: string[];
}

export type DatasetValues = any[]; 