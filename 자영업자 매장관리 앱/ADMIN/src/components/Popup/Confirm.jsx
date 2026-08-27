import React, { useEffect, useState, useRef } from 'react';

import { motion } from "framer-motion";

import images from "@/libs/images";
import styles from './index.module.css';

import { animateCSS } from "@/libs/utils";

export default function Component({
    style,
    fixed=true
}) {

    useEffect(() => {

       
    }, [])

    return (
        <motion.div
            className={fixed ? styles.container : styles.container_nofix}
            style={style}
        >
            <motion.div
                className={styles.loading_spin}
                // initial={{ scale: 0.5, opacity: 0 }}
                // animate={{ scale: 1, opacity: 1 }}
            >
            </motion.div>
        </motion.div>
    )    
}