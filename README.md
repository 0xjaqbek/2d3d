# Pixel Art to 3D Model Converter with NFT Support

This application converts pixel art images or NFTs into 3D models. It now supports fetching NFTs directly from the Ethereum blockchain.

## Features

- Upload pixel art images to convert to 3D models
- Convert NFTs to 3D models by providing a token ID
- View 3D models in an interactive viewer
- Download 3D models in OBJ format

## Setup and Installation

### Prerequisites

- Node.js (≥18.0.0)
- npm or yarn
- An Ethereum provider API key (Infura, Alchemy, etc.)

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd pixel-art-to-3d
   ```

2. Install dependencies
   ```
   npm run install-all
   ```

3. Set up environment variables
   ```
   cp server/.env.example server/.env
   ```

4. Edit the `server/.env` file and add your Ethereum provider URL:
   ```
   ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   ```

### Running the Application

1. Start the development server
   ```
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## NFT Conversion

The application is configured to work with the NFT contract at address `0x99903e8eC87b9987bD6289DF8eff178d6E533561` on the Ethereum mainnet. To convert an NFT:

1. Click on the "Use NFT" tab
2. Enter the token ID of the NFT you want to convert
3. Click "Convert NFT"

## Deployment

### Heroku

This application is ready for deployment on Heroku:

```
heroku create
git push heroku main
```

### Other Platforms

For other platforms, ensure that you:

1. Build the client application: `cd client && npm run build`
2. Set environment variables for your Ethereum provider
3. Start the server: `npm start`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.