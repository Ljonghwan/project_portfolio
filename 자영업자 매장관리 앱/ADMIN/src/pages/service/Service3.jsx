import { useEffect, useState } from "react";

import InputDate from "@/components/InputDate";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";
import AuthInfoBox from "@/components/Box/AuthInfoBox";

import API from "@/libs/api";
import consts from "@/libs/consts";

import { toast } from "react-toastify";
import Loading from "@/components/Loading";

export default function Service3() {

    const [load, setLoad] = useState(true);
    // 기본값은 최근 7일
    const [sdate, setsdate] = useState(""); // 시작일
    const [edate, setedate] = useState(""); // 종료일

    const [stx, setStx] = useState(""); // 검색어

    const [orgList, setOrgList] = useState([])
    const [viewList, setViewList] = useState([])

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    // 데이터 로드
    async function loadData() {
        let sender = {};
        setLoad(true);
        const { data, error } = await API.post('/admin/auth/list', sender);

        setTimeout(() => {
            setLoad(false);
            if (error) {
                // toast.error(error?.message)
                return;
            }

            setOrgList(data);
            searchFunc(data)

        }, consts.apiDelay)

    }

    // 검색 필터
    function filterFunc(data) {
        let orList = data ? data : orgList;
        const resultList = orList?.filter(item => {
            if (sdate && dayjs(item?.createdAt).diff(dayjs(sdate + "00:00:00"), "second") < 0) {
                return false
            }

            if (edate && dayjs(item?.createdAt).diff(dayjs(edate + "23:59:59"), "second") > 0) {
                return false
            }
            console.log(String(item?.desc).includes(stx))
            if (stx &&
                !(
                    String(item?.name).includes(stx) ||
                    String(item?.desc).includes(stx)
                )
            ) return false;

            return true;
        })

        setViewList(resultList);
    }

    // 검색 클릭
    function searchFunc(data) {
        filterFunc(data);
    }

    // 테이블 아이템 클릭
    function itemClick(item) {
        setShow(true);
        setDetail(item);
    }

    useEffect(() => {
        loadData()
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">

            <div className="page_title_box" >
                <p>권한관리</p>
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

                    <button className="btn4" style={{ width: 128 }} onClick={() => {
                        searchFunc();
                    }}>검색</button>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="mt_20">
                <div className="title_12">
                    총 <span className="color_FF5B06">{viewList.length}</span>건
                </div>
                <button className="btn4" style={{ height: 36 }} onClick={() => {
                    itemClick();
                }}>권한등록</button>
            </div>

            <div className="mt_20" style={{ height: "100%" }}>
                <DataTable
                    datas={viewList}
                    header={() => {
                        return <>
                            <td style={{ width: "10%" }}>NO</td>
                            <td style={{ width: "20%" }}>권한명</td>
                            <td style={{ width: "20%" }}>설명</td>
                            <td style={{ width: "20%" }}>부여인원</td>
                            <td style={{ width: "20%" }}>생성일</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"usr-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td style={{ width: "10%" }}>{viewList.length - index}</td>
                            <td style={{ width: "20%" }}>{item?.name}</td>
                            <td style={{ width: "20%" }}>{item?.desc}</td>
                            <td style={{ width: "20%" }}>{item?.userlist?.length}</td>
                            <td style={{ width: "20%" }}>{dayjs(item?.createdAt).format("YYYY-MM-DD")}</td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <AuthInfoBox detail={detail} onUpdate={loadData} closeFunc={() => {
                    setShow(false);
                }} />
            }
        </div >
    </div>

}