// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './index.css';

console.log('main.jsx is running');
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);