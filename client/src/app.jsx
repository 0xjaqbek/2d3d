import React, { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import './app.css';

// NFT Contract ABI (minimal required for getting token URI)
const NFT_CONTRACT_ABI = [
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

// Contract address for the NFT collection
const NFT_CONTRACT_ADDRESS = '0x99903e8eC87b9987bD6289DF8eff178d6E533561';

// Ethereum mainnet RPC URL
const ETHEREUM_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/uH88xD8x-hsIQlZ8bgpyWjBfny9WUCfw';

// Rainbow colors for UI elements
const RAINBOW_COLORS = [
  '#FF5555', // Red
  '#FFAA00', // Orange
  '#FFFF55', // Yellow  
  '#55FF55', // Green
  '#55FFFF', // Cyan
  '#5555FF', // Blue
  '#FF55FF', // Magenta
];

function PixelArtApp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [tokenId, setTokenId] = useState('');
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const downloadLinkRef = useRef(null);
  const [rainbowIndex, setRainbowIndex] = useState(0);

  // Rainbow color cycling effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRainbowIndex((prev) => (prev + 1) % RAINBOW_COLORS.length);
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get current rainbow color
  const getCurrentColor = () => RAINBOW_COLORS[rainbowIndex];

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
        throw new Error('Nieprawidłowy Token ID');
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
        throw new Error('Nie udało się pobrać obrazu NFT');
      }

      // For IPFS metadata JSON, we might need to parse JSON and get image
      const metadata = await response.json();
      const actualImageUrl = metadata.image 
        ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : imageUrl;

      setNftImageUrl(actualImageUrl);
      setLoading(false);
    } catch (err) {
      console.error('Błąd pobierania NFT:', err);
      setError(err.message || 'Nie udało się pobrać NFT');
      setLoading(false);
    }
  };

  // Convert NFT image
  const handleConvertNFT = async () => {
    if (!nftImageUrl) return;
  
    try {
      setLoading(true);
      setError(null);
  
      console.log('Konwertowanie NFT z tokenID:', tokenId);
      console.log('Adres właściciela:', ownerAddress || manualAddress || 'Nie określono');
  
      // Fetch image blob
      const response = await fetch(nftImageUrl);
      const blob = await response.blob();
  
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'nft-image.png');
      
      // Add tokenId and ownerAddress if available
      if (tokenId) {
        console.log('Dodawanie token ID do formularza:', tokenId);
        formData.append('tokenId', tokenId);
      }
      
      const effectiveAddress = ownerAddress || manualAddress || '0x0000000000000000000000000000000000000000';
      console.log('Dodawanie adresu właściciela do formularza:', effectiveAddress);
      formData.append('ownerAddress', effectiveAddress);
  
      // Upload to server for processing
      const processResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
  
      if (!processResponse.ok) {
        throw new Error('Nie udało się przetworzyć obrazu');
      }
  
      // Create blob URL for the result
      const resultBlob = await processResponse.blob();
      const imageUrl = URL.createObjectURL(resultBlob);
      
      setResultImageUrl(imageUrl);
      setLoading(false);
    } catch (err) {
      console.error('Błąd konwersji:', err);
      setError(err.message || 'Nie udało się przekonwertować obrazu');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultImageUrl && downloadLinkRef.current) {
      downloadLinkRef.current.click();
    }
  };

  // Get border style with random pixel pattern
  const getPixelBorder = () => {
    return {
      borderImageSlice: '4 4 4 4',
      borderImageWidth: '4px 4px 4px 4px',
      borderImageOutset: '0px 0px 0px 0px',
      borderImageRepeat: 'repeat repeat',
      borderImageSource: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm2 0h1v1H2V0zM1 1h1v1H1V1zm2 0h1v1H3V1zM0 2h1v1H0V2zm2 0h1v1H2V2zM1 3h1v1H1V3zm2 0h1v1H3V3z' fill='${getCurrentColor().replace('#', '%23')}'/%3E%3C/svg%3E")`,
      borderWidth: '4px',
      borderStyle: 'solid',
      borderColor: 'transparent'
    };
  };

  return (
    <div className="pixel-app">
      <header>
        <img src="https://www.thepolacy.pl/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.9ed90224.png&w=256&q=75" alt="thePolacy" className="logo" />
        <p className="tagline">FanArt</p>
      </header>

      <main>
        <div className="nft-retrieval card" style={getPixelBorder()}>
          <h2>Pobierz Dane NFT</h2>
          <div className="token-input">
            <input 
              type="number" 
              placeholder="Wpisz thePolacy NFT Token ID" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              style={getPixelBorder()}
            />
            <button 
              className="primary-button"
              onClick={fetchNFTImage}
              disabled={loading}
              style={getPixelBorder()}
            >
              {loading ? 'Ładowanie...' : 'Wczytaj NFT'}
            </button>
          </div>

          {ownerAddress && (
            <div className="owner-info" style={getPixelBorder()}>
              <p>Właściciel: {ownerAddress}</p>
            </div>
          )}

          {nftImageUrl && (
            <div className="nft-preview">
              <div className="image-container" style={getPixelBorder()}>
                <img 
                  src={nftImageUrl} 
                  alt="Pobrany NFT" 
                  className="preview-image"
                />
              </div>
              <button 
                className="primary-button"
                onClick={handleConvertNFT}
                disabled={loading}
                style={getPixelBorder()}
              >
                {loading ? 'Przetwarzanie...' : 'Dodaj Efekt 3D'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message" style={getPixelBorder()}>
            <p>{error}</p>
          </div>
        )}

        {resultImageUrl && (
          <div className="result card" style={getPixelBorder()}>
            <h2>Oto Twoja Grafika 3D</h2>
            <div className="image-container" style={getPixelBorder()}>
              <img 
                src={resultImageUrl} 
                alt="Pixel art z efektem głębi" 
                className="result-image"
              />
            </div>
            <button 
              className="download-button"
              onClick={handleDownload}
              style={getPixelBorder()}
            >
              Pobierz
            </button>
            <a 
              ref={downloadLinkRef}
              href={resultImageUrl}
              download="pixel-art-3d.png"
              style={{ display: 'none' }}
            >
              Pobierz
            </a>
          </div>
        )}
      </main>

      <footer>
        <p>© 2025 thePolacy fanArtWeb3App by jaqbek</p>
      </footer>
    </div>
  );
}

export default PixelArtApp;