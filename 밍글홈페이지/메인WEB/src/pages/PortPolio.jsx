import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

import { motion } from 'framer-motion';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

// import { useRouteHistory } from "@/hooks"

import API from "@/libs/api";

import { useData, useConfig, useEtc } from '@/store';

import Thumb from "@/components/Item/Thumb";

export default function Layers({ share, setShare }) {

    const location = useLocation();
    const navigate = useNavigate();

    const { initCate } = location.state || {};

    const { configOptions } = useConfig();
    const { portpolio } = useData();
    const { setTheme } = useEtc();

    const main = useRef();
    const containerRef = useRef(null);
    const locoScroll = useRef(null);
    const imageRefs = useRef([]);

    const [cate, setCate] = useState('');


    useEffect(() => {
        console.log('effect 111111');
        locoScroll.current = new LocomotiveScroll({
            el: containerRef.current,
            smooth: true,
            lerp: 0.07,
            smartphone: {
                smooth: false
            }
            // smartphone: true,
        });

        locoScroll.current.on('call', (value, way, obj) => {
            if (value === 'onEnter' && way === 'enter') {
                console.log('해당 아이템이 진입했습니다:', obj.el);
                const bgColor = obj.el.getAttribute('data-bg');
                if (bgColor) {
                    containerRef.current.style.backgroundColor = bgColor;
                    setTheme(bgColor)
                }
            }
        });


        return () => {
            locoScroll.current?.destroy();
        };
    }, [])

    useEffect(() => {

        console.log('effect 2222222', share, cate, locoScroll.current );
        if (!locoScroll.current) return;

        containerRef.current.style.backgroundColor = portpolio?.filter(x => !cate ? true : x?.cate?.includes(cate))?.[0]?.bg;
        setTheme(portpolio?.filter(x => !cate ? true : x?.cate?.includes(cate))?.[0]?.bg);

        const target = document.getElementById(`portpolio-${share?.idx}`)

        if (target) {
            locoScroll.current.update();

            setTimeout(() => {
                console.log('target', target)
                locoScroll.current.scrollTo(target, {
                    duration: 300,
                    disableLerp: true,
                    offset: -(target.offsetHeight / 2)
                });
                setShare(null);
            }, 100);
        } else {
            
        }

    }, [cate]);

    useEffect(() => {
        if (share?.cate) setCate(share?.cate)
    }, [share])

    // useEffect(() => {

    //     if(initCate) setCate(initCate);

    // }, [initCate])

    const linkFunc = (idx) => {
        // setShare(idx);
        navigate(`${routes.portpolio}/${idx}`, { state: { cate } });
    }

    const cateFunc = (v) => {
        setCate(v);

        console.log('none target')
        locoScroll.current.scrollTo(10, {
            duration: 300,
            disableLerp: true,
            easing: [0.25, 0.00, 0.35, 1.00]
        });
        setTimeout(() => {
            locoScroll.current.update();
        }, 300)

        // locoScroll.current.scrollTo(0, {
        //     duration: 300,
        //     disableLerp: true,
        //     easing: [0.25, 0.00, 0.35, 1.00]
        // });
        // setTimeout(() => {
        //     locoScroll.current.update();
        // }, 300)
    }

    return (
        <>
            {/* {!isMobile && <Cursor isGelly={true} /> } */}

            <div className='portpolio_cates' data-cursor-exclusion>
                <p className={`text ${!cate ? 'active' : ''}`} onClick={() => { cateFunc('') }}>ALL<span className='rh'>{portpolio?.length})</span></p>
                {configOptions?.portpolioOptions?.map((x, i) => {
                    return <p key={i} className={`text ${cate === x ? 'active' : ''}`} onClick={() => cateFunc(x)}>{x}<span className='rh'>{portpolio?.filter(item => item?.cate?.includes(x))?.length})</span></p>
                })}
                {/* <p className='text'>{cate}{initCate}</p> */}
            </div>

            <div className="portpolio_container" data-cursor-exclusion>
                <div className='portpolio_list' ref={containerRef} >
                    {portpolio?.filter(x => !cate ? true : x?.cate?.includes(cate))?.map((x, i) => {
                        return (
                            <Thumb key={i} item={x} linkFunc={linkFunc} />
                        )
                    })}
                </div>
            </div>
        </>

    );
}
