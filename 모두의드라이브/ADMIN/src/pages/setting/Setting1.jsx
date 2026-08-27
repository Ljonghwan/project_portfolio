import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { useUser, usePopup, usePopupComponent } from '@/store';

import Input from "@/components/Input";
import InputFile from '@/components/InputFile';
import Loading from "@/components/Loading";

export default function Page() {

    const { reload } = useUser();
    const { openPopup } = usePopup();

    const [nowpw, setnowpw] = useState("");
    const [pw, setpw] = useState("");
    const [repw, setrepw] = useState("");

    const [initLoad, setInitLoad] = useState(false);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    const submitAlert = () => {
        
        if(!nowpw) {
            toast.error('현재 비밀번호를 입력해주세요.');
            return;
        }

        if(!pw) {
            toast.error('변경할 비밀번호를 입력해주세요.');
            return;
        }

        if(pw !== repw) {
            toast.error('변경할 비밀번호가 다릅니다.');
            return;
        }

        openPopup({
            message: "변경 하시겠습니까?",
            buttonCencle: "취소",
            onPress: () => submitFunc(),
        })

    }

    const submitFunc = async () => {

        if(load) return;

        setLoad(true);

        const id = toast.loading("Please wait...");

        const sender = {
            nowpw: nowpw,
            pw: pw,
            repw: repw,
        }

        const { data, error } = await API.post('/admin/auth/password', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});

            setnowpw("");
            setpw("");
            setrepw("");
            
            reload();

        }, consts.apiDelay); 

    }

	return (
		<div className='box' >
            {initLoad && <Loading  />}
            <div className='box_container' style={{ paddingBottom: 0 }}>
                <div className='title_box'>
                    <p className='title'>관리자 비밀번호</p>
                </div>

                <div className={'content_box'} style={{ width: 500 }}>
                    <Input 
                        type="text" 
                        label={'현재 비밀번호를 입력하세요.'}
                        placeholder="비밀번호 입력" 
                        name="nowpw" 
                        value={nowpw} 
                        setValue={setnowpw} 
                    />

                    <div>
                        <Input 
                            type="text" 
                            label={'변경할 비밀번호를 입력하세요.'}
                            placeholder="비밀번호 입력" 
                            name="pw" 
                            value={pw} 
                            setValue={setpw} 
                        />
                        <Input 
                            style={{ marginTop: 10 }}
                            type="text" 
                            placeholder="비밀번호 재입력" 
                            name="repw" 
                            value={repw} 
                            setValue={setrepw} 
                        />
                    </div>
                    
                    <div className='btn_box' style={{ marginTop: 40 }}>
                        <button className='btn2' onClick={submitAlert}>저장하기</button>
                    </div>
                </div>
                
            </div>
        </div>

	)
}