/**
 * Main App component that handles routing between gallery and editor views.
 * Uses styled-components for styling and maintains selected chart state.
 */

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { GalleryGrid } from './components/Gallery/GalleryGrid'
import { EditorLayout } from './components/Editor/EditorLayout'
import { DataManagement } from './components/DataManagement/DataManagement'
import { initDB } from './utils/indexedDB'
import { seedDatabaseWithSampleData } from './utils/seedData'
import { DatabaseErrorModal } from './components/DataManagement/DatabaseErrorModal'
import ErrorBoundary from './components/common/ErrorBoundary'
import { DashboardContainer } from './components/Dashboard/DashboardContainer'
import { ThemeProvider } from './styles/ThemeProvider'
import { MuiThemeProvider } from './styles/MuiThemeProvider'

const AppContainer = styled.div`
  min-height: 100vh;
`;

function App() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [dbError, setDbError] = useState<Error | null>(null)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [isDbSeeded, setIsDbSeeded] = useState(false)

  useEffect(() => {
    // Initialize database and seed with sample data
    const initializeApp = async () => {
      try {
        // First initialize the database
        await initDB();
        
        // Then seed with sample data if needed
        const seeded = await seedDatabaseWithSampleData();
        setIsDbSeeded(seeded);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error : new Error('Unknown database error'));
        setIsErrorModalOpen(true);
      }
    };
    
    initializeApp();
  }, []);

  const handleDatabaseReset = () => {
    // Reload the application after database reset
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MuiThemeProvider>
        <BrowserRouter>
          <AppContainer>
            <Layout>
              <Routes>
                <Route path="/" element={
                  !selectedChart ? (
                    <GalleryGrid onChartSelect={setSelectedChart} />
                  ) : (
                    <EditorLayout 
                      chartId={selectedChart} 
                      onBack={() => setSelectedChart(null)} 
                    />
                  )
                } />
                <Route path="/data" element={<DataManagement isDbSeeded={isDbSeeded} />} />
                <Route path="/dashboard" element={<DashboardContainer />} />
              </Routes>
            </Layout>
            
            {isErrorModalOpen && (
              <DatabaseErrorModal 
                isOpen={isErrorModalOpen}
                error={dbError}
                onClose={() => setIsErrorModalOpen(false)}
                onReset={handleDatabaseReset}
              />
            )}
          </AppContainer>
        </BrowserRouter>
        </MuiThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
