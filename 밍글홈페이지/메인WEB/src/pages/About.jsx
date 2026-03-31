import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';

import { TypeAnimation } from 'react-type-animation';

import { motion } from 'framer-motion';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { animateCSS, hpHypen } from "@/libs/utils";

import API from "@/libs/api";

import { useSize } from '@/store';

import Falling from "@/components/Falling";
import Form from "@/components/Form";


export default function Layers() {

    const location = useLocation();
    const navigate = useNavigate();

    const main = useRef();

    const { size } = useSize();

    const { contextSafe } = useGSAP(
        () => {

            if (ScrollSmoother.get()) {
                ScrollSmoother.get().kill();
            }

            const smoother = ScrollSmoother.create({
                wrapper: '#smooth-wrapper',
                content: '#smooth-content',
                speed: 0.7,
                smooth: 1.5,
                // smoothTouch: 1.2,
                effects: true,
            });

            return () => {
                smoother.kill();
            };
        },
        { scope: main, dependencies: [location.pathname] }
    );

    return (
        <>
            <div id="smooth-wrapper" className='container' ref={main}>
                <div id="smooth-content">
                    <div className='about'>
                        <div className='title_box'>
                            <img src={images.mingle_dot} className='rotate2' />
                            <motion.div
                                {...consts.textInViewVariants}
                            >
                                <p className='title'>밍글은 계속해서</p>
                                <p className='title'>
                                    (
                                    <TypeAnimation
                                        sequence={[
                                            '즐겁게',
                                            1000,
                                            '믿을 수 없게',
                                            1000,
                                            '크리에이티브하게',
                                            1000,
                                        ]}
                                        repeat={Infinity}
                                        preRenderFirstString={true}
                                        cursor={false}
                                        wrapper="span"
                                        speed={{ type: 'keyStrokeDelayInMs', value: 150 }}
                                        deletionSpeed={50}
                                    />
                                    ) <br />일합니다.
                                </p>
                            </motion.div>
                        </div>

                        {size?.width > 1024 ? (
                            <div className='message_list'>
                                <motion.div
                                    {...consts.textLeftInViewVariants}
                                    viewport={{ once: true, amount: size?.width > 1024 ? 0.9 : 0.5 }}
                                    className='message'
                                >
                                    <p>Ready to ( <span>mingle</span> )?</p>
                                </motion.div>
                                <motion.div
                                    {...consts.textInViewVariants}
                                    viewport={{ once: true, amount: size?.width > 1024 ? 0.9 : 0.5 }}
                                    className='message message_own'
                                >
                                    <p>(<span>주식회사 밍글</span>)은 전략적 UX 설계와 실용적인 IT 솔루션을 바탕으로, 디지털 브랜딩부터 웹·앱 개발, SI/SM, 서버 운영, 유지보수까지 아우르는 <span>종합 디지털 파트너(Full-Service Digital Partner)</span>입니다.</p>
                                </motion.div>
                                <motion.div
                                    {...consts.textInViewVariants}
                                    viewport={{ once: true, amount: size?.width > 1024 ? 1 : 0.5 }}
                                    className='message message_own'
                                >
                                    <p>(<span>Mingle</span>) is a full-service digital agency offering UX/UI consulting, web & app development, e-commerce solutions, branding (BX/BI), server management, and <span>digital maintenance services — combining design sensibility</span> with technical expertise.</p>
                                </motion.div>
                                <motion.div
                                    {...consts.textLeftInViewVariants}
                                    viewport={{ once: true, amount: size?.width > 1024 ? 1 : 0.5 }}
                                    className='message'
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(routes.home, { state: { contact: true } })}
                                    data-cursor-text="CLICK"
                                    data-cursor-size="100px"
                                >
                                    <p>
                                        <span>밍글</span>과 함께 하시고 싶다면?
                                        <img src={images.right3} />
                                    </p>
                                </motion.div>
                            </div>
                        ) : (
                            <motion.ul
                                className='message_list'
                                variants={{
                                    hidden: {},
                                    show: {
                                        transition: {
                                            staggerChildren: 0.3,
                                        },
                                    },
                                }}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                            >
                                <motion.li
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 },
                                    }}
                                    className='message'
                                >
                                    <p>Ready to ( <span>mingle</span> )?</p>
                                </motion.li>
                                <motion.li
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 },
                                    }}
                                    className='message message_own'
                                >
                                    <p>(<span>주식회사 밍글</span>)은 전략적 UX 설계와 실용적인 IT 솔루션을 바탕으로, 디지털 브랜딩부터 웹·앱 개발, SI/SM, 서버 운영, 유지보수까지 아우르는 <span>종합 디지털 파트너(Full-Service Digital Partner)</span>입니다.</p>
                                </motion.li>
                                <motion.li
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 },
                                    }}
                                    className='message message_own'
                                >
                                    <p>(<span>Mingle</span>) is a full-service digital agency offering UX/UI consulting, web & app development, e-commerce solutions, branding (BX/BI), server management, and <span>digital maintenance services — combining design sensibility</span> with technical expertise.</p>
                                </motion.li>
                                <motion.li
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 },
                                    }}
                                    className='message'
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(routes.home, { state: { contact: true } })}
                                >
                                    <p>
                                        <span>밍글</span>과 함께 하시고 싶다면?
                                        <img src={images.right3} />
                                    </p>
                                </motion.li>
                            </motion.ul>
                        )}




                    </div>
                </div>
            </div>
        </>

    );
}
