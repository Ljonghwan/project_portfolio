import { useRef, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import { motion } from 'framer-motion';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { usePopupComponent } from '@/store';

import InputFile from "@/components/InputFile";
import Loading from "@/components/Loading";
import ContextMenu from "@/components/ContextMenu";


export default function Page() {

    const { open } = usePopupComponent();

    const inputRef = useRef();

    const [mainList, setMainList] = useState([]);

    const [list, setList] = useState([]);

    const [selectedIdx, setSelectedIdx] = useState(null);

    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    useEffect(() => {

        dataFunc();
        dataFunc2()

    }, [open])

    const dataFunc = async (reset=false) => {

        if(reset) {
            setInitLoad(true);
        }
        const { data, error } = await API.post('/admin/portpolio');

        setList(data || [])

        setDebouncedTimeout(() => {
            setLoad(false)
            setInitLoad(false)
        }, consts.apiDelay); 
    }

    const dataFunc2 = async () => {

        const { data, error } = await API.post('/admin/portpolio/main');

        setMainList(data || [])

    }

    const handleEvent = ({ key, idx, target }) => {
        console.log('id,', key, idx, target);

        if(key === 'portpolio') {
            onChage({ idx: idx, key: 'target_idx', value: target })
        } else if(key === 'file') {
            setSelectedIdx(idx);
            inputRef.current.click();
        } else if(key === 'delete') {
            onChage({ idx: idx, key: 'logo', value: null })
        }

    }

    const handleFileChange = (v) => {
        console.log('v', v, selectedIdx);
        onChage({ idx: selectedIdx, key: 'logo', value: v })
    }

    const onChage = ({ idx, key, value }) => {
        setMainList(prev => prev?.map(x => {
            if(idx !== x?.idx) return x;

            return {
                ...x,
                [key]: value
            }
        }))
    }

    const submitFunc = async () => {
        if(load) return;

        setLoad(true);

        const id = toast.loading("Please wait...");

        const sender = {
            list: mainList
        }

        const { data, error } = await API.post('/admin/portpolio/mainUpdate', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});

            dataFunc();
            dataFunc2();

        }, consts.apiDelay);
    }

	return (
		<div className='box' >
            {initLoad && <Loading  />}
            
            <div style={{ display: 'none' }}>
                <InputFile
                    hidden
                    ref={inputRef}
                    valid='image'
                    name={"file"}
                    setfilesValue={handleFileChange}
                />
            </div>


            <div className='box_container' style={{ paddingBottom: 0 }}>
                <div className='title_box'>
                    <p className='title'>메인 주요 작업물 관리</p>
                </div>

                <div className={'content_box'} style={{ height: '100%' }}>
                    <section className="panel dark">
                        <div className='content center'>
                            <motion.div
                                {...consts.textVariants}
                                className='section1_text'
                            >
                                <p className='rh text'>We are just</p>
                                <ContextMenu 
                                    id="m1" 
                                    idx={mainList?.find(x => x?.position === 1)?.idx} 
                                    style={{ height: '100%' }} 
                                    handleEvent={handleEvent} 
                                    list={list}
                                    listValue={mainList?.find(x => x?.position === 1)?.target_idx}
                                >
                                    <div className='project'>
                                        <p>1</p>
                                        {mainList?.find(x => x?.position === 1)?.logo && <img src={mainList?.find(x => x?.position === 1)?.logo?.base || ( consts.s3Url + mainList?.find(x => x?.position === 1)?.logo )} />}
                                    </div>
                                </ContextMenu>
                               
                                <p className='rh text'>try</p>
                            </motion.div>
                            <motion.div
                                {...consts.textVariants}
                                transition={{ delay: 0.2 }}
                                className='section1_text'
                            >
                                <p className='rh text'>We</p>
                                <div className='span'>
                                    <p className='rh text'>mingle</p>
                                    <img src={images.mingle_dot} className='rotate2' />
                                </div>
                                <p className='rh text'>purpose,</p>
                                <ContextMenu 
                                    id="m2" 
                                    idx={mainList?.find(x => x?.position === 2)?.idx} 
                                    style={{ height: '100%' }} 
                                    handleEvent={handleEvent}
                                    list={list}
                                    listValue={mainList?.find(x => x?.position === 2)?.target_idx}
                                >
                                    <div className='project'>
                                        <p>2</p>
                                        {mainList?.find(x => x?.position === 2)?.logo && <img src={mainList?.find(x => x?.position === 2)?.logo?.base || ( consts.s3Url + mainList?.find(x => x?.position === 2)?.logo )} />}
                                    </div>
                                </ContextMenu>
                            </motion.div>
                            <motion.div
                                {...consts.textVariants}
                                transition={{ delay: 0.4 }}
                                className='section1_text end'
                            >
                                <ContextMenu 
                                    id="m3" 
                                    idx={mainList?.find(x => x?.position === 3)?.idx} 
                                    style={{ height: '100%' }} 
                                    handleEvent={handleEvent}
                                    list={list}
                                    listValue={mainList?.find(x => x?.position === 3)?.target_idx}
                                >
                                    <div className='project'>
                                        <p>3</p>
                                        {mainList?.find(x => x?.position === 3)?.logo && <img src={mainList?.find(x => x?.position === 3)?.logo?.base || ( consts.s3Url + mainList?.find(x => x?.position === 3)?.logo )} />}
                                    </div>
                                </ContextMenu>
                                <p className='rh text'>people,</p>
                                <p className='rh text'>and possibility.</p>
                                <ContextMenu 
                                    id="m4" 
                                    idx={mainList?.find(x => x?.position === 4)?.idx} 
                                    style={{ height: '100%' }} 
                                    handleEvent={handleEvent}
                                    list={list}
                                    listValue={mainList?.find(x => x?.position === 4)?.target_idx}
                                >
                                    <div className='project'>
                                        <p>4</p>
                                        {mainList?.find(x => x?.position === 4)?.logo && <img src={mainList?.find(x => x?.position === 4)?.logo?.base || ( consts.s3Url + mainList?.find(x => x?.position === 4)?.logo )} />}
                                    </div>
                                </ContextMenu>
                            </motion.div>
                        </div>

                        <div className='section1_bottom'>
                            <div className='text_box'>
                                <p className='text'>* 아이콘 제거시 해당 영역은 노출되지 않습니다.</p>
                                <p className='text'>* 포트폴리오 미연결시 리스트 페이지로 이동합니다.</p>
                            </div>
                            {/* <img src={images.message} /> */}
                        </div>
                    </section>

                    <div className='btn_box' style={{ marginTop: 20 }}>
                        <button className='btn2' onClick={submitFunc}>저장하기</button>
                    </div>
                </div>
                
            </div>
        </div>
	)
}