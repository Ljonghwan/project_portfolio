import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from 'react-helmet-async';

import Lottie from "lottie-react";
import animationData from '@/assets/lottie/mingle_symbol.json';

import consts from '@/libs/consts';

import styles from './index.module.css';

export default function Loading({ load, setLoad = () => {}, style, fixed = true }) {
    const [zoom, setZoom] = useState(false);

    useEffect(() => {
        if (load) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [load]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <AnimatePresence>
                {load && (
                    <motion.div
                        className={styles.container}
                        style={style}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    >
                        <span className={styles.loader}></span>
                        
                    </motion.div>
                )}
                
            </AnimatePresence>
        </>
       
    );
}