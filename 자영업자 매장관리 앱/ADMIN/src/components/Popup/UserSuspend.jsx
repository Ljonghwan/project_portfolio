import React, { useEffect, useState } from 'react';

import styles from './index.module.css';
import InputSelect from '../InputSelect';
import { usePopup, usePopupComponent } from '@/store';
import Images from '@/libs/images';
import { toast } from 'react-toastify';
import API from '@/libs/api';

export default function UserSuspend() {

    const { openPopup } = usePopup();
    const { closePopupComponent, data } = usePopupComponent();

    const userIdx = data?.userIdx;
    const onSuccess = data?.onSuccess || (() => {});

    const [reason, setReason] = useState("");
    const [detail, setDetail] = useState("");

    const [active, setActive] = useState(false);

    // 기타 선택 여부 확인
    const isEtcSelected = reason === 6 || reason === "6" || reason === "기타";

    useEffect(() => {
        // 정지사유가 선택되지 않은 경우
        if (!reason) {
            setActive(false);
            return;
        }

        // 기타 선택 시: 최소 5자 이상 입력 필수
        if (isEtcSelected) {
            if (detail.trim().length >= 5) {
                setActive(true);
            } else {
                setActive(false);
            }
        } else {
            // 기타가 아닌 경우: 사유만 선택되면 활성화 (상세 내용은 선택 사항)
            setActive(true);
        }
    }, [reason, detail, isEtcSelected])

    const handleSubmit = () => {
        // 유효성 검증
        if (!reason) {
            toast.error("정지사유를 선택해주세요.");
            return;
        }

        // 기타 선택 시 최소 5자 이상 입력 필수
        if (isEtcSelected) {
            if (detail.trim().length < 5) {
                toast.error("기타 사유는 최소 5자 이상 입력해주세요.");
                return;
            }
        }

        openPopup({
            title: "이용정지",
            message: "해당 회원을 이용정지 하시겠습니까?\n정지된 회원은 앱 로그인이 불가합니다.",
            button: "저장",
            onPress: async () => {
                try {
                    // API 호출
                    const { error } = await API.post("/admin/account/updateStatus", {
                        idx: userIdx,
                        status: 2,
                        disable_type: reason,
                        disable_desc: detail.trim()
                    });

                    if (error) {
                        // toast.error(error?.message);
                        return;
                    }

                    toast.success("이용정지가 완료되었습니다.");
                    onSuccess();
                    closePopupComponent();
                } catch (err) {
                    toast.error("이용정지 처리 중 오류가 발생했습니다.");
                }
            },
            buttonCencle: "취소",
            onCancelPress: () => {

            }
        });
    }

    return (
        <div className={`${styles.pop_contain} ${styles.l}`}>
            <button className={styles.close_btn} onClick={closePopupComponent}>
                <img src={Images.close} alt="" />
            </button>

            <h2 className={styles.pop_title}>이용정지</h2>

            <div className={styles.input_section}>
                <p className={styles.input_label}>
                    정지사유 선택
                </p>
                <div className={styles.suspend_select}>
                    <InputSelect
                        name="suspend_reason"
                        value={reason}
                        setValue={setReason}
                        option={[
                            { idx: "운영정책 위반(욕설/비방)", title: "운영정책 위반(욕설/비방)" },
                            { idx: "스팸/광고", title: "스팸/광고" },
                            { idx: "부적절한 콘텐츠", title: "부적절한 콘텐츠" },
                            { idx: "사기/피싱 의심", title: "사기/피싱 의심" },
                            { idx: "개인정보 침해", title: "개인정보 침해" },
                            { idx: "기타", title: "기타" },
                        ]}
                        placeholder={"정지사유를 선택해주세요."}
                    />
                </div>
            </div>

            <div className={styles.input_section} style={{ marginBottom: 24 }}>
                <p className={styles.input_label}>
                    상세 내용 {isEtcSelected && <span className={styles.required}>*</span>}
                </p>
                <textarea
                    className={styles.suspend_textarea}
                    placeholder={isEtcSelected ? "기타 사유를 최소 5자 이상 입력해주세요." : "정지하려는 사유를 입력해주세요."}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={10}
                />
                {isEtcSelected && (
                    <p className={styles.input_helper_text}>
                        {detail.trim().length}/5자 이상 입력 필수
                    </p>
                )}
            </div>

            <div className={styles.button_group}>
                <button
                    className={`${styles.action_btn} ${styles.cancel_btn}`}
                    onClick={closePopupComponent}
                >
                    취소
                </button>
                <button
                    className={`${styles.action_btn} ${styles.submit_btn_dark}`}
                    onClick={handleSubmit}
                    disabled={!active}
                >
                    저장
                </button>
            </div>
        </div>
    )
}
