import React, { useState, useEffect } from 'react';

import Marquee from "react-fast-marquee";

import styles from './index.module.css';

export default function Component({
    title,
    platform = [],
    type,
    scope,
    purpose,
    bg,
    color
}) {
    const [text, setText] = useState("");

    useEffect(() => {
        setText(
            `Project Title ${title || "N/A"} · Platform ${platform.join(", ") || "N/A"} · Type ${type || "N/A"} · Scope ${scope || "N/A"} · Purpose ${purpose || "N/A"}`
        );
    }, [title, platform, type, scope, purpose]);

    return (
        <Marquee 
            style={{
                backgroundColor: bg || '#000'
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
