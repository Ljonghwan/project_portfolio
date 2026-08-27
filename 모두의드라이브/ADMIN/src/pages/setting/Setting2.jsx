import { useRef, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

// Toast 에디터
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { useUser, usePopup, usePopupComponent } from '@/store';

import TextArea from "@/components/TextArea";
import InputFile from '@/components/InputFile';
import Loading from "@/components/Loading";

export default function Page() {

    const { reload } = useUser();
    const { openPopup } = usePopup();

    const editor = useRef();

    const [step, setStep] = useState(1);

    const [comment, setComment] = useState("");

    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    useEffect(() => {
        if(step) {
            dataFunc();
        }
       
    }, [step]);

    const dataFunc = async (reset=false) => {

        if(reset) {
            setInitLoad(true);
        }

        let sender = {
            type: step
        }

        const { data, error } = await API.post('/term', sender);
        // console.log('file', data);
        setComment(data);
        editor.current?.getInstance().setHTML(data || "");

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
            type: step,
            comment: editor.current?.getInstance().getHTML()
            // comment: comment
        }

        const { data, error } = await API.post('/admin/company/term', sender, { id });

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
                    <div className="title_progress">
                        {consts?.termTypeConsts?.map((x, i) => {
                            return (
                                <p key={i} className={step === x?.idx ? "active" : ""} onClick={() =>setStep(x?.idx)}>{x?.title}</p>
                            )
                        })}
                    </div>
                </div>

                <div className={'content_box'}>
                    
                    {/* <TextArea name={'comment'} placeholder="내용을 입력해 주세요." value={comment} setValue={setComment} height={500}/> */}

                    <Editor
                        ref={editor}
                        placeholder="내용을 입력해주세요."
                        previewStyle="vertical" // 미리보기 스타일 지정
                        height="700px" // 에디터 창 높이
                        initialEditType="wysiwyg" // 초기 입력모드 설정(디폴트 markdown)
                        toolbarItems={[
                            // 툴바 옵션 설정
                            ['heading', 'bold', 'italic', 'strike'],
                            ['hr', 'quote'],
                            ['ul', 'ol', 'task', 'indent', 'outdent'],
                            ['table', 'image', 'link']
                        ]}
                    />
                    
                    <div className='btn_box' >
                        <button className='btn2' onClick={submitFunc}>저장하기</button>
                    </div>
                </div>
                
            </div>
        </div>

	)
}