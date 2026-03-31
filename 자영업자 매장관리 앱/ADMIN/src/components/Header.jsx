import { useRef, useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import Zoom from 'react-medium-image-zoom';

import { useUser, usePopup, useMenu, usePopupComponent } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { getProfile, numFormat } from "@/libs/utils";

import API from "@/libs/api";

import LeftNav from "@/components/LeftNav";
import TextProfile from './TextProfile';
import ContextMenu from "@/components/ContextMenu";
import Images from '@/libs/images';
import ChangePassword from '@/components/Popup/ChangePassword';

export default function Component() {

    const { menuList } = useMenu();
    const { token, mbData, count, logout } = useUser();
    const { openPopup } = usePopup();
    const { openPopupComponent } = usePopupComponent();

    const navigate = useNavigate();
    const location = useLocation();

    const [toggleBox, setToggleBox] = useState(false);

    useEffect(() => {
        // pathname 에 따른 메뉴ㅅㄹ정
        console.log(menuList?.find(x => x.routes.includes(location.pathname))?.leftNav);

    }, [location.pathname])

    const linkFunc = (link) => {
        // dispatch(reset());
        if (link) {
            navigate(link);
        }
    }

    const changePassFunc = () => {
        setToggleBox(false)
        openPopupComponent({
            component: <ChangePassword />
        });
    }

    const logoutFunc = () => {
        setToggleBox(false)
        openPopup({
            title:"로그아웃",
            message: '로그아웃 하시겠습니까?',
            buttonCencle: '취소',
            onPress: logout
        })
    }

    const toggleFunc = () => {
        setToggleBox(v => !v)
    }


    return (
        <>
            <div className='header'>

                <div className='header_logo_box'>
                    {/* <img src={images.logo} alt={consts.imgAlt} />
                    <p className='header_title'>채팅관리자</p> */}
                </div>

                {/* <ul className='header_menu_box'>
                    {menus.map((x, i) => {
                        const active = x?.routes?.includes(location.pathname);
                        
                        return (
                            <li key={i} onClick={() => linkFunc(x?.routes?.[0])} className={active ? "active" : ""}>
                                <img src={images[x.icon]} alt={consts.imgAlt}/>
                                {x.icon && <img src={images[x.icon + (!active ? "_off" : "")]} alt={consts.imgAlt}/> }
                                <p>{x.title}</p>
                                {(x.count === 'cavity' && count > 0) && <span>{numFormat(count)}</span>}
                            </li>
                        )
                    })}
                </ul> */}
                <div className='header_auth_box' onClick={toggleFunc} >
                    <TextProfile text={mbData?.name || "관리자"} />
                    <p>{mbData?.name || "관리자"} 님 </p>
                </div>
                {toggleBox && <div className="menu_box">
                    <div style={{ textAlign: "end" }}>
                        <img className="hand" src={Images.close} alt={"x"} onClick={toggleFunc} />
                    </div>
                    <div className='admin_info grey'>
                        <p className='title_12'>{mbData?.name}</p>
                        <p className='title_10 color_6C6C6C'>{mbData?.email}</p>
                    </div>
                    <div className='admin_info hand' onClick={changePassFunc}>
                        <p className='ml_5 title_12'>비밀번호 변경</p>
                    </div>
                    <div className='admin_info hand' onClick={logoutFunc} >
                        <img src={images.logout} alt={consts.imgAlt} />
                        <p className='title_12 color_6C6C6C'>로그아웃</p>
                    </div>
                </div>}
            </div>

            <LeftNav />
        </>
    )
}