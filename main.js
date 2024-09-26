// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Create a window
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false, // Allow access to node APIs
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Get the next frame number
ipcMain.handle('get-next-frame-number', async () => {
  const dir = path.join(__dirname, 'frames');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const files = fs.readdirSync(dir);
  const lastFrameNumber = files.length;
  const nextFrameNumber = (lastFrameNumber + 1).toString().padStart(3, '0');
  return `FRAME_${nextFrameNumber}.png`;
});
// Get the current frame number
ipcMain.handle('get-current-frame-number', async () => {
  const dir = path.join(__dirname, 'frames');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const files = fs.readdirSync(dir);
  const lastFrameNumber = files.length;
  const nextFrameNumber = (lastFrameNumber).toString().padStart(3, '0');
  return `FRAME_${nextFrameNumber}.png`;
});

ipcMain.handle('get-current-frame-image', async () => {
    const dir = path.join(__dirname, 'frames');
  
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  
    const files = fs.readdirSync(dir);
    const lastFrameNumber = files.length;
    const nextFrameNumber = (lastFrameNumber).toString().padStart(3, '0');
    const address = `${__dirname}/frames/FRAME_${nextFrameNumber}.png`
    const file = fs.readFileSync(address).toString('base64')

    return file;
  });

// Save a new frame
ipcMain.handle('save-frame', async (event, imageData) => {
  const dir = path.join(__dirname, 'frames');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const files = fs.readdirSync(dir);
  const lastFrameNumber = files.length;
  const newFrameNumber = (lastFrameNumber + 1).toString().padStart(3, '0');
  const filename = `FRAME_${newFrameNumber}.png`;
  const filePath = path.join(dir, filename);

  // Write the image to the file system
  fs.writeFileSync(filePath, imageData, 'base64');

  return filename;
});

// Delete the latest frame
ipcMain.handle('delete-last-frame', async () => {
  const dir = path.join(__dirname, 'frames');

  if (!fs.existsSync(dir)) {
    return null;
  }

  const files = fs.readdirSync(dir).sort(); // Sort to ensure the files are ordered
  if (files.length === 0) {
    return null;
  }

  const latestFile = files[files.length - 1]; // Get the latest file
  const latestFilePath = path.join(dir, latestFile);

  // Delete the latest frame file
  fs.unlinkSync(latestFilePath);

  return latestFile;
});


// Quit when all windows are closed. 
app.on('window-all-closed', () => { 
    // On macOS it is common for applications and their  
    // menu bar to stay active until the user quits  
    // explicitly with Cmd + Q 
    if (process.platform !== 'darwin') { 
        app.quit() 
    } 
}) 
  
app.on('activate', () => { 
    // On macOS it's common to re-create a window in the  
    // app when the dock icon is clicked and there are no  
    // other windows open. 
    if (BrowserWindow.getAllWindows().length === 0) { 
        createWindow() 
    } 
}) 
  