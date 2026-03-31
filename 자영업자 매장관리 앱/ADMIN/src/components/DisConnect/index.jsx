import React, { useEffect, useState, useRef } from 'react';

import { motion } from "framer-motion";

import images from "@/libs/images";
import styles from './index.module.css';

import { animateCSS } from "@/libs/utils";

export default function Component({
    onClick=()=>{}
}) {

    useEffect(() => {

       
    }, [])

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
        >
            <button className='btn3' onClick={onClick}>채팅방 접속하기</button>
        </motion.div>
    )    
}