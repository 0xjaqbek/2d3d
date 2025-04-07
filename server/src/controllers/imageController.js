// server/src/controllers/imageController.js
const { processImage } = require('../services/imageService');

const processImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const buffer = req.file.buffer;
    
    // Process the image and generate 3D model data
    const modelData = await processImage(buffer);
    
    // Return the 3D model data
    res.status(200).json({ modelData });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: error.message || 'Error processing image' });
  }
};

module.exports = {
  processImageController,
};
