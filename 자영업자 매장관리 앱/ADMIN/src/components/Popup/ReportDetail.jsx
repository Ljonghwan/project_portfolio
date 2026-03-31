import React, { useEffect, useState, useRef } from 'react';

import { motion } from "framer-motion";


import dayjs from "dayjs";

import styles from './index.module.css';

import { animateCSS } from "@/libs/utils";

import Input from '@/components/Input';
import TextArea from '@/components/TextArea';

import API from "@/libs/api";
import consts from "@/libs/consts";
import images from '@/libs/images';
import routes from '@/libs/routes';

import { toast } from 'react-toastify';
import { usePopup, usePopupComponent } from '@/store';

export default function ReportDetail({
    item,
    onUpdate = () => { },
    onClose = () => { },
}) {

    const { openPopup } = usePopup();
    const { closePopupComponent } = usePopupComponent();

    const [ boardIdx, setBoardIdx ] = useState('');

    useEffect(() => {
        if(item?.idx) dataFunc();
    }, [item])

     const dataFunc = async () => {

        let sender = {
            idx: item?.idx
        };

        console.log('sender', sender);

        const { data, error } = await API.post('/admin/content/report', sender);

        setBoardIdx(data?.boardIdx || '');

    }

    async function saveFunc() {

        let sender = {
            idx: item?.idx
        }
        const { data, error } = await API.post('/admin/content/reportStatus', sender);

        if (error) {
            // toast.error(error?.message)
            return;
        }

        toast.success("처리 되었습니다.")
        onUpdate();
        onClose();
    }


    return (

        <div className={`${styles.pop_contain} ${styles.l}`}>
            <button className={styles.close_btn} onClick={onClose}>
                <img src={images.close} alt="" />
            </button>

            <h2 className={styles.pop_title}>
                신고 보기 {boardIdx}
            </h2>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>신고 대상</p>
                <div className={`${styles.status_info_value} ${styles.blue}`} style={{ cursor: 'pointer' }} onClick={() => {
                    localStorage.setItem('idx', boardIdx);
                    window.open(routes.contents)
                }}>
                    {(item?.type === 1 ? "P-" : 'C-') + item?.target_idx}
                </div>
            </div>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>신고 일시</p>
                <div className={`${styles.status_info_value}`}>
                    {dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")}
                </div>
            </div>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>신고자</p>
                <div className={`${styles.status_info_value}`}>
                    {item?.user?.name}({item?.user?.nickname})
                </div>
            </div>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>신고유형</p>
                <div className={`${styles.status_info_value}`}>
                    {consts.targetTypeConsts?.find(x => x?.idx === item?.type)?.title + " 신고"}
                </div>
            </div>


            <div className={styles.status_info_section} style={{ marginBottom: 24 }}>
                <p className={styles.status_info_label}>신고사유</p>
                <div className={styles.status_reason_box}>
                    {item?.comment || '-'}
                </div>
            </div>

            <div className={styles.button_group}>
                <button
                    className={`${styles.action_btn} ${styles.cancel_btn}`}
                    onClick={onClose}
                >
                    취소
                </button>
                <button
                    className={`${styles.action_btn} ${styles.submit_btn_dark}`}
                    onClick={saveFunc}
                >
                    {item?.status === 1 ? "완료처리" : "접수처리"}
                </button>
            </div>

            {/* 
            <div className={styles.admin_detail_info_secton + " mt_30"}>
                <button className='btn3 w_150 round mt_24' onClick={onClose}>취소</button>
                <button className='btn4 w_150 round mt_24' onClick={saveFunc}>{detail?.idx ? "저장" : "등록"}</button>
            </div> */}
        </div>
    )
}