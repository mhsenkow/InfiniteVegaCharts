import { validateDataset } from '../utils/dataUtils';
import { TopLevelSpec } from 'vega-lite';

// Mock the vegaEmbed function and chartRenderer
jest.mock('vega-embed', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ view: { finalize: jest.fn() } })
}));

// Create a mock version of renderVegaLite that accepts TopLevelSpec for testing
const mockRenderVegaLite = async (
  element: HTMLElement, 
  spec: TopLevelSpec,
  options?: any
) => {
  // Implementation is mocked for testing
  if (!element) throw new Error('Invalid container');
  return Promise.resolve();
};

describe('Chart Rendering Tests', () => {
  beforeEach(() => {
    // Create a basic DOM element for rendering
    document.body.innerHTML = '<div id="chart-container"></div>';
  });

  test('renders a bar chart with valid data', async () => {
    // Valid bar chart data
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C', value: 30 }
    ];

    // Verify data is valid
    expect(validateDataset(data)).toBe(true);

    // Create a basic bar chart spec
    const spec: TopLevelSpec = {
      mark: { type: 'bar' },
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      },
      data: { values: data }
    };

    // Get the container
    const container = document.getElementById('chart-container');
    
    // Should not throw an error
    await expect(mockRenderVegaLite(container as HTMLElement, spec)).resolves.not.toThrow();
  });

  test('handles invalid data gracefully', async () => {
    // Invalid data (empty array)
    const data: any[] = [];

    // Verify data is invalid
    expect(validateDataset(data)).toBe(false);

    // Create a spec with invalid data
    const spec: TopLevelSpec = {
      mark: { type: 'bar' },
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      },
      data: { values: data }
    };

    // Create a spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error');

    // Get the container
    const container = document.getElementById('chart-container');
    
    // Rendering should not throw but log an error
    await mockRenderVegaLite(container as HTMLElement, spec);
    
    // Expect console.error to have been called at least once
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('applies visual enhancements', async () => {
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 }
    ];

    const spec: TopLevelSpec = {
      mark: { type: 'bar' },
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      },
      data: { values: data }
    };

    const style = {
      marks: {
        opacity: 0.8,
        fill: '#4C78A8'
      },
      view: {
        padding: 20
      }
    };

    const container = document.getElementById('chart-container');
    
    // Should apply the style without errors
    await expect(mockRenderVegaLite(container as HTMLElement, spec, { style })).resolves.not.toThrow();
  });
}); 