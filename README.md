# NFT Pixel Art 3D Depth Converter

## Overview
This project allows users to retrieve NFT images from the Ethereum blockchain and convert them into 3D depth visualization images.

## Prerequisites
- Node.js (v18+)
- npm or yarn
- MetaMask browser extension
- Ethereum-compatible browser

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/nft-pixel-art-converter.git
cd nft-pixel-art-converter
```

### 2. Install Dependencies
```bash
npm run install-all
```

### 3. Environment Configuration
- Copy `.env.example` to `.env` in both `client` and `server` directories
- Update contract addresses and API endpoints as needed

### 4. Start Development Servers
```bash
npm run dev
```

### 5. Browser Setup
- Install MetaMask browser extension
- Connect to the appropriate Ethereum network
- Ensure you have some NFTs in the specified contract

## Features
- Retrieve NFT images via Token ID
- Convert images to 3D depth visualization
- Download converted images

## Technologies
- React
- Ethers.js
- Node.js
- Express
- Canvas

## Deployment
Ensure to set proper environment variables for production deployments.

## License
MIT License