import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from "lodash";
import dayjs from "dayjs";

import Zoom from 'react-medium-image-zoom';

import { useUser, usePopup, useGallery, useConfig, usePopupComponent } from '@/store';
import UserSuspend from '@/components/Popup/UserSuspend';
import UserStatusReason from '@/components/Popup/UserStatusReason';


import Loading from "@/components/Loading";
import InputSelect from "@/components/InputSelect";

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen } from "@/libs/utils";
import InfoBox from '@/components/InfoBox';

const HtmlViewer = React.memo(function HtmlViewer({ html }) {
    const htmlContent = useMemo(() => ({ __html: html }), [html]);
    return <div dangerouslySetInnerHTML={htmlContent} />;
});

export default function Component({
    style,
    detail = null,
    closeFunc,
    onUpdate = () => { }
}) {

    const { token, mbData, logout } = useUser();
    const { openPopup } = usePopup();
    const { closePopupComponent, openPopupComponent } = usePopupComponent();
    const { configOptions } = useConfig();

    const navigate = useNavigate();
    const location = useLocation();

    const ref = useRef();

    const [item, setItem] = useState(null);
    const [replys, setReplys] = useState([]);
    const [reports, setReports] = useState([]);
    const [votes, setVotes] = useState([]);

    const [load, setLoad] = useState(true);


    useEffect(() => {
        window.history.pushState(null, "", "");

        window.addEventListener("popstate", closeFunc);

        return () => {
            window.removeEventListener("popstate", closeFunc);
        };
    }, []);

    useEffect(() => {
        if (detail?.idx) dataFunc();
    }, [detail])


    const dataFunc = async () => {

        let sender = {
            idx: detail?.idx
        };

        console.log('sender', sender);

        const { data, error } = await API.post('/admin/content/board', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                // // toast.error(error?.message);
                closeFunc();
                return;
            }

            setItem(data?.item || null);
            setReplys(data?.replys || []);
            setReports(data?.reports || []);
            setVotes(data?.votes || []);

        }, consts.apiDelay)

    }

    const deleteReplyFunc = async (idx) => {
        openPopup({
            title: "삭제",
            message: "삭제 하시겠습니까?",
            warning: "삭제할 경우 다시 복구되지 않습니다. ",
            button: "삭제",
            onPress: async () => {

                let sender = { idx: idx };

                const { data, error } = await API.post('/admin/content/replyDelete', sender);
                if (error) {
                    // toast.error(error?.message)
                    return;
                }

                toast.success("삭제 되었습니다.")

                dataFunc();
            },
            buttonCencle: "취소",
            onCancelPress: () => { }
        })
    }

    const deleteFunc = async () => {
        openPopup({
            title: "삭제",
            message: "삭제 하시겠습니까?",
            warning: "삭제할 경우 다시 복구되지 않습니다. ",
            button: "삭제",
            onPress: async () => {


                let sender = { idx: item?.idx };
                const { data, error } = await API.post('/admin/content/boardDelete', sender);
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

    const statusFunc = async () => {

        let sender = { idx: item?.idx };
        const { data, error } = await API.post('/admin/content/boardStatus', sender);
        if (error) {
            // toast.error(error?.message)
            return;
        }

        toast.success("처리 되었습니다.")

        dataFunc();
        onUpdate();
    }

    return (
        <div className='content_form2 animate__animated animate__faster animate__fadeInRight'>
            <div ref={ref} className={`box rect`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>
                {load && (<Loading />)}
                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                    <div className='title_box' style={{}}>
                        <div className="page_title_box" >
                            <p>커뮤니티 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                            <button className='btn grey' onClick={deleteFunc}>{"삭제"}</button>
                            <button className='btn black' onClick={statusFunc}>{item?.status === 1 ? "숨김처리" : "노출처리"}</button>
                        </div>
                    </div>

                    <div className='info_container'>
                        <div className='edit'>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="커뮤니티 ID" content={item?.idx} borderTop borderBottom />
                                <InfoBox style={{ flex: 1 }} title="작성자" content={`${item?.user?.name}(${item?.user?.nickname})`} borderTop borderBottom />
                            </div>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="카테고리" content={configOptions.boardCategory?.find(x => x?.idx === item?.cate)?.title || '-'} borderBottom />
                                <InfoBox style={{ flex: 1 }} title="작성일시" content={dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")} borderBottom />
                            </div>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="상태" content={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                        {item?.status === 1 && <p className='tag_status stop'>노출</p>}
                                        {item?.status === 2 && <p className='tag_status delete'>미노출</p>}
                                    </div>
                                } borderBottom />
                                <InfoBox style={{ flex: 1 }} title="신고횟수" content={numFormat(reports?.length)} borderBottom />
                            </div>

                        </div>

                        <p className='title_info mt_36'>게시글</p>

                        <div className='edit mt_24'>
                            <InfoBox style={{ flex: 1 }} title="제목" content={item?.title} borderTop borderBottom />
                            <InfoBox style={{ flex: 1 }} title="내용" titleStyle={{ height: 'auto' }} content={
                                <div style={{ width: 500 }}>
                                    <HtmlViewer html={item?.comment} />

                                    <div className='mt_24' style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                        {item?.image?.map((x, i) => {
                                            return (
                                                <Zoom key={i}>
                                                    <img src={consts.s3Url + x} style={{ width: '100%' }} />
                                                </Zoom>
                                            )
                                        })}
                                    </div>
                                </div>
                            } borderBottom />

                            {votes?.length > 0 && (
                                <InfoBox style={{ flex: 1 }} title="투표" titleStyle={{ height: 'auto' }} content={
                                    <div style={{  }}>
                                        <div className='' style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                            <p>총 투표인원: {numFormat(votes?.reduce((acc, x) => acc + x?.count, 0))}명</p>
                                            {votes?.map((x, i) => {
                                                return (
                                                    <div key={i} style={{ display: 'flex', width: 500,  alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <p>{i + 1}. {x?.title}</p>
                                                        <p>{numFormat(x?.count)}명 ({((x?.count / votes?.reduce((acc, x) => acc + x?.count, 0)) * 100).toFixed(1)}%)</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                } borderBottom />
                            )}
                        </div>

                        <p className='title_info mt_36'>댓글</p>
                        <div className='edit mt_30' style={{ maxHeight: 500, overflow: 'auto' }}>
                            <table className='nomal_table'>
                                <thead style={{ position: 'sticky', top: 0 }}>
                                    <tr>
                                        <td style={{ width: "10%" }}>NO</td>
                                        <td style={{ width: "10%" }}>작성자</td>
                                        <td style={{ width: "60%" }}>내용</td>
                                        <td style={{ width: "10%" }}>작성일</td>
                                        <td style={{ width: "10%" }}>삭제</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {replys?.map((x, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>C-{x?.idx} // {x?.emoji}</td>
                                                <td>{x?.user?.name}({x?.user?.nickname})</td>
                                                <td style={{ whiteSpace: 'pre', color: x?.deleteAt ? '#919EAB' : '#000' }}>
                                                    {x?.comment}
                                                    {x?.emoji && (
                                                        <>
                                                            <br />
                                                            <img src={consts.s3Url + (configOptions?.emoji?.find(xx => xx?.idx == x?.emoji)?.image) } style={{ width: 100, height: 100, objectFit: 'cover' }}/>
                                                        </>
                                                    )}
                                                </td>
                                                <td>{dayjs(x?.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                                                <td>
                                                    {x?.deleteAt ? (
                                                        ""
                                                    ) : (
                                                        <button className="btn btn8" style={{ justifySelf: 'center' }} onClick={() => deleteReplyFunc(x?.idx)}>삭제</button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {replys?.length < 1 && (
                                        <tr>
                                            <td className="null_td" colSpan={5}>댓글이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <p className='title_info mt_36'>신고내역</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "calc(100% / 3)" }}>신고자</td>
                                        <td style={{ width: "calc(100% / 3)" }}>신고사유</td>
                                        <td style={{ width: "calc(100% / 3)" }}>신고일</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports?.map((x, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{x?.user?.name}({x?.user?.nickname})</td>
                                                <td style={{ whiteSpace: 'pre' }}>{x?.comment}</td>
                                                <td>{dayjs(x?.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                                            </tr>
                                        )
                                    })}
                                    {reports?.length < 1 && (
                                        <tr>
                                            <td className="null_td" colSpan={3}>신고내역이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    )
}
