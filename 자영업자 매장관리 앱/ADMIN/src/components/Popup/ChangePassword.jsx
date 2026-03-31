import React, { useState, useEffect } from 'react';

import styles from './index.module.css';
import { usePopupComponent } from '@/store';
import Images from '@/libs/images';
import { toast } from 'react-toastify';
import API from '@/libs/api';
import { regPassword } from '@/libs/utils';

export default function ChangePassword({
    style,
    fixed = true,
}) {

    const { closePopupComponent } = usePopupComponent();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [active, setActive] = useState(true);

    // 비밀번호 유효성 검사 (8-16자, 영문대소문자, 숫자 필수, 특수문자 선택)
    const isValidPassword = (password) => {
        // 8-16자, 영문 포함, 숫자 포함 필수 (특수문자는 허용)
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,16}$/;
        return regex.test(password);
    };

    useEffect(() => {
        // 현재 비밀번호와 새 비밀번호가 모두 입력되고, 새 비밀번호가 유효성 검사를 통과해야 활성화
        if (currentPassword && newPassword && isValidPassword(newPassword) && (currentPassword === newPassword)) {
            setActive(true);
        } else {
            setActive(false);
        }
    }, [currentPassword, newPassword]);

    const handleSubmit = async () => {
        // 유효성 검증
        if (!currentPassword) {
            toast.error("새 비밀번호를 입력해주세요.");
            return;
        }

        if (!newPassword) {
            toast.error("새 비밀번호 확인을 입력해주세요.");
            return;
        }

        if (!isValidPassword(newPassword)) {
            toast.error("비밀번호는 8-16자 영문, 숫자를 혼용해야 합니다.");
            return;
        }

        try {
            // API 호출
            const { error } = await API.post("/admin/login/changePass", {
                pass: currentPassword,
                pass2: newPassword
            });

            if (error) {
                // toast.error(error?.message);
                return;
            }

            toast.success("비밀번호가 변경되었습니다.");
            closePopupComponent();
        } catch (err) {
            console.log('err', err);
            toast.error("비밀번호 변경 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={styles.pop_contain}>
            <button className={styles.close_btn} onClick={closePopupComponent}>
                <img src={Images.close} alt="" />
            </button>

            <h2 className={styles.pop_title}>비밀번호 변경</h2>

            <div className={styles.input_section}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p className={styles.input_label} style={{ margin: 0 }}>비밀번호</p>
                    {isValidPassword(currentPassword) ? (
                        <span className={styles.password_status_text}>
                            사용가능
                        </span>
                    ) : (
                        <span className={styles.password_status_text} style={{ color: 'red' }}>
                            사용불가
                        </span>
                    )}
                </div>
                <div className={styles.password_field_wrapper}>
                    <input
                        type="password"
                        className={styles.password_input}
                        placeholder="새 비밀번호"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    {currentPassword && (
                        <button
                            className='remove_icon'
                            onClick={() => setCurrentPassword("")}
                            type="button"
                        />
                    )}
                </div>
            </div>

            <div className={styles.input_section} style={{ marginBottom: 24 }}>
                <p className={styles.input_label}>비밀번호 확인</p>
                <div className={styles.password_field_wrapper}>
                    <input
                        type="password"
                        className={styles.password_input}
                        placeholder="새 비밀번호 확인"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {newPassword && (
                        <button
                            className='remove_icon'
                            onClick={() => setNewPassword("")}
                            type="button"
                        />
                    )}
                </div>
                <p className={styles.password_helper_text}>
                    • 8~16자 영문 대소문자, 숫자 조합
                </p>
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
