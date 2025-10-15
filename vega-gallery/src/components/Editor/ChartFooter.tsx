import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { TablePagination } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { TopLevelSpec } from 'vega-lite';
import { createDataSample, detectDataTypes } from '../../utils/dataUtils';
import InfoIcon from '@mui/icons-material/Info';
import TuneIcon from '@mui/icons-material/Tune';
import DataColumnToken, { ColumnMetadata } from '../common/DataColumnToken';

const FooterContainer = styled.div`
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
`;

const ToggleButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  transition: all 0.2s ease;
  margin-bottom: 4px;

  &:hover {
    background: var(--color-surfaceHover);
    border-color: var(--color-border);
  }

  svg {
    transform: rotate(${props => props.$isOpen ? '180deg' : '0deg'});
    transition: transform 0.3s ease;
  }
`;

const TableContainer = styled.div<{ $isOpen: boolean }>`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: ${props => props.$isOpen ? '600px' : '0'};
  transition: max-height 0.3s ease;
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
`;

const TableScroller = styled.div`
  flex: 1;
  overflow: auto;
  min-height: 200px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th, td {
    padding: 6px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    background: var(--color-background);
    z-index: 1;
  }

  tbody tr:hover {
    background: var(--color-background);
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);

  select {
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 8px;

    button {
      padding: 4px 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: var(--color-surface);
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background: var(--color-surfaceHover);
      }
    }
  }
`;

const TableControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);

  input {
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    width: 200px;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const EncodingSection = styled.div`
  padding: 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.1rem;
    color: var(--color-text-primary);
  }
`;

const SamplingIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 4px 8px;
  background: var(--color-samplingIndicator-background);
  border: 1px solid var(--color-samplingIndicator-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-samplingIndicator-text);
  
  svg {
    font-size: 14px;
    color: var(--color-samplingIndicator-icon);
  }
`;

const DataSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SummaryText = styled.div`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
`;

const ViewDataButton = styled.button`
  padding: 6px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
  }
`;

const SamplingContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`;

const SampleOption = styled.span<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text.secondary};
  font-size: 0.8rem;
  
  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : '#f1f3f5'};
  }
`;

const TableHeader = styled.th`
  position: sticky;
  top: 0;
  background: var(--color-background);
  z-index: 1;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  
  &:hover {
    background: var(--color-surfaceHover);
  }
  
  & > div {
    max-width: 100%;
    cursor: grab;
  }
`;

interface ChartFooterProps {
  data?: any[] | null;
  spec?: TopLevelSpec | null;
  sampleSize: number;
  onSampleSizeChange: (size: number) => void;
}

