import { useState, useEffect, useRef, memo, useCallback } from 'react'
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
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

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen, formatBusinessNumber, formatToAbs } from "@/libs/utils";
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

    const [store, setStore] = useState(null);
    const [staffs, setStaffs] = useState([]);
    const [events, setEvents] = useState([]);

    const [chartSum, setChartSum] = useState({});

    const [cardSum, setCardSum] = useState(0);
    const [cashSum, setCashSum] = useState(0);

    const [logs, setLogs] = useState([]);

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
        if (detail) dataFunc();
    }, [detail])

    const dataFunc = async () => {
        let sender = {
            idx: detail?.idx
        };

        console.log('sender', sender);

        const { data, error } = await API.post("/admin/store/detail", sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                closeFunc();
                return;
            }

            setStore(data?.store || null);
            setStaffs(data?.staffs || []);
            setEvents(data?.events || []);

            setChartSum({
                sum1: data?.chart?.reduce((acc, item) => acc + item?.value, 0) || 0,
                sum2: data?.chart2?.reduce((acc, item) => acc + item?.value, 0) || 0,
                sum3: data?.chart3?.reduce((acc, item) => acc + item?.value, 0) || 0
            });


            setCardSum(data?.cardSum || 0);
            setCashSum(data?.cashSum || 0);

            setLogs(data?.logs || []);

            setBoardCount(data?.boardCount || 0);
            setReplyCount(data?.replyCount || 0);
            setReportCount(data?.reportCount || 0);

        }, consts.apiDelay)

    }

    // 엑셀 다운로드
    function excelFunc() {
        const id = toast.loading("엑셀 다운로드 중...");
        try {

            const excelFileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const excelFileExtension = '.xlsx';
            const excelFileName = `${detail?.idx}_활동로그_${dayjs().format('YYYYMMDD_HHmm')}`;

            // 조건 요약 행 생성
            const conditionRows = [
                ['매장 정보'],
                [`매장ID: ${detail?.idx} | 매장명: ${detail?.name} | 대표자: ${detail?.user?.name} | 대표자ID: ${detail?.user?.account}`],
                [], // 빈 행
            ];

            // 헤더 행
            const headerRow = [
                "일시",
                "행위 유형",
                "내용",
                "오류 내용",
                "결과"
            ];

            // 데이터 매핑
            let dataList = logs.map((item, i) => {
                return [
                    dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm:ss") || '-',
                    item?.type || '-',
                    item?.title || '-',
                    item?.comment || '-',
                    item?.status === 1 ? '성공' : '실패' || '-'
                ]
            });

            // 워크시트 생성 (조건 요약 + 헤더)
            const ws = XLSX.utils.aoa_to_sheet([
                ...conditionRows,
                headerRow
            ]);

            // 데이터 추가
            dataList.map((item) => {
                XLSX.utils.sheet_add_aoa(
                    ws,
                    [
                        item
                    ],
                    { origin: -1 }
                );
                return false;
            });

            const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
            const excelButter = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const excelFile = new Blob([excelButter], { type: excelFileType });
            FileSaver.saveAs(excelFile, excelFileName + excelFileExtension);

            toast.update(id, { render: '엑셀 다운로드가 완료되었습니다.', type: "success", ...consts.toastOption });
        } catch (error) {
            console.log('error', error);
            toast.update(id, { render: '엑셀 다운로드에 실패했습니다.', type: "error", ...consts.toastOption });
        }
    }


    return (
        <div className='content_form2 animate__animated animate__faster animate__fadeInRight'>
            {load && (<Loading />)}
            <div ref={ref} className={`box rect`} style={{ overflow: 'auto', paddingBottom: 24, ...style }}>
                {/* {!load && (<Loading />)} */}
                <div className='box_container_form' style={{ paddingBottom: 0 }}>
                    <div className='title_box' style={{}}>
                        <div className="page_title_box" >
                            <p>매장 관리</p>
                        </div>

                        <div className="" style={{ display: "flex", gap: 10 }}>
                            <button className='btn' onClick={closeFunc}>목록으로</button>
                        </div>
                    </div>

                    <div className='info_container'>
                        <div className='edit'>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="매장 ID" content={detail?.idx} borderTop borderBottom />
                                <InfoBox style={{ flex: 1 }} title="대표자" content={`${detail?.user?.name}(${detail?.user?.account})`} borderTop borderBottom />
                            </div>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="매장명" content={detail?.name} borderBottom />
                                <InfoBox style={{ flex: 1 }} title="사업자등록번호" content={formatBusinessNumber(detail?.business_num)} borderBottom />
                            </div>
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="업종" content={`${detail?.typeText?.depth1} > ${detail?.typeText?.depth2} > ${detail?.typeText?.depth3}`} borderBottom />
                                <InfoBox style={{ flex: 1 }} title="연락처" content={hpHypen(detail?.tel)} borderBottom />
                            </div>
                            <InfoBox style={{ flex: 1 }} title="주소" content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                    {detail?.addr} {detail?.addr2}
                                </div>
                            } borderBottom />
                            <div style={{ display: "flex", width: "100%" }}>
                                <InfoBox style={{ flex: 1 }} title="등록일자" content={dayjs(detail?.createdAt).format("YYYY-MM-DD HH:mm:ss")} borderBottom />
                                <InfoBox style={{ flex: 1 }} title="여신금융협회 연동" titleStyle={{ fontSize: '15px' }} content={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                        {
                                            (detail?.cardsales_id && detail?.cardsales_grp_id) ?
                                                <p className='tag_status active'>연동</p>
                                                : <p className='tag_status delete'>미연동</p>
                                        }
                                    </div>
                                } borderBottom />
                            </div>
                        </div>



                        <p className='title_info mt_36'>직원 목록</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "25%" }}>이름</td>
                                        <td style={{ width: "25%" }}>근무형태</td>
                                        <td style={{ width: "25%" }}>등록일</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffs?.map((x, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{x?.name}</td>
                                                <td>{x?.work_type}</td>
                                                <td>{dayjs(x?.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
                                            </tr>
                                        )
                                    })}
                                    {staffs?.length < 1 && (
                                        <tr>
                                            <td className="null_td" colSpan={3}>직원 목록이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <p className='title_info mt_36'>최근 이벤트</p>
                        <div className='edit mt_30'>
                            <table className='nomal_table'>
                                <thead>
                                    <tr>
                                        <td style={{ width: "25%" }}>이벤트 명</td>
                                        <td style={{ width: "25%" }}>진행기간</td>
                                        <td style={{ width: "15%" }}>발급수</td>
                                        <td style={{ width: "15%" }}>사용수</td>
                                        <td style={{ width: "20%" }}>등록일</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events?.map((x, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{x?.title}</td>
                                                <td>{dayjs(x?.sdate).format("YYYY-MM-DD")} ~ {dayjs(x?.edate).format("YYYY-MM-DD")}</td>
                                                <td>{numFormat(x?.senders?.length)}</td>
                                                <td>{numFormat(x?.senders?.filter(y => y?.used)?.length)}</td>
                                                <td>{dayjs(x?.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
                                            </tr>
                                        )
                                    })}
                                    {events?.length < 1 && (
                                        <tr>
                                            <td className="null_td" colSpan={5}>최근 이벤트가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>


                        <p className='title_info mt_36'>매출 정보</p>
                        <div className='edit mt_30'>
                            <InfoBox style={{ flex: 1 }} title={`이번달 총 매출 (${dayjs().format("YYYY-MM")})`} content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', paddingLeft: 20 }}>
                                    ₩ {numFormat(chartSum?.sum1)}
                                </div>
                            } borderBottom borderTop />
                            <InfoBox style={{ flex: 1 }} title={`저번달 총 매출 (${dayjs().subtract(1, 'month').format("YYYY-MM")})`} content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', paddingLeft: 20 }}>
                                    ₩ {numFormat(chartSum?.sum2)}  (전월 대비 {formatToAbs((chartSum?.sum2 - chartSum?.sum3) / chartSum?.sum3 * 100)}%)
                                </div>
                            } borderBottom />
                            <InfoBox style={{ flex: 1 }} title={<p>최근 3개월<br />일 평균 매출</p>} content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', paddingLeft: 20 }}>
                                    ₩ {
                                        numFormat(
                                            Math.round((chartSum?.sum2 + chartSum?.sum3) / (dayjs().subtract(1, 'month').daysInMonth() + dayjs().subtract(2, 'month').daysInMonth()))
                                        )
                                    }
                                </div>
                            } borderBottom />
                            <InfoBox style={{ flex: 1 }} title="현금 비중" content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', paddingLeft: 20 }}>
                                    {((cashSum / (cardSum + cashSum) * 100) || 0).toFixed(2)}% (수기 입력 기반)
                                </div>
                            } borderBottom />
                        </div>

                        <div className='flex mt_36' style={{ justifyContent: 'space-between' }}>
                            <p className='title_info'>최근 활동 로그</p>
                            <button className="excel_btn" onClick={excelFunc}>엑셀 다운로드</button>
                        </div>


                        <div className='edit mt_30' style={{ maxHeight: 300, overflow: 'auto' }}>
                            <table className='nomal_table'>
                                <thead style={{ position: 'sticky', top: 0 }}>
                                    <tr>
                                        <td style={{ width: "20%" }}>일시</td>
                                        <td style={{ width: "10%" }}>행위 유형</td>
                                        <td style={{ width: "30%" }}>내용</td>
                                        <td style={{ width: "30%" }}>오류 내용</td>
                                        <td style={{ width: "10%" }}>결과</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs?.map((x, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{dayjs(x?.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
                                                <td>{x?.type}</td>
                                                <td>{x?.title}</td>
                                                <td>{x?.comment}</td>
                                                <td style={{ color: x?.status === 1 ? 'blue' : 'red' }}>{x?.status === 1 ? '성공' : '실패'}</td>
                                            </tr>
                                        )
                                    })}
                                    {logs?.length < 1 && (
                                        <tr>
                                            <td className="null_td" colSpan={5}>최근 활동 로그가 없습니다.</td>
                                        </tr>
                                    )}
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
