import { useEffect, useState } from "react";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";
import { usePopupComponent, useConfig } from "@/store";

import PopupInfoBox from "@/components/Box/PopupInfoBox";

import API from "@/libs/api";
import consts from "@/libs/consts";
import { getDateStatus } from "@/libs/utils";

import { toast } from "react-toastify";
import Loading from "@/components/Loading";

export default function Service2() {

    const { openPopupComponent, closePopupComponent } = usePopupComponent();
    const { configOptions } = useConfig();

    const [load, setLoad] = useState(true);

    const [sdate, setsdate] = useState(""); // 시작일
    const [edate, setedate] = useState(""); // 종료일

    const [stxType, setStxType] = useState(1); //검색 타입
    const [stx, setStx] = useState(""); // 검색어
    const [statusType, setStatusType] = useState(""); // 상태 타입
    const [authType, setAuthType] = useState(""); // 권한 타입

    const [dataList, setDataList] = useState([]);
    const [viewList, setViewList] = useState([])

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    // 데이터 로드
    async function loadData() {
        let sender = {};
        setLoad(true);
        const { data, error } = await API.post('/admin/popup/list', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                // toast.error(error?.message)
                return;
            }

            setDataList(data);
            searchFunc(data)

        }, consts.apiDelay)

    }

    // 검색 필터
    function filterFunc(stx, stxType, statusType, data) {
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
                    String(item?.title).includes(stx)
                )
            ) return false

            if (statusType && getDateStatus(item?.sdate, item?.edate) != statusType) return false;


            return true;
        })

        setViewList(resultList);
    }

    // 검색 클릭
    function searchFunc(data) {
        filterFunc(stx, stxType, statusType, data);
    }

    async function itemClick(item) {
        console.log("🚀 ~ itemClick ~ item:", item)
        setShow(true)
        setDetail(item);
    }

    useEffect(() => {
        loadData();
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>팝업관리</p>
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
                                searchFunc(null);
                            }
                        }}
                    />
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="status"
                        value={statusType}
                        setValue={setStatusType}
                        option={consts.popupStatusConsts}
                        placeholder={"상태 선택"}
                    />

                    <button className="btn4" style={{ width: 128 }} onClick={() => { searchFunc(null) }}>검색</button>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="mt_20">
                <div className="title_12">
                    총 <span className="color_FF5B06">{viewList.length}</span>건
                </div>
                <button className="btn4" style={{ height: 36 }} onClick={() => {
                    itemClick(null);
                }}>팝업 등록</button>
            </div>

            <div className="mt_20" style={{ height: "100%" }}>
                <DataTable
                    datas={viewList}
                    header={() => {
                        return <>
                            <td style={{ width: "10%" }}>NO</td>
                            <td style={{ width: "30%" }}>제목</td>
                            <td style={{ width: "10%" }}>팝업 유형</td>
                            <td style={{ width: "10%" }}>노출 위치</td>
                            <td style={{ width: "20%" }}>기간</td>
                            <td style={{ width: "10%" }}>상태</td>
                            <td style={{ width: "10%" }}>등록일</td>
                        </>
                    }}
                    body={(item, index) => {
                        let status = getDateStatus(item?.sdate, item?.edate);

                        return <tr key={"usr-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td>{item?.idx}</td>
                            <td>{item?.title}</td>
                            <td>{configOptions.popupType?.find(x => x?.idx === item?.type)?.title || ""}</td>
                            <td>{configOptions.popupTargets?.find(x => x?.idx === item?.target)?.title || ""}</td>
                            <td>{item?.sdate} ~ {item?.edate}</td>
                            <td>
                                {status === 1 && <p className='tag_status active'>대기</p>}
                                {status === 2 && <p className='tag_status stop'>진행</p>}
                                {status === 9 && <p className='tag_status delete'>종료</p>}
                            </td>
                            <td>{dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <PopupInfoBox detail={detail} dataList={dataList} onUpdate={loadData} closeFunc={() => {
                    setShow(false);
                }} />
            }
        </div >
    </div>
}