import React, { useEffect, useState } from 'react';

import { motion } from "framer-motion";

import { usePopup } from '@/store';

import consts from '@/libs/consts';

export default function Popup({}) {

    const { open, component, title, message, warning, button, buttonCencle, onCancelPress, onPress, closePopup } = usePopup();

    const [list, setList] = useState([]);

    useEffect(() => {

        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };

    }, [open])

    
    const handleClose = () => {
        closePopup();
    };
    
    return (
        <>
            <motion.div
                className="popup"
                initial={consts.loaderVariants.closed}
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
                    className={`${component ? 'popup_container_component' : 'popup_container'}`}
                    initial={"closed"}
                    animate={(open) ? "open" : "closed"}
                    variants={consts.boxVariants}
                >

                    {component ? (
                        <div style={{ width: '100%' }}>
                            {component}
                        </div>
                    ) : (
                        <>
                            <div className="popup_top">
                                {title && <p className="popup_title">{title}</p>}
                                {message && <p className="popup_msg">{message}</p>}
                                {warning && <p className="popup_msg_warning">{warning}</p>}
                            </div>
                            
                            <div className="popup_btn">

                                {buttonCencle && 
                                    <button 
                                        type="button" 
                                        className="popbtn cencle_btn"
                                        onClick={() => {
                                            handleClose();
                                            onCancelPress && onCancelPress();
                                        }}>
                                        {buttonCencle}
                                    </button>
                                }

                                <button 
                                    type="button" 
                                    className="popbtn ok_btn"
                                    onClick={() => {
                                        handleClose();
                                        onPress && onPress();
                                    }}>
                                    {button}
                                </button>
                            </div>
                        </>
                    )}

                    
                
                </motion.div>

            </motion.div>
        </>
    );
}