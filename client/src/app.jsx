// client/src/App.jsx
import React, { useState, useRef } from 'react';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const downloadLinkRef = useRef(null);

  const handleUploadSuccess = (data) => {
    // For image responses, data will be a Blob
    if (data instanceof Blob) {
      const imageUrl = URL.createObjectURL(data);
      setResultImageUrl(imageUrl);
    }
    setLoading(false);
    setError(null);
  };

  const handleUploadError = (err) => {
    setError(err.message || 'Failed to process image');
    setLoading(false);
    setResultImageUrl(null);
  };

  const handleStartUpload = () => {
    setLoading(true);
    setError(null);
    setResultImageUrl(null);
  };

  const handleDownload = () => {
    if (resultImageUrl && downloadLinkRef.current) {
      downloadLinkRef.current.click();
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Pixel Art Depth Effect</h1>
        <p>Upload a pixel art image to add a depth effect</p>
      </header>

      <main>
        <FileUploader 
          onUploadStart={handleStartUpload}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {loading && (
          <div className="loading">
            <p>Processing image...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>Error: {error}</p>
          </div>
        )}

        {resultImageUrl && (
          <div className="result">
            <div className="image-result">
              <h3>Result Image with Depth:</h3>
              <img 
                src={resultImageUrl} 
                alt="Pixel art with depth effect" 
                className="result-image"
              />
            </div>
            <div className="download-container">
              <button 
                className="download-button"
                onClick={handleDownload}
              >
                Download Image
              </button>
              <a 
                ref={downloadLinkRef}
                href={resultImageUrl}
                download="depth-image.png"
                style={{ display: 'none' }}
              >
                Download
              </a>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 Pixel Art Depth Effect</p>
      </footer>
    </div>
  );
}

export default App;