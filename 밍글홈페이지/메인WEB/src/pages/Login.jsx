import { useState, useEffect } from 'react'

import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';

import { useUser } from '@/store';

import Input from '@/components/Input';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { animateCSS } from "@/libs/utils";

import API from "@/libs/api";

import bg from '@/assets/videos/bg.mp4';

export default function Page() {
    
    const navigate = useNavigate();
    
    const { login } = useUser();

    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');

    const [load, setLoad] = useState(false);

    useEffect(() => {

        animateCSS({
            element: '.login_box', 
            animation: 'zoomInDown',
            faster: true
        });

    }, [])

    const loginFunc = async () => {

        if(load) return;

        if(!email) {
            toast.error('아이디를 입력해주세요.');
            return;
        }
        if(!pw) {
            toast.error('비밀번호를 입력해주세요.');
            return;
        }
        
        setLoad(true);
        const id = toast.loading("Please wait...");

        const sender = {
            id: email,
            pw: pw,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/admin/login', sender, { id });

        setTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }
    
            toast.done(id);
            
            animateCSS({
                element: '.login_box', 
                animation: 'zoomOutDown',
                faster: true,
                hide: true
            }).then(() => {
                login({ token: data });
                navigate(routes.home);
            });

        }, consts.apiDelay)

    }


    const handleKeyDown = (e) => {
        if (e?.key === 'Enter') {
            loginFunc();
        }
    };

	return (
		<div className="login_container">
            <video className='background_video' autoPlay muted loop>
                <source src={bg} type="video/mp4" />
            </video>

            <div
                className="login_box"
            >
                <div className='login_logo_box'>
                    <img src={images.logo} alt={consts.imgAlt} />
                    <p>관리자 사이트</p>
                </div>
                <div className="login_input">
                    {/* <p className="sub_title">로그인</p> */}
                    <Input className="input_text" type="text" style={{ marginBottom: 10 }} placeholder="아이디를 입력해주세요." name="email" value={email} setValue={setEmail} onKeyDown={handleKeyDown} label="아이디" autoComplete={"one-time-code"}/>
                    <Input className="input_text" type="password" placeholder="비밀번호를 입력해주세요." name="pw" value={pw} setValue={setPw} onKeyDown={handleKeyDown} label="비밀번호" autoComplete={"one-time-code"}/>
                </div>
                <button type="button" className="login_btn" onClick={() => loginFunc()}>로그인</button>
            </div>
        </div>
	)
}