import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from "lodash";
import dayjs from "dayjs";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import Zoom from 'react-medium-image-zoom';

import 'swiper/css';
import 'swiper/css/pagination';

import { useUser, usePopup, useGallery, useConfig, usePopupComponent } from '@/store';

import Empty from "@/components/Empty";
import Loading from "@/components/Loading";
import InputSelect from "@/components/InputSelect";

import TopVisual from "@/components/Badge/TopVisual";

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen } from "@/libs/utils";

export default function Component({ 
    style,
    mode,
    selected,
    type,
    listReload=()=>{},
    admin=false
}) {

    const { token, mbData, logout } = useUser();
    const { openPopup } = usePopup();
    const { closePopupComponent } = usePopupComponent();
    
    const { openGallery } = useGallery();
    const { configOptions } = useConfig();
    
    const navigate = useNavigate();
    const location = useLocation();

    const ref = useRef();

    const setDebouncedTimeout = useDebouncedTimeout();

    // 필터링
    const [item, setItem] = useState('');
    const [status, setStatus] = useState(1);

    const [load, setLoad] = useState(false);

    useEffect(() => {

        dataFunc(true);

    }, [selected])

    const dataFunc = async (reset=false) => {

        if(reset) {
            ref.current.scrollTo( 0, 0 );
            setLoad(false);
        }

        const sender = {
            idx: selected?.idx
        }

        const { data, error } = await API.post(type === 'subscription' ? '/admin/board/subscription' : '/admin/board', sender);
        console.log('data', data);

        if(error) {
            toast.error(error?.message, consts.toastErrorOption);
            return;
        }

        setItem(data);
        setStatus(data?.status);

        setDebouncedTimeout(() => {
            setLoad(true)
        }, consts.apiDelay); 

    }

    const statusFunc = async (status) => {

        const id = toast.loading("Please wait...");

        const sender = {
            idx: item?.idx,
            status: status,
            type: type
        }

        const { data, error } = await API.post('/admin/board/status', sender, { id });

        setDebouncedTimeout(() => {

            if(error) {
                toast.update(id, { render: error?.message, type: "error", ...consts.toastOption });
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});
            dataFunc();

        }, consts.apiDelay); 
        
    }
	return (
        <>
           
            <div ref={ref} className={`box`} style={{ overflow: 'auto', paddingBottom: 24,  ...style }}>

               {!load && ( <Loading /> )}

                {mode === 'pop' && (
                    <div className='box_top_title_box'>
                        <p className='box_top_title'>문의 상세</p>
                        <img src={images.close} alt={consts.imgAlt} onClick={closePopupComponent}/>
                    </div>
                )}
            
               <motion.div
                    className={'box_content'}
                    style={{ flex: 1, justifyContent: 'space-between' }}
                    initial={consts.loaderVariants.closed}
                    animate={load ? "open" : "closed"}
                    variants={consts.loaderVariants}
                >
                    <div className='list_container'>
                        {/* <div className='flex' style={{ justifyContent: 'flex-end', gap: 8 }}>
                            <button className='td_btn type2'>접수</button>
                            <button className='td_btn type3'>처리완료</button>
                        </div>   */}

                        <p className='title'>신청자 정보</p>
                        <ul className='list'>
                            <li>
                                <p className='label'>신청 일시</p>
                                <p className='data'>{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</p>
                            </li>
                            <li>
                                <p className='label'>회사명</p>
                                <p className='data'>{item?.company}</p>
                            </li>
                            <li>
                                <p className='label'>담당자명</p>
                                <p className='data'>{item?.name}</p>
                            </li>
                            <li>
                                <p className='label'>이메일</p>
                                <p className='data'>{item?.email}</p>
                            </li>
                        </ul>

                        <p className='title'>문의 정보</p>
                        {type === 'subscription' ? (
                            <>
                                <ul className='list'>
                                    <li>
                                        <p className='label'>필요한 개발 종류</p>
                                        <p className='data'>{item?.projects}</p>
                                    </li>
                                    <li>
                                        <p className='label'>개발 대상</p>
                                        <p className='data'>{item?.services}</p>
                                    </li>
                                    
                                </ul>
                                <ul className='list'>
                                    <li>
                                        <p className='label'>희망 플랜</p>
                                        <p className='data'>{item?.plan}</p>
                                    </li>
                                    <li>
                                        <p className='label'>현재 준비 상황</p>
                                        <p className='data'>{item?.ready}</p>
                                    </li>
                                  
                                </ul>
                            </>
                        ) : (
                            <>
                                <ul className='list'>
                                    <li>
                                        <p className='label'>진행 서비스</p>
                                        <p className='data'>{item?.services}</p>
                                    </li>
                                    <li>
                                        <p className='label'>진행 프로젝트</p>
                                        <p className='data'>{item?.projects}</p>
                                    </li>
                                </ul>
                                <ul className='list'>
                                    <li>
                                        <p className='label'>기존 사이트 주소</p>
                                        <a className='data' href={item?.site} target='_blank'>{item?.site}</a>
                                    </li>
                                    <li>
                                        <p className='label'>프로젝트 예산</p>
                                        <p className='data'>{item?.price}</p>
                                    </li>
                                </ul>
                            </>
                        )}
                        
                        <ul className='list'>
                            <li>
                                <p className='label'>처리 상태</p>
                                <p className='data'>{consts.boardCateConsts?.find(x => x?.idx === item?.status)?.title}</p>
                            </li>
                        </ul>
                        
                        <div className='list_full'>
                            <p className='label'>추가 설명</p>
                            <p className='data'>{item?.comment}</p>
                        </div>
                        <div className='list_full'>
                            {item?.files?.map((x, i) => {
                                return (
                                    <div className='file_download'>
                                        <p className='data'>{x?.name || x?.file}</p>
                                        <img src={images.download} onClick={async () => {
                                            await API.download({ name: x?.name, file: x?.file })
                                        }}/>
                                    </div>
                                    
                                )
                            })}
                            
                        </div>

                        
                    </div>

                    <div className='flex' style={{ justifyContent: 'center', gap: 20 }}>
                        <button className='td_btn big type2' onClick={() => statusFunc(1)}>접수</button>
                        <button className='td_btn big type3' onClick={() => statusFunc(2)}>처리완료</button>
                    </div> 
                
                </motion.div>

            </div>

        </>
	)
}
