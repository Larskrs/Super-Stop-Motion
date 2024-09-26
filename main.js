// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Ffmpeg = require('fluent-ffmpeg');

// Function to read JSON data from config.js
function readConfig() {
    try {
      const configPath = path.join(__dirname, 'config.json');
        
      // Read the file synchronously and parse it into a JSON object
      const data = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(data);
        
        // Return the config object
        return config;
    } catch (error) {
        console.error('Error reading config.js:', error.message);
        return null;
    }
}

// Example usage
const config = readConfig();



console.log(config)

let window = null
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
  window = win
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

ipcMain.handle('toggle-fullscreen', async () => {

  window.setFullScreen(!window.isFullScreen());

});

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

// Delete the latest frame
ipcMain.handle('export-movie', async () => {
  const fps = 12
  const frameFolder = `${__dirname}/frames/`
  const outputFile = `${__dirname}/output/video.mp4`;
  console.log(frameFolder, outputFile)  // Path to the output MP4 file
  const frames = fs.readdirSync(frameFolder)

  const inputPattern = path.join(frameFolder, 'FRAME_%03d.png')

  Ffmpeg(inputPattern)               // Use input pattern for the image frames
      .inputFPS(fps)                 // Set input FPS
      .outputFPS(fps)                // Set output FPS
      .withSize("1920x1080")
      .videoCodec('libx264')         // H.264 codec for MP4
      .format('mp4')                 // Output format: MP4
      .on('progress', (progress) => {
          console.log(`Export progress: ${progress.frames} frames processed (${progress.percent}% done)`);
      })
      .on('start', (commandLine) => {
          console.log(`FFmpeg started with command: ${commandLine}`);
      })
      .on('error', (err, stdout, stderr) => {
          console.error('An error occurred: ' + err.message);
          console.error('ffmpeg stdout: ' + stdout);
          console.error('ffmpeg stderr: ' + stderr);
      })
      .on('end', () => {
          console.log('Processing finished successfully!');
      })
      .output(outputFile)            // Set output file
      .run();      
  }
)

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
  