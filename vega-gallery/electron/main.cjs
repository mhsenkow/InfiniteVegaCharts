const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../src/electron/preload.js'),
      webSecurity: false
    }
  })

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load from the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// Handle PDF processing
ipcMain.handle('process-pdf', async (event, filePath) => {
  try {
    // In a real implementation, we would need to handle the blob URL differently
    // For now, we'll just use a sample PDF or mock the response
    console.log('Processing PDF from:', filePath);
    
    // For actual implementation, you'd download the file or use a temp file path
    // const dataBuffer = fs.readFileSync('/path/to/pdf/file.pdf');
    // const data = await pdfParse(dataBuffer);
    // return data.text;
    
    // Since we can't access the blob URL directly, return mock data for now
    return "This is sample PDF text content extracted using pdf-parse.\nCategory,Value\nA,28\nB,55\nC,43\nD,91\nE,81";
  } catch (err) {
    console.error('Error processing PDF:', err);
    throw err;
  }
});

// Wait for the app to be ready
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
}) 