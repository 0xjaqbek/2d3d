import React, { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import FileUploader from './components/FileUploader';
import './App.css';

// NFT Contract ABI (minimal required for getting token URI)
const NFT_CONTRACT_ABI = [
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
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
  const [ownerAddress, setOwnerAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const downloadLinkRef = useRef(null);

  // Function to fetch NFT image URL using public provider
  const fetchNFTImage = async () => {
    // Reset previous states
    setLoading(true);
    setError(null);
    setNftImageUrl(null);
    setResultImageUrl(null);
    setOwnerAddress('');

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
      
      // Fetch owner address
      const owner = await contract.ownerOf(tokenIdNum);
      setOwnerAddress(owner);

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
  
      console.log('Converting NFT with token ID:', tokenId);
      console.log('Owner address:', ownerAddress || manualAddress || 'Not specified');
  
      // Fetch image blob
      const response = await fetch(nftImageUrl);
      const blob = await response.blob();
  
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'nft-image.png');
      
      // Add tokenId and ownerAddress if available
      if (tokenId) {
        console.log('Adding token ID to form data:', tokenId);
        formData.append('tokenId', tokenId);
      }
      
      const effectiveAddress = ownerAddress || manualAddress || '0x0000000000000000000000000000000000000000';
      console.log('Adding owner address to form data:', effectiveAddress);
      formData.append('ownerAddress', effectiveAddress);
  
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

  // Handle direct file upload
  const handleUploadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleUploadSuccess = (blob) => {
    setLoading(false);
    const imageUrl = URL.createObjectURL(blob);
    setResultImageUrl(imageUrl);
  };

  const handleUploadError = (error) => {
    setLoading(false);
    setError(error.message || 'Failed to upload and process image');
  };

  const handleDownload = () => {
    if (resultImageUrl && downloadLinkRef.current) {
      downloadLinkRef.current.click();
    }
  };

  // Get effective address for the form (either from NFT lookup or manual entry)
  const getEffectiveAddress = () => {
    return ownerAddress || manualAddress || '';
  };

  return (
    <div className="app">
      <header>
        <h1>Przemień thePolaka w 3D Polaka</h1>
        <p>wpisz ID thePolaka</p>
      </header>

      <main>
        <div className="nft-retrieval">
          <h2>NFT</h2>
          <div className="token-input">
            <input 
              type="number" 
              placeholder="Wpisz NFT Token ID" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <button onClick={fetchNFTImage}>
              Zczytaj Obarzek
            </button>
          </div>

          {/* Manual owner address input */}
          <div className="owner-input">
            {ownerAddress && (
              <div className="owner-info">
                <p>Właściciel: {ownerAddress}</p>
              </div>
            )}
          </div>

          {/* Alternative direct file upload option */}
          <div className="direct-upload">
            <h3>Lub prześlij własny obraz</h3>
            <FileUploader
              onUploadStart={handleUploadStart}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              tokenId={tokenId}
              ownerAddress={getEffectiveAddress()}
            />
          </div>

          {loading && (
            <div className="loading">
              <p>Ładowanie...</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          {nftImageUrl && (
            <div className="nft-preview">
              <h3>Obraz NFT</h3>
              <img 
                src={nftImageUrl} 
                alt="Retrieved NFT" 
                className="nft-image"
              />
              <button 
                className="convert-button"
                onClick={handleConvertNFT}
              >
                Konwertuj
              </button>
            </div>
          )}
        </div>

        {resultImageUrl && (
          <div className="result">
            <div className="image-result">
              <h3>Wynik:</h3>
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
                Pobierz
              </button>
              <a 
                ref={downloadLinkRef}
                href={resultImageUrl}
                download="depth-nft-image.png"
                style={{ display: 'none' }}
              >
                Pobierz
              </a>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 thePolacy NFT FanPage by jaqbek.eth</p>
      </footer>
    </div>
  );
}

export default App;