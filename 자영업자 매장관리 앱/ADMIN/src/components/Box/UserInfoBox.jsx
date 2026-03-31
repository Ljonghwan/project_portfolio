import { useState, useEffect, useRef, memo, useCallback } from 'react'
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

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen, formatBusinessNumber } from "@/libs/utils";
import InfoBox from '@/components/InfoBox';

export default function Component({
    style,
    detail,
    closeFunc,
    onUpdate = () => { }
}) {

    const { token, mbData, logout } = useUser();
    const { openPopup } = usePopup();
    const { closePopupComponent, openPopupComponent } = usePopupComponent();

    const navigate = useNavigate();
    const location = useLocation();

    const ref = useRef();

    const [store, setStore] = useState([]);
    const [boardCount, setBoardCount] = useState(0);
    const [replyCount, setReplyCount] = useState(0);
    const [reportCount, setReportCount] = useState(0);

    const [load, setLoad] = useState(true);


    useEffect(() => {
        window.history.pushState(null, "", "");

        window.addEventListener("popstate", closeFunc);

        return () => {
            window.removeEventListener("popstate", closeFunc);
        };
    }, []);

    useEffect(() => {
        if(detail) dataFunc();
    }, [detail])

    const dataFunc = async () => {
        let sender = {
            idx: detail?.idx
        };

        console.log('sender', sender);

        const { data, error } = await API.post("/admin/account/detail", sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                closeFunc();
                return;
            }

            setStore(data?.store || []);
            setBoardCount(data?.boardCount || 0);
            setReplyCount(data?.replyCount || 0);
            setReportCount(data?.reportCount || 0);

        }, consts.apiDelay)

    }

    const handleSuspendClick = () => {
        openPopupComponent({
            component: <UserSuspend />,
            data: {
                userIdx: detail?.idx,
                onSuccess: () => {
                    onUpdate(); // Users.jsx의 loadData 호출하여 목록 갱신
                    // UserInfoBox는 열린 상태로 유지됨
                }
            }
        });
    }

    const handleUnsuspendClick = () => {
        openPopup({
            title: "정지해제",
            message: "해당 회원의 이용정지를 해제하시겠습니까?",
            button: "해제",
            onPress: async () => {
                try {
                    const { error } = await API.post("/admin/account/updateStatus", {
                        idx: detail?.idx,
                        status: 1
                    });

                    if (error) {
                        // toast.error(error?.message);
                        return;
                    }

                    toast.success("정지가 해제되었습니다.");
                    onUpdate(); // Users.jsx의 loadData 호출하여 목록 갱신
                } catch (err) {
                    toast.error("정지해제 처리 중 오류가 발생했습니다.");
                }
            },
            buttonCencle: "취소",
            onCancelPress: () => {}
        });
    }

    const handleStatusReasonClick = () => {
        const isWithdraw = detail?.status === 9; // 탈퇴 여부
        const isSuspend = detail?.status === 2;  // 정지 여부

        openPopupComponent({
            component: <UserStatusReason />,
            data: {
                statusData: {
                    userId: detail?.account || '-',
                    userName: detail?.name || '-',
                    statusType: isWithdraw ? 'withdraw' : isSuspend ? 'suspend' : '',
                    date: isWithdraw ? detail?.deleteAt : detail?.updatedAt || '-',
                    reasonType: isWithdraw ? detail?.delete_type : detail?.disable_type || '기타',
                    reason: isWithdraw ? detail?.delete_desc : detail?.disable_desc || '-'
                }
            }
        });
    }

    return (
        <div className='content_form2 animate__animated animate__faster animate__fadeInRight'>
            {load && (<Loading />)}
            <div ref={ref} className={`box rect`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>
                {/* {!load && (<Loading />)} */}
                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                    <div className='title_box' style={{ }}>
                        <div className="page_title_box" >
                            <p>회원 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                            {detail?.status === 2 ? (
                                <button className='btn4 round' onClick={handleUnsuspendClick}>정지해제</button>
                            ) : detail?.status === 1 ? (
                                <button className='btn4 round' onClick={handleSuspendClick}>이용정지</button>
                            ) : null}
                        </div>
                    </div>

                    <div className='info_container'>
                        <div className='edit'>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="회원 ID" content={detail?.account} borderTop borderBottom />
                                <InfoBox style={{ flex: 1 }} title="가입 유형" content={detail?.type === 'account' ? '이메일' : detail?.type} borderTop borderBottom />
                            </div>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="이름" content={detail?.name} borderBottom />
                                <InfoBox style={{ flex: 1 }} title="닉네임" content={detail?.nickname} borderBottom />
                            </div>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="휴대폰번호" content={detail?.hp} borderBottom />
                                <InfoBox style={{ flex: 1 }} title="가입일" content={dayjs(detail?.createdAt).format("YYYY-MM-DD HH:mm:ss")} borderBottom />
                            </div>
                            <InfoBox style={{ flex: 1 }} title="상태" content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                    {detail?.status === 1 && <p className='tag_status active'>정상</p>}
                                    {detail?.status === 2 && <p className='tag_status stop'>정지</p>}
                                    {detail?.status === 9 && <p className='tag_status delete'>탈퇴</p>}
                                    {(detail?.status === 9 || detail?.status === 2) && (
                                        <button className='btn4 smal' onClick={handleStatusReasonClick}>사유보기</button>
                                    )}
                                </div>
                            } borderBottom />
                        </div>

                        <p className='title_info mt_36'>인증/연동 정보</p>
                        <div className='edit mt_24'>
                            <InfoBox 
                                style={{ flex: 1 }} 
                                title="여신금융협회" 
                                content={
                                    <>
                                        {store?.filter(x => x?.cardsales_id && x?.cardsales_grp_id)?.map(x => x?.title)?.join(', ') || "-"}
                                    </>
                                } 
                                borderTop 
                                borderBottom 
                            />
                            {/* <InfoBox style={{ flex: 1 }} title="사업자등록번호" content={"-"} borderBottom /> */}
                            <InfoBox style={{ flex: 1 }} title="연동 매장 수" content={store?.filter(x => x?.cardsales_id && x?.cardsales_grp_id)?.length} borderBottom />
                        </div>

                        <p className='title_info mt_36'>매장 정보</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "25%" }}>매장명</td>
                                        <td style={{ width: "25%" }}>사업자등록번호</td>
                                        <td style={{ width: "25%" }}>면적(평)</td>
                                        <td style={{ width: "25%" }}>생성일시</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {store?.map((x, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{x?.name}</td>
                                                <td>{formatBusinessNumber(x?.business_num)}</td>
                                                <td>{x?.area ? x?.area + "평" : "-"}</td>
                                                <td>{dayjs(x?.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
                                            </tr>
                                        )
                                    })}
                                    {store?.length < 1 && (
                                        <tr>
                                            <td className="null_td" colSpan={4}>매장 정보가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <p className='title_info mt_36'>커뮤니티 활동</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "calc(100% / 3)" }}>게시글 수</td>
                                        <td style={{ width: "calc(100% / 3)" }}>댓글 수</td>
                                        <td style={{ width: "calc(100% / 3)" }}>최근 신고</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{numFormat(boardCount)}</td>
                                        <td>{numFormat(replyCount)}</td>
                                        <td>{numFormat(reportCount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* <p className='title_info mt_36'>일지 활동</p>
                        <div className='edit mt_30'>
                            <InfoBox style={{ flex: 1 }} title="작성글 수" content={"-"} borderTop borderBottom />
                            <InfoBox style={{ flex: 1 }} title="최신 글" content={"-"} borderBottom />
                        </div> */}

                    </div>

                </div>
            </div>

        </div>
    )
}
