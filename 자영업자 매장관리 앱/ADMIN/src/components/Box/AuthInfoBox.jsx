import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from "lodash";
import dayjs from "dayjs";

import Loading from "@/components/Loading";

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen, checkAuth, AuthLevel } from "@/libs/utils";
import InfoBox from '@/components/InfoBox';
import CheckBox from '@/components/CheckBox';
import Input from '../Input';

import API from "@/libs/api";
import { usePopup } from '@/store';

const AUTH_NAME = {
    users: "회원관리",
    matching: "매장 관리",
    contents_1: "커뮤니티관리",
    contents_2: "일지관리",
    contents_3: "신고관리",
    news: "소식관리",
    event: "이벤트템플릿관리",
    cs_1: "고객피드백관리",
    cs_2: "공지사항관리",
    cs_3: "자주묻는질문관리",
    cs_4: "약관 및 정책관리",
    service_1: "팝업관리",
    service_2: "계정관리",
    service_3: "권한관리",
}

export default function AuthInfoBox({
    style,
    detail,
    closeFunc,
    onUpdate = () => { },
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const { openPopup } = usePopup();

    const ref = useRef();
    const [load, setLoad] = useState(false);

    const [authData, setAuthData] = useState();
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");




    const submitFunc = async () => {

        if (!name) {
            toast.error("권한명을 입력해주세요.");
            return;
        }

        if (!desc) {
            toast.error("권한 설명을 입력해주세요.");
            return;
        }

        let sender = {
            ...authData,
            name: name,
            desc: desc,
        }
        let uri = authData?.idx ? '/admin/auth/update' : '/admin/auth/insert'

        openPopup({
            title: "저장",
            message: "저장 하시겠습니까?",
            button: "저장",
            onPress: async () => {
                const { data, error } = await API.post(uri, sender);

                if (error) {
                    // toast.error(error?.message)
                    return;
                }

                toast.success("저장 되었습니다.")

                onUpdate();
                closeFunc();
            },
            buttonCencle: "취소",
            onCancelPress: () => {

            }
        })
    }

    const deleteFunc = async () => {
        openPopup({
            title: "삭제",
            message: "삭제 하시겠습니까?",
            warning: "삭제할 경우 다시 복구되지 않습니다. ",
            button: "삭제",
            onPress: async () => {
                if (detail?.userlist?.length > 0) {
                    toast.error("권한이 부여된 인원이 있습니다.")
                    return;
                }

                let sender = { idx: detail?.idx };
                const { data, error } = await API.post('/admin/auth/delete', sender);
                if (error) {
                    // toast.error(error?.message)
                    return;
                }

                toast.success("삭제 되었습니다.")

                onUpdate();
                closeFunc();
            },
            buttonCencle: "취소",
            onCancelPress: () => { }
        })
    }

    useEffect(() => {
        window.history.pushState(null, "", "");

        window.addEventListener("popstate", closeFunc);

        return () => {
            window.removeEventListener("popstate", closeFunc);
        };
    }, []);

    useEffect(() => {
        console.log("???", detail)
        if (detail) {
            setName(detail?.name);
            setDesc(detail?.desc);
            setAuthData(detail);
        } else {
            setName("");
            setDesc("");
            setAuthData({
                users: 0,
                matching: 0,
                contents_1: 0,
                contents_2: 0,
                contents_3: 0,
                news: 0,
                event: 0,
                cs_1: 0,
                cs_2: 0,
                cs_3: 0,
                cs_4: 0,
                service_1: 0,
                service_2: 0,
                service_3: 0,
            })
        }
    }, []);


    return (
        <div className='content_form2 animate__animated animate__faster animate__fadeInRight'>
            <div ref={ref} className={`box rect`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>

                {/* {!load && (<Loading />)} */}

                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                   
                    <div className='title_box' style={{}}>
                        <div className="page_title_box" >
                            <p>권한 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                            <button className='btn grey' onClick={deleteFunc}>{"삭제"}</button>
                            <button className='btn black' onClick={submitFunc}>{"저장"}</button>
                        </div>
                    </div>



                    <div className='info_container'>
                        <div className='edit' style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <Input className="input_text" type="text" label={"권한명"} placeholder="권한명 입력해주세요." value={name} setValue={setName} />
                            </div>
                            <div style={{ flex: 2 }}>
                                <Input className="input_text" type="text" label={"권한설명"} placeholder="권한설명을 입력해주세요." value={desc} setValue={setDesc} />
                            </div>

                        </div>

                        <p className='title_info mt_36'>권한설정</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "20%" }}>권한명</td>
                                        <td style={{ width: "20%" }}>R</td>
                                        <td style={{ width: "20%" }}>W</td>
                                        <td style={{ width: "20%" }}>M</td>
                                        <td style={{ width: "20%" }}>D</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(AUTH_NAME)?.map((key) => {
                                        return <tr>
                                            <td style={{
                                                background: "#F4F4F4",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: "#626262"
                                            }}>
                                                {AUTH_NAME[key]}
                                            </td>
                                            <td><CheckBox checked={checkAuth(AuthLevel.READ, authData?.[key])} onChange={() => {
                                                setAuthData(v => ({ ...v, [key]: checkAuth(AuthLevel.READ, authData?.[key]) ? authData?.[key] - AuthLevel.READ : authData?.[key] + AuthLevel.READ }))
                                            }} /></td>
                                            <td><CheckBox checked={checkAuth(AuthLevel.WRITE, authData?.[key])} onChange={() => {
                                                setAuthData(v => ({ ...v, [key]: checkAuth(AuthLevel.WRITE, authData?.[key]) ? authData?.[key] - AuthLevel.WRITE : authData?.[key] + AuthLevel.WRITE }))
                                            }} /></td>
                                            <td><CheckBox checked={checkAuth(AuthLevel.MODIFY, authData?.[key])} onChange={() => {
                                                setAuthData(v => ({ ...v, [key]: checkAuth(AuthLevel.MODIFY, authData?.[key]) ? authData?.[key] - AuthLevel.MODIFY : authData?.[key] + AuthLevel.MODIFY }))
                                            }} /></td>
                                            <td><CheckBox checked={checkAuth(AuthLevel.DELETE, authData?.[key])} onChange={() => {
                                                setAuthData(v => ({ ...v, [key]: checkAuth(AuthLevel.DELETE, authData?.[key]) ? authData?.[key] - AuthLevel.DELETE : authData?.[key] + AuthLevel.DELETE }))
                                            }} /></td>
                                        </tr>
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <p className='title_info mt_36'>부여 인원</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "20%" }}>No</td>
                                        <td style={{ width: "40%" }}>이름</td>
                                        <td style={{ width: "40%" }}>아이디</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {authData?.userlist?.map((v, i) => {
                                        return <tr>
                                            {/* <td>{authData?.userlist?.length - i}</td> */}
                                            <td>{i + 1}</td>
                                            <td>{v?.name}</td>
                                            <td>{v?.email}</td>
                                        </tr>
                                    })}

                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}
