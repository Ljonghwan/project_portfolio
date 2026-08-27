import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from "lodash";
import dayjs from "dayjs";

import Zoom from 'react-medium-image-zoom';

import { useUser, usePopup, useGallery, useConfig, usePopupComponent } from '@/store';

import Empty from "@/components/Empty";
import Loading from "@/components/Loading";

import Input from "@/components/Input";
import InputCheck from "@/components/InputCheck";
import InputFile from "@/components/InputFile";
import TextArea from "@/components/TextArea";
import InputSelect from "@/components/InputSelect";

import Thumb from "@/components/Preview/Thumb";
import ThumbList from "@/components/Preview/Thumb/list";
import Scrolling from "@/components/Preview/Scrolling";

import EditSection from "@/components/EditSection";

import ToggleButtons from "@/components/ToggleButtons";

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen } from "@/libs/utils";

const sorts = [
    { key: 'box', label: '메인' },
    { key: 'list', label: '리스트' },
];

export default function Component({
    style,
    detail,
    setDetail,
    closeFunc,
    recoverFunc=()=>{},
    deleteAlert=()=>{}
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

    const [sort, setSort] = useState(sorts[0]); // 초기 활성화 버튼

    const [item, setItem] = useState({
        mockupMode: 1
    });

    const [cate, setCate] = useState([]);

    const [thumb, setThumb] = useState(null);
    const [thumbBg, setThumbBg] = useState(null);
    const [thumbVideo, setThumbVideo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [mockup, setMockup] = useState(null);
    const [mainSection, setMainSection] = useState(null);
    const [detailSection, setDetailSection] = useState(null);
    const [footerLogo, setFooterLogo] = useState(null);

    const [load, setLoad] = useState(false);


    useEffect(() => {
        window.history.pushState(null, "", "");

        window.addEventListener("popstate", closeFunc);

        return () => {
            window.removeEventListener("popstate", closeFunc);
        };
    }, []);

    useEffect(() => {

        if (detail?.idx) {
            dataFunc(true);
        } else {
            setLoad(true);
        }

    }, [detail])

    const dataFunc = async (reset = false) => {

        if (reset) {
            ref.current.scrollTo(0, 0);
            setLoad(false);
        }

        const sender = {
            idx: detail?.idx
        }

        const { data, error } = await API.post('/admin/portpolio', sender);

        if (error) {
            toast.error(error?.message, consts.toastErrorOption);
            return;
        }

        console.log('data', data);

        setItem(data || {});
        
        setCate(data?.cate);

        setThumb(data?.thumb);
        setThumbBg(data?.thumbBg);
        setThumbVideo(data?.thumbVideo);

        setBanner(data?.banner);
        setMockup(data?.mockup);
        setMainSection(data?.mainSection);
        setDetailSection(data?.detailSection);
        setFooterLogo(data?.footerLogo);

        // setBanner(item?.cate);
        // setMockup(item?.cate);
        // setMainSection(item?.cate);
        // setDetailSection(item?.cate);
        // setFooterLogo(item?.cate);

        setDebouncedTimeout(() => {
            setLoad(true)
        }, consts.apiDelay);

    }

    const submitFunc = async () => {
        if(!item?.title) {
            toast.error('타이틀을 입력해 주세요.', consts.toastErrorOption);
            return;
        }
        if(cate?.length < 1) {
            toast.error('프로젝트 종류를 선택해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!thumb || !thumbBg) {
            toast.error('썸네일 이미지를 첨부해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!banner?.pc || !banner?.m) {
            toast.error('배너 이미지를 첨부해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!mockup) {
            toast.error('목업 이미지를 첨부해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!item?.comment || !item?.commentEng) {
            toast.error('프로젝트 설명을 입력해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!mainSection?.pc || !mainSection?.m) {
            toast.error('Main 섹션 이미지를 첨부해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!detailSection?.pc || !detailSection?.m) {
            toast.error('Detail 섹션 이미지를 첨부해 주세요.', consts.toastErrorOption);
            return;
        }
        if(!footerLogo) {
            toast.error('Footer 섹션 로고를 첨부해 주세요.', consts.toastErrorOption);
            return;
        }


        const id = toast.loading("Please wait...");

        const sender = {
            item,
            cate: configOptions?.portpolioOptions?.filter(x => cate?.includes(x)),
            thumb,
            thumbBg,
            thumbVideo,
            banner,
            mockup,
            mainSection,
            detailSection,
            footerLogo
        }

        const { data, error } = await API.post('/admin/portpolio/update', sender, { id });

        setDebouncedTimeout(() => {

            if(error) {
                toast.update(id, { render: error?.message, type: "error", ...consts.toastOption });
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});

            if(item?.idx) dataFunc();
            else closeFunc();
            // closeFunc();

        }, consts.apiDelay); 


    }

    const deleteFunc = async () => {

        const id = toast.loading("Please wait...");

        const sender = {
            idx: item?.idx
        }

        const { data, error } = await API.post('/admin/portpolio/delete', sender, { id });

        setDebouncedTimeout(() => {

            if(error) {
                toast.update(id, { render: error?.message, type: "error", ...consts.toastOption });
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});

            closeFunc();

        }, consts.apiDelay); 
    }

    return (
        <div className='content_form animate__animated animate__faster animate__fadeInRight'>
            <div ref={ref} className={`box`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>

                {!load && (<Loading />)}

                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                    <div className='title_box'>
                        <div className='flex' style={{ justifyContent: 'center', gap: 12 }}>
                            <p className='title'>{detail ? `${detail?.title} 상세 보기` : "포트폴리오 등록"} </p>

                        </div>

                        <div className='flex' style={{ justifyContent: 'center', gap: 12 }}>
                            <button className='btn3' onClick={closeFunc}>목록으로</button>
                            {!item?.deleteAt && <button className='btn4' onClick={submitFunc}>저장하기</button>}
                            {item?.idx && (
                                (item?.deleteAt) ? (
                                    <>
                                        <button className='btn6' onClick={() => {
                                            recoverFunc(item?.idx);
                                            closeFunc();
                                        }}>복구하기</button>    
                                        <button className='btn5' onClick={() => {
                                            deleteAlert(item?.idx);
                                            closeFunc();
                                        }}>삭제하기</button>    
                                    </>
                                ) : (
                                    <button className='btn5' onClick={deleteFunc}>휴지통으로 이동</button>    
                                )
                            )}
                            {/* <button className='td_btn big type3' onClick={() => statusFunc(2)}>처리완료</button> */}
                        </div>
                    </div>

                    <div className='edit_container'>
                        <div className='edit'>

                            <div className='input_file_flex' style={{ alignItems: 'center', gap: 20 }}>
                                <InputSelect
                                    required
                                    label={'노출 상태'}
                                    name="status"
                                    value={item?.status}
                                    onChange={setItem}
                                    option={consts.viewStatusConsts.filter(x => x?.idx)}
                                />
                                <div>
                                    <p className='input_label'>조회수</p>
                                    <p className='input_read'>{numFormat(item?.view)} 회</p>
                                </div>
                            </div>

                            <Input
                                required
                                type="text"
                                label={'타이틀'}
                                placeholder="타이틀을 입력해주세요."
                                name="title"
                                value={item?.title}
                                onChange={setItem}
                            />
                            

                            <Input
                                type="text"
                                label={'연결링크'}
                                placeholder="URL을 입력해주세요."
                                name="link"
                                value={item?.link}
                                onChange={setItem}
                            />

                            <InputCheck
                                required
                                label={'프로젝트 종류'}
                                name="cate"
                                value={cate}
                                setValue={setCate}
                                options={configOptions?.portpolioOptions}
                            />

                            <EditSection title={'썸네일'}>
                                <div className='input_file_flex' >
                                    <div>
                                        <p className='input_label required'>썸네일 배경(640*640)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"thumb"}
                                            filesValue={thumb}
                                            setfilesValue={setThumb}
                                            imageStyle={{ aspectRatio: 640/640, width: 300 }}
                                        />
                                    </div>
                                    <div>
                                        <p className='input_label required'>썸네일 호버(640*360)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"thumbBg"}
                                            filesValue={thumbBg}
                                            setfilesValue={setThumbBg}
                                            imageStyle={{ aspectRatio: 640/360, width: 300 }}
                                        />
                                    </div>
                                    <div>
                                        <p className='input_label'>썸네일 호버 영상(640*360)</p>
                                        <InputFile
                                            type={1}
                                            valid='video'
                                            name={"thumbVideo"}
                                            filesValue={thumbVideo}
                                            setfilesValue={setThumbVideo}
                                            imageStyle={{ aspectRatio: 640/360, width: 300 }}
                                        />
                                    </div>
                                </div>
                            </EditSection>

                            <EditSection title={'배너, 목업, 스크롤링 티커'}>
                                <div className='input_file_flex' >
                                    <div>
                                        <p className='input_label required'>배너이미지(1920*1080)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"banner_pc"}
                                            filesValue={banner?.pc}
                                            setfilesValue={(v) => setBanner(prev => { return {...prev, pc: v} })}
                                            imageStyle={{ aspectRatio: 1920/1080, width: 250 }}
                                        />
                                    </div>
                                    <div>
                                        <p className='input_label required'>배너이미지 Mobile(AUTO)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"banner_m"}
                                            filesValue={banner?.m}
                                            setfilesValue={(v) => setBanner(prev => { return {...prev, m: v} })}
                                            imageStyle={{ aspectRatio: 'unset', width: 150, objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div>
                                        <p className='input_label required'>목업 이미지({item?.mockupMode == 1 ? '737*966' : '1820*786'})</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"mockup"}
                                            filesValue={mockup}
                                            setfilesValue={setMockup}
                                            imageStyle={{ aspectRatio: item?.mockupMode == 1 ? 737/966 : 1820/786, width: item?.mockupMode == 1 ? 150 : 250 }}
                                        />
                                    </div>
                                    <div >
                                        <InputSelect
                                            required
                                            label={'목업 이미지 종류'}
                                            name="mockupMode"
                                            value={item?.mockupMode}
                                            onChange={setItem}
                                            option={consts.mockupConsts}
                                        />
                                    </div>
                                        
                                </div>
                                <div className='flex' style={{ gap: 20, alignItems: 'flex-start', marginTop: 20 }}>
                                    <div style={{ flex: 1 }}>
                                        <TextArea 
                                            label={'프로젝트 설명'}
                                            required
                                            name={'comment'} 
                                            placeholder="내용을 입력해 주세요." 
                                            value={item?.comment} 
                                            onChange={setItem} 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <TextArea 
                                            label={'프로젝트 설명(영문)'}
                                            required
                                            name={'commentEng'} 
                                            placeholder="내용을 입력해 주세요." 
                                            value={item?.commentEng} 
                                            onChange={setItem} 
                                        />
                                    </div>
                                </div>
                                <div className='flex' style={{ gap: 20, alignItems: 'flex-start', marginTop: 20 }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            type="text"
                                            label={'스크롤링 티커 Type'}
                                            placeholder="ex) App Development"
                                            name="infoType"
                                            value={item?.infoType}
                                            onChange={setItem}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            type="text"
                                            label={'스크롤링 티커 Scope'}
                                            placeholder="ex) Frontend & Backend Development, Server Management"
                                            name="infoScope"
                                            value={item?.infoScope}
                                            onChange={setItem}
                                        />
                                    </div>
                                </div>

                                <div className='flex' style={{ gap: 20, alignItems: 'flex-start', marginTop: 20 }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            type="text"
                                            label={'스크롤링 티커 Purpose'}
                                            placeholder="ex) A mobile taxi-hailing service exclusively for pregnant women in the Gyeongbuk and Gumi regions ..."
                                            name="infoPurpose"
                                            value={item?.infoPurpose}
                                            onChange={setItem}
                                        />
                                    </div>
                                </div>
                                <div className='flex' style={{ gap: 20, alignItems: 'flex-start', marginTop: 20 }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            type="text"
                                            label={'스크롤링 티커 배경색(Footer 섹션과 리스트 배경색 공유)'}
                                            placeholder="배경색을 입력해주세요.(#000000)"
                                            name="bg"
                                            value={item?.bg}
                                            onChange={setItem}
                                            maxlength={9}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            type="text"
                                            label={'스크롤링 티커 글자색'}
                                            placeholder="글자색을 입력해주세요.(#ffffff)"
                                            name="color"
                                            value={item?.color}
                                            onChange={setItem}
                                            maxlength={9}
                                        />
                                    </div>
                                </div>
                                
                                
                            </EditSection>

                            <EditSection title={'Main 섹션'}>
                                <div className='input_file_flex' >
                                    <div>
                                        <p className='input_label required'>Main 섹션 이미지(1920*1080)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"mainSection_pc"}
                                            filesValue={mainSection?.pc}
                                            setfilesValue={(v) => setMainSection(prev => { return {...prev, pc: v} })}
                                            imageStyle={{ aspectRatio: 1920/1080, width: 300 }}
                                        />
                                    </div>
                                    <div>
                                        <p className='input_label required'>Main 섹션 Mobile 이미지(AUTO)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"mainSection_m"}
                                            filesValue={mainSection?.m}
                                            setfilesValue={(v) => setMainSection(prev => { return {...prev, m: v} })}
                                            imageStyle={{ aspectRatio: 'unset', width: 150, objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            </EditSection>
                            
                           
                            <EditSection title={'Detail 섹션'}>
                                <div className='input_file_flex' >
                                    <div>
                                        <p className='input_label required'>Detail 섹션 이미지(AUTO)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"detailSection_pc"}
                                            filesValue={detailSection?.pc}
                                            setfilesValue={(v) => setDetailSection(prev => { return {...prev, pc: v} })}
                                            imageStyle={{ aspectRatio: 'unset', width: 300, objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div>
                                        <p className='input_label required'>Detail 섹션 Mobile 이미지(AUTO)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"detailSection_m"}
                                            filesValue={detailSection?.m}
                                            setfilesValue={(v) => setDetailSection(prev => { return {...prev, m: v} })}
                                            imageStyle={{ aspectRatio: 'unset', width: 150, objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            </EditSection>

                            <EditSection title={'Footer 섹션'}>
                                <div className='input_file_flex' >
                                    <div>
                                        <p className='input_label required'>Footer 섹션 로고(원본사이즈 - svg 파일 추천)</p>
                                        <InputFile
                                            type={1}
                                            valid='image'
                                            name={"footerLogo"}
                                            filesValue={footerLogo}
                                            setfilesValue={setFooterLogo}
                                            imageStyle={{ aspectRatio: 'unset', width: 300, objectFit: 'contain' }}
                                        />
                                    </div>

                                    
                                    <div></div>
                                    <div></div>
                                </div>
                            </EditSection>
                            
                        </div>

                        <div className='preview' style={{ top: 120 }}>
                                                            
                            <div className='title_box'>
                                <p className='title' >스크롤링 티커 미리보기</p>
                            </div>
                            
                            <Scrolling 
                                title={item?.title} 
                                platform={cate} 
                                type={item?.infoType} 
                                scope={item?.infoScope} 
                                purpose={item?.infoPurpose} 
                                bg={item?.bg}
                                color={item?.color}
                            />

                            <div className='title_box' style={{ marginTop: 20 }}>
                                <p className='title'>썸네일 미리보기</p>
                                <ToggleButtons 
                                    buttons={sorts}
                                    value={sort}
                                    setValue={setSort}
                                />
                            </div>
                            {sort?.key === 'box' ? (
                                <Thumb item={{ title: item?.title, thumb: thumb, thumbBg: thumbBg, cate: configOptions?.portpolioOptions?.filter(x => cate?.includes(x)) }} />
                            ) : (
                                <ThumbList item={{ title: item?.title, thumb: thumb, thumbBg: thumbBg, thumbVideo: thumbVideo, cate: configOptions?.portpolioOptions?.filter(x => cate?.includes(x)) }} />
                            ) }
                            

                        </div>
                    </div>
                </div>


                

            </div>

        </div>
    )
}
