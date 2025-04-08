// server/src/services/imageService.js
const getPixels = require('get-pixels');
const { promisify } = require('util');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ethers } = require('ethers');

// Promisify the get-pixels function
const getPixelsAsync = promisify((src, type, cb) => getPixels(src, type, cb));

// Configuration parameters
const LEVEL_0_HEIGHT = 7;     // Background level
const LEVEL_1_HEIGHT = 10;     // Dark colors level
const LEVEL_2_HEIGHT = 13;    // Bright colors level
const LEVEL_3_HEIGHT = 15;    // Central dark elements (highest)
const BRIGHTNESS_THRESHOLD = 0.2; // Threshold between dark and bright colors (0-1)
const SIDE_VIEW_ANGLE = 45;   // Angle in degrees for the side view (0-90)
const EXTRUSION_DEPTH = 5;    // Scaling factor for extrusion
const PADDING = 60;           // Padding around the image

// Center region (25%-75%)
const CENTER_START_X = 0.33;  // Start of center region X (percentage of width)
const CENTER_END_X = 0.66;    // End of center region X (percentage of width)
const CENTER_START_Y = 0.40;  // Start of center region Y (percentage of height)
const CENTER_END_Y = 0.80;    // End of center region Y (percentage of height)

// Focus region (33%-66% width, 40%-80% height)
const FOCUS_START_X = 0.33;   // Start of focus region X (percentage of width)
const FOCUS_END_X = 0.66;     // End of focus region X (percentage of width)
const FOCUS_START_Y = 0.40;   // Start of focus region Y (percentage of height)
const FOCUS_END_Y = 0.80;     // End of focus region Y (percentage of height)

// Ethereum provider for ENS lookups
const ETHEREUM_PROVIDER = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/uH88xD8x-hsIQlZ8bgpyWjBfny9WUCfw');

const processImage = async (buffer, tokenId = '0', ownerAddress = '0x0000000000000000000000000000000000000000') => {
  try {
    // Create a temporary file to handle the image processing
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `image-${Date.now()}.png`);
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, buffer);
    
    // Get pixel data from the image using the file path
    const pixels = await getPixelsAsync(tempFilePath, null);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Extract dimensions and pixel data
    const width = pixels.shape[0];
    const height = pixels.shape[1];
    
    // Identify background color by checking sides
    const backgroundColors = identifyBackgroundColors(pixels, width, height);
    
    // Create elevation map with tiered approach
    const elevationMap = createTieredElevationMap(pixels, width, height, backgroundColors);
    
    // Render the elevation view
    const imageBuffer = await renderElevationView(pixels, elevationMap, width, height, backgroundColors, tokenId, ownerAddress);
    
    return {
      format: 'png',
      data: imageBuffer,
      dimensions: { width, height }
    };
  } catch (error) {
    console.error('Error in image processing:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
};

// Find colors that touch at least 2 sides of the image
const identifyBackgroundColors = (pixels, width, height) => {
  const sideColors = new Map();
  
  // Helper to add a color to the side map
  const addColor = (r, g, b) => {
    const colorKey = `${r},${g},${b}`;
    if (!sideColors.has(colorKey)) {
      sideColors.set(colorKey, { r, g, b, sides: new Set() });
    }
    return colorKey;
  };
  
  // Check top edge
  for (let x = 0; x < width; x++) {
    const r = pixels.get(x, 0, 0);
    const g = pixels.get(x, 0, 1);
    const b = pixels.get(x, 0, 2);
    const colorKey = addColor(r, g, b);
    sideColors.get(colorKey).sides.add('top');
  }
  
  // Check bottom edge
  for (let x = 0; x < width; x++) {
    const r = pixels.get(x, height - 1, 0);
    const g = pixels.get(x, height - 1, 1);
    const b = pixels.get(x, height - 1, 2);
    const colorKey = addColor(r, g, b);
    sideColors.get(colorKey).sides.add('bottom');
  }
  
  // Check left edge
  for (let y = 0; y < height; y++) {
    const r = pixels.get(0, y, 0);
    const g = pixels.get(0, y, 1);
    const b = pixels.get(0, y, 2);
    const colorKey = addColor(r, g, b);
    sideColors.get(colorKey).sides.add('left');
  }
  
  // Check right edge
  for (let y = 0; y < height; y++) {
    const r = pixels.get(width - 1, y, 0);
    const g = pixels.get(width - 1, y, 1);
    const b = pixels.get(width - 1, y, 2);
    const colorKey = addColor(r, g, b);
    sideColors.get(colorKey).sides.add('right');
  }
  
  // Filter to only keep colors that touch at least 2 sides
  const backgroundColors = new Set();
  for (const [colorKey, data] of sideColors.entries()) {
    if (data.sides.size >= 2) {
      backgroundColors.add(colorKey);
    }
  }
  
  return backgroundColors;
};

const createTieredElevationMap = (pixels, width, height, backgroundColors) => {
  const elevationMap = new Array(width * height).fill(0);
  
  // Calculate center region boundaries
  const centerStartX = Math.floor(width * CENTER_START_X);
  const centerEndX = Math.floor(width * CENTER_END_X);
  const centerStartY = Math.floor(height * CENTER_START_Y);
  const centerEndY = Math.floor(height * CENTER_END_Y);
  
  // Calculate focus region boundaries (33%-66% width, 40%-80% height)
  const focusStartX = Math.floor(width * FOCUS_START_X);
  const focusEndX = Math.floor(width * FOCUS_END_X);
  const focusStartY = Math.floor(height * FOCUS_START_Y);
  const focusEndY = Math.floor(height * FOCUS_END_Y);
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const r = pixels.get(x, y, 0);
      const g = pixels.get(x, y, 1);
      const b = pixels.get(x, y, 2);
      const a = pixels.shape[2] >= 4 ? pixels.get(x, y, 3) : 255;
      
      // Skip fully transparent pixels
      if (a === 0) {
        elevationMap[y * width + x] = 0;
        continue;
      }
      
      const colorKey = `${r},${g},${b}`;
      
      // Check if this is a background color (touching at least 2 sides)
      if (backgroundColors.has(colorKey)) {
        elevationMap[y * width + x] = LEVEL_0_HEIGHT;
        continue;
      }
      
      // Calculate brightness
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Check if pixel is in the focus region (33%-66% width, 40%-80% height)
      const isInFocusRegion = (x >= focusStartX && x <= focusEndX && 
                               y >= focusStartY && y <= focusEndY);
      
      // Check if pixel is in the center region (25%-75%)
      const isInCenterRegion = (x >= centerStartX && x <= centerEndX && 
                                y >= centerStartY && y <= centerEndY);
      
      // Check if pixel is dark
      const isDark = brightness < BRIGHTNESS_THRESHOLD;
      
      // Special case 1: Dark pixels in focus region go to level 3 (highest)
      if (isInFocusRegion && isDark) {
        elevationMap[y * width + x] = LEVEL_3_HEIGHT;
      }
      // Special case 2: Dark pixels in center region go to level 2
      else if (isInCenterRegion && isDark) {
        elevationMap[y * width + x] = LEVEL_2_HEIGHT;
      }
      // Regular case: Assign elevation based on brightness
      else if (isDark) {
        elevationMap[y * width + x] = LEVEL_1_HEIGHT; // Dark colors
      } else {
        elevationMap[y * width + x] = LEVEL_2_HEIGHT; // Bright colors
      }
    }
  }
  
  return elevationMap;
};

