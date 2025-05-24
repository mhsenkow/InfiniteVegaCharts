import React from 'react';
import styled from 'styled-components'
import { ChartCategory, Complexity, ChartConfig } from '../../types/chart'

const Container = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
`

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Label = styled.label`
  font-weight: 500;
  color: var(--color-text);
`

const Select = styled.select`
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
  }
`

const SearchInput = styled.input`
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`

interface FilterBarProps {
  category: ChartCategory | 'All';
  complexity: Complexity | 'All';
  searchTerm: string;
  sortBy: 'category' | 'complexity';
  filteredCharts: ChartConfig[];
  onCategoryChange: (category: ChartCategory | 'All') => void;
  onComplexityChange: (complexity: Complexity | 'All') => void;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: 'category' | 'complexity') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  category,
  complexity,
  searchTerm,
  sortBy,
  filteredCharts,
  onCategoryChange,
  onComplexityChange,
  onSearchChange,
  onSortChange
}) => {
  const categories = Object.values(ChartCategory);

  return (
    <Container>
      <SearchInput
        type="text"
        placeholder="Search charts..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <FilterGroup>
        <Label>Category:</Label>
        <Select 
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as ChartCategory | 'All')}
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat} ({filteredCharts.filter(c => c.category === cat).length})
            </option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label>Complexity:</Label>
        <Select
          value={complexity}
          onChange={(e) => onComplexityChange(e.target.value as Complexity | 'All')}
        >
          <option value="All">All Levels</option>
          {Object.values(Complexity).map(level => (
            <option key={level} value={level}>
              {level} ({filteredCharts.filter(c => c.complexity === level).length})
            </option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label>Sort by:</Label>
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'category' | 'complexity')}
        >
          <option value="category">Category</option>
          <option value="complexity">Complexity</option>
        </Select>
      </FilterGroup>

      <span>{filteredCharts.length} charts</span>
    </Container>
  )
}
