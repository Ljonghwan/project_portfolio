import { useEffect, useState } from "react";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";

import BoardInfoBox from "@/components/Box/BoardInfoBox";

import ReportDetail from "@/components/Popup/ReportDetail";

import Loading from "@/components/Loading";
import consts from "@/libs/consts";

import API from "@/libs/api";
import { toast } from "react-toastify";
import _ from "lodash";

import { numFormat } from "@/libs/utils";


import { useConfig, usePopupComponent } from '@/store';

export default function Cs4() {

    const { configOptions } = useConfig();
    const { openPopupComponent, closePopupComponent } = usePopupComponent();

    const [load, setLoad] = useState(true);

    const [stx, setStx] = useState("");
    const [sdate, setsdate] = useState("");
    const [edate, setedate] = useState("");
    const [type, setType] = useState("");
    const [status, setStatus] = useState("");

    const [dataList, setDataList] = useState([]);
    const [viewList, setViewList] = useState([]);

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    async function loadData() {
        
        let sender = {};
        const { data, error } = await API.post('/admin/content/report', sender);

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

            if (type && item?.type != type) return false;
            if (status && item?.status != status) return false;

            return true;
        })

        setViewList(resultList);
    }

    function searchFunc(data) {
        filterFunc(data);
    }

    // 테이블 아이템 클릭
    function itemClick(item) {
        openPopupComponent({
            component: <ReportDetail
                item={item}
                onClose={closePopupComponent}
                onUpdate={() => { loadData() }}
            />
        })
    }


    useEffect(() => {
        loadData()
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>신고 관리</p>
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
                        name="type"
                        value={type}
                        setValue={setType}
                        option={consts.targetTypeConsts.map(x => ({ ...x, title: x?.title + ' 신고' }))}
                        placeholder={'유형 선택'}
                    />
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="status"
                        value={status}
                        setValue={setStatus}
                        option={consts.processStatusConsts}
                        placeholder={'상태 선택'}
                    />
                    <button className="btn4" style={{ width: 128 }} onClick={() => { searchFunc() }}>검색</button>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="mt_20">
                <div className="title_12">
                    총 <span className="color_FF5B06">{viewList.length}</span>건
                </div>
            </div>

            <div className="mt_20" style={{ height: "100%" }}>
                <DataTable
                    datas={viewList}
                    header={() => {
                        return <>
                            <td style={{ width: "20%" }}>신고ID</td>
                            <td style={{ width: "20%" }}>신고유형</td>
                            <td style={{ width: "20%" }}>신고자</td>
                            <td style={{ width: "20%" }}>신고대상</td>
                            <td style={{ width: "10%" }}>상태</td>
                            <td style={{ width: "10%" }}>작성일</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"cs4-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td>{item?.idx}</td>
                            <td>{consts.targetTypeConsts?.find(x => x?.idx === item?.type)?.title + " 신고"}</td>
                            <td>{item?.user?.name}({item?.user?.nickname})</td>
                            <td>{item?.type === 1 ? "P-" : 'C-'}{item?.target_idx}</td>
                            <td>
                                {item?.status === 1 && <p className='tag_status active'>접수</p>}
                                {item?.status === 2 && <p className='tag_status stop'>완료</p>}
                            </td>
                            <td>{dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")}</td>
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