import React, { useId } from 'react';
import styles from './index.module.css';

import { omit } from 'lodash';

import images from '@/libs/images';
import consts from '@/libs/consts';

export default function CheckBox(props) {
    const {
        item
    } = props;

    const uniqKey = useId();

    return (
        <div className={styles.container}>
            {item?.image && (
                <img className={styles.bg} src={item?.image?.base || consts.s3Url + (item?.image?.file || item?.image)}/>
            )}
            <div className={styles.content} style={{ justifyContent: (item?.layout == 1 ? 'flex-end' : item?.layout == 2 ? 'space-between' : 'flex-start') }}>
                <div className={styles.titleBox}>
                    <p style={item?.title_style}>제목 텍스트 영역 입니다.</p>
                    <p style={item?.sub_title_style}>부제목 텍스트 영역입니다. 미리보기</p>
                </div>

                <div className={styles.eventBox}>
                    <button className={styles.button} style={item?.button_style}>{item?.button || "버튼명"}</button>

                    <div className={styles.eventInfo}>
                        <p>혜택 : 할인방식 자동 출력</p>
                        <p>사용조건 : 최소 결제금액 입력 시 노출</p>
                        <p>유효기간 : 진행기간 자동출력</p>
                        <p>사용방법 : 매장 내 직원에게 보여주세요</p>
                    </div>
                </div>
            </div>
        </div>
    )
} 