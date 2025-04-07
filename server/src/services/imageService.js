// server/src/services/imageService.js
const getPixels = require('get-pixels');
const { promisify } = require('util');
const OBJExporter = require('./exporters/objExporter');

// Promisify the get-pixels function
const getPixelsAsync = promisify((src, type, cb) => getPixels(src, type, cb));

const processImage = async (buffer) => {
  try {
    // Get pixel data from the image
    const pixels = await getPixelsAsync(buffer, null);
    
    // Extract dimensions and pixel data
    const width = pixels.shape[0];
    const height = pixels.shape[1];
    
    // Create a 3D voxel representation
    const voxelModel = createVoxelModel(pixels, width, height);
    
    // Generate OBJ file content
    const objData = OBJExporter.generateOBJ(voxelModel);
    
    return {
      format: 'obj',
      data: objData,
      dimensions: { width, height },
      previewData: generatePreviewData(voxelModel),
    };
  } catch (error) {
    console.error('Error in image processing:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
};

const createVoxelModel = (pixels, width, height) => {
  const voxels = [];
  
  // Iterate through each pixel
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Get RGB values for the current pixel
      const r = pixels.get(x, y, 0);
      const g = pixels.get(x, y, 1);
      const b = pixels.get(x, y, 2);
      const a = pixels.shape[2] >= 4 ? pixels.get(x, y, 3) : 255;
      
      // Skip fully transparent pixels
      if (a === 0) continue;
      
      // Calculate the height based on color brightness
      // Brightness = (0.299*R + 0.587*G + 0.114*B)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const height = Math.max(0.1, brightness / 255); // Scale between 0.1 and 1
      
      // Add voxel data
      voxels.push({
        position: [x, y, 0],
        size: [1, 1, height],
        color: [r, g, b],
      });
    }
  }
  
  return voxels;
};

const generatePreviewData = (voxels) => {
  // Generate a simplified version of the model for preview
  // This could include fewer voxels or simplified geometry
  return voxels.map(voxel => ({
    position: voxel.position,
    size: voxel.size,
    color: voxel.color,
  }));
};

module.exports = {
  processImage,
};
