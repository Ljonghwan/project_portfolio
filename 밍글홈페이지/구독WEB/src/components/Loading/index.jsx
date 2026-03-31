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
            <Helmet>
                <meta name="theme-color" content={consts.pageThemeColors.white} />
            </Helmet>

            <div
                className={styles.container_lottie}
                style={style}
                // initial={{ y: 0, opacity: 1 }}
                // animate={{ y: 0, opacity: 1 }}
                // exit={{ y: 100, opacity: 0, transition: { duration: 0.4 } }}
            >
                <Lottie animationData={animationData} loop={false} onComplete={() => {
                    setLoad(false);
                }}/>
            </div>

            
            {/*             
            <AnimatePresence>
                {load && (
                    <motion.div
                        className={fixed ? styles.container : styles.container_nofix}
                        style={style}
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0, transition: { duration: 0.4 } }}
                    >
                        <motion.div
                            initial={{ scale: 1, opacity: 1 }}
                            animate={zoom ? { scale: 20, opacity: 0 } : { scale: 1, opacity: 1 }}
                            transition={{ delay: .5, duration: 1, ease: "easeInOut" }}
                            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
                            onAnimationComplete={() => {
                                if (zoom) setLoad(false);
                            }}
                        >
                            <LogoDraw
                                duration={2}
                                onComplete={() => setZoom(true)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence> */}
        </>
       
    );
}