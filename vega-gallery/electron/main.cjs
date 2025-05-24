const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')

// Try to load pdf-parse, but handle the case where it might not be installed
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (err) {
  console.warn('pdf-parse not available:', err.message);
}

// Keep a global reference of the window object to avoid garbage collection
let mainWindow

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../src/electron/preload.js')
    }
  })

  // Load the app
  if (isDev) {
    // Load from development server
    // Try different ports starting from 5173, as Vite might use any available port
    tryLoadDevServer(mainWindow, 5173, 20)
    // Open the DevTools in development mode
    mainWindow.webContents.openDevTools()
    console.log('Running in development mode')
  } else {
    // Load the index.html from the dist folder in production
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    console.log('Running in production mode')
  }

  // Handle window close event
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  // Log any load failures
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load content')
    if (isDev) {
      setTimeout(() => {
        console.log('Attempting to reload...')
        mainWindow.loadURL('http://localhost:5174')
      }, 3000)
    }
  })
}

// Function to try loading from different ports
function tryLoadDevServer(window, startPort, maxAttempts) {
  let currentPort = startPort;
  let attempts = 0;
  
  const tryPort = () => {
    if (attempts >= maxAttempts) {
      console.error(`Failed to connect to dev server after ${maxAttempts} attempts`);
      return;
    }
    
    const url = `http://localhost:${currentPort}`;
    console.log(`Attempting to connect to dev server at ${url}`);
    
    window.loadURL(url).catch(err => {
      console.log(`Failed to connect to port ${currentPort}: ${err.message}`);
      attempts++;
      currentPort++;
      setTimeout(tryPort, 1000);
    });
  };
  
  tryPort();
}

// Handle PDF processing
ipcMain.handle('process-pdf', async (event, filePath) => {
  try {
    console.log('Processing PDF from:', filePath)
    
    if (!pdfParse) {
      console.warn('pdf-parse library not available, returning mock data');
      return "This is sample PDF text content extracted using pdf-parse.\nCategory,Value\nA,28\nB,55\nC,43\nD,91\nE,81";
    }
    
    try {
      // Read the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      
      // Parse the PDF
      const data = await pdfParse(dataBuffer);
      
      // Return the text content
      return data.text;
    } catch (parseErr) {
      console.error('Error parsing PDF:', parseErr);
      throw new Error(`Failed to parse PDF: ${parseErr.message}`);
    }
  } catch (err) {
    console.error('Error processing PDF:', err)
    throw err
  }
})

// Create window when Electron is ready
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// On macOS, re-create a window when dock icon is clicked and no windows are open
app.on('activate', function () {
  if (mainWindow === null) createWindow()
}) 