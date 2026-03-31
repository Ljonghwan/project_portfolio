import { useEffect, useRef, useState, useId } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Marquee from "react-fast-marquee";

import Image from "@/components/Image";

import Input from "@/components/Input";
import InputRadio from "@/components/InputRadio";
import InputSelect from "@/components/InputSelect";
import TextArea from "@/components/TextArea";

import { EnterDiv, EnterP, Enterli, EnterTag } from "@/components/EnterMotion";

import routes from "@/libs/routes";
import images from "@/libs/images";
import videos from "@/libs/videos";

import consts from "@/libs/consts";

import { usePopup, useConfig } from '@/store';

import API from "@/libs/api";

import { regEmail, useDebouncedTimeout } from "@/libs/utils";

export default function Page() {

    const navigate = useNavigate();

    const { configOptions } = useConfig();
    const { openPopup } = usePopup();

    const setDebouncedTimeout = useDebouncedTimeout();

    const [item, setItem] = useState({});

    const [load, setLoad] = useState(false);

    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };

     const submitFunc = async () => {
      
       
        if(load) return;
        
        if(!item?.company) {
            toast.error("회사명을 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!item?.name) {
            toast.error("담당자명을 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!item?.email) {
            toast.error("이메일을 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!regEmail.test(item?.email)) {
            toast.error("올바른 이메일 형식이 아니에요.", consts.toastErrorOption);
            return;
        }
        if(!item?.hp || item?.hp?.length < 10) {
            toast.error("연락처를 입력해 주세요.", consts.toastErrorOption);
            return;
        }

        if(!item?.projects) {
            toast.error("필요한 개발 종류를 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!item?.services) {
            toast.error("개발 대상을 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!item?.plan) {
            toast.error("희망 플랜을 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!item?.ready) {
            toast.error("현재 준비 상황을 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!item?.comment) {
            toast.error("서비스의 주요 기능에 대해 알려주세요.", consts.toastErrorOption);
            return;
        }


        // 견적문의 등록 API
        setLoad(true);

        const id = toast.loading("Please wait...");

        let sender = {
            item
        }

        const { data, error } = await API.post('/v1/subscription/inquiry', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }

            // toast.success();
            setItem({});
            toast.update(id, { render: 'Success!!', type: "success",  ...consts.toastOption});
            
            openPopup({
                message: `정상 제출 되었습니다.\n빠른 시일 내에 확인 후 연락 드리겠습니다.`,
            })


        }, consts.apiDelayLong); 
    }
    
    return (
        <div className='container'>

            <div className='counseling_banner' />

            <div className='form'>
                <div className='title_box'>
                    <EnterP delay={0.1} className='label'>구독 문의하기</EnterP>
                    <EnterP delay={0.2} className='title'>Mingle Corp. - 상담 신청하기</EnterP>
                    <EnterP delay={0.3} className='comment'>신규 구축부터 유지보수까지 전 과정에 대한 상담을 제공합니다.<br />신청 제출 시 영업일 기준 +1일 이내에 연락을 드립니다.</EnterP>
                </div>

                <div className='line' />

                <EnterDiv amount='some' className='input_list'>
                    <p className='title required'>1. 회사, 담당자 정보 입력</p>
                    <Input
                        name="company"
                        value={item?.company}
                        setValue={(v) => handleChange({ key: 'company', value: v })}
                        placeholder="회사명"
                        maxlength={10}
                    />
                    <Input
                        name="name"
                        value={item?.name}
                        setValue={(v) => handleChange({ key: 'name', value: v })}
                        placeholder="담당자 성명"
                        maxlength={10}
                    />
                    <Input
                        name="email"
                        value={item?.email}
                        setValue={(v) => handleChange({ key: 'email', value: v })}
                        placeholder="이메일 주소"
                        maxlength={30}
                    />
                    <Input
                        name="hp"
                        type={'tel'}
                        valid={'hp'}
                        value={item?.hp}
                        setValue={(v) => handleChange({ key: 'hp', value: v })}
                        placeholder="모바일 번호  or 업무용 회사번호"
                        maxlength={20}
                    />
                </EnterDiv>

                <EnterDiv amount='some' className='input_list'>
                    <p className='title required'>2. 필요한 개발 종류</p>
                    <InputRadio
                        name="projects"
                        value={item?.projects}
                        setValue={(v) => handleChange({ key: 'projects', value: v })}
                        options={configOptions.subscriptionType}
                    />
                </EnterDiv>

                <EnterDiv amount='some' className='input_list'>
                    <p className='title required'>3. 개발 대상</p>
                    <InputRadio
                        name="services"
                        value={item?.services}
                        setValue={(v) => handleChange({ key: 'services', value: v })}
                        options={configOptions.subscriptionTarget}
                    />
                </EnterDiv>

                <EnterDiv amount='some' className='input_list'>
                    <p className='title required'>4. 희망 플랜</p>
                    <InputRadio
                        name="plan"
                        value={item?.plan}
                        setValue={(v) => handleChange({ key: 'plan', value: v })}
                        options={consts.plans}
                    />
                </EnterDiv>

                <EnterDiv amount='some' className='input_list'>
                    <p className='title required'>5. 현재 준비 상황</p>
                    <InputSelect
                        name="ready"
                        value={item?.ready}
                        setValue={(v) => handleChange({ key: 'ready', value: v })}
                        optionNotKey={configOptions?.subscriptionReady}
                        placeholder={'현재 준비되신 상황을 선택해 주세요.'}
                    />
                </EnterDiv>

                <EnterDiv amount='some' className='input_list'>
                    <p className='title required'>6. 제품 관련 자료 및 배경 설명</p>
                    <p className='comment'>서비스의 주요 기능에 대해 알려주세요.<br />출시 이후의 서비스의 경우에는 해당 페이지의 URL을 포함해 주세요.</p>
                    <TextArea
                        name="comment"
                        value={item?.comment}
                        setValue={(v) => handleChange({ key: 'comment', value: v })}
                        placeholder={`서비스 개요, 주요 기능, 관련되거나 유사한 서비스, 추가 참고사항`}
                    />
                </EnterDiv>

                <div className='submit' onClick={submitFunc} data-cursor-size="0px">
                    <p>신청 제출하기</p>
                    <img src={images.right} alt={consts.imgAlt} />
                </div>
            </div>
        </div>
    )
}