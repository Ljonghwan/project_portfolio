import { useState } from 'react';

import images from '../libs/images';
import consts from '../libs/consts';

export default function Video({ src, className = "", style = {}, onClick = () => { } }) {

    const [loaded, setLoaded] = useState(false);

    return (
        <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            className={`fade-in-image ${loaded ? 'loaded' : ''} ${className}`} 
            onLoadedData={() => {
                setLoaded(true)
            }}
        >
            <source src={src} type="video/mp4" />
        </video>
                
    )
}