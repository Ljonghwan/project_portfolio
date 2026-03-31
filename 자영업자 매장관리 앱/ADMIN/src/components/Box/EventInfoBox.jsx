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
import InputDate from "@/components/InputDate";
import InputRadio from "@/components/InputRadio";
import InputFile from "@/components/InputFile";
import CheckBox from '@/components/CheckBox';

import InputFontStyle from '@/components/InputFontStyle';
import InputFontAlign from '@/components/InputFontAlign';
import InputColor from '@/components/InputColor';

import TemplatePreview from '@/components/TemplatePreview';

import InfoBox from '@/components/InfoBox';

import API from "@/libs/api";

import consts from "@/libs/consts";
import images from "@/libs/images";

import { stripHtml, numFormat, getDateStatus, patternUrl, patternNum } from "@/libs/utils";
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

    const [item, setItem] = useState(null)
    const [removes, setRemoves] = useState([]);

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
        if (!item?.image) {
            toast.error("배경이미지를 첨부하세요.");
            return;
        }
        if (!item?.button) {
            toast.error("버튼명을 입력하세요.");
            return;
        }

        let sender = {
            item: item
        }
        const { data, error } = await API.post('/admin/event/update', sender);

        if (error) {
            // toast.error(error?.message)
            return;
        }

        toast.success("저장되었습니다.")
        onUpdate();
        closeFunc();
    }

    useEffect(() => {

        setItem(detail || {
            layout: 1,
            title_style: {
                fontSize: 'xx-large',
                textAlign: 'center',
                color: '#000000'
            },
            sub_title_style: {
                fontSize: 'medium',
                textAlign: 'center',
                color: '#000000'
            },
            button_style: {
                backgroundColor: '#000000'
            },
            status: 1,
        });

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

                    <div className='title_box' style={{}}>
                        <div className="page_title_box" >
                            <p >템플릿 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn grey' onClick={closeFunc}>{"취소"}</button>
                            <button className='btn black' onClick={() => {
                                updateFunc()
                            }}>{!item?.idx ? "저장" : "수정"}</button>
                        </div>
                    </div>

                    <div className='info_container flex' style={{ alignItems: 'flex-start', gap: 80 }}>
                        {/* <p className='title_24 bold_600 mt_24'>소식 관리</p> */}

                        <div className={'content_box'} style={{ gap: 40, width: 500 }}>
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
                                label={'템플릿 제목'}
                                placeholder="제목을 입력해주세요."
                                value={item?.title}
                                setValue={(v) => handleChange({ key: 'title', value: v })}
                                maxlength={100}
                            />

                            <div>
                                <p className='input_label' >배경 이미지</p>
                                <InputFile
                                    type={1}
                                    name={'image'}
                                    valid='image'
                                    filesValue={item?.image}
                                    setfilesValue={(v) => {
                                        handleChange({
                                            key: 'image',
                                            value: v
                                        })
                                    }}
                                />
                            </div>

                            <InputSelect
                                name="layout"
                                label={'레이아웃'}
                                value={item?.layout}
                                setValue={(v) => handleChange({ key: 'layout', value: v })}
                                option={consts.layoutOptions}
                                placeholder={"레이아웃"}
                            />

                            <div>
                                <p className='input_label' >메인 타이틀 스타일</p>
                                <div className='flex' style={{ gap: 6, marginBottom: 6 }}>
                                    <InputSelect
                                        style={{ width: 150, flex: 'unset' }}
                                        name="title_style"
                                        value={item?.title_style?.fontSize}
                                        setValue={(v) => handleChange({ key: 'title_style', value: { ...item?.title_style, fontSize: v } })}
                                        optionNotKey={consts.fontSizeOptions}
                                    />
                                    <InputFontStyle
                                        value={item?.title_style}
                                        setValue={(v) => handleChange({ key: 'title_style', value: v })}
                                    />
                                    <InputFontAlign
                                        value={item?.title_style}
                                        setValue={(v) => handleChange({ key: 'title_style', value: v })}
                                    />
                                </div>
                                <InputColor
                                    value={item?.title_style?.color}
                                    setValue={(v) => handleChange({ key: 'title_style', value: { ...item?.title_style, color: v } })}
                                />
                            </div>

                            <div>
                                <p className='input_label' >서브 타이틀 스타일</p>
                                <div className='flex' style={{ gap: 6, marginBottom: 6 }}>
                                    <InputSelect
                                        style={{ width: 150, flex: 'unset' }}
                                        name="sub_title_style"
                                        value={item?.sub_title_style?.fontSize}
                                        setValue={(v) => handleChange({ key: 'sub_title_style', value: { ...item?.sub_title_style, fontSize: v } })}
                                        optionNotKey={consts.fontSizeOptions}
                                    />
                                    <InputFontStyle
                                        value={item?.sub_title_style}
                                        setValue={(v) => handleChange({ key: 'sub_title_style', value: v })}
                                    />
                                    <InputFontAlign
                                        value={item?.sub_title_style}
                                        setValue={(v) => handleChange({ key: 'sub_title_style', value: v })}
                                    />
                                </div>
                                <InputColor
                                    value={item?.sub_title_style?.color}
                                    setValue={(v) => handleChange({ key: 'sub_title_style', value: { ...item?.sub_title_style, color: v } })}
                                />
                            </div>


                            <Input
                                className="input_text"
                                type="text"
                                label={'버튼명'}
                                placeholder="버튼명을 입력해주세요"
                                value={item?.button}
                                setValue={(v) => handleChange({ key: 'button', value: v })}
                                maxlength={20}
                            />
                            <div>
                                <p className='input_label' >버튼 색상</p>
                                <InputColor
                                    value={item?.button_style?.backgroundColor}
                                    setValue={(v) => handleChange({ key: 'button_style', value: { ...item?.button_style, backgroundColor: v } })}
                                />
                            </div>


                            <InputRadio
                                label={'노출 여부'}
                                options={consts.viewStatusConsts?.filter(x => x?.idx)}
                                value={item?.status}
                                setValue={(v) => handleChange({ key: 'status', value: v })}
                            />

                        </div>



                        <div className=''>
                            <p className='input_label' >미리보기(9:16)</p>

                            <TemplatePreview item={item} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}