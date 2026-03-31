import { useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';

import { useUser, usePopup, useMenu } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { getProfile, numFormat } from "@/libs/utils";

import API from "@/libs/api";

const lnbShow = consts.lnbShow;
const lnvHide = consts.lnvHide;

export default function Component() {

    const { menuList, menuOpen } = useMenu();
    const { token, mbData, count, logout } = useUser();
    const { openPopup } = usePopup();

    const navigate = useNavigate();
    const location = useLocation();

    const [show, setShow] = useState(true);

    useEffect(() => {
        // if (!lnvHide?.includes(location.pathname) && menu?.length > 0) {
        //     console.log("보여줘")
        //     setShow(true);
        // } else {
        //     console.log("안보여")
        //     setShow(false);
        // }

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
        // <div style={{ display: show ? 'block' : 'none' }} className={`left_nav animate__animated animate__faster ${lnbShow?.includes(location.pathname) ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
        <div style={{ display: show ? 'block' : 'none' }} className={`left_nav`}>
            <div className='left_nav_logo_box'>
                <img src={images.logo} alt={consts.imgAlt} />
            </div>

            <div className="left_nav_menu_box">
                {menuList?.map((x, i) => {
                    let isSubMenu = x?.leftNav?.length > 1;
                    return (
                        <div
                            key={"left_nav_menu_box" + i}
                            style={{
                                display: "flex",
                                flexDirection: 'column'
                            }}>
                            <button
                                className={`left_nav_menu ${x.routes.includes(location.pathname) ? 'active' : ''} `}
                                key={x.route}
                                onClick={() => {
                                    if (x.routes.length === 1) {
                                        linkFunc(x.routes.at(0))
                                    } else {
                                        menuOpen(i, !x?.isOpen);
                                    }
                                }}
                            >
                                {x.icon && <img src={images[x.icon + (x.routes.includes(location.pathname) ? '_active' : '')]} alt={consts.imgAlt} />}
                                {x?.title}
                                {isSubMenu && <div className='arrow'>
                                    <img className={x?.isOpen ? "active" : ""} src={images.down_grey} alt="" />
                                </div>}

                            </button>

                            {isSubMenu &&
                                <div
                                    className={`left_nav_sub_menu_box${x?.isOpen ? " " : " disabled"}`}
                                    style={{ animationDelay: x?.isOpen ? `${i * 0.03}s` : "0s" }}
                                >
                                    {x?.leftNav?.map(v => {
                                        return <button
                                            className={`left_nav_sub_menu ${v.route === location.pathname ? 'active' : ''} `}
                                            key={v.route}
                                            onClick={() => linkFunc(v.route)}
                                        >
                                            {v?.title}
                                        </button>
                                    })}
                                </div>}

                        </div>
                    )
                })}
            </div>

        </div>
    )
}