import { create } from 'zustand';
import { Dashboard, DashboardChart, ViewMode } from '../types/dashboard';
import { getAllSnapshots, Snapshot } from '../utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';

interface DashboardState {
  // Current dashboard
  currentDashboard: Dashboard | null;
  dashboards: Dashboard[];
  
  // UI state
  viewMode: ViewMode;
  isLoading: boolean;
  snapshots: Snapshot[];
  
  // Canvas state
  canvasZoom: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  loadSnapshots: () => Promise<void>;
  addChart: (snapshot: Snapshot, x?: number, y?: number, width?: number, height?: number) => void;
  updateChartPosition: (id: string, x: number, y: number) => void;
  updateChartDimensions: (id: string, width: number, height: number) => void;
  removeChart: (id: string) => void;
  setCanvasTransform: (zoom: number, offsetX: number, offsetY: number) => void;
  createDashboard: (name: string) => void;
  updateChartInfo: (chartId: string, source: string, notes: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentDashboard: null,
  dashboards: [],
  viewMode: ViewMode.GRID,
  isLoading: false,
  snapshots: [],
  canvasZoom: 1,
  canvasOffsetX: 0,
  canvasOffsetY: 0,
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setCurrentDashboard: (dashboard) => set({ currentDashboard: dashboard }),
  
  loadSnapshots: async () => {
    set({ isLoading: true });
    try {
      const snapshots = await getAllSnapshots();
      set({ snapshots, isLoading: false });
    } catch (error) {
      console.error('Failed to load snapshots:', error);
      set({ isLoading: false });
    }
  },
  
  addChart: (snapshot, x = 0, y = 0, width = 400, height = 300) => {
    const { currentDashboard, viewMode } = get();
    
    if (!currentDashboard) return;
    
    // Generate a unique ID for the new chart
    const chartId = uuidv4();
    
    // Determine chart position for better layout when adding multiple charts
    let chartX = x;
    let chartY = y;
    
    // In canvas view, try to spread out charts to avoid exact overlaps
    // by adding a small offset for each new chart based on the number of existing charts
    if (viewMode === ViewMode.CANVAS && currentDashboard.charts.length > 0) {
      // Apply a staggered offset to avoid exact overlapping of charts
      const chartCount = currentDashboard.charts.length;
      const offsetX = chartCount % 3 * 50; // Offset charts in groups of 3
      const offsetY = Math.floor(chartCount / 3) * 50;
      
      chartX += offsetX;
      chartY += offsetY;
    }
    
    const newChart: DashboardChart = {
      id: chartId,
      spec: snapshot.spec,
      timestamp: new Date(),
      x: chartX,
      y: chartY,
      width,
      height,
      snapshot
    };
    
    const updatedDashboard = {
      ...currentDashboard,
      charts: [...currentDashboard.charts, newChart],
      updatedAt: new Date().toISOString()
    };
    
    set({ currentDashboard: updatedDashboard });
  },
  
  updateChartPosition: (id, x, y) => {
    const { currentDashboard } = get();
    
    if (!currentDashboard) return;
    
    const updatedCharts = currentDashboard.charts.map(chart => 
      chart.id === id ? { ...chart, x, y } : chart
    );
    
    const updatedDashboard = {
      ...currentDashboard,
      charts: updatedCharts,
      updatedAt: new Date().toISOString()
    };
    
    set({ currentDashboard: updatedDashboard });
  },
  
  updateChartDimensions: (id, width, height) => {
    const { currentDashboard } = get();
    
    if (!currentDashboard) return;
    
    const updatedCharts = currentDashboard.charts.map(chart => 
      chart.id === id ? { ...chart, width, height } : chart
    );
    
    const updatedDashboard = {
      ...currentDashboard,
      charts: updatedCharts,
      updatedAt: new Date().toISOString()
    };
    
    set({ currentDashboard: updatedDashboard });
  },
  
  removeChart: (id) => {
    const { currentDashboard } = get();
    
    if (!currentDashboard) return;
    
    const updatedCharts = currentDashboard.charts.filter(chart => chart.id !== id);
    
    const updatedDashboard = {
      ...currentDashboard,
      charts: updatedCharts,
      updatedAt: new Date().toISOString()
    };
    
    set({ currentDashboard: updatedDashboard });
  },
  
  setCanvasTransform: (zoom, offsetX, offsetY) => {
    set({ 
      canvasZoom: zoom,
      canvasOffsetX: offsetX,
      canvasOffsetY: offsetY
    });
  },
  
  createDashboard: (name) => {
    const newDashboard: Dashboard = {
      id: uuidv4(),
      name,
      charts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    set(state => ({
      dashboards: [...state.dashboards, newDashboard],
      currentDashboard: newDashboard
    }));
  },
  
  updateChartInfo: (chartId, source, notes) => {
    const { currentDashboard } = get();
    
    if (!currentDashboard) return;
    
    const updatedCharts = currentDashboard.charts.map(chart => {
      if (chart.id === chartId && chart.snapshot) {
        // Update the snapshot with new source and notes
        const updatedSnapshot = {
          ...chart.snapshot,
          source,
          notes
        };
        
        // Also store the updated snapshot in IndexedDB
        import('../utils/indexedDB').then(({ storeSnapshot }) => {
          storeSnapshot(updatedSnapshot)
            .catch(err => console.error('Failed to update snapshot:', err));
        });
        
        return {
          ...chart,
          snapshot: updatedSnapshot
        };
      }
      return chart;
    });
    
    const updatedDashboard = {
      ...currentDashboard,
      charts: updatedCharts,
      updatedAt: new Date().toISOString()
    };
    
    set({ currentDashboard: updatedDashboard });
  }
})); 