import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';

import { motion } from 'framer-motion';

import { isMobile } from 'react-device-detect';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { animateCSS, hpHypen } from "@/libs/utils";
import dummy from "@/libs/dummy";


import API from "@/libs/api";

import { usePopup, useConfig, useData, useSize, useEtc } from '@/store';

import Falling from "@/components/Falling";
import FallingMobile from "@/components/FallingMobile";
// import FallingMobile from "@/components/FallingMobile2";

import Form from "@/components/Form";


export default function Layers() {

    const location = useLocation();
    const navigate = useNavigate();

    const { configOptions } = useConfig();
    const { portpolio, mainLogos } = useData();
    const { size } = useSize();
    const { setTheme } = useEtc();

    const main = useRef();
    const scrollTween = useRef();
    const sceneRef = useRef();

    const [fallingView, setFallingView] = useState(false);
    const [fallingBoxSize, setFallingBoxSize] = useState({});

    const { contextSafe } = useGSAP(
        () => {

            // 기존 인스턴스가 있다면 제거
            if (ScrollSmoother.get()) {
                ScrollSmoother.get().kill();
            }

            const smoother = ScrollSmoother.create({
                wrapper: '#smooth-wrapper',
                content: '#smooth-content',
                ease: 'power4.out',
                // speed: 2,
                smooth: 1.2, // seconds it takes to "catch up" to native scroll position
                // smoothTouch: 1, 
                effects: true, // look for data-speed and data-lag attributes on elements and animate accordingly
            });

            const panels = gsap.utils.toArray('.panel');

            // 각 섹션에 슬라이드 애니메이션 적용
            panels.forEach((panel, i) => {
                ScrollTrigger.create({
                    trigger: panel,
                    start: 'top 50%', // 섹션이 뷰포트 하단에 닿을 때
                    // pin: true,
                    // pinSpacing: false,
                    // markers: true, // 디버깅용 마커 (필요시 제거)

                    once: true,
                    onEnter: () => {
                        if (panel.classList.contains('scene')) {
                            setFallingView(true);
                        }
                    },

                    id: 'panel-' + i,
                });
            });

            // ScrollSmoother는 메모리 누수 방지 위해 반드시 제거
            return () => {
                smoother.kill();
                ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            };
        },
        { scope: main, dependencies: [location.pathname] }
    );

    useEffect(() => {

        const parent = sceneRef.current;
        const parentRect = parent.getBoundingClientRect();
        console.log('parentRect', parentRect);
        setFallingBoxSize({ width: parentRect?.width, height: parentRect?.height })

    }, [size])

    const goPortpolio = (idx) => {
        if (idx) {
            navigate(`${routes.portpolio}/${idx}`, { state: { in: true } });
        } else {
            navigate(routes.portpolio);
        }
    }

    const contactFunc = () => {
        const target = document.getElementById('form');
        if (!target) return;

        if (isMobile) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 0 // 헤더 높이 등 오프셋
                },
                ease: 'power2.out'
            });
        } else {
            const smoother = ScrollSmoother.get();

            smoother.scrollTo(target, true, "top top"); // true = animate
        }
    }

    return (
        <>
            <div className='container' data-cursor-exclusion >
                <div id="smooth-wrapper" ref={main}>
                    <div id="smooth-content">
                        <section className="panel dark">
                            <div className='content center' >
                                <motion.div
                                    {...consts.textVariants}
                                    className='section1_text'
                                >
                                    <p className='rh text'>We are just</p>
                                    {mainLogos?.find(x => x?.position === 1)?.logo && (
                                        <div className='project' onClick={() => goPortpolio(mainLogos?.find(x => x?.position === 1)?.target_idx)}>
                                            <img src={consts.s3Url + mainLogos?.find(x => x?.position === 1)?.logo} />
                                        </div>
                                    )}
                                    <p className='rh text'>try</p>
                                </motion.div>
                                <motion.div
                                    {...consts.textVariants}
                                    transition={{ delay: 0.2 }}
                                    className='section1_text'
                                >
                                    <p className='rh text'>We</p>
                                    <div className='span' onClick={() => goPortpolio()}>
                                        <p className='rh text'>mingle</p>
                                        <img src={images.mingle_dot} className='rotate2' />
                                    </div>
                                    <p className='rh text'>purpose,</p>
                                    {mainLogos?.find(x => x?.position === 2)?.logo && (
                                        <div className='project' onClick={() => goPortpolio(mainLogos?.find(x => x?.position === 2)?.target_idx)}>
                                            <img src={consts.s3Url + mainLogos?.find(x => x?.position === 2)?.logo} />
                                        </div>
                                    )}
                                </motion.div>
                                <motion.div
                                    {...consts.textVariants}
                                    transition={{ delay: 0.4 }}
                                    className='section1_text end'
                                >
                                    {mainLogos?.find(x => x?.position === 3)?.logo && (
                                        <div className='project' onClick={() => goPortpolio(mainLogos?.find(x => x?.position === 3)?.target_idx)}>
                                            <img src={consts.s3Url + mainLogos?.find(x => x?.position === 3)?.logo} />
                                        </div>
                                    )}
                                    <p className='rh text'>people,</p>
                                    <p className='rh text'>and possibility.</p>
                                    {mainLogos?.find(x => x?.position === 4)?.logo && (
                                        <div className='project' onClick={() => goPortpolio(mainLogos?.find(x => x?.position === 4)?.target_idx)}>
                                            <img src={consts.s3Url + mainLogos?.find(x => x?.position === 4)?.logo} />
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            <div className='section1_bottom'>
                                <div className='text_box'>
                                    <p className='text'>주식회사 밍글은 고객과의 소통을 최우선으로 더 나은 솔루션을 제시함으로서</p>
                                    <p className='text'>새로운 디자인을 (<span className='rh'>Mingled</span>) 하고 있습니다.</p>
                                </div>
                                {/* <img src={images.message} /> */}
                            </div>
                        </section>

                        {/* <section className="panel dark" style={{ justifyContent: 'flex-start' }}>
                            <div className='video_box'>
                                <video
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    src={"/bg.mp4"}
                                    className=""
                                />
                            </div>
                           
                        </section> */}
                        
                        <section className="panel dark" style={{ justifyContent: 'flex-start' }}>
                            <div className='video_box'>
                                <video
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    src={configOptions?.video ? consts.s3Url + configOptions?.video : "/bg.mp4"}
                                    className=""
                                />
                            </div>
                            <div className='section2_text' >
                                <p className='text' onClick={() => {
                                    navigate(routes.portpolio)
                                    // window.scrollTo(0, 0);
                                }}>ALL<span className='rh'>{portpolio?.length})</span></p>
                                {configOptions?.portpolioOptions?.map((x, i) => {
                                    return (
                                        <p key={i} className='text' onClick={() => {
                                            navigate(routes.portpolio);
                                            // navigate(routes.portpolio, { state: { initCate: x } })
                                            // window.scrollTo(0, 0);
                                        }}>
                                            {x}<span className='rh'>{portpolio?.filter(item => item?.cate?.includes(x))?.length})</span>
                                        </p>
                                    )
                                })}
                            </div>
                        </section>

                        {/* 여기가 보이기 시작하면 시작 */}
                        <section className="panel white scene" ref={sceneRef}>
                            <div className='section3_text'>
                                <div className={'flex'} >
                                    <p className='text'>‘</p>
                                    <span className='text2'>밍글</span>
                                    <p className='text'>’과 함께 어우러질 준비, 되셨나요?</p>
                                </div>
                                <img src={images.link_gif} className='link' onClick={contactFunc} />
                            </div>
                            <div className='section3_text_m'>
                                <p className='text'>‘<span>밍글</span>’과 함께 어우러질 준비, 되셨나요?</p>
                                <img src={images.link_gif} className='link' onClick={contactFunc} />
                            </div>

                            {size?.width > 1024 ? (
                                (fallingView && portpolio?.length > 0) && <Falling fallingBoxSize={fallingBoxSize} list={portpolio?.filter((x, i) => i < 8)} />
                            ) : (
                                (fallingView && portpolio?.length > 0) && <FallingMobile fallingBoxSize={fallingBoxSize} list={portpolio?.filter((x, i) => i < 8)} />
                            )}

                        </section>

                        <section className="panel white form" id="form">
                            <Form />
                        </section>

                        <section className="panel dark">
                            <div className='footer'>
                                <div className='footer_left'>
                                    <div className='sns_box'>
                                        <a href={`${configOptions?.sns?.behence}`} target="_blank" className='sns'>behance</a>
                                        {/* <p className='sns'>youtube</p> */}
                                        <a href={`${configOptions?.sns?.insta}`} target="_blank" className='sns'>instagram</a>
                                    </div>

                                    <div className='info_box'>
                                        <p className='rh label'>location</p>
                                        <p className='info'>{configOptions?.addr}</p>
                                    </div>
                                </div>
                                <div className='footer_right'>

                                    <div className='info_box'>
                                        <p className='rh label'>business inquires</p>
                                        <a href={`tel:${configOptions?.tel}`} className='info'>{hpHypen(configOptions?.tel)}</a>
                                        <a href={`mailto:${configOptions?.email}`} className='info'>{configOptions?.email}</a>
                                    </div>
                                    {/* <div className='file_box' onClick={async () => {
                                        await API.brochure()
                                    }}>
                                        <p className='rh'>company brochure</p>
                                        <img src={images.download} alt={consts.imgAlt} />
                                    </div> */}
                                    <p className='copy'>© 2025 Mingle All rights reserved.</p>
                                </div>

                            </div>
                        </section>
                    </div>

                </div>

            </div>
        </>

    );
}
