import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, useMatch } from 'react-router-dom';

import { useUser, usePopup, useEtc, useConfig } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { getProfile, hpHypen } from "@/libs/utils";

import API from "@/libs/api";

export default function Component() {

    const { token, mbData, count, logout } = useUser();
    const { openPopup } = usePopup();
    const { configOptions } = useConfig();

    const navigate = useNavigate();
    const location = useLocation();

    const [view, setView] = useState(false);

    return (
        <div className='footer'>
            <div className='top'>
                <img src={images.logo} alt={consts.imgAlt}/>
                <button className='btn3' onClick={async () => {
                    await API.brochure()
                }} data-cursor-size="0px" >서비스 소개서 다운로드</button>
            </div>
            <div className='line' />
            <div className='bottom'>
                <p>주식회사 밍글 | 사업자등록번호 {configOptions?.businessNum} | 대표 김대호 | {configOptions?.email} | {hpHypen(configOptions?.tel)}</p>
                <p>{configOptions?.addr}</p>
                <p>Copyright © 2025 Mingle. All Rights Reserved.</p>
            </div>
        </div>
    )
}