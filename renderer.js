// renderer.js

const { ipcRenderer } = require('electron');

// Elements from the DOM
const video = document.getElementById('video');
const captureButton = document.getElementById('capture-btn');
const deleteButton = document.getElementById('delete-btn');
const exportButton = document.getElementById('export-btn');
const fullScreenButton = document.getElementById('fullscreen-btn')
const nextFrameElement = document.getElementById('next-frame');
const overlayElement = document.getElementById('overlay')

// Set up the video stream
async function startVideoStream() {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: {
      width: { ideal: 4096 },
      height: { ideal: 2160 } 
    }
  });
  video.srcObject = stream;
}

startVideoStream();

// Function to update the next frame number display
async function updateNextFrameName() {
  const nextFrame = await ipcRenderer.invoke('get-next-frame-number');
  const currentFrame = await ipcRenderer.invoke('get-current-frame-number');
  const currentFrameImage = await ipcRenderer.invoke('get-current-frame-image');
  overlayElement.src = `data:image/png;base64,${currentFrameImage}`
  nextFrameElement.textContent = `${currentFrame}\n${nextFrame}`;
}

// Capture a frame from the video
captureButton.addEventListener('click', async () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set canvas dimensions same as the video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw the current frame from the video onto the canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert canvas to base64-encoded PNG
  const imageData = canvas.toDataURL('image/png', 1.0).replace(/^data:image\/png;base64,/, '');

  // Send the image data to the main process for saving
  const filename = await ipcRenderer.invoke('save-frame', imageData);
  console.log(`Saved ${filename}`);

  // Update the next frame name
  updateNextFrameName();
});

// Delete the latest frame
deleteButton.addEventListener('click', async () => {
  const deletedFrame = await ipcRenderer.invoke('delete-last-frame');
  if (deletedFrame) {
    console.log(`Deleted ${deletedFrame}`);
    updateNextFrameName(); // Update frame name after deletion
  }
});

fullScreenButton.addEventListener('click', async () => {
  await ipcRenderer.invoke('toggle-fullscreen')
})

exportButton.addEventListener('click', async () => {
  const exported = await ipcRenderer.invoke('export-movie');
})



// Update the next frame name when the app starts
updateNextFrameName();