export const ChartFooter = ({ data, spec, sampleSize, onSampleSizeChange }: ChartFooterProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tableData, setTableData] = useState<any[]>([]);
  const [originalDataLength, setOriginalDataLength] = useState(0);
  const [isDataSampled, setIsDataSampled] = useState(false);
  const [showSamplingOptions, setShowSamplingOptions] = useState(false);
  const [columnMetadata, setColumnMetadata] = useState<Record<string, ColumnMetadata>>({});

  // Process data for display
  useEffect(() => {
    console.log('ChartFooter data:', data);
    console.log('ChartFooter spec:', spec);
    
    // Get the data from props or from spec
    let rawData: any[] = [];
    
    if (Array.isArray(data)) {
      // Use data directly if it's an array
      rawData = data;
    } else if (spec?.data) {
      // Safely extract data from spec with type checking
      const specData = spec.data;
      if ('values' in specData && Array.isArray(specData.values)) {
        rawData = specData.values;
      }
    }
    
    setOriginalDataLength(rawData.length);
    
    // Apply sampling if dataset is large
    if (rawData.length > 100) {
      const sampledData = createDataSample(rawData, sampleSize);
      setTableData(sampledData);
      setIsDataSampled(true);
    } else {
      setTableData(rawData);
      setIsDataSampled(false);
    }

    // Calculate column metadata
    if (rawData.length > 0) {
      const dataTypes = detectDataTypes(rawData);
      const metadata: Record<string, ColumnMetadata> = {};
      
      // Extract columns from the first row of data
      Object.keys(rawData[0] || {}).forEach(column => {
        // Get column values for statistics
        const values = rawData
          .map(row => row[column])
          .filter(val => val !== null && val !== undefined);
          
        const uniqueValues = new Set(values).size;
        const missingValues = rawData.length - values.length;
        
        // Calculate basic statistics for numerical columns
        let stats = undefined;
        if (dataTypes[column] === 'quantitative') {
          const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
          if (numericValues.length > 0) {
            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const mean = sum / numericValues.length;
            
            stats = { min, max, mean };
          }
        }
        
        metadata[column] = {
          name: column,
          type: dataTypes[column] || 'nominal',
          uniqueValues,
          missingValues,
          stats
        };
      });
      
      setColumnMetadata(metadata);
    }
  }, [data, spec, sampleSize]);

  // Get columns from the first row of data
  const columns = useMemo(() => {
    if (!tableData.length) return [];
    return Object.keys(tableData[0] || {});
  }, [tableData]);

  // Get the data for the current page
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return tableData.slice(startIndex, startIndex + rowsPerPage);
  }, [tableData, page, rowsPerPage]);

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle applying sample size change
  const handleSampleSizeChange = (newSize: number, event?: React.MouseEvent) => {
    // Stop event propagation to prevent interference with parent components
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log(`Setting sample size to ${newSize}`);
    onSampleSizeChange(newSize);
    setShowSamplingOptions(false);
  };

  // Toggle sampling options visibility
  const toggleSamplingOptions = (event?: React.MouseEvent) => {
    // Stop event propagation to prevent interference with parent components
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setShowSamplingOptions(!showSamplingOptions);
  };

  // Handle column token click
  const handleColumnTokenClick = (column: ColumnMetadata) => {
    // Copy column name to clipboard
    navigator.clipboard.writeText(column.name).then(() => {
      console.log('Column name copied to clipboard:', column.name);
    });
  };

  return (
    <FooterContainer>
      <DataSummary>
        <SummaryText>
          {originalDataLength > 0 ? (
            <>
              {originalDataLength} total rows{isDataSampled && ` (showing ${tableData.length} samples)`} × {columns.length} columns
              {isDataSampled && (
                <SamplingIndicator title={`Table shows a sample of ${tableData.length} out of ${originalDataLength} rows for performance`}>
                  <InfoIcon fontSize="small" />
                  Sampled Data
                </SamplingIndicator>
              )}
            </>
          ) : (
            'No data available'
          )}
        </SummaryText>
        <div style={{ display: 'flex', gap: '8px' }}>
          {originalDataLength > 100 && (
            <ViewDataButton 
              onClick={(event) => toggleSamplingOptions(event)} 
              title="Adjust sampling options"
              style={{ marginRight: '8px' }}
            >
              <TuneIcon fontSize="small" style={{ marginRight: '4px' }} />
              Sampling
            </ViewDataButton>
          )}
          <ViewDataButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <>
                <VisibilityOffIcon fontSize="small" style={{ marginRight: '4px' }} />
                Hide Data
              </>
            ) : (
              <>
                <VisibilityIcon fontSize="small" style={{ marginRight: '4px' }} />
                View Data
              </>
            )}
          </ViewDataButton>
        </div>
      </DataSummary>

      {showSamplingOptions && originalDataLength > 100 && (
        <SamplingContainer>
          <span>Sample size:</span>
          {[100, 250, 500, 1000, 2000, 5000].map(size => (
            <SampleOption
              key={size}
              $active={sampleSize === size}
              onClick={(event) => handleSampleSizeChange(size, event)}
              role="button"
              tabIndex={0}
            >
              {size} rows
            </SampleOption>
          ))}
          <SampleOption
            $active={sampleSize === originalDataLength}
            onClick={(event) => handleSampleSizeChange(originalDataLength, event)}
            role="button"
            tabIndex={0}
          >
            All ({originalDataLength})
          </SampleOption>
        </SamplingContainer>
      )}

      <TableContainer $isOpen={isOpen}>
        <TableScroller>
          <Table>
            <thead>
              <tr>
                {columns.map(column => (
                  <TableHeader key={column}>
                    {columnMetadata[column] ? (
                      <DataColumnToken 
                        column={columnMetadata[column]} 
                        showStats={true}
                        onClick={handleColumnTokenClick}
                      />
                    ) : (
                      column
                    )}
                  </TableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => (
                <tr key={i}>
                  {columns.map(column => (
                    <td key={column}>{String(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroller>

        <TablePagination
          component="div"
          count={tableData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </FooterContainer>
  );
}; 