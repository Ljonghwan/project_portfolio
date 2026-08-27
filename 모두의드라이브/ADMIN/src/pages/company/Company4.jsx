import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { usePopupComponent } from '@/store';

import InputFile from '@/components/InputFile';

import Loading from "@/components/Loading";


export default function Page() {

    const { open } = usePopupComponent();

    const [video, setVideo] = useState(null);

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

        setVideo(data?.video || null);

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
            file: video
        }
        const { data, error } = await API.post('/admin/company/video', sender, { id });

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
                    <p className='title'>메인 영상 관리</p>
                    <p className='sub_title'>업로드 하신 영상이 메인 영상 섹션에 노출됩니다.</p>
                </div>

                <div className={'content_box'} >
                    <InputFile
                        valid='video'
                        name={"video"}
                        filesValue={video}
                        setfilesValue={setVideo}
                        imageStyle={{ aspectRatio: 1920/1080, width: 500 }}
                    />
                    
                    <div className='btn_box'>
                        <button className='btn2' onClick={submitFunc}>저장하기</button>
                    </div>
                </div>
            </div>
        </div>
	)
}