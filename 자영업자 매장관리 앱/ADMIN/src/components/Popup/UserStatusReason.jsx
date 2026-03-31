import React from 'react';

import styles from './index.module.css';
import { usePopupComponent } from '@/store';
import Images from '@/libs/images';
import dayjs from 'dayjs';

export default function UserStatusReason() {

    const { closePopupComponent, data } = usePopupComponent();

    const statusData = data?.statusData || {};
    const isWithdraw = statusData?.statusType === 'withdraw';
    const isSuspend = statusData?.statusType === 'suspend';

    return (
        <div className={`${styles.pop_contain} ${styles.l}`}>
            <button className={styles.close_btn} onClick={closePopupComponent}>
                <img src={Images.close} alt="" />
            </button>

            <h2 className={styles.pop_title}>
                {isWithdraw ? '탈퇴 사유' : isSuspend ? '정지 사유' : '사유'}
            </h2>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>회원 ID</p>
                <div className={`${styles.status_info_value} ${isWithdraw ? styles.blue : ""}`}>
                    {statusData?.userId || '-'}
                </div>
            </div>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>회원명</p>
                <div className={styles.status_info_value}>
                    {statusData?.userName || '-'}
                </div>
            </div>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>
                    {isWithdraw ? '탈퇴 일시' : isSuspend ? '정지 일시' : '일시'}
                </p>
                <div className={styles.status_info_value}>
                    {statusData?.date ? dayjs(statusData?.date).format("YYYY-MM-DD HH:mm") : '-'}
                </div>
            </div>

            <div className={styles.status_info_section}>
                <p className={styles.status_info_label}>
                    {isWithdraw ? '탈퇴 유형' : isSuspend ? '정지 유형' : '유형'}
                </p>
                <div className={styles.status_info_value}>
                    {statusData?.reasonType || '-'}
                </div>
            </div>

            <div className={styles.status_info_section} style={{ marginBottom: 24 }}>
                <p className={styles.status_info_label}>
                    {isWithdraw ? '탈퇴 사유' : isSuspend ? '정지 사유' : '사유'}
                </p>
                <div className={styles.status_reason_box}>
                    {statusData?.reason || '-'}
                </div>
            </div>

            <button
                className={styles.confirm_btn}
                onClick={closePopupComponent}
            >
                확인
            </button>
        </div>
    )
}
