import { DatasetSelectorBaseProps } from '../../types/dataset';

export interface DatasetSelectorProps extends DatasetSelectorBaseProps {
  mode: 'gallery' | 'editor';
  // Additional props specific to each mode
} 