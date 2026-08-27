import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, useMatch } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

import { isMobile } from 'react-device-detect';
import { Cursor } from 'react-creative-cursor';
import 'react-creative-cursor/dist/styles.css';

import { useUser, usePopup, useEtc } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { getProfile, numFormat } from "@/libs/utils";

import API from "@/libs/api";

const sidebarVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
};


export default function Component() {

    const { token, mbData, count, logout } = useUser();
    const { openPopup } = usePopup();
    const { theme, setTheme } = useEtc();

    const navigate = useNavigate();
    const location = useLocation();

    const { contact } = location.state || {};

    const [view, setView] = useState(false);

    const match = useMatch(routes.portpolioView);

    useEffect(() => {

        if( location.pathname === routes.home ) {
            setTheme(consts.pageThemeColors.default);
        } else if(location.pathname === routes.about || match) {
            setTheme(consts.pageThemeColors.white);
        } else {
            setTheme(consts.pageThemeColors.default);
        }
        
        if (location.pathname === routes.home && contact) {
            setTimeout(() => {
                contactFunc();
            }, 300)
        }

    }, [location.pathname, match])

    useEffect(() => {
        if (view) {
            document.body.style.overflow = 'hidden';
            // document.body.style.backgroundColor = '#28282820';
        } else {
            document.body.style.overflow = '';
            // document.body.style.backgroundColor = theme;
        }
        return () => {
            document.body.style.overflow = '';
            // document.body.style.backgroundColor = theme;
        };

    }, [view])

     useEffect(() => {

        console.log('theme', theme);
        // document.body.style.backgroundColor = theme;

    }, [theme])

    const linkFunc = (link, option) => {
        setView(false);

        if (location.pathname === link) {
            // if(location.pathname === routes.portpolio) {
            //     portpolio_list
            // }
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        } else if (link) {

            navigate(link, option);
            window.scrollTo(0, 0);
            //  window.scrollBy(0, -scrollSpeed);
        }
    }

    const contactFunc = () => {
        setView(false);

        if (location.pathname !== routes.home) {
            linkFunc(routes.home, { state: { contact: true } });
            return;
        }

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


        // const y = target.getBoundingClientRect().top + window.scrollY;

        // gsap.to(window, {
        //     scrollTo: y,
        //     duration: 1,
        //     ease: 'power2.out',
        // });
    }

    return (
        <>
            <Helmet>
                <meta name="theme-color" content={theme} />
            </Helmet>

             {!isMobile && <Cursor isGelly={true} gellyAnimationAmount={300} sizeAnimationDuration={1}/> }

            <div className='header' data-cursor-exclusion>
                <p>WE ARE</p>

                <div className='header_logo_box' onClick={() => linkFunc(routes.home)}>
                    <img src={images.logo_white} alt={consts.imgAlt} className='logo'/>
                    <img src={images.logo_m} alt={consts.imgAlt} className='logo_m'/>
                    {/* <p className='header_title'>채팅관리자</p> */}
                </div>

                <button type={'button'} className='header_menu_m' onClick={() => setView(!view)} />

                <div
                    className='header_menu_box'
                >
                    <div className='header_menu_top' onClick={() => setView(!view)}>
                        <img src={images.exit_white} />
                    </div>
                    <p onClick={() => linkFunc(routes.about)}>ABOUT</p>
                    <p onClick={() => linkFunc(routes.portpolio)}>MINGLE</p>
                    <p onClick={contactFunc}>CONTACT</p>
                </div>
            </div>
            
            {(location.pathname === routes.home || location.pathname === routes.about) && (
                <div className='floting' onClick={contactFunc} data-cursor-size="0"  >
                    <img src={images.message} />
                </div>
            )}

            <AnimatePresence>
                {view && (
                    <>
                        <motion.div
                            className='header_menu_box_m'
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={sidebarVariants}
                            // transition={{ type: 'spring' }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className='header_menu_top' onClick={() => setView(!view)}>
                                <img src={images.exit_white} />
                            </div>
                            <div className='header_menu_list'>
                                <p onClick={() => linkFunc(routes.about)}>ABOUT</p>
                                <p onClick={() => linkFunc(routes.portpolio)}>MINGLE</p>
                                <p onClick={contactFunc}>CONTACT</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </>
    )
}