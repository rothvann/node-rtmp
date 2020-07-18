import React, { useState, useEffect } from 'react';
import VideoCard from 'video-card';

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
    fetch('localhost:3476/api/stream/list', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      referrerPolicy: 'no-referrer',
    })
    .then(response => response.json())
    .then(data => {
      setCards(makeCardsFromList(data));      
    });
    
  });
  
  return (
    <div className='video_gallery'>
      {cards}    
    </div>
  )
}