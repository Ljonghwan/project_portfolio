import React, { useState, useEffect } from 'react';

import Marquee from "react-fast-marquee";

import styles from './index.module.css';

export default function Component({
    text="",
    bg,
    color,
    style
}) {
    

    return (
        <Marquee 
            speed={200}
            style={{
                backgroundColor: bg || '#282828',
                gap: 100,
                height: 40
            }}
            autoFill
            pauseOnHover
            gradient
            gradientColor={bg || '#282828'}
            gradientWidth={50}
        >
            <p className={`paperlogy ${styles.text}`} style={{ color: color || '#fff'}}>{text}</p>
        </Marquee>

    );
}
