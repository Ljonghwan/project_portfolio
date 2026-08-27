import React, { useEffect, useState, useRef } from 'react';

import images from "@/libs/images";
import styles from './index.module.css';

export default function Component({
    msg="데이터가 없습니다.",
    icon,
    style
}) {


    return (
        <div className={styles.container} style={style}>
            {icon && (
                <img src={icon} />
            )}
            <p className={styles.title}>{msg}</p>
        </div>
    )    
}