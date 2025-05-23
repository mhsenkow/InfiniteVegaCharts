import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { TablePagination } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { TopLevelSpec } from 'vega-lite';

const FooterContainer = styled.div`
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 12px;
`;

const ToggleButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
  transition: all 0.2s ease;
  margin-bottom: 4px;

  &:hover {
    background: #f1f3f5;
    border-color: #ddd;
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
  border: 1px solid #eee;
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
    border-bottom: 1px solid #eee;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    background: #f8f9fa;
    z-index: 1;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-top: 1px solid #eee;

  select {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 8px;

    button {
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background: #f1f3f5;
      }
    }
  }
`;

const TableControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;

  input {
    padding: 4px 8px;
    border: 1px solid #ddd;
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
  border-top: 1px solid #eee;
  background: #f8f9fa;

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.1rem;
    color: #2c3e50;
  }
`;

const EncodingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const EncodingControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EncodingLabel = styled.div`
  font-weight: 500;
  color: #495057;
`;

const EncodingButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: ${props => props.theme.colors.primary};
  }

  &.recommend {
    background: ${props => props.theme.colors.primary};
    color: white;
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
  color: ${props => props.theme.text.secondary};
`;

const ViewDataButton = styled.button`
  padding: 6px 12px;
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const DataTableContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
  margin: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const ColumnStats = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
`;

const ColumnStat = styled.div`
  margin-bottom: 12px;
`;

const ColumnName = styled.div`
  font-weight: 500;
  color: #495057;
`;

const StatsList = styled.ul`
  list-style: none;
  padding-left: 0;
`;

const StatItem = styled.li`
  margin-bottom: 4px;
`;

const ColumnType = styled.span`
  font-weight: 500;
  color: #495057;
`;

const SamplingContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
  font-size: 0.9rem;
  color: ${props => props.theme.text.secondary};
`;

const SampleOption = styled.span<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.text.secondary};
  font-size: 0.8rem;
  
  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : '#f1f3f5'};
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 4px 8px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background: white;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary};
  }
`;

interface ChartFooterProps {
  data?: any[] | null;
  spec?: TopLevelSpec | null;
  sampleSize: number;
  onSampleSizeChange: (size: number) => void;
}

export const ChartFooter = ({ data, spec, sampleSize, onSampleSizeChange }: ChartFooterProps) => {
  // Add debug log to see what we're getting
  console.log('ChartFooter data:', data);
  console.log('ChartFooter spec:', spec);

  const [showDataTable, setShowDataTable] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Add state for visible columns
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  // Determine the data to show
  const rawData = data || (spec?.data && 'values' in spec.data ? spec.data.values : []) || [];
  const isArray = Array.isArray(rawData);
  
  // Create a safe array of objects for display
  const safeData = isArray ? rawData : [];
  
  // Determine all possible columns
  const allColumns = safeData.length > 0 
    ? Object.keys(safeData[0] || {})
    : [];
  
  // Initialize visible columns if not already set
  useEffect(() => {
    if (allColumns.length > 0 && visibleColumns.size === 0) {
      setVisibleColumns(new Set(allColumns));
    }
  }, [allColumns, visibleColumns]);
  
  // Get the columns to display
  const columns = Array.from(visibleColumns).filter(col => allColumns.includes(col));
  
  // Apply sampling to the data
  const sampledData = safeData.slice(0, Math.min(sampleSize, safeData.length));
  
  // Apply pagination
  const paginatedData = sampledData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <FooterContainer>
      <DataSummary>
        <SummaryText>
          {(() => {
            // Calculate the total row count safely
            let dataLength = 0;
            if (Array.isArray(data)) {
              dataLength = data.length;
            } else if (spec?.data && 'values' in spec.data) {
              const values = spec.data.values;
              dataLength = Array.isArray(values) ? values.length : 0;
            }
            return dataLength.toLocaleString();
          })()} total rows 
          (showing {sampledData.length} samples) × {columns.length} columns
        </SummaryText>
        <ViewDataButton onClick={() => setShowDataTable(!showDataTable)}>
          {showDataTable ? 'Hide Data' : 'View Data'}
        </ViewDataButton>
      </DataSummary>

      {sampledData.length > 0 && showDataTable && (
        <>
          <SamplingContainer>
            {[1, 10, 25, 50, 75, 100].map(size => (
              <SampleOption
                key={size}
                $active={sampleSize === size}
                onClick={() => onSampleSizeChange(size)}
                role="button"
                tabIndex={0}
              >
                {size} rows
              </SampleOption>
            ))}
          </SamplingContainer>
          
          <DataTableContainer>
            <DataTable>
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map(column => (
                      <td key={column}>
                        {typeof row[column] === 'object' 
                          ? JSON.stringify(row[column]) 
                          : String(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </DataTable>
            
            <Pagination>
              <PageButton
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={page === 0}
              >
                Previous
              </PageButton>
              <span>
                Page {page + 1} of {Math.ceil(sampledData.length / rowsPerPage)}
              </span>
              <PageButton
                onClick={() => setPage(prev => Math.min(Math.ceil(sampledData.length / rowsPerPage) - 1, prev + 1))}
                disabled={page >= Math.ceil(sampledData.length / rowsPerPage) - 1}
              >
                Next
              </PageButton>
            </Pagination>
          </DataTableContainer>
        </>
      )}
    </FooterContainer>
  );
}; 