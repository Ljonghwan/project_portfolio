import { useEffect, useState } from "react";
import dayjs from "dayjs";
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { toast } from 'react-toastify';

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import UserInfoBox from "@/components/Box/UserInfoBox"
import Loading from "@/components/Loading";

import consts from "@/libs/consts";

import { hpHypen } from "@/libs/utils";
import API from "@/libs/api";

export default function Users() {

    const [load, setLoad] = useState(true);

    // 기본값은 최근 7일
    const [sdate, setsdate] = useState(""); // 시작일
    const [edate, setedate] = useState(""); // 종료일

    const [stxType, setStxType] = useState(""); //검색 타입
    const [stx, setStx] = useState(""); // 검색어
    const [statusType, setStatusType] = useState(""); // 상태 타입

    const [userList, setUserList] = useState([])
    const [viewList, setViewList] = useState([])

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    // 데이터 로드
    async function loadData() {
        setLoad(true);

        try {
            const { data, error } = await API.post('/admin/account/list');

            if (error) {
                // toast.error(error?.message);
                setLoad(false);
                return null;
            }

            setUserList(data);
            searchFunc(data);
            return data; // 업데이트된 데이터 반환
        } catch (err) {
            console.error('데이터 로드 오류:', err);
            toast.error('데이터를 불러오는데 실패했습니다.');
            return null;
        } finally {
            setTimeout(() => {
                setLoad(false);
            }, consts.apiDelay)
            
        }
    }

    // 검색 필터
    function filterFunc(data=null) {
        let orList = data ? data : userList;
        const resultList = orList?.filter(item => {
            // 기간 필터 (가입일 기준)
            if (sdate && dayjs(item.createdAt).isBefore(dayjs(sdate), 'day')) return false;
            if (edate && dayjs(item.createdAt).isAfter(dayjs(edate), 'day')) return false;

            // 검색 타입 및 검색어 필터
            if (stxType && stx) {
                const searchValue = stx.toLowerCase();
                switch (Number(stxType)) {
                    case 1: // 회원명
                        if (!String(item.name || '').toLowerCase().includes(searchValue)) return false;
                        break;
                    case 2: // 닉네임
                        if (!String(item.nickname || '').toLowerCase().includes(searchValue)) return false;
                        break;
                    case 3: // 휴대폰번호
                        if (!String(item.hp || '').includes(stx)) return false;
                        break;
                    case 4: // 이메일
                        if (!String(item.company_email || '').toLowerCase().includes(searchValue)) return false;
                        break;
                    case 5: // 회원ID (정확히 일치)
                        if (String(item.account || '') !== stx) return false;
                        break;
                    case 6: // 사업자번호
                        if (!String(item.company_no || '').includes(stx)) return false;
                        break;
                    default:
                        break;
                }
            }

            // 상태 필터
            if (statusType) {
                const status = Number(statusType);
                if (status === 3) { // 탈퇴 (idx: 3 → status: 9)
                    if (item.status !== 9) return false;
                } else {
                    if (item.status !== status) return false;
                }
            }

            return true;
        })

        setViewList(resultList);
    }

   
    function searchFunc(data) {
        console.log('data', data)
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
                    { idx: 1, title: "회원명" },
                    { idx: 2, title: "닉네임" },
                    { idx: 3, title: "휴대폰번호" },
                    { idx: 4, title: "이메일" },
                    { idx: 5, title: "회원ID" },
                    { idx: 6, title: "사업자번호" }
                ].find(opt => opt.idx === stxType || opt.idx === Number(stxType))?.title || '없음')
                : '없음';

            const searchKeyword = stx || '없음';

            const statusLabel = statusType
                ? ([
                    { idx: 1, title: "정상" },
                    { idx: 2, title: "이용정지" },
                    { idx: 9, title: "탈퇴" }
                ].find(opt => opt.idx === statusType || opt.idx === Number(statusType))?.title || '없음')
                : '없음';

            // 데이터 매핑
            let dataList = viewList.map((item, i) => {
                return {
                    회원ID: item?.account || '-',
                    회원명: item?.name || '-',
                    닉네임: item?.nickname || '-',
                    회원유형: item?.level === 1 ? '일반' : item?.level === 2 ? '프리미엄' : '-',
                    휴대폰번호: item?.hp || '-',
                    인증연동: '-', // 실제 데이터에 맞게 수정 필요
                    매장수: item?.storeCount || 0,
                    상태: item?.status === 1 ? '정상' : item?.status === 2 ? '정지' : item?.status === 9 ? '탈퇴' : '-',
                    가입일시: dayjs(item?.createdAt).format('YYYY-MM-DD HH:mm:ss')
                }
            });

            const excelFileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const excelFileExtension = '.xlsx';
            const excelFileName = `회원관리_${dayjs().format('YYYYMMDD_HHmm')}`;

            // 조건 요약 행 생성
            const conditionRows = [
                ['조건 요약'],
                [`기간: ${period} | 검색타입: ${searchTypeLabel} | 검색어: ${searchKeyword} | 상태: ${statusLabel}`],
                [], // 빈 행
            ];

            // 헤더 행
            const headerRow = [
                "회원ID",
                "회원명",
                "닉네임",
                "회원유형",
                "휴대폰번호",
                "인증/연동",
                "매장수",
                "상태",
                "가입일시"
            ];

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
                        [
                            item?.회원ID,
                            item?.회원명,
                            item?.닉네임,
                            item?.회원유형,
                            item?.휴대폰번호,
                            item?.인증연동,
                            item?.매장수,
                            item?.상태,
                            item?.가입일시,
                        ]
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
        console.log(item);
        setShow(true)
    }

    useEffect(() => {
        loadData()
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>회원 관리</p>
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
                            { idx: 1, title: "회원명" },
                            { idx: 2, title: "닉네임" },
                            { idx: 3, title: "휴대폰번호" },
                            { idx: 4, title: "이메일" },
                            { idx: 5, title: "회원ID" }, // 정확히 일치
                            // { idx: 6, title: "사업자번호" }
                        ]}
                        placeholder={"검색 타입"}
                    />

                    <InputSearch
                        style={{ flex: 1 }}
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
                        name="status"
                        value={statusType}
                        setValue={setStatusType}
                        option={[
                            { idx: 1, title: "정상" },
                            { idx: 2, title: "정지" },
                            { idx: 3, title: "탈퇴" },
                        ]}
                        placeholder={"상태 타입"}
                    />
                    <button className="btn4" style={{ width: 80 }} onClick={() => searchFunc()}>검색</button>
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
                            <td style={{ width: "15%" }}>회원ID</td>
                            <td style={{ width: "10%" }}>회원명</td>
                            <td style={{ width: "10%" }}>닉네임</td>
                            <td style={{ width: "10%" }}>가입유형</td>
                            <td style={{ width: "10%" }}>휴대폰번호</td>
                            <td style={{ width: "10%" }}>매장수</td>
                            <td style={{ width: "10%" }}>상태</td>
                            <td style={{ width: "10%" }}>가입일시</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"usr-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                            setDetail(item);
                        }}>
                            <td>{item?.account}</td>
                            <td>{item?.name}</td>
                            <td>{item?.nickname}</td>
                            <td>{item?.type === 'account' ? '이메일' : item?.type}</td>
                            <td>{item?.hp}</td>
                            <td>{item?.store_count || 0}</td>
                            <td>
                                {item?.status === 1 && <p className='tag_status active'>정상</p>}
                                {item?.status === 2 && <p className='tag_status stop'>정지</p>}
                                {item?.status === 9 && <p className='tag_status delete'>탈퇴</p>}
                            </td>
                            <td>{dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <UserInfoBox
                    detail={detail}
                    closeFunc={() => {
                        setShow(false);
                    }}
                    onUpdate={async () => {
                        const updatedData = await loadData();
                        // 업데이트된 리스트에서 같은 idx의 회원 데이터 찾아서 detail 업데이트
                        if (updatedData) {
                            const updatedUser = updatedData.find(user => user.idx === detail?.idx);
                            if (updatedUser) {
                                setDetail(updatedUser);
                            }
                        }
                    }}
                />
            }
        </div >
    </div>

}