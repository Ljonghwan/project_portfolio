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

    const [list, setList] = useState([]);
    const [file, setFile] = useState(null);
    const [file2, setFile2] = useState(null);

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

        const { data, error } = await API.post('/admin/company/file');
        // console.log('file', data);
        setFile(data?.file || null)
        setFile2(data?.file2 || null)

        setDebouncedTimeout(() => {
            setLoad(false)
            setInitLoad(false)
        }, consts.apiDelay); 
    }

    const submitFunc = async (type=1) => {

        if(load) return;

        setLoad(true);

        const id = toast.loading("Please wait...");

        const sender = {
            file: file,
        }

        const { data, error } = await API.post('/admin/company/fileSave', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});
            dataFunc();

        }, consts.apiDelay); 

    }

     const submitSubscriptionFunc = async () => {

        if(load) return;

        setLoad(true);

        const id = toast.loading("Please wait...");

        const sender = {
            file: file2,
            type: 2
        }

        const { data, error } = await API.post('/admin/company/fileSave', sender, { id });

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
                    <p className='title'>회사소개서 관리</p>
                    <p className='sub_title'>업로드 하신 파일을 다운로드 받을 수 있도록 푸터에 노출됩니다.</p>
                </div>

                <div className={'content_box'} >
                    <InputFile 
                        name={'file1'}
                        valid='pdf'
                        filesValue={file}
                        setfilesValue={setFile}
                    />

                    <div className='btn_box'>
                        <button className='btn2' onClick={submitFunc}>저장하기</button>
                    </div>
                </div>

                <div className='title_box'>
                    <p className='title'>구독서비스 소개서 관리</p>
                    <p className='sub_title'>업로드 하신 파일을 다운로드 받을 수 있도록 푸터에 노출됩니다.</p>
                </div>

                <div className={'content_box'} >
                    <InputFile 
                        name={'file2'}
                        valid='pdf'
                        filesValue={file2}
                        setfilesValue={setFile2}
                    />
                    
                    <div className='btn_box'>
                        <button className='btn2' onClick={submitSubscriptionFunc}>저장하기</button>
                    </div>
                </div>
            </div>
        </div>
	)
}