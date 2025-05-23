/**
 * Main App component that handles routing between gallery and editor views.
 * Uses styled-components for styling and maintains selected chart state.
 */

import { useState, useEffect } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { GalleryGrid } from './components/Gallery/GalleryGrid'
import { EditorLayout } from './components/Editor/EditorLayout'
import { DataManagement } from './components/DataManagement/DataManagement'
import { theme } from './types/theme'
import { initDB } from './utils/indexedDB'
import { DatabaseErrorModal } from './components/DataManagement/DatabaseErrorModal'
import ErrorBoundary from './components/common/ErrorBoundary'
import { CanvasArea } from './components/Canvas/CanvasArea'

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`

function App() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [dbError, setDbError] = useState<Error | null>(null)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)

  useEffect(() => {
    initDB().catch(error => {
      console.error('Failed to initialize database:', error);
      setDbError(error instanceof Error ? error : new Error('Unknown database error'));
      setIsErrorModalOpen(true);
    });
  }, []);

  const handleDatabaseReset = () => {
    // Reload the application after database reset
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
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
                <Route path="/data" element={<DataManagement />} />
                <Route path="/dashboard" element={<CanvasArea />} />
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
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
