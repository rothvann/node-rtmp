import React from 'react';
import './style/header-nav.css';
import './style/video-gallery.css';
import './style/video-card.css';
import HeaderNav from './components/header-nav.js';
import VideoGallery from './components/video-gallery.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <HeaderNav/>
      <VideoGallery/>
    </div>
  );
}

export default App;
