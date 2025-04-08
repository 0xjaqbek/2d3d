// client/src/components/FileUploader.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUploader.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function FileUploader({ onUploadStart, onUploadSuccess, onUploadError, tokenId, ownerAddress }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    // Only use the first file if multiple are dropped
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      onUploadStart();
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Add tokenId and ownerAddress to the form data if provided
      if (tokenId) {
        formData.append('tokenId', tokenId);
      }
      
      if (ownerAddress) {
        formData.append('ownerAddress', ownerAddress);
      }

      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to parse error as JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload image');
        } catch (e) {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      // Check the content type to determine if it's an image or JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('image/')) {
        // It's an image response, get as blob
        const blob = await response.blob();
        onUploadSuccess(blob);
      } else {
        // It's JSON data
        const data = await response.json();
        onUploadSuccess(data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error);
    }
  };

  return (
    <div className="file-uploader">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="file-preview">
            <img 
              src={URL.createObjectURL(selectedFile)} 
              alt="Selected file preview" 
              className="preview-image" 
            />
            <p>{selectedFile.name}</p>
          </div>
        ) : (
          <div className="dropzone-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h3l-4 4-4-4h3z"/>
            </svg>
            <p>Drag & drop a pixel art image here, or click to select a file</p>
            <p className="dropzone-hint">PNG, JPG, or GIF only. Max size: 5MB</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <button 
          className="upload-button" 
          onClick={handleUpload}
        >
          Add Depth Effect
        </button>
      )}
    </div>
  );
}

export default FileUploader;