import React, { useEffect, useState, useRef } from 'react';

import images from "@/libs/images";
import styles from './index.module.css';

export default function Component({
    buttons,
    value,
    setValue,
    style
}) {

    const buttonRefs = useRef([]);
    const bgRefs = useRef(null);

    useEffect(() => {
        console.log(buttons, value)
        if (buttonRefs.current[value?.key]) {

            const activeBtn = buttonRefs.current[value?.key].current;

            if (activeBtn && bgRefs) {
                const rect = activeBtn.getBoundingClientRect();
                const containerRect = activeBtn.parentElement.getBoundingClientRect();

                const calc = rect.left - containerRect.left;

                bgRefs.current.style.width = `${rect.width}px`;
                bgRefs.current.style.transform = `translateX(${calc - (calc > 0 ? -2 : 2)}px)`;
            }
        }

    }, [buttons, value]);

    const handleButtonClick = (value) => {
        setValue(value);
    };

    return (
        <div className={styles.sort_group} style={style}>
            {buttons.map((btn, index) => (
                <button
                    key={btn?.key}
                    ref={(el) => (buttonRefs.current[btn?.key] = { current: el })} // ref 설정
                    className={`${styles.btn} ${value?.key === btn?.key ? styles.active : ''}`}
                    onClick={() => handleButtonClick(btn)}
                    data-value={btn.value}
                >
                    {btn.label}
                </button>
            ))}
            <span ref={bgRefs} className={styles.background} />
        </div>
    )    
}