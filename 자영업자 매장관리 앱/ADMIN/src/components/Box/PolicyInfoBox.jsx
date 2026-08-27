import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from "lodash";
import dayjs from "dayjs";

import Loading from "@/components/Loading";
import InputSelect from "@/components/InputSelect";
import API from "@/libs/api";

import consts from "@/libs/consts";
import { Editor, Viewer } from '@toast-ui/react-editor';

export default function PolicyInfoBox({
    style,
    detail,
    dataList,
    closeFunc,
    onUpdate = () => { },
}) {

    const navigate = useNavigate();
    const location = useLocation();

    const ref = useRef();
    const editor = useRef();

    const [policy, setPolicy] = useState(null)
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
        if (!type) {
            toast.error("유형을 선택하세요.");
            return;
        }

        let sender = {
            type: type,
            comment: editor.current?.getInstance().getHTML()
        }
        const { data, error } = await API.post('/admin/policy/update', sender);
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
        } else {
            setPolicy(detail);
            setType(detail?.type);
        }
    }, [detail])

    return (
        <div className='content_form2 animate__animated animate__faster animate__fadeInRight'>
            <div ref={ref} className={`box rect`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>
                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                    <div className='title_box' style={{}}>
                        <div className="page_title_box" >
                            <p>약관 및 정책 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                            {edit && <button className='btn grey' onClick={() => {
                                if (detail?.idx) {
                                    setEdit(false);
                                } else {
                                    closeFunc();
                                }
                            }}>{"취소"}</button>}
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
                        {!edit ? <>
                            <div className="" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <p className='title_20 bold_600'>{detail?.title}</p>
                                <p className='title_16 color_343330'>{dayjs(detail?.updatedAt).format("YYYY-MM-DD")}</p>
                            </div>
                            <hr className='line mt_24' />

                            <div className='edit mt_36'>
                                <Viewer initialValue={detail?.comment}/>
                            </div>

                            <hr className='line mt_48' />
                        </> : <>
                            <div className={'content_box mt_20'}>
                                <InputSelect
                                    style={{ width: 490 }}
                                    name="status"
                                    value={type}
                                    setValue={setType}
                                    option={consts.policyTypes}
                                    placeholder={"유형"}
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
                            </div>
                        </>}


                        <div className="mt_40" style={{ display: "flex", justifyContent: "space-between" }}>
                            
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}