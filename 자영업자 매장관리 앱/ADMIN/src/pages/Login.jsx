import { useState, useEffect } from 'react'

import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';

import { useUser, useConfig, usePopupComponent, usePopup, useMenu } from '@/store';

import Input from '@/components/Input';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { animateCSS, regEmail } from "@/libs/utils";

import API from "@/libs/api";

// import bg from '@/assets/videos/bg.mp4';
import bg from '@/assets/videos/bg3.mp4';
import FindPass from '@/components/Popup/FindPass';

export default function Page() {

    const navigate = useNavigate();

    const { login } = useUser();
    const { resetMenu } = useMenu();
    const { openPopupComponent, closePopupComponent } = usePopupComponent();

    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');

    const [active, setActive] = useState(false);

    useEffect(() => {
        animateCSS({
            element: '.login_box',
            animation: 'zoomInDown',
            faster: true
        });

    }, [])

    const loginFunc = async () => {
        if(!active) {
            return;
        }
        if (!email) {
            toast.error('아이디를 입력해주세요.');
            return;
        }
        if (!pw) {
            toast.error('비밀번호를 입력해주세요.');
            return;
        }

        const sender = {
            id: email,
            pw: pw,
        }
        const { data, error } = await API.post('/admin/login', sender);

        if (error) {
            // toast.error(error?.message);
            return;
        }
        
        resetMenu();

        setTimeout(() => {
            animateCSS({
                element: '.login_box',
                animation: 'zoomOutDown',
                faster: true,
                hide: true
            }).then(() => {
                login({ token: data });
                navigate(routes.dashboad);
            });

        }, consts.apiDelay)
    }

    const handleKeyDown = (e) => {
        if (e?.key === 'Enter') {
            loginFunc();
        }
    };

    const findPassFunc = () => {
        openPopupComponent({
            component: <FindPass
                onClose={closePopupComponent}
            />
        })
    }

    useEffect(() => {
        if (regEmail.test(email) && pw.length >= 8) {
            setActive(true);
        } else {
            setActive(false);
        }
    }, [email, pw])

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
                    <p>로그인</p>
                </div>
                <div className="login_input">
                    <p className="title_18 bold_600">아이디</p>
                    <div className='mt_15'>
                        <Input className="input_text " type="text" style={{ marginBottom: 10 }} placeholder="아이디를 입력해주세요." name="email" value={email} setValue={setEmail} onKeyDown={handleKeyDown} />
                    </div>

                    <div className='mt_40' style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p className="title_18 bold_600">비밀번호</p>
                        <p className="title_18 hand" style={{ opacity: 0.6 }} onClick={() => { findPassFunc() }}>비밀번호를 잊어버리셨나요?</p>
                    </div>
                    <div className='mt_15'>
                        <Input className="input_text" type="password" placeholder="비밀번호를 입력해주세요." name="pw" value={pw} setValue={setPw} onKeyDown={handleKeyDown} />
                    </div>
                </div>
                <button type="button" className={`login_btn ${active ? "" : "disabled"}`} onClick={() => loginFunc()} disabled={!active}>로그인</button>

                <div className="footer mt_30">
                    <p>관리자 계정 생성을 위해서는 시스템 관리자에게 연락바랍니다.</p>
                    <p>{consts.managerInfo.name} | {consts.managerInfo.hp} | {consts.managerInfo.email}</p>
                </div>
            </div>
        </div>
    )
}