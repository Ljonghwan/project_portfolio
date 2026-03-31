import React, { useEffect, useState, useRef } from 'react';

import styles from './index.module.css';
import Input from '../Input';
import InputSelect from '../InputSelect';
import { usePopup, usePopupComponent } from '@/store';
import Images from '@/libs/images';
import { toast } from 'react-toastify';
import { regEmail } from '@/libs/utils';
import API from '@/libs/api';

export default function FindPass({
    style,
    fixed = true
}) {

    const { openPopup } = usePopup();
    const { closePopupComponent } = usePopupComponent();

    const [email, setEmail] = useState("")
    const [domain, setDomain] = useState("")

    const [active, setActive] = useState(false)

    useEffect(() => {
        if (!email || !domain) {
            setActive(false);
        } else {
            setActive(true);
        }
    }, [email, domain])

    const handleSubmit = () => {
        let strEmail = email + '@' + domain;

        if (!regEmail.test(strEmail)) {
            toast.error("이메일 형식이 올바르지 않습니다.")
            return;
        }

        let sender = { email: strEmail }
        openPopup({
            title: "발송",
            message: "발송 하시겠습니까?",
            button: "발송",
            onPress: async () => {

                const { data, error } = await API.post("/admin/login/findPass", sender);

                if (error) {
                    // toast.error(error?.message)
                    return;
                }

                toast.success("발송 되었습니다.")
                closePopupComponent();
            },
            buttonCencle: "취소",
            onCancelPress: () => {

            }
        })
    }

    return (
        <div className={`${styles.pop_contain} ${styles.m}`}>
            <button className={styles.close_btn} onClick={closePopupComponent}>
                <img src={Images.close} alt="" />
            </button>

            <h2 className={styles.pop_title}>비밀번호 찾기</h2>

            <div className={styles.pop_desc}>
                <p>가입 시 입력한 이메일 주소를 입력해주세요.</p>
                <p>임시 비밀번호를 발송해드립니다.</p>
            </div>

            <div className={styles.input_section}>
                <p className={styles.input_label}>
                    이메일 <span className={styles.required}>*</span>
                </p>
                <div className={styles.email_input_wrapper}>
                    <div className={styles.find_input_email}>
                        <Input
                            className="input_text"
                            type="text"
                            placeholder=""
                            name="email"
                            value={email}
                            setValue={setEmail}
                            autoComplete={"off"}
                        />
                    </div>
                    <span className={styles.email_at}>@</span>
                    <div className={styles.find_input_email}>
                        <Input
                            className="input_text"
                            type="text"
                            placeholder=""
                            name="domain"
                            value={domain}
                            setValue={setDomain}
                            autoComplete={"off"}
                        />
                    </div>

                    <div className={styles.find_input_select}>
                        <InputSelect
                            name="domain_select"
                            value={domain}
                            setValue={setDomain}
                            option={[
                                { idx: "gmail.com", title: "gmail.com" },
                                { idx: "naver.com", title: "naver.com" },
                                { idx: "hanmail.net", title: "hanmail.net" },
                                { idx: "kakao.com", title: "kakao.com" },
                            ]}
                            placeholder={"직접입력"}
                        />
                    </div>
                </div>
            </div>

            <button className={styles.submit_btn} onClick={handleSubmit} disabled={!active}>
                비밀번호 찾기
            </button>
        </div>
    )
}