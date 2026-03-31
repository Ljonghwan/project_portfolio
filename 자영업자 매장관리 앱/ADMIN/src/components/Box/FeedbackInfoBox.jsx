import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from "lodash";
import dayjs from "dayjs";
import { Editor, Viewer } from '@toast-ui/react-editor';
import Zoom from 'react-medium-image-zoom';

import Loading from "@/components/Loading";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import InputRadio from "@/components/InputRadio";

import InfoBox from '@/components/InfoBox';

import API from "@/libs/api";

import consts from "@/libs/consts";
import { stripHtml, numFormat } from "@/libs/utils";
import { usePopup, useConfig } from '@/store';

const sorts = [
    { key: 'idx', od: 'desc', label: '최신순' },
    { key: 'createdAt', od: 'asc', label: '오래된 순' },
];

export default function PolicyInfoBox({
    style,
    detail,
    dataList,
    closeFunc,
    onUpdate = () => { },
}) {

    const navigate = useNavigate();
    const location = useLocation();

    const { openPopup } = usePopup();
    const { configOptions } = useConfig();


    const ref = useRef();
    const editor = useRef();

    const [item, setItem] = useState(detail || { status: 1 })



    const [edit, setEdit] = useState();
    const [type, setType] = useState("");

    useEffect(() => {
        window.history.pushState(null, "", "");

        window.addEventListener("popstate", closeFunc);

        return () => {
            window.removeEventListener("popstate", closeFunc);
        };
    }, []);

    // 저장/등록
    const updateFunc = async () => {
        if (!item?.answer) {
            toast.error("답변을 입력하세요.");
            return;
        }

        let sender = {
            item: item
        }
        const { data, error } = await API.post('/admin/feedback/update', sender);

        if (error) {
            // toast.error(error?.message)
            return;
        }

        toast.success("저장되었습니다.")
        onUpdate();
        closeFunc();
    }

    useEffect(() => {

        if (!detail?.idx) {
            toast.error("해당 데이터를 찾지 못했습니다.");
            closeFunc();
        } else {
            setItem(detail);
        }

    }, [detail])

    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const deleteFunc = async () => {
        openPopup({
            title: "삭제",
            message: "삭제 하시겠습니까?",
            warning: "삭제할 경우 다시 복구되지 않습니다. ",
            button: "삭제",
            onPress: async () => {


                let sender = { idx: item?.idx };
                const { data, error } = await API.post('/admin/notice/delete', sender);
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

    return (
        <div className='content_form2 animate__animated animate__faster animate__fadeInRight'>
            <div ref={ref} className={`box rect`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>
                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                    <div className='title_box' style={{}}>
                        <div className="page_title_box" >
                            <p>고객피드백 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                            {item?.status === 1 && <button className='btn black' onClick={updateFunc}>{"답변완료"}</button>}
                        </div>
                    </div>

                    <div className='info_container'>
                        <div className="" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                            <p className='title_20 bold_600 word flex'>Q. {item?.title}</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
                                {/* <p className='title_16 color_343330'>{numFormat(item?.view)} 조회</p> */}
                                <p className='title_16 color_5A6BFF'>{configOptions?.feedbackOptions?.find(x => x?.idx === item?.cate)?.title}</p>
                                <p className='title_16 color_343330'>{dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")}</p>
                                <p className={`title_16`} style={{ color: item?.status === 1 ? '#E41616' : '#4A6CFC' }}>{consts.processStatusConsts2?.find(x => x?.idx === item?.status)?.title}</p>
                            </div>
                        </div>
                        <hr className='line mt_24' />

                        <div className='edit mt_36' >
                            <p style={{ whiteSpace: 'pre', lineHeight: 1.4 }} >{item?.comment}</p>
                            {item?.image?.length > 0 && (
                                <div className='flex' style={{ gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                                    {item?.image?.map((x, i) => {
                                        return (
                                            <Zoom key={i}>
                                                <img src={consts.s3Url + x} style={{ width: 140, aspectRatio: 1 / 1, borderRadius: 8, objectFit: 'cover' }} />
                                            </Zoom>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <hr className='line mt_48' />

                        <div className="mt_36" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                            <p className='title_20 bold_600 word flex'>A. {item?.status === 2 ? '답변 완료' : '답변 준비 중'}</p>
                            {item?.status === 2 && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
                                    <p className='title_16 color_343330'>{item?.admin?.name}({item?.admin?.email})</p>
                                    <p className='title_16 color_343330'>{dayjs(item?.answerAt).format("YYYY-MM-DD HH:mm")}</p>
                                </div>
                            )}

                        </div>

                        <div className='edit mt_36' >

                            <TextArea
                                className="input_text"
                                type="text"
                                placeholder="답변을 입력해주세요."
                                value={item?.answer}
                                setValue={(v) => handleChange({ key: 'answer', value: v })}
                                maxlength={1000}
                                readOnly={item?.status === 2}
                            />

                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}