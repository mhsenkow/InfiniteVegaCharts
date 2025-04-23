import { validateDataset, detectDataTypes } from '../utils/dataUtils';

describe('Data Validation Tests', () => {
  test('validates properly structured data', () => {
    const validData = [
      { id: 1, value: 10, category: 'A' },
      { id: 2, value: 20, category: 'B' },
      { id: 3, value: 30, category: 'C' },
    ];
    
    expect(validateDataset(validData)).toBe(true);
  });
  
  test('rejects empty datasets', () => {
    expect(validateDataset([])).toBe(false);
  });
  
  test('rejects non-array input', () => {
    expect(validateDataset(null as any)).toBe(false);
    expect(validateDataset({} as any)).toBe(false);
  });
  
  test('rejects dataset with inconsistent structure', () => {
    const inconsistentData = [
      { id: 1, value: 10, category: 'A' },
      { id: 2, value: 20 }, // Missing category
      { id: 3, value: 30, category: 'C', extraField: 'something' }, // Extra field
    ];
    
    expect(validateDataset(inconsistentData)).toBe(false);
  });
  
  test('accepts dataset with null or undefined values', () => {
    const dataWithNulls = [
      { id: 1, value: 10, category: 'A' },
      { id: 2, value: null, category: 'B' },
      { id: 3, value: undefined, category: 'C' },
    ];
    
    expect(validateDataset(dataWithNulls)).toBe(true);
  });
  
  test('properly detects data types', () => {
    const mixedData = [
      { 
        id: 1, 
        numValue: 10, 
        strValue: 'test',
        dateValue: '2023-01-01',
        boolValue: true,
        ordinalValue: 'Low'
      },
      { 
        id: 2, 
        numValue: 20, 
        strValue: 'another',
        dateValue: '2023-01-02',
        boolValue: false,
        ordinalValue: 'Medium'
      },
      { 
        id: 3, 
        numValue: 30, 
        strValue: 'third',
        dateValue: '2023-01-03',
        boolValue: true,
        ordinalValue: 'High'
      },
    ];
    
    const types = detectDataTypes(mixedData);
    
    expect(types.numValue).toBe('quantitative');
    expect(['nominal', 'ordinal']).toContain(types.strValue);
    expect(types.dateValue).toBe('temporal');
    expect(types.ordinalValue).toBe('ordinal');
  });
}); 