// server/src/controllers/imageController.js
const { processImage } = require('../services/imageService');

const processImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const buffer = req.file.buffer;
    
    // Process the image and generate the depth effect
    const result = await processImage(buffer);
    
    // If result is PNG data, send as image
    if (result.format === 'png') {
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', 'attachment; filename="depth-image.png"');
      return res.send(result.data);
    }
    
    // Otherwise return as JSON
    res.status(200).json({ modelData: result });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: error.message || 'Error processing image' });
  }
};

module.exports = {
  processImageController,
};