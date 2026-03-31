import React, { useEffect, useState } from 'react';

import { motion } from "framer-motion";


import { usePopupComponent } from '@/store';

import consts from '@/libs/consts';

export default function Popup({}) {

    const { open, component, title, openPopupComponent, closePopupComponent } = usePopupComponent();

    const [list, setList] = useState([]);

    useEffect(() => {

    }, [open])

    const handleClose = () => {
        closePopupComponent();
    };
    
    return (
        <>
            <motion.div
                className="popup"
                initial={"closed"}
                animate={open ? "open" : "closed"}
                variants={consts.loaderVariants}
            >

                <motion.div
                    className="popup_bg"
                   
                    onClick={e => { 
                        if (e.target !== e.currentTarget) return;
                        handleClose();
                    }}
                />

                <motion.div
                    className={`popup_container_component`}
                    initial={"closed"}
                    animate={(open) ? "open" : "closed"}
                    variants={consts.boxVariants}
                >

                    {component && (
                        <div className='popup_container_component_inner' style={{ width: '100%' }}>
                            {component}
                        </div>
                    )}
                
                </motion.div>

            </motion.div>
        </>
    );
}