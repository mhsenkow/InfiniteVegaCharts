import React from 'react';
import { DatasetManagementPage } from './DatasetManagementPage';

interface DataManagementProps {
  isDbSeeded?: boolean;
}

export const DataManagement: React.FC<DataManagementProps> = ({ isDbSeeded }) => {
  return <DatasetManagementPage />;
};

export default DataManagement; 