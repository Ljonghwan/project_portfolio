import { useEffect, useState } from "react";

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

import { useParams, useLocation } from 'react-router-dom';

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";

import BoardInfoBox from "@/components/Box/BoardInfoBox";

import Loading from "@/components/Loading";
import consts from "@/libs/consts";

import API from "@/libs/api";
import { toast } from "react-toastify";
import _ from "lodash";

import { numFormat, stripHtml } from "@/libs/utils";


import { useConfig } from '@/store';

export default function Cs4() {

    // const { idx } = useParams();
    const location = useLocation();
    const { idx } = location.state || {};

    const { configOptions } = useConfig();

    const [load, setLoad] = useState(true);

    const [stx, setStx] = useState("");
    const [sdate, setsdate] = useState("");
    const [edate, setedate] = useState("");
    const [cate, setCate] = useState("");

    const [dataList, setDataList] = useState([]);
    const [viewList, setViewList] = useState([]);

    const [type, setType] = useState("");

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    async function loadData() {
        let sender = {};
        setLoad(true);
        const { data, error } = await API.post('/admin/content/board', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                // toast.error(error?.message)
                return;
            }

            setDataList(data);
            searchFunc(data);

            const idx = localStorage.getItem('idx');
            if (idx) {
                localStorage.removeItem('idx');
                let item = data?.find(x => x?.idx == idx);
                console.log('item', idx, item);
                itemClick(item);
            }

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

            if (stx &&
                !(
                    String(item?.title).includes(stx) ||
                    String(item?.user?.name).includes(stx) ||
                    String(item?.user?.nickname).includes(stx) ||
                    String(item?.idx) === stx
                )
            ) return false

            if (cate && item?.cate != cate) return false;
            if (type && item?.status != type) return false;

            return true;
        })

        setViewList(resultList);
    }

    function searchFunc(data) {
        filterFunc(data);
    }

    // 테이블 아이템 클릭
    function itemClick(item) {
        console.log("🚀 ~ itemClick ~ item:", item)
        setShow(true)
        setDetail(item)
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

            const searchKeyword = stx || '없음';
            const cateLabel = cate
                ? (configOptions.boardCategory?.find(x => x?.idx === cate)?.title || '없음')
                : '없음';

            const statusLabel = type
                ? (consts.viewStatusConsts?.find(x => x?.idx === type)?.title || '없음')
                : '없음';




            const excelFileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const excelFileExtension = '.xlsx';
            const excelFileName = `커뮤니티관리_${dayjs().format('YYYYMMDD_HHmm')}`;

            // 조건 요약 행 생성
            const conditionRows = [
                ['조건 요약'],
                [`기간: ${period} | 검색어: ${searchKeyword} | 카테고리: ${cateLabel} | 상태: ${statusLabel}`],
                [], // 빈 행
            ];

            // 헤더 행
            const headerRow = [
                "커뮤니티ID",
                "카테고리",
                "제목",
                "내용요약",
                "작성자",
                "좋아요",
                "댓글",
                "작성일",
                "상태"
            ];

            // 데이터 매핑
            let dataList = viewList.map((item, i) => {
                return [
                    item?.idx || '-',
                    configOptions.boardCategory?.find(x => x?.idx === item?.cate)?.title || '-',
                    item?.title || '-',
                    item?.comment || '-',
                    `${item?.user?.name}(${item?.user?.nickname})`,
                    item?.like_count,
                    item?.reply_count,
                    dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm"),
                    consts.viewStatusConsts?.find(x => x?.idx === item?.status)?.title || '-'
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

    useEffect(() => {
        loadData();



    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>커뮤니티 관리</p>
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
                        name="cate"
                        value={cate}
                        setValue={setCate}
                        option={configOptions.boardCategory}
                        placeholder={'카테고리 전체'}
                    />
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="status"
                        value={type}
                        setValue={setType}
                        option={consts.viewStatusConsts}
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
                            <td style={{ width: "5%" }}>커뮤니티ID</td>
                            <td style={{ width: "10%" }}>카테고리</td>
                            <td style={{ width: "50%" }}>제목</td>
                            <td style={{ width: "10%" }}>작성자</td>
                            <td style={{ width: "5%" }}>좋아요</td>
                            <td style={{ width: "5%" }}>댓글</td>
                            <td style={{ width: "10%" }}>작성일</td>
                            <td style={{ width: "5%" }}>상태</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"cs4-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td>{item?.idx}</td>
                            <td>{configOptions.boardCategory?.find(x => x?.idx === item?.cate)?.title || '-'}</td>
                            <td>{item?.title}</td>
                            <td>{item?.user?.name}({item?.user?.nickname})</td>
                            <td>{numFormat(item?.like_count)}</td>
                            <td>{numFormat(item?.reply_count)}</td>
                            <td>{dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                            <td>
                                {item?.status === 1 && <p className='tag_status stop'>노출</p>}
                                {item?.status === 2 && <p className='tag_status delete'>미노출</p>}
                            </td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <BoardInfoBox detail={detail} dataList={dataList} onUpdate={loadData} closeFunc={() => {
                    setShow(false);
                }} />
            }
        </div >
    </div>
}