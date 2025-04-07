// client/src/App.jsx
import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import ModelViewer from './components/ModelViewer';
import './App.css';

function App() {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUploadSuccess = (data) => {
    setModelData(data.modelData);
    setLoading(false);
    setError(null);
  };

  const handleUploadError = (err) => {
    setError(err.message || 'Failed to process image');
    setLoading(false);
  };

  const handleStartUpload = () => {
    setLoading(true);
    setError(null);
  };

  return (
    <div className="app">
      <header>
        <h1>Pixel Art to 3D Model Converter</h1>
        <p>Upload a pixel art image to convert it into a 3D model</p>
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

        {modelData && (
          <div className="result">
            <ModelViewer modelData={modelData} />
            <div className="download-container">
              <a 
                className="download-button"
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(modelData.data)}`}
                download="model.obj"
              >
                Download 3D Model (OBJ)
              </a>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 Pixel Art to 3D Converter</p>
      </footer>
    </div>
  );
}

export default App;