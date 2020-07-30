import React, { useState, useEffect } from 'react';
import VideoCard from './video-card';

function makeCardsFromList(videoSrc) {
  return videoSrc.map((src) => {
    return (
      <VideoCard src={src}/>
    )
  });
}

export default function VideoGallery(props) {
  const [cards, setCards] = useState([]);
  
  useEffect(() => {
    //Get list of videos return tabs component
    fetch('http://localhost:3476/api/stream/list', {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      //setCards(makeCardsFromList(data));      
    });
    
  });
  
  return (
    <div className='video_gallery'>
      {cards}    
    </div>
  )
}