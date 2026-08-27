import { useEffect, useState } from "react";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";
import { usePopupComponent } from "@/store";
import AdminDetail from "@/components/Popup/AdminDetail";

import API from "@/libs/api";
import consts from "@/libs/consts";

import { toast } from "react-toastify";
import Loading from "@/components/Loading";

export default function Service2() {

    const { openPopupComponent, closePopupComponent } = usePopupComponent();

    const [load, setLoad] = useState(true);

    const [sdate, setsdate] = useState(""); // 시작일
    const [edate, setedate] = useState(""); // 종료일

    const [stxType, setStxType] = useState(1); //검색 타입
    const [stx, setStx] = useState(""); // 검색어
    const [statusType, setStatusType] = useState(""); // 상태 타입
    const [authType, setAuthType] = useState(""); // 권한 타입

    const [orgList, setOrgList] = useState([])
    const [viewList, setViewList] = useState([])

    const [authList, setAuthList] = useState([]);

    async function loadAuth() {
        const { data, error } = await API.post('/admin/admin/authList', {});
        setAuthList(data);
    }
    // 데이터 로드
    async function loadData() {
        let sender = {};
        setLoad(true);
        const { data, error } = await API.post('/admin/admin/list', sender);

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
    function filterFunc(stx, stxType, statusType, data) {
        let orList = data ? data : orgList;
        const resultList = orList.filter(item => {
            if ((stx && stxType == 1) && !String(item?.name).includes(stx)) return false;

            if ((stx && stxType == 2) && !String(item?.email).includes(stx)) return false;

            if (statusType && item?.status != statusType) return false;

            if (authType && item?.auth_idx != authType) return false;

            return true;
        })

        setViewList(resultList);
    }

    // 검색 클릭
    function searchFunc(data) {
        filterFunc(stx, stxType, statusType, data);
    }

    async function itemClick(item) {
        // const { data, error } = await API.post('/admin/admin/authList', {});

        openPopupComponent({
            component: <AdminDetail
                detail={item}
                authList={authList || []}
                onClose={closePopupComponent}
                onUpdate={() => { loadData() }}
            />
        })
    }

    useEffect(() => {
        loadAuth();
        loadData();
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>계정관리</p>
            </div>

            <div className="page_search_box mt_20">
                <div style={{ width: "100%" }}>
                    {/* <InputDate
                        placeholder="시작날짜"
                        placeholderEnd="종료날짜"
                        name="ipd1"
                        dateValue={sdate}
                        setDateValue={setsdate}
                        dateValueEnd={edate}
                        setDateValueEnd={setedate}
                        multiple={true}
                    /> */}
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="cate"
                        value={stxType}
                        setValue={setStxType}
                        option={[
                            { idx: 1, title: "이름" },
                            { idx: 2, title: "ID" },
                        ]}
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
                        option={[
                            { idx: "Y", title: "Y" },
                            { idx: "N", title: "N" },
                        ]}
                        placeholder={"상태 선택"}
                    />
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="auth_status"
                        value={authType}
                        setValue={setAuthType}
                        option={authList?.map(auth => {
                            return { idx: auth?.idx, title: auth?.name }
                        })}
                        placeholder={"권한 선택"}
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
                }}>계정등록</button>
            </div>

            <div className="mt_20" style={{ height: "100%" }}>
                <DataTable
                    datas={viewList}
                    header={() => {
                        return <>
                            <td style={{ width: "10%" }}>NO</td>
                            <td style={{ width: "20%" }}>이름</td>
                            <td style={{ width: "20%" }}>ID</td>
                            <td style={{ width: "20%" }}>사용여부</td>
                            <td style={{ width: "20%" }}>권한</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"usr-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td>{item?.idx}</td>
                            <td>{item?.name}</td>
                            <td>{item?.email}</td>
                            <td>{item?.status === 1 ? "Y" : "N"}</td>
                            <td>{item?.auth?.name}</td>
                        </tr>
                    }}
                />
            </div>
        </div >
    </div>
}