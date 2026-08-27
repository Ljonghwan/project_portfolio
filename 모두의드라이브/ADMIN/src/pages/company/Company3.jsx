import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { usePopupComponent } from '@/store';

import Input from "@/components/Input";
import InputFile from '@/components/InputFile';
import Loading from "@/components/Loading";

export default function Page() {

    const { open } = usePopupComponent();


    const [name, setName] = useState("");
    const [tel, setTel] = useState("");
    const [email, setEmail] = useState("");
    const [addr, setAddr] = useState("");

    const [insta, setInsta] = useState("");
    const [youtube, setYoutube] = useState("");
    const [file, setFile] = useState(null);


    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    useEffect(() => {

        dataFunc(true);

    }, [open])

    const dataFunc = async (reset=false) => {

        if(reset) {
            setInitLoad(true);
        }

        const { data, error } = await API.post('/admin/company');
        
        setName(data?.name);
        setTel(data?.tel);
        setEmail(data?.email);
        setAddr(data?.addr);

        setDebouncedTimeout(() => {
            setLoad(false)
            setInitLoad(false)
        }, consts.apiDelay); 
    }

    const submitFunc = async () => {

        if(load) return;

        setLoad(true);

        const id = toast.loading("Please wait...");

        const sender = {
            name,
            tel,
            email,
            addr,
        }

        const { data, error } = await API.post('/admin/company/info', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});
            dataFunc();

        }, consts.apiDelay); 

    }

	return (
		<div className='box' >
            {initLoad && <Loading  />}
            <div className='box_container' style={{ width: 1000, paddingBottom: 0 }}>
                <div className='title_box'>
                    <p className='title'>회사 정보 관리</p>
                    <p className='sub_title'>작성하신 URL로 연결될 수 있도록 푸터에 노출됩니다.</p>
                </div>

                <div className='flex' style={{ alignItems: 'flex-start', gap: 20 }}>
                    <div className={'content_box'} style={{ flex: 1 }}>
                        <Input 
                            type="text" 
                            label={'상호명'}
                            placeholder="상호명을 입력해주세요." 
                            name="name" 
                            value={name} 
                            setValue={setName} 
                        />
                        
                        <Input 
                            type="text" 
                            label={'이메일'}
                            placeholder="이메일을 입력해주세요." 
                            name="email" 
                            value={email} 
                            setValue={setEmail} 
                        />
                        
                    </div>
                    <div className={'content_box'} style={{ flex: 1 }}>
                    <Input 
                            type="text" 
                            label={'연락처'}
                            placeholder="연락처를 입력해주세요." 
                            name="tel" 
                            value={tel} 
                            setValue={setTel} 
                        />
                        <Input 
                            type="text" 
                            label={'주소'}
                            placeholder="주소를 입력해주세요." 
                            name="addr" 
                            value={addr} 
                            setValue={setAddr} 
                            // withButton={'주소찾기'}
                        />
                    </div>
                </div>

                <div className='btn_box' style={{ marginTop: 40 }}>
                    <button className='btn2' onClick={submitFunc}>저장하기</button>
                </div>
            </div>
        </div>
	)
}