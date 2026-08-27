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
import InputSelect from "@/components/InputSelect";
import InputRadio from "@/components/InputRadio";
import InputFile from "@/components/InputFile";

import InfoBox from '@/components/InfoBox';

import API from "@/libs/api";

import consts from "@/libs/consts";
import { stripHtml, numFormat } from "@/libs/utils";
import { usePopup } from '@/store';

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
        if (!item?.title) {
            toast.error("제목을 입력하세요.");
            return;
        }

        let comment = editor.current?.getInstance().getHTML();

        if (stripHtml(comment)?.length < 10) {
            toast.error("내용을 10자이상 입력하세요.");
            return;
        }

        if (!item?.image) {
            toast.error("대표이미지를 첨부하세요.");
            return;
        }

        let sender = {
            item: { ...item, comment: comment }
        }
        const { data, error } = await API.post('/admin/news/update', sender);

        setEdit(false);

        if (error) {
            // toast.error(error?.message)
            return;
        }

        toast.success("저장되었습니다.")
        onUpdate();
        closeFunc();
    }

    useEffect(() => {
        let policyData = dataList.find(v => v.type == type)
        editor.current?.getInstance().setHTML(policyData?.comment || "");
    }, [type])

    useEffect(() => {

        if (!detail?.idx) {
            setEdit(true);
        }
        setItem(detail || { status: 1 });

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
                const { data, error } = await API.post('/admin/news/delete', sender);
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

                    <div className='title_box' style={{  }}>
                        <div className="page_title_box" >
                            <p>소식 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                            {edit ?
                                <button className='btn grey' onClick={() => {
                                    if (detail?.idx) {
                                        setEdit(false);
                                    } else {
                                        closeFunc();
                                    }
                                }}>{"취소"}</button>
                                :
                                <button className='btn grey' onClick={deleteFunc}>{"삭제"}</button>
                            }
                            <button className='btn black' onClick={() => {
                                if (edit) {
                                    // 저장
                                    updateFunc();
                                } else {
                                    // 수정
                                    setEdit(true);
                                    setTimeout(() => {
                                        editor.current?.getInstance().setHTML(detail?.comment || "");
                                    }, 50)
                                }
                            }}>{edit ? "저장" : "수정"}</button>
                        </div>
                    </div>

                    <div className='info_container'>
                        {/* <p className='title_24 bold_600 mt_24'>소식 관리</p> */}
                        {!edit ? <>
                            <div className="" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                                <p className='title_20 bold_600 word flex'>{item?.title}</p>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
                                    <p className='title_16 color_343330'>{numFormat(item?.view)} 조회</p>
                                    <p className='title_16 color_343330'>{dayjs(item?.createdAt).format("YYYY-MM-DD")}</p>
                                </div>
                            </div>
                            <hr className='line mt_24' />

                            <div className='edit mt_36'>
                                <Zoom>
                                    <img src={consts.s3Url + item?.image} className='news_thumb' />
                                </Zoom>
                                <Viewer initialValue={item?.comment} />
                            </div>

                            <hr className='line mt_48' />
                        </> : <>
                            <div className={'content_box mt_20'}>
                                {/* <InputSelect
                                    style={{ width: 490 }}
                                    name="status"
                                    value={type}
                                    setValue={setType}
                                    option={consts.policyTypes}
                                    placeholder={"유형"}
                                /> */}

                                <Input
                                    className="input_text"
                                    type="text"
                                    placeholder="제목을 입력해주세요."
                                    value={item?.title}
                                    setValue={(v) => handleChange({ key: 'title', value: v })}
                                    maxlength={100}
                                />

                                <Editor
                                    ref={editor}
                                    placeholder="내용을 입력해주세요."
                                    previewStyle="vertical" // 미리보기 스타일 지정
                                    height="463px" // 에디터 창 높이
                                    initialEditType="wysiwyg" // 초기 입력모드 설정(디폴트 markdown)
                                    toolbarItems={[
                                        // 툴바 옵션 설정
                                        ['heading', 'bold', 'italic', 'strike'],
                                        ['hr', 'quote'],
                                        ['ul', 'ol', 'task', 'indent', 'outdent'],
                                        ['table', 'image', 'link']
                                    ]}
                                />

                                <div className='form_div_list'>
                                    <div className='form_div'>
                                        <p>대표 이미지<br />(1:1 비율)</p>
                                        <div>
                                            <InputFile
                                                valid='image'
                                                filesValue={item?.image}
                                                setfilesValue={(v) => handleChange({ key: 'image', value: v })}
                                            />
                                        </div>
                                    </div>
                                    <div className='form_div'>
                                        <p>노출 여부</p>
                                        <div>
                                            <InputRadio
                                                options={consts.viewStatusConsts?.filter(x => x?.idx)}
                                                value={item?.status}
                                                setValue={(v) => handleChange({ key: 'status', value: v })}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </>}



                    </div>
                </div>
            </div>

        </div>
    )
}