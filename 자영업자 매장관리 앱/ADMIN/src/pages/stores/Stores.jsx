import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";

import StoreInfoBox from "@/components/Box/StoreInfoBox";

import Loading from "@/components/Loading";
import consts from "@/libs/consts";

import API from "@/libs/api";
import { toast } from "react-toastify";
import Zoom from 'react-medium-image-zoom';
import _ from "lodash";

import { numFormat, formatBusinessNumber } from "@/libs/utils";

export default function Cs4() {

    const [load, setLoad] = useState(true);

    const [stx, setStx] = useState("");
    const [stxType, setStxType] = useState(""); //검색 타입
    const [sdate, setsdate] = useState("");
    const [edate, setedate] = useState("");

    const [dataList, setDataList] = useState([]);
    const [viewList, setViewList] = useState([]);

    const [type, setType] = useState("");

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    async function loadData() {
        let sender = {};
        setLoad(true);
        const { data, error } = await API.post('/admin/store/list', sender);
        console.log("🚀 ~ loadData ~ data:", data, error)
        setTimeout(() => {

            setLoad(false);

            if (error) {
                // toast.error(error?.message)
                return;
            }

            setDataList(data);
            searchFunc(data);

        }, consts.apiDelay)

    }

    function filterFunc(data) {
        let orList = data ? data : dataList;
        const resultList = orList.filter(item => {
            if (sdate && dayjs(item?.createdAt).diff(dayjs(sdate + "00:00:00"), "second") < 0) {
                return false
            }
            if (edate && dayjs(item?.createdAt).diff(dayjs(edate + "23:59:59"), "second") > 0) {
                return false
            }

             // 검색 타입 및 검색어 필터
             if (stxType && stx) {
                const searchValue = stx.toLowerCase();
                switch (Number(stxType)) {
                    case 1: // 매장명
                        if (!String(item?.name || '').toLowerCase().includes(searchValue)) return false;
                        break;
                    case 2: // 대표자
                        if (!String(item?.user?.name || '').toLowerCase().includes(searchValue)) return false;
                        break;
                    case 3: // 대표자ID
                        if (!String(item?.user?.account || '').includes(stx)) return false;
                        break;
                    case 4: // 사업자등록번호
                        if (!String(item?.business_num || '').includes(stx)) return false;
                        break;
                    case 5: // 주소
                        if (!String((item?.addr + item?.addr2) || '').toLowerCase().includes(searchValue)) return false;
                        break;
                    default:
                        break;
                }
            }

            if (type) {
                switch (Number(type)) {
                    case 1: 
                        if (item?.cash_count < 1) return false;
                        break;
                    case 2: 
                        if (item?.cash_count > 0) return false;
                        break;
                    default:
                        break;
                }
            }

            return true;
        })

        setViewList(resultList);
    }

    function searchFunc(data) {
        filterFunc(data);
    }


    // 엑셀 다운로드
    function excelFunc() {
        const id = toast.loading("엑셀 다운로드 중...");
        try {
            // 조건 요약 정보
            let period = '없음';
            if (sdate && edate) {
                period = `${dayjs(sdate).format('YYYY-MM-DD')} ~ ${dayjs(edate).format('YYYY-MM-DD')}`;
            } else if (sdate) {
                period = `${dayjs(sdate).format('YYYY-MM-DD')} ~ `;
            } else if (edate) {
                period = `~ ${dayjs(edate).format('YYYY-MM-DD')}`;
            }
            const searchTypeLabel = stxType
                ? ([
                    { idx: 1, title: "매장명" },
                    { idx: 2, title: "대표자" },
                    { idx: 3, title: "대표자ID" },
                    { idx: 4, title: "사업자등록번호" },
                    { idx: 5, title: "주소" }
                ].find(opt => opt.idx === stxType || opt.idx === Number(stxType))?.title || '없음')
                : '없음';
            const searchKeyword = stx || '없음';
            const typeLabel = type
                ? ([
                    { idx: '', title: "현금거래 전체" },
                    { idx: 1, title: "사용" },
                    { idx: 2, title: "미사용" },
                ].find(opt => opt.idx === type || opt.idx === Number(type))?.title || '없음')
                : '없음';




            const excelFileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const excelFileExtension = '.xlsx';
            const excelFileName = `매장관리_${dayjs().format('YYYYMMDD_HHmm')}`;

            // 조건 요약 행 생성
            const conditionRows = [
                ['조건 요약'],
                [`기간: ${period} | 검색타입: ${searchTypeLabel} | 검색어: ${searchKeyword} | 현금거래: ${typeLabel}`],
                [], // 빈 행
            ];

            // 헤더 행
            const headerRow = [
                "매장ID",
                "매장명",
                "대표자",
                "대표자ID",
                "사업자등록번호",
                "주소",
                "상세주소",
                "현금거래",
                "등록일"
            ];

            // 데이터 매핑
            let dataList = viewList.map((item, i) => {
                return [
                    item?.idx || '-',
                    item?.name || '-',
                    item?.user?.name || '-',
                    item?.user?.account || '-',
                    formatBusinessNumber(item?.business_num) || '-',
                    item?.addr || '-',
                    item?.addr2 || '-',
                    item?.cash_count > 0 ? '사용' : '미사용' || '-',
                    dayjs(item?.createdAt).format("YYYY-MM-DD") || '-'
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



    // 테이블 아이템 클릭
    function itemClick(item) {
        console.log("🚀 ~ itemClick ~ item:", item)
        setShow(true)
        setDetail(item)
    }

    useEffect(() => {
        loadData()
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>매장 관리</p>
            </div>

            <div className="page_search_box mt_20">
                <div style={{ width: "100%" }}>
                    <InputDate
                        placeholder="시작날짜"
                        placeholderEnd="종료날짜"
                        name="ipd1"
                        dateValue={sdate}
                        setDateValue={setsdate}
                        dateValueEnd={edate}
                        setDateValueEnd={setedate}
                        multiple={true}
                    />

                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="cate"
                        value={stxType}
                        setValue={setStxType}
                        option={[
                            { idx: 1, title: "매장명" },
                            { idx: 2, title: "대표자" },
                            { idx: 3, title: "대표자ID" },
                            { idx: 4, title: "사업자등록번호" },
                            { idx: 5, title: "주소" }
                        ]}
                        placeholder={"검색 타입"}
                    />
                    <InputSearch
                        className="input_text"
                        type="text"
                        placeholder="검색어 입력"
                        name="stx"
                        value={stx}
                        setValue={setStx}
                        autoComplete={"one-time-code"}
                        onKeyDown={e => {
                            if (e?.key === 'Enter') {
                                searchFunc();
                            }
                        }}
                    />
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="type"
                        value={type}
                        setValue={setType}
                        option={[
                            { idx: '', title: "현금거래 전체" },
                            { idx: 1, title: "사용" },
                            { idx: 2, title: "미사용" },
                        ]}
                    />
                    <button className="btn4" style={{ width: 128 }} onClick={() => { searchFunc() }}>검색</button>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="mt_20">
                <div className="title_12">
                    총 <span className="color_FF5B06">{viewList.length}</span>건
                </div>
                <button className="excel_btn" onClick={excelFunc}>엑셀 다운로드</button>
            </div>

            <div className="mt_20" style={{ height: "100%" }}>
                <DataTable
                    datas={viewList}
                    header={() => {
                        return <>
                            <td style={{ width: "10%" }}>매장ID</td>
                            <td style={{ width: "10%" }}>매장명</td>
                            <td style={{ width: "10%" }}>대표자</td>
                            <td style={{ width: "10%" }}>대표ID</td>
                            <td style={{ width: "10%" }}>사업자등록번호</td>
                            <td style={{ width: "15%" }}>주소</td>
                            <td style={{ width: "5%" }}>현금거래</td>
                            <td style={{ width: "10%" }}>등록일</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"usr-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                            setDetail(item);
                        }}>
                            <td>{item?.idx}</td>
                            <td>{item?.name}</td>
                            <td>{item?.user?.name}</td>
                            <td>{item?.user?.account}</td>
                            <td>{formatBusinessNumber(item?.business_num)}</td>
                            <td style={{ lineHeight: 1.5 }}>
                                {item?.addr}
                                <br/>
                                {item?.addr2}
                            </td>
                            <td>
                                {item?.cash_count > 0 ? '사용' : '미사용'}
                            </td>
                            <td>{dayjs(item?.createdAt).format("YYYY-MM-DD")}</td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <StoreInfoBox detail={detail} dataList={dataList} onUpdate={loadData} closeFunc={() => {
                    setShow(false);
                }} />
            }
        </div >
    </div>
}