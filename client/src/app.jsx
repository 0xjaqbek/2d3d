import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
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
        <h1>thePolacy fanArt</h1>
        <p>od jaqbka</p>
      </header>

      <main>
        <div className="nft-retrieval card">
          <h2>Pobierz Dane</h2>
          <div className="token-input">
            <input 
              type="number" 
              placeholder="Wpisz thePolacy NFT Token ID" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <button 
              className="primary-button"
              onClick={fetchNFTImage}
              disabled={loading}
            >
              {loading ? 'Procesuję...' : 'Wczytaj NFT'}
            </button>
          </div>

          {ownerAddress && (
            <div className="owner-info">
              <p>Właściciel: {ownerAddress}</p>
            </div>
          )}

          {nftImageUrl && (
            <div className="nft-preview">
              <div className="image-container">
                <img 
                  src={nftImageUrl} 
                  alt="Retrieved NFT" 
                  className="preview-image"
                />
              </div>
              <button 
                className="primary-button"
                onClick={handleConvertNFT}
                disabled={loading}
              >
                {loading ? 'Procesuję...' : 'Dodaj Efekt'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {resultImageUrl && (
          <div className="result card">
            <h2>Proszę</h2>
            <div className="image-container">
              <img 
                src={resultImageUrl} 
                alt="Pixel art with depth effect" 
                className="result-image"
              />
            </div>
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
              Download
            </a>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 thePolacy fanArtWeb3App.jaqbek</p>
      </footer>
    </div>
  );
}

export default App;