import { Snapshot } from '../utils/indexedDB';

export interface DashboardChart {
  id: string;
  spec: any; // Vega/Vega-Lite spec
  timestamp: Date;
  x: number;
  y: number;
  width: number;
  height: number;
  snapshot: Snapshot;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  charts: DashboardChart[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export enum ViewMode {
  GRID = 'grid',
  CANVAS = 'canvas'
} 