const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create a basic icon
function createIcon(size, fileName) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with a blue color
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(0, 0, size, size);
  
  // Draw a simple V letter for Vega
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.25);
  ctx.lineTo(size * 0.5, size * 0.75);
  ctx.lineTo(size * 0.7, size * 0.25);
  ctx.lineTo(size * 0.65, size * 0.25);
  ctx.lineTo(size * 0.5, size * 0.65);
  ctx.lineTo(size * 0.35, size * 0.25);
  ctx.closePath();
  ctx.fill();
  
  // Add text
  const fontSize = size * 0.1;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('VEGA', size/2, size * 0.85);
  
  // Save the image as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(fileName, buffer);
  console.log(`Created ${fileName}`);
}

// Generate icons
createIcon(192, 'public/pwa-192x192.png');
createIcon(512, 'public/pwa-512x512.png');
createIcon(180, 'public/apple-touch-icon.png');

console.log('All PWA icons generated successfully!'); 