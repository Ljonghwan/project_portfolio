import { useState } from 'react';

import images from '../libs/images';
import consts from '../libs/consts';

export default function Image({ src, className="", style={}, onClick=()=>{} }) {

    const [loaded, setLoaded] = useState(false);
    
    return (
        <img 
            onClick={onClick}
            className={`fade-in-image ${loaded ? 'loaded' : ''} ${className}`} 
            src={src} 
            alt={consts.imgAlt}
            style={style}
            onLoad={() => setLoaded(true)}
        />
    )    
}