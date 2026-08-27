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


    const [insta, setInsta] = useState("");
    const [behence, setBehence] = useState("");
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
        console.log('data', data);
        setInsta(data?.sns?.insta || null);
        setBehence(data?.sns?.behence || null);
        setYoutube(data?.sns?.youtube || null);

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
            insta: insta,
            behence: behence,
            youtube: youtube,
        }

        const { data, error } = await API.post('/admin/company/sns', sender, { id });

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
            <div className='box_container' style={{ paddingBottom: 0 }}>
                <div className='title_box'>
                    <p className='title'>SNS URL 관리</p>
                    <p className='sub_title'>작성하신 URL로 연결될 수 있도록 푸터에 노출됩니다.</p>
                </div>

                <div className={'content_box'} style={{ width: 500 }}>
                    <Input 
                        type="text" 
                        label={'인스타그램'}
                        placeholder="URL을 입력해주세요." 
                        name="insta" 
                        value={insta} 
                        setValue={setInsta} 
                    />
                    <Input 
                        type="text" 
                        label={'비핸스'}
                        placeholder="URL을 입력해주세요." 
                        name="behence" 
                        value={behence} 
                        setValue={setBehence} 
                    />
                    <Input 
                        type="text" 
                        label={'유튜브'}
                        placeholder="URL을 입력해주세요." 
                        name="youtube" 
                        value={youtube} 
                        setValue={setYoutube} 
                    />
                    
                    <div className='btn_box' style={{ marginTop: 40 }}>
                        <button className='btn2' onClick={submitFunc}>저장하기</button>
                    </div>
                </div>
                
            </div>
        </div>
	)
}