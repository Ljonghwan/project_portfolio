import { useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';

import { useUser, usePopup } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { getProfile, numFormat } from "@/libs/utils";

import API from "@/libs/api";

const lnbShow = consts.lnbShow;
const lnvHide = consts.lnvHide;

export default function Component({ menu }) {

    const { token, mbData, count, logout } = useUser();
    const { openPopup } = usePopup();

    const navigate = useNavigate();
    const location = useLocation();

    const [show, setShow] = useState(false);

    useEffect(() => {
        console.log('menu', menu);
        if (!lnvHide?.includes(location.pathname) && menu?.length > 0) {
            setShow(true);
        } else {
            setShow(false);
        }

    }, [location.pathname]);

    const linkFunc = (link) => {
        // dispatch(reset());
        if (link) {
            // dispatch( setPopupStorage({ key: 'cadastral', value: false }) );
            // dispatch( setPopupStorage({ key: 'drawing', value: false }) );
            navigate(link);
        }
    }

    return (
        <div style={{ display: show ? 'block' : 'none' }} className={`left_nav animate__animated animate__faster ${lnbShow?.includes(location.pathname) ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
            <div className='left_nav_logo_box'>
                <img src={images.logo} alt={consts.imgAlt} />
                {/* <p className='header_title'>채팅관리자</p> */}
            </div>

            {menu?.filter(item => !item?.level || item?.level <= mbData?.level)?.map((x, i) => {
                return (
                    <button
                        className={`animate__animated animate__faster animate__fadeIn left_nav_one ${x.routes.includes(location.pathname) ? 'active' : ''} `}
                        style={{ animationDelay: `${i * 0.03}s` }}
                        key={x.route}
                        onClick={() => linkFunc(x.route)}
                    >
                        {x.title}
                        {false && (
                            <span className='left_nav_count'>{123}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}