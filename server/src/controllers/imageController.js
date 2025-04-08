// server/src/controllers/imageController.js
const { processImage } = require('../services/imageService');

const processImageController = async (req, res) => {
  try {
    console.log('Processing image with the following data:');
    console.log('Body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    console.log('File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const buffer = req.file.buffer;
    
    // Get tokenId and ownerAddress from request body, provide defaults if not provided
    const tokenId = req.body.tokenId || '0';
    const ownerAddress = req.body.ownerAddress || '0x0000000000000000000000000000000000000000';
    
    console.log('Using tokenId:', tokenId);
    console.log('Using ownerAddress:', ownerAddress);
    
    // Process the image and generate the depth effect with metadata
    const result = await processImage(buffer, tokenId, ownerAddress);
    
    // If result is PNG data, send as image
    if (result.format === 'png') {
      console.log('Sending PNG response');
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', 'attachment; filename="depth-image.png"');
      return res.send(result.data);
    }
    
    // Otherwise return as JSON
    console.log('Sending JSON response');
    res.status(200).json({ modelData: result });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: error.message || 'Error processing image' });
  }
};

module.exports = {
  processImageController,
};