import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
import FileUploader from './components/FileUploader';
import './App.css';

// NFT Contract ABI (minimal required for getting token URI)
const NFT_CONTRACT_ABI = [
  "function tokenURI(uint256 tokenId) public view returns (string memory)"
];

// Contract address for the NFT collection
const NFT_CONTRACT_ADDRESS = '0x99903e8eC87b9987bD6289DF8eff178d6E533561';

// Ethereum mainnet RPC URL (using Infura - you can replace with Alchemy or other provider)
const ETHEREUM_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/uH88xD8x-hsIQlZ8bgpyWjBfny9WUCfw';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [tokenId, setTokenId] = useState('');
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const downloadLinkRef = useRef(null);

  // Function to fetch NFT image URL using public provider
  const fetchNFTImage = async () => {
    // Reset previous states
    setLoading(true);
    setError(null);
    setNftImageUrl(null);
    setResultImageUrl(null);

    try {
      // Create a read-only provider
      const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL);
      
      // Create contract instance
      const contract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
      );

      // Validate token ID
      const tokenIdNum = parseInt(tokenId, 10);
      if (isNaN(tokenIdNum) || tokenIdNum < 0) {
        throw new Error('Invalid Token ID');
      }

      // Fetch token URI
      const tokenURI = await contract.tokenURI(tokenIdNum);

      // Convert IPFS URI if needed
      const imageUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');

      // Fetch image data
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFT image');
      }

      // For IPFS metadata JSON, we might need to parse JSON and get image
      const metadata = await response.json();
      const actualImageUrl = metadata.image 
        ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : imageUrl;

      setNftImageUrl(actualImageUrl);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching NFT:', err);
      setError(err.message || 'Failed to fetch NFT');
      setLoading(false);
    }
  };

  // Convert NFT image
  const handleConvertNFT = async () => {
    if (!nftImageUrl) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch image blob
      const response = await fetch(nftImageUrl);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'nft-image.png');

      // Upload to server for processing
      const processResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process image');
      }

      // Create blob URL for the result
      const resultBlob = await processResponse.blob();
      const imageUrl = URL.createObjectURL(resultBlob);
      
      setResultImageUrl(imageUrl);
      setLoading(false);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert image');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultImageUrl && downloadLinkRef.current) {
      downloadLinkRef.current.click();
    }
  };

  return (
    <div className="app">
      <header>
        <h1>NFT Pixel Art Depth Effect</h1>
        <p>Retrieve and convert NFT images to 3D depth visualization</p>
      </header>

      <main>
        <div className="nft-retrieval">
          <h2>Retrieve NFT</h2>
          <div className="token-input">
            <input 
              type="number" 
              placeholder="Enter NFT Token ID" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <button onClick={fetchNFTImage}>
              Fetch NFT
            </button>
          </div>

          {loading && (
            <div className="loading">
              <p>Loading...</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          {nftImageUrl && (
            <div className="nft-preview">
              <h3>NFT Image</h3>
              <img 
                src={nftImageUrl} 
                alt="Retrieved NFT" 
                className="nft-image"
              />
              <button 
                className="convert-button"
                onClick={handleConvertNFT}
              >
                Convert to Depth Image
              </button>
            </div>
          )}
        </div>

        {resultImageUrl && (
          <div className="result">
            <div className="image-result">
              <h3>Depth Effect Image:</h3>
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
                download="depth-nft-image.png"
                style={{ display: 'none' }}
              >
                Download
              </a>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 NFT Pixel Art Depth Converter</p>
      </footer>
    </div>
  );
}

export default App;