// Helper function to get ENS name for an address
async function getEnsName(address) {
  try {
    const ensName = await ETHEREUM_PROVIDER.lookupAddress(address);
    return ensName || address;
  } catch (error) {
    console.error('Error looking up ENS name:', error);
    return address;
  }
}

// Function to find the logo file
const findLogoFile = () => {
  // Try multiple possible locations for the logo file
  const possiblePaths = [
    path.join(__dirname, '../../../thePolacyLogo.png'),  // Original path (three levels up)
    path.join(__dirname, '../../thePolacyLogo.png'),     // Two levels up
    path.join(__dirname, '../thePolacyLogo.png'),        // One level up
    path.join(__dirname, 'thePolacyLogo.png'),           // Same directory
    path.join(process.cwd(), 'thePolacyLogo.png'),       // Root of the project
    path.join(process.cwd(), 'server/thePolacyLogo.png') // In server directory
  ];

  // Try to find the first path that exists
  for (const logoPath of possiblePaths) {
    console.log('Checking logo path:', logoPath);
    if (fs.existsSync(logoPath)) {
      console.log('Logo found at:', logoPath);
      return logoPath;
    }
  }

  console.error('Logo file not found in any of the expected locations');
  return null;
};

const renderElevationView = async (pixels, elevationMap, width, height, backgroundColors, tokenId, ownerAddress) => {
  // Calculate the new dimensions for the elevation view
  // We need extra space for the extrusion on both sides
  const elevationWidth = width + PADDING * 2;
  const elevationHeight = height + PADDING * 2;
  
  // Create canvas for rendering the elevation view with white background
  const canvas = createCanvas(elevationWidth, elevationHeight);
  const ctx = canvas.getContext('2d');
  
  // Fill the canvas with white background instead of transparent
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, elevationWidth, elevationHeight);
  
  // Calculate the projection factors
  const xProjection = Math.cos(SIDE_VIEW_ANGLE * Math.PI / 180);
  const yProjection = Math.sin(SIDE_VIEW_ANGLE * Math.PI / 180);
  
  // Offset for centering the image
  const offsetX = PADDING;
  const offsetY = PADDING + LEVEL_3_HEIGHT * EXTRUSION_DEPTH * yProjection; // Account for max elevation
  
  // First pass: Draw all non-background pixels from back to front
  // This creates a silhouette of the actual content
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = pixels.get(x, y, 0);
      const g = pixels.get(x, y, 1);
      const b = pixels.get(x, y, 2);
      const a = pixels.shape[2] >= 4 ? pixels.get(x, y, 3) : 255;
      
      // Skip fully transparent pixels
      if (a === 0) continue;
      
      const colorKey = `${r},${g},${b}`;
      
      // Get the elevation for this pixel
      const elevation = elevationMap[y * width + x] * EXTRUSION_DEPTH;
      
      // Calculate position on canvas
      const baseX = offsetX + x;
      const baseY = offsetY + y;
      
      // Convert RGB color to hex
      const hexColor = rgbToHex(r, g, b);
      
      // Define a vertical grid of points to connect for face rendering
      const gridPoints = [
        // Front face bottom
        { x: baseX, y: baseY, z: 0 },
        { x: baseX + 1, y: baseY, z: 0 },
        { x: baseX + 1, y: baseY + 1, z: 0 },
        { x: baseX, y: baseY + 1, z: 0 },
        
        // Front face top (elevated)
        { x: baseX, y: baseY, z: elevation },
        { x: baseX + 1, y: baseY, z: elevation },
        { x: baseX + 1, y: baseY + 1, z: elevation },
        { x: baseX, y: baseY + 1, z: elevation }
      ];
      
      // Project the points into 2D space
      const projectedPoints = gridPoints.map(point => ({
        x: point.x + point.z * xProjection,
        y: point.y - point.z * yProjection
      }));
      
      // Only draw elevated elements (skip if elevation is 0)
      if (elevation > 0) {
        // Draw the main faces of the cube
        
        // Top face (lighter)
        const topColor = lightenColor(hexColor, 15);
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(projectedPoints[4].x, projectedPoints[4].y);
        ctx.lineTo(projectedPoints[5].x, projectedPoints[5].y);
        ctx.lineTo(projectedPoints[6].x, projectedPoints[6].y);
        ctx.lineTo(projectedPoints[7].x, projectedPoints[7].y);
        ctx.closePath();
        ctx.fill();
        
        // Right face (darker)
        const rightColor = darkenColor(hexColor, 20);
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(projectedPoints[1].x, projectedPoints[1].y);
        ctx.lineTo(projectedPoints[5].x, projectedPoints[5].y);
        ctx.lineTo(projectedPoints[6].x, projectedPoints[6].y);
        ctx.lineTo(projectedPoints[2].x, projectedPoints[2].y);
        ctx.closePath();
        ctx.fill();
        
        // Left face (darkest)
        const leftColor = darkenColor(hexColor, 35);
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
        ctx.lineTo(projectedPoints[4].x, projectedPoints[4].y);
        ctx.lineTo(projectedPoints[7].x, projectedPoints[7].y);
        ctx.lineTo(projectedPoints[3].x, projectedPoints[3].y);
        ctx.closePath();
        ctx.fill();
      }
      
      // Front face (original color) - draw for all pixels
      ctx.fillStyle = hexColor;
      ctx.beginPath();
      ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
      ctx.lineTo(projectedPoints[1].x, projectedPoints[1].y);
      ctx.lineTo(projectedPoints[2].x, projectedPoints[2].y);
      ctx.lineTo(projectedPoints[3].x, projectedPoints[3].y);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Add overlay elements (logo, NFT ID, owner address)
  try {
    // 1. Add logo in top left corner
    const logoPath = findLogoFile();
    if (logoPath) {
      try {
        const logo = await loadImage(logoPath);
        // Calculate logo dimensions (keeping aspect ratio, 10% of canvas height)
        const logoHeight = Math.round(elevationHeight * 0.1);
        const logoWidth = Math.round((logo.width / logo.height) * logoHeight);
        ctx.drawImage(logo, 20, 20, logoWidth, logoHeight);
        console.log('Logo successfully added to the image');
      } catch (logoError) {
        console.error('Error loading logo image:', logoError);
      }
    }
    
    // 2. Add NFT ID to top right corner
    const fontSize = Math.round(elevationHeight * 0.03); // 3% of height for text size
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    // Add shadow to make text more visible
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Draw NFT ID
    console.log('Adding NFT ID:', tokenId);
    ctx.fillText(`#${tokenId}`, elevationWidth - 20, 20);
    
    // 3. Add owner address/ENS at the bottom
    // Look up ENS name if available
    let displayAddress = ownerAddress;
    try {
      displayAddress = await getEnsName(ownerAddress);
    } catch (error) {
      console.error('Error getting ENS name:', error);
    }
    
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white'; // Change text color to black for better visibility on white background
    ctx.textBaseline = 'bottom';
    console.log('Adding owner address:', displayAddress);
    ctx.fillText(`${displayAddress}`, elevationWidth / 2, elevationHeight - 20);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
  } catch (error) {
    console.error('Error adding overlay elements:', error);
  }
  
  return canvas.toBuffer('image/png');
};

// Helper function to convert RGB to hex color
const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Helper function to darken a color by a percentage
const darkenColor = (hex, percent) => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);
  
  return `#${(r.toString(16).padStart(2, '0'))}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Helper function to lighten a color by a percentage
const lightenColor = (hex, percent) => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  r = Math.min(255, Math.floor(r * (100 + percent) / 100));
  g = Math.min(255, Math.floor(g * (100 + percent) / 100));
  b = Math.min(255, Math.floor(b * (100 + percent) / 100));
  
  return `#${(r.toString(16).padStart(2, '0'))}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

module.exports = {
  processImage,
};