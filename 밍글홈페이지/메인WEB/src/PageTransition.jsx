import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PageTransition({ bg, children }) {
    const [revealed, setRevealed] = useState(false);

    return (
        <>
            {children}

            {/* <AnimatePresence>
                {!revealed && (
                    <motion.div
                        key="brush"
                        initial={{ height: 0 }}
                        animate={{ height: "100vh" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed"
                        onAnimationComplete={() => setRevealed(true)}
                        style={{ backgroundColor: bg || '#000' }}
                    />
                )}
            </AnimatePresence> */}

                {/* <motion.div
                    initial={{ opacity: 1, x: 500 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0.5, x: -500 }}
                    className="relative z-10"
                >
                    {children}
                </motion.div> */}
        </>
    );
}
