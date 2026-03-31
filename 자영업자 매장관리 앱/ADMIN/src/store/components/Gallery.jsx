import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";

import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

import { useGallery } from '@/store';

import consts from '@/libs/consts';

export default function Gallery({}) {

    const { open, startIndex, list, closeGallery } = useGallery();


    const handleClose = () => {
        closeGallery();
    };

    const renderItem = (item) => (
        <div className="image-gallery-image">
            <img
                src={item.original}
                alt={consts.imgAlt}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
            />
        </div>
    );
    
    return (
        <>
            <motion.div
                className="popup"
                initial={consts.loaderVariants.closed}
                animate={open ? "open" : "closed"}
                variants={consts.loaderVariants}
            >

                <motion.div
                    className="gallery_bg"
                    initial={consts.loaderBlurVariants.closed}
                    animate={open ? "open" : "closed"}
                    variants={consts.loaderBlurVariants}
                    onClick={e => { 
                        if (e.target !== e.currentTarget) return;
                        handleClose();
                    }}
                />

                <motion.div
                    className={`gallery_container`}
                    initial={consts.boxVariants.closed}
                    animate={(open) ? "open" : "closed"}
                    variants={consts.boxVariants}
                >
                
                    <ImageGallery 
                        items={list?.map(x => { return { original: x } } )} 
                        showPlayButton={false}
                        showBullets={true}
                        startIndex={startIndex}
                        useBrowserFullscreen={false}
                        draggable={false}
                    />
                
                </motion.div>

            </motion.div>
        </>
    );
}