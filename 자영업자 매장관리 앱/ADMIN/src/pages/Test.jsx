import { useState, useEffect } from 'react'

import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';

import { useUser, useConfig, usePopupComponent, usePopup } from '@/store';

import Input from '@/components/Input';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { animateCSS } from "@/libs/utils";

import API from "@/libs/api";

// import bg from '@/assets/videos/bg.mp4';
import bg from '@/assets/videos/bg3.mp4';

import FindPass from "@/components/Popup/FindPass"

export default function Page() {

    const navigate = useNavigate();

    const { login } = useUser();
    const { configOptions } = useConfig();
    const { open } = usePopup();
    const { openPopupComponent, closePopupComponent } = usePopupComponent();

    const btnFunc = (type = 1) => {
        if (type === 1) openPopupComponent({ title: "비밀번호 찾기", component: <FindPass /> })

    }

    return (
        <div>
            <button className='btn' onClick={() => { btnFunc(1) }}>Find Popup</button>
            <button className='btn2' onClick={() => { btnFunc(2) }}>button</button>
            <button className='btn3' onClick={() => { btnFunc(3) }}>button</button>
            <button className='btn4' onClick={() => { btnFunc(4) }}>button</button>
            {/* <button className='btn2'>button</button>
            <button className='btn3'>button</button>
            <button className='btn4'>button</button>
            <button className='btn5'>button</button>
            <button className='td_btn'>button</button>
            <button className='td_btn type1'>button</button>
            <button className='td_btn type2'>button</button>
            <button className='td_btn type3'>button</button>
            <button className='td_btn type4'>button</button>
            <button className='td_btn type5'>button</button>
            <button className='td_btn type6'>button</button>
            <button className='portpolio_detail_btn'></button>
            <button className='add_btn'>button</button>
            <button className='minus_btn'>button</button>
            <button className='cavity_btn type2'>button</button>
            <button className='cavity_btn type3'>button</button>
            <button className='addblack_btn'></button>
            <button className='match_btn'>asd</button> */}

        </div>
    )
}