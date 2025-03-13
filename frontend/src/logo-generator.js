// This is a simple script to generate logo files for the application
// Run with: node logo-generator.js

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to generate a logo
function generateLogo(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3498db'; // Blue background
  ctx.fillRect(0, 0, size, size);

  // API text
  ctx.fillStyle = '#ffffff'; // White text
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('API', size / 2, size * 0.35);

  // Watcher text
  ctx.fillStyle = '#ffffff'; // White text
  ctx.font = `bold ${size * 0.2}px Arial`;
  ctx.fillText('WATCHER', size / 2, size * 0.65);

  // Status indicator
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.85, size * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#2ecc71'; // Green indicator
  ctx.fill();

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Generated ${filename}`);
}

// Generate logos
generateLogo(192, 'logo192.png');
generateLogo(512, 'logo512.png');

console.log('Logo generation complete!'); 