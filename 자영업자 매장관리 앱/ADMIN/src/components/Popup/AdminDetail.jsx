import React, { useEffect, useState, useRef } from 'react';

import { motion } from "framer-motion";

import images from "@/libs/images";
import styles from './index.module.css';

import { animateCSS } from "@/libs/utils";
import Input from '../Input';
import InputSelect from '../InputSelect';

import API from "@/libs/api";
import { toast } from 'react-toastify';
import { usePopup } from '@/store';

export default function AdminDetail({
    detail,
    authList = [],
    onUpdate = () => { },
    onClose = () => { },
}) {

    const { openPopup } = usePopup();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [pass2, setPass2] = useState("");
    const [active, setActive] = useState("");
    const [auth, setAuth] = useState("");

    async function saveFunc() {
        if (detail?.idx) {
            console.log("저장하기")
            let sender = {
                idx: detail?.idx,
                name,
                email,
                pass,
                pass2,
                active,
                auth_idx: detail?.auth_idx != auth ? auth : undefined,
            }

            openPopup({
                title: "저장",
                message: "저장 하시겠습니까?",
                button: "저장",
                onPress: async () => {
                    const { data, error } = await API.post('/admin/admin/update', sender);
                    if (error) {
                        // toast.error(error?.message)
                        return;
                    }

                    onUpdate();
                    onClose();
                    toast.success("저장 되었습니다.")
                },
                buttonCencle: "취소",
                onCancelPress: () => {

                }
            })
        } else {
            console.log("생성하기")
            let sender = {
                name,
                email,
                pass,
                pass2,
                active,
                auth_idx: auth,
            }
            openPopup({
                title: "등록",
                message: "등록 하시겠습니까?",
                button: "등록",
                onPress: async () => {
                    const { data, error } = await API.post('/admin/admin/insert', sender);
                    if (error) {
                        // toast.error(error?.message)
                        return;
                    }

                    onUpdate();
                    onClose();
                    toast.success("등록 되었습니다.")
                },
                buttonCencle: "취소",
                onCancelPress: () => {

                }
            })
        }
    }

    async function resetPass() {
        console.log("비밀번호 초기화")
        let sender = {
            idx: detail?.idx,
        }

        openPopup({
            title: "초기화",
            message: "비밀번호 초기화 하시겠습니까?",
            button: "초기화",
            onPress: async () => {
                const { data, error } = await API.post('/admin/admin/resetPass', sender);
                if (error) {
                    // toast.error(error?.message)
                    return;
                }
                toast.success("임시비밀번호가 발송되었습니다.")
            },
            buttonCencle: "취소",
            onCancelPress: () => {

            }
        })

    }

    useEffect(() => {
        console.log("🚀 ~ AdminDetail ~ detail:", detail)
        if (detail) {
            setName(detail?.name)
            setEmail(detail?.email)
            setActive(detail?.status === 1 ? "Y" : "N")
            setAuth(detail?.auth_idx)
        }
    }, [detail])

    return (
        <div className={`${styles.pop_contain} ${styles.xl}`}>
            <p className='title_20 bold_700'>{detail?.idx ? "상세" : "계정등록"}</ p>
            <div className={styles.admin_detail_info_secton + " mt_30"}>
                <Input className="input_text" type="text" style={{}} label={"이름"} placeholder="이름 입력" name="name" value={name} setValue={setName} autoComplete={"one-time-code"} />
                <Input className="input_text" type="text" style={{}} label={"ID"} placeholder="이메일 입력" name="email" value={email} setValue={setEmail} autoComplete={"one-time-code"} />
            </div>
            <div className={styles.admin_detail_info_secton + " mt_30"}>
                <Input className="input_text" type="text" style={{}} label={"비밀번호"} placeholder="비밀번호 입력" name="pass" value={pass} setValue={setPass} autoComplete={"one-time-code"} />
                <Input className="input_text" type="text" style={{}} label={"비밀번호 확인"} placeholder="비밀번호 확인 입력" name="pass2" value={pass2} setValue={setPass2} autoComplete={"one-time-code"} />
            </div>

            <div className={styles.admin_detail_info_secton + " mt_30"}>
                <InputSelect
                    style={{ flex: 0.5 }}
                    label={"사용여부"}
                    value={active}
                    setValue={setActive}
                    option={[
                        { idx: "Y", title: "Y" },
                        { idx: "N", title: "N" },
                    ]}
                />
                <InputSelect
                    style={{ flex: 0.5 }}
                    label={"권한"}
                    value={auth}
                    setValue={setAuth}
                    option={authList?.map(auth => {
                        return { idx: auth?.idx, title: auth?.name }
                    })}
                    placeholder={"선택"}
                />
            </div>
            {detail?.idx && <button className='btn mt_24' onClick={resetPass}>비밀번호 초기화</button>}

            <div className={styles.admin_detail_info_secton + " mt_30"}>
                <button className='btn3 w_150 round mt_24' onClick={onClose}>취소</button>
                <button className='btn4 w_150 round mt_24' onClick={saveFunc}>{detail?.idx ? "저장" : "등록"}</button>
            </div>
        </div>
    )
}