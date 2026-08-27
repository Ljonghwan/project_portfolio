import React, { useEffect, useState, useRef } from 'react';

import * as motion from "motion/react-client"

import images from "@/libs/images";
import styles from './index.module.css';


import { useSize } from '@/store';

function EnterDiv({
    delay=0,
    amount="all",
    style,
    className="",
    onClick=()=>{},
    children,
    ...props
}) {

    const { size } = useSize();

    return (
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: size?.width > 1000 ? delay : (delay / 3),
            }}
            viewport={{
                once: true,
                amount: size?.width > 1000 ? amount : 'some'
            }}
            style={style}
            className={className}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    )    
}

function EnterP({
    delay=0,
    amount="all",
    style,
    className="",
    children
}) {

    const { size } = useSize();

    return (
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{
                once: true,
                amount: size?.width > 1000 ? amount : 'some'
            }}
            transition={{
                duration: 0.5,
                delay: size?.width > 1000 ? delay : (delay / 3),
            }}
            style={style}
            className={className}
        >
            {children}
        </motion.p>
    )    
}

function Enterli({
    delay=0,
    amount='some',
    style,
    className="",
    children
}) {

    const { size } = useSize();

    return (
        <motion.li
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{
                once: true,
                amount: amount,
            }}
            transition={{
                duration: 0.3,
                delay: size?.width > 1000 ? delay : (delay / 3),
            }}
            style={style}
            className={className}
        >
            {children}
        </motion.li>
    )    
}

function EnterTag({
    delay=0,
    amount='some',
    style,
    className="",
    children
}) {

    const { size } = useSize();

    return (
         <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.3,
                delay: size?.width > 1000 ? delay : (delay / 3),
            }}
            viewport={{
                once: true,
                amount: amount
            }}
            style={style}
            className={className}
        >
            {children}
        </motion.div>
    )    
}

export {
    EnterDiv,
    EnterP,
    Enterli,
    EnterTag
}