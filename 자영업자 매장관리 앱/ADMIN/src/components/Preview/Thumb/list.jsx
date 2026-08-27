import { useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

export default function Component({
    item,
    index,
    style,
    linkFunc,
    animate = false,
    perspective = 1000,
    maxTilt = 20,
    scaleOnHover = 1.1,
}) {

    const navigate = useNavigate();

    const x = useMotionValue(0.5)
    const y = useMotionValue(0.5)

    const rotateX = useTransform(y, [0, 1], [15, -25])
    const rotateY = useTransform(x, [0, 1], [-15, 25])

    const animatedRotateX = useSpring(rotateX, {
        stiffness: 300,
        damping: 30,
    })
    const animatedRotateY = useSpring(rotateY, {
        stiffness: 300,
        damping: 30,
    })

    const scale = useSpring(1, {
        stiffness: 500,
        damping: 20,
    })

    const handleMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        // Adjusted to work with both mouse and touch events
        const clientX = event.clientX || event.touches[0].clientX
        const clientY = event.clientY || event.touches[0].clientY
        const mouseX = clientX - rect.left
        const mouseY = clientY - rect.top

        x.set(mouseX / rect.width)
        y.set(mouseY / rect.height)
    }

    const handleEnter = () => {
        scale.set(scaleOnHover)
    }

    const handleLeave = () => {
        x.set(0.5)
        y.set(0.5)
        scale.set(1)
    }

    return (
        <div id={`portpolio-${item?.idx}`} className={'portpolio_one'} style={{ ...style }} data-scroll-section>
            <motion.div
                className='section'
                onClick={() => linkFunc(item?.idx)}
                style={{
                    ...style,
                    rotateX: animatedRotateX,
                    rotateY: animatedRotateY,
                    scale: scale,
                    transformOrigin: "center",
                }}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
                onMouseEnter={handleEnter}
                onTouchStart={handleEnter}
                onMouseLeave={handleLeave}
                onTouchEnd={handleLeave}
            >
                <div className='dim'>
                    <img className={'bg_img'} src={item?.thumb ? (item?.thumb?.base || (consts.s3Url + item?.thumb)) : "/og.png"} />

                    {item?.thumbVideo ? (
                        <video
                            className={'bg_hover'}
                            src={item?.thumbVideo?.base || ( consts.s3Url + (item?.thumbVideo) )}
                            muted
                            playsInline
                            loop
                            autoPlay
                        >
                        </video>
                    ) : (
                        <img className={'bg_hover'} src={item?.thumbBg ? (item?.thumbBg?.base || (consts.s3Url + item?.thumbBg)) : "/og.png"}  />
                    )}
                </div>

                <div className={'data'}>
                    <p className='title'>{item?.title}</p>

                    <div className={'tags'}>
                        {item?.cate?.map((x, i) => {
                            return (
                                <p key={i}>{x}</p>
                            )
                        })}
                    </div>

                </div>
            </motion.div>

        </div>
    )
}
