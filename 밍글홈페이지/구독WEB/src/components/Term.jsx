import { useRef, useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import Zoom from 'react-medium-image-zoom';

import { useConfig, usePopupComponent } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { getProfile, numFormat } from "@/libs/utils";

import API from "@/libs/api";

import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import InputFile from "@/components/InputFile";
import InputFileMultiple from "@/components/InputFileMultiple";
import InputSelect from "@/components/InputSelect";

import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function Component() {

    const { configOptions } = useConfig();
    const { closePopupComponent } = usePopupComponent();

    const [comment, setComment] = useState('');

    useEffect(() => {
        dataFunc();
    }, [])

    const dataFunc = async () => {


        const { data, error } = await API.post('/term');
        setComment(data);

        Editor.factory({
            el: document.querySelector('#viewer'),
            viewer: true,
            initialValue: data
        });

    }

    return (
        <div className='term_pop'>
            <div className='title_box'>
                <p>개인정보 수집 이용 방침</p>
                <img src={images.close} onClick={closePopupComponent} />
            </div>

            <div className='data' id="viewer">
            </div>

        </div>
    )
}