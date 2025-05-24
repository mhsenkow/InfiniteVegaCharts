import styled from 'styled-components'

const Container = styled.div`
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

interface ChartFilterProps<T> {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}

export function ChartFilter<T extends string>({ 
  label, 
  value, 
  options, 
  onChange 
}: ChartFilterProps<T>) {
  return (
    <Container>
      <Label>{label}</Label>
      <Select 
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </Container>
  )
} 