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
        if (!item?.type) {
            toast.error("팝업 유형을 선택하세요.");
            return;
        }
        if (!item?.target) {
            toast.error("팝업 노출위치를 선택하세요.");
            return;
        }
        if (!item?.sdate || !item?.edate) {
            toast.error("팝업 노출기간을 선택하세요.");
            return;
        }
        
        if(item?.image?.filter(x => !x?.image)?.length > 0) {
            toast.error("상세 이미지를 첨부하세요.");
            return;
        }
        console.log(item?.image?.filter(x => !patternUrl.test(x?.link)));
        if(item?.image?.filter(x => !patternUrl.test(x?.link))?.length > 0) {
            toast.error("올바른 링크 URL이 아닙니다.");
            return;
        }
        if (!item?.image_type) {
            toast.error("이미지 설정을 선택하세요.");
            return;
        }
        if (!item?.close) {
            toast.error("창닫기 방법을 선택하세요.");
            return;
        }
        if (item?.close === 2 && (!patternNum.test(item?.close_day) || item?.close_day < 1)) {
            toast.error("창닫기 일자를 입력하세요.");
            return;
        }


        let sender = {
            item: item
        }
        const { data, error } = await API.post('/admin/popup/update', sender);

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
            type: configOptions?.popupType?.[0]?.idx,
            target: configOptions?.popupTargets?.[0]?.idx,
            image: [{}],
            status: 1,
            image_type: configOptions?.popupImageType?.[0]?.idx,
            close: configOptions?.popupCloseType?.[0]?.idx,
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
                            <p>팝업관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn grey' onClick={closeFunc}>{"취소"}</button>
                            <button className='btn black' onClick={() => {
                               updateFunc()
                            }}>{!item?.idx ? "저장" : "수정"}</button>
                        </div>
                    </div>

                    <div className='info_container'>
                        {/* <p className='title_24 bold_600 mt_24'>소식 관리</p> */}

                        <div className={'content_box mt_20'} style={{ gap: 40 }}>
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

                            <InputRadio
                                label={'팝업 유형'}
                                options={configOptions.popupType}
                                value={item?.type}
                                setValue={(v) => handleChange({ key: 'type', value: v })}
                            />

                            <InputRadio
                                label={'노출 위치'}
                                options={configOptions.popupTargets}
                                value={item?.target}
                                setValue={(v) => handleChange({ key: 'target', value: v })}
                            />

                            <div style={{ width: 700 }}>
                                <InputDate
                                    label={'기간 설정'}
                                    placeholder="시작날짜"
                                    placeholderEnd="종료날짜"
                                    dateValue={item?.sdate}
                                    setDateValue={(v) => handleChange({ key: 'sdate', value: v })}
                                    dateValueEnd={item?.edate}
                                    setDateValueEnd={(v) => handleChange({ key: 'edate', value: v })}
                                    multiple={true}
                                    showTime={true}

                                />
                            </div>
                            
                            <InputRadio
                                label={'노출 상태'}
                                options={consts.popupStatusConsts}
                                value={getDateStatus(item?.sdate, item?.edate)}
                                disabled={true}
                            />

                            <div>
                                <div className='flex' style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <p className='input_label' style={{ marginBottom: 0 }}>상세 이미지</p>
                                    <div className='flex' style={{ flex: 'unset', gap: 7 }}>
                                        <button className='minus_btn' onClick={() => {
                                            if (removes?.length < 1) {
                                                toast.error('이미지를 선택해주세요.');
                                                return;
                                            }
                                            handleChange({ key: 'image', value: item?.image?.filter((x, i) => !removes.includes(i)) })
                                            setRemoves([]);
                                        }} />
                                        <button className='add_btn' onClick={() => {
                                            if (item?.image?.length >= 10) {
                                                toast.error('더이상 추가할 수 없습니다.');
                                                return;
                                            }
                                            handleChange({ key: 'image', value: [...item?.image, {}] })
                                        }} />
                                    </div>
                                </div>
                                <div className='flex' style={{ flexDirection: 'column', gap: 18, marginTop: 18 }}>
                                    {item?.image?.map((x, i) => {
                                        return (
                                            <div key={i} className='popup_form_image'>
                                                <CheckBox
                                                    type={2}
                                                    checked={removes?.includes(i)}
                                                    onChange={() => {
                                                        if (removes?.includes(i)) {
                                                            setRemoves(prev => prev?.filter(item => item !== i));
                                                        } else {
                                                            setRemoves(prev => [...prev, i]);
                                                        }
                                                    }}
                                                />

                                                <div>
                                                    <div style={{ width: item?.type === 1 ? 230 : 300, aspectRatio: item?.type === 1 ? 3 / 4 : 4 / 3, backgroundColor: '#F3F3F3' }}>
                                                        {x?.image &&
                                                            <div style={{ position: 'relative' }}>
                                                                <Zoom>
                                                                    <img src={x?.image?.base || consts.s3Url + x?.image} className='image_view' style={{ aspectRatio: item?.type === 1 ? 3 / 4 : 4 / 3 }} />
                                                                </Zoom>
                                                                <button className='delete_btn2' style={{ position: 'absolute', top: 5, right: 5 }} onClick={() => {
                                                                    handleChange({
                                                                        key: 'image',
                                                                        value: item?.image?.map((xx, ii) => {
                                                                            if (ii !== i) return xx;
                                                                            return { ...xx, image: null }
                                                                        })
                                                                    })
                                                                }} />
                                                            </div>
                                                        }
                                                    </div>
                                                    <p className="msg">
                                                        {`가로 (width)는 최소 320px 이상을 권장합니다.\n${item?.type === 1 ? "일반 팝업은 3:4" : "바텀 팝업은 4:3"} 비율로 노출됩니다.`}
                                                    </p>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ marginBottom: 30 }}>
                                                        <p className='input_label'>이미지 등록</p>
                                                        <InputFile
                                                            type={1}
                                                            name={'image_' + i}
                                                            valid='image'
                                                            setfilesValue={(v) => {
                                                                handleChange({
                                                                    key: 'image',
                                                                    value: item?.image?.map((xx, ii) => {
                                                                        if (ii !== i) return xx;
                                                                        return { ...xx, image: v }
                                                                    })
                                                                })
                                                            }}
                                                        />
                                                    </div>
                                                    <Input
                                                        className="input_text"
                                                        type="text"
                                                        label={'링크 URL'}
                                                        placeholder="http://"
                                                        value={x?.link}
                                                        setValue={(v) => {
                                                            handleChange({
                                                                key: 'image',
                                                                value: item?.image?.map((xx, ii) => {
                                                                    if (ii !== i) return xx;
                                                                    return { ...xx, link: v }
                                                                })
                                                            })
                                                        }}
                                                        maxlength={100}
                                                    />
                                                </div>

                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <InputRadio
                                label={'이미지 설정'}
                                options={configOptions.popupImageType}
                                value={item?.image_type}
                                setValue={(v) => handleChange({ key: 'image_type', value: v })}
                            />

                            {/* <InputRadio
                                label={'창닫기 방법'}
                                options={configOptions.popupCloseType}
                                value={item?.close}
                                setValue={(v) => handleChange({ key: 'close', value: v })}
                            /> */}
                            <div style={{ width: '100%' }}>
                                <p className={`input_label`}>창닫기 방법</p>
                                <div className='flex' style={{ gap: 20 }}>
                                    {configOptions.popupCloseType?.map((x, i) => {
                                        return (
                                            <div key={i} className='input_check_box' onClick={() => handleChange({ key: 'close', value: x?.idx })}>
                                                <img src={item?.close === x?.idx ? images.check_on : images.check_off} />
                                                {x?.idx === 2 && (
                                                    <div style={{ width: 100 }}>
                                                        <Input
                                                            valid={'num'}
                                                            className="input_text"
                                                            type="text"
                                                            placeholder=""
                                                            value={item?.close_day}
                                                            setValue={(v) => handleChange({ key: 'close_day', value: v })}
                                                            maxlength={3}
                                                        />
                                                    </div>
                                                )}
                                                <p>{x?.title}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>


                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}