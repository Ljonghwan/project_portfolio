import React, { useEffect, useState } from 'react';

import { motion } from "framer-motion";

import { usePopup } from '@/store';

import consts from '@/libs/consts';
import Images from '@/libs/images';

export default function Popup({ }) {

    const { open, component, title, message, warning, button, buttonCencle, onCancelPress, onPress, closePopup } = usePopup();

    const [list, setList] = useState([]);

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
                                {title && <div className="popup_title">
                                    {warning ? <div style={{ display: "flex", gap: 16, alignItems: "center", }}>
                                        <div style={{ display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 100, background: "#FFDBDB" }}>
                                            <img style={{ width: 20, height: 20 }} src={Images.trash} alt={"x"} />
                                        </div>
                                        {title}
                                    </div> : title}
                                    <img className="hand" src={Images.close} alt={"x"} onClick={() => { handleClose() }} />
                                </div>}
                                {(message || warning) && (
                                    <div>
                                        {message && <p className="popup_msg">{message}</p>}
                                        {warning && <p className="popup_msg_warning">{warning}</p>}
                                    </div>
                                )}
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
                                    className={`popbtn ${warning ? "warning_btn" : "ok_btn"}`}
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