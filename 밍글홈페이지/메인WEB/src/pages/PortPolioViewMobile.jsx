import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';

import { isMobile } from 'react-device-detect';

import { motion, useInView } from 'framer-motion';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { animateCSS, hpHypen } from "@/libs/utils";

import API from "@/libs/api";

import { useData, useConfig } from '@/store';

import NotFound from "@/pages/NotFound";

import ResponsiveImage from "@/components/ResponsiveImage";
import Scrolling from "@/components/Scrolling";
import Loading from "@/components/Loading2";


export default function Layers({ share, setShare }) {

    const { idx } = useParams();

    const location = useLocation();
    const navigate = useNavigate();

    const { configOptions } = useConfig();
    const { portpolio } = useData();

    const main = useRef();
    const banner = useRef();
    const section = useRef();
    const footer = useRef();

    const mainSection = useRef();
    const mainSectionImage = useRef();

    const header = useRef();

    const ref = useRef(null);

    const isInView = useInView(ref, { once: true });

    const [item, setItem] = useState(portpolio?.find(x => x?.idx == idx));
    const [step, setStep] = useState(1);

    const [load, setLoad] = useState(true);

    useEffect(() => {
        window.history.pushState(null, "", "");

        const goToBack = () => {
            console.log('back !!!!');
            if(!location?.state?.in) setShare({ idx, cate: location?.state?.cate });
            navigate(-1);
            // handleBack(idx);
            // navigate(-1);
            // navigate(routes.portpolio, { replace: true, state: { idx: idx } });
        };
        
        window.addEventListener("popstate", goToBack);

        return () => {
            window.removeEventListener("popstate", goToBack);
        };
    }, []);

    useEffect(() => {

        if (item) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: 0,
                    offsetY: 0 // 헤더 높이 등 오프셋
                },
                ease: 'power2.out'
            });

            viewFunc()

            setTimeout(() => {
                setLoad(false);
            }, 1000)
        }

    }, [item])

    const { contextSafe } = useGSAP(
        () => {
            if (!item) return;

           

            /* 배너 영역 */
            ScrollTrigger.create({
                trigger: banner.current,
                start: 'top top', // 섹션이 뷰포트 하단에 닿을 때
                pin: true,
                pinSpacing: false,
                // markers: true, // 디버깅용 마커 (필요시 제거)
            });
            /* 배너 영역 끝 */

            /* 푸터 영역 */
            
            /* 푸터 영역 끝 */

            setTimeout(() => {
                // /* 페이지 내부 헤더 */
                // const pinOffset = getComputedStyle(header.current).getPropertyValue('--header-height').trim() || '0px';

                // gsap.set(header.current, {
                //     top: `105px`, // 띄우고 싶은 만큼 고정 위치 조정
                //     position: 'absolute', // smoother가 있어서 transform pinType일 때는 absolute도 OK
                //     zIndex: 100,
                // });

                // ScrollTrigger.create({
                //     trigger: header.current,
                //     pin: true,
                //     pinType: 'transform',
                //     pinSpacing: false,

                //     start: `top top+=${pinOffset}`,
                //     endTrigger: '.portpolio_view',
                //     end: 'bottom top',
                // });
                // /* 페이지 내부 헤더 끝 */

                /* 각각 스탭별 이벤트 */
                // const steps = gsap.utils.toArray('.step');

                // steps.forEach((stepEl, index) => {
                //     ScrollTrigger.create({
                //         trigger: stepEl,
                //         start: 'top center', // 요소의 top이 뷰포트 중앙에 오면
                //         end: 'bottom center',
                //         onEnter: () => setStep(index + 1),
                //         onEnterBack: () => setStep(index + 1),
                //     });
                // });
                /* 각각 스탭별 이벤트 끝 */

                /* 메인 영역 */
                // gsap.set(mainSectionImage.current, { scale: 1.6 });

                // gsap.to(mainSectionImage.current, {
                //     scale: 1, // 줄어들 크기
                //     scrollTrigger: {
                //         trigger: mainSection.current,
                //         start: 'top 75%', // 컨테이너 상단이 화면 상단에서 75% 정도까지 들어왔을때 시작
                //         end: 'bottom bottom',   // 컨테이너 하단이 화면 하단에 왔을때 끝
                //         scrub: true,
                //         // markers: true,    // 개발 중 디버깅용
                //     },
                // });
                /* 메인 영역 끝 */

            }, 100)

            return () => {
                ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            };
        },
        { scope: main, dependencies: [location.pathname] }
    );

    const goToSection = (index) => {
        const steps = section.current?.querySelectorAll('.step');
        if (!steps || !steps[index]) return;

        setStep(index + 1);

        const target = steps[index];

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
        

    };


    const viewFunc = async () => {
        let sender = {
            idx: item?.idx
        }

        await API.post('/v1/portpolio/view', sender);
    }

    return (
        !item ? (
            <>
                <NotFound />
            </>
        ) : (
            <>
                <Loading load={load} setLoad={setLoad} />

                <div id="smooth-wrapper" ref={main} style={{ opacity: load ? 0 : 1 }}>
                    <div id="smooth-content">
                        <div className='portpolio_view'>
                            <div className='section' ref={banner} >
                                <div className='portpolio_section banner'>
                                    <ResponsiveImage image={item?.banner} />

                                    <motion.div
                                        initial={{ opacity: 0, y: 100 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.5 }}
                                    >
                                        <p className='title'>{item?.title}</p>
                                    </motion.div>

                                    {/* <p className='sticker'>N{item?.title}{item?.title}{item?.title}{item?.title}{item?.title}</p>
                                    <p className='sticker'>P{item?.title}{item?.title}{item?.title}{item?.title}{item?.title}</p>
                                    <p className='sticker'>T{item?.title}{item?.title}{item?.title}{item?.title}{item?.title}</p> */}
                                </div>
                            </div>

                            <div className='section' style={{ position: 'relative' }} ref={section}>
                                {/* <div ref={header} className='portpolio_header'>
                                    <div className={step === 1 ? 'active' : ''} onClick={() => goToSection(0)}>
                                        <p>OVERVIEW</p>
                                        <img src={images.right2} />
                                    </div>
                                    <div className={step === 2 ? 'active' : ''} onClick={() => goToSection(1)}>
                                        <p>MAIN PAGE</p>
                                        <img src={images.right2} />
                                    </div>
                                    <div className={step === 3 ? 'active' : ''} onClick={() => goToSection(2)}>
                                        <p>DETAIL PAGE</p>
                                        <img src={images.right2} />
                                    </div>
                                </div> */}

                                <div className='step'>
                                    <Scrolling
                                        text={`Project Title ${item?.title || "N/A"} · Platform ${item?.cate?.join(", ") || "N/A"} · Type ${item?.infoType || "N/A"} · Scope ${item?.infoScope || "N/A"} · Purpose ${item?.infoPurpose || "N/A"}`}
                                        bg={item?.bg}
                                        color={item?.color}
                                    />

                                    <div className={`portpolio_section portpolio_info mode${item?.mockupMode}`}>

                                        <div className='comment_box'>
                                            <motion.div
                                                {...consts.textInViewVariants}
                                            >
                                                <p className='comment'>{item?.comment}</p>
                                            </motion.div>

                                            <motion.div
                                                {...consts.textInViewVariants}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <p className='comment eng'>{item?.commentEng}</p>
                                            </motion.div>


                                            {item?.link && (
                                                <div className='site_button' onClick={() => window.open(item?.link)}>
                                                    <p>SITE</p>
                                                    <img src={images.link2} />
                                                </div>
                                            )}

                                        </div>

                                        <img src={consts.s3Url + item?.mockup} className='mockup' />

                                    </div>
                                </div>

                                <div className='step'>
                                    <div className='full' ref={mainSection}>
                                        <ResponsiveImage image={item?.mainSection} ref={mainSectionImage} />
                                    </div>
                                </div>

                                <div className='step' >
                                    <ResponsiveImage image={item?.detailSection} className={'auto_height'} />
                                </div>

                            </div>

                            <div ref={footer} className='portpolio_footer' style={{ position: 'relative' }}>
                                
                                <div className='portpolio_footer_logo' style={{ backgroundColor: item?.bg }}>
                                    <img src={consts.s3Url + item?.footerLogo} />
                                </div>

                                <Scrolling
                                    text={`Your next great idea deserves the right team! let’s mingle!`}
                                />
                            
                            </div>
                        </div>
                    </div>
                </div>

            </>
            
        )


    );
}
