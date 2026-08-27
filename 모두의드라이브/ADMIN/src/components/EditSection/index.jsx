import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './index.module.css';

import images from "@/libs/images";

export default function Component({ title, children }) {
    const [isOpen, setIsOpen] = useState(false);

    // 타이틀 클릭 시 토글
    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    // 애니메이션 설정
    const variants = {
        open: {
            height: 'auto',
            opacity: 1,
            transition: {
                height: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.3 },
            },
        },
        closed: {
            height: 0,
            opacity: 0,
            transition: {
                height: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.3 },
            },
        },
    };

    return (
        <motion.div className={`${styles.container} ${isOpen ? styles.active : ''}`}>
            <div className={styles.titleBox} onClick={handleToggle} style={{ cursor: 'pointer' }}>
                <p className={styles.title}>{title}</p>
                <img src={images.down_black} className={styles.arrow}/>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.content}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={variants}
                        style={{ overflow: 'hidden' }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}