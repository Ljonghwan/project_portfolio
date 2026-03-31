import { useEffect, useState } from "react";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";

import FeedbackInfoBox from "@/components/Box/FeedbackInfoBox";

import Loading from "@/components/Loading";
import consts from "@/libs/consts";

import API from "@/libs/api";
import { toast } from "react-toastify";
import _ from "lodash";

import { numFormat } from "@/libs/utils";

import { useConfig } from '@/store';

export default function Cs4() {

    const { configOptions } = useConfig();

    const [load, setLoad] = useState(true);

    const [stx, setStx] = useState("");
    const [sdate, setsdate] = useState("");
    const [edate, setedate] = useState("");

    const [dataList, setDataList] = useState([]);
    const [viewList, setViewList] = useState([]);

    const [type, setType] = useState("");
    const [cate, setCate] = useState("");

    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    async function loadData() {
        let sender = {};

        setLoad(true);
        const { data, error } = await API.post('/admin/feedback/list', sender);

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

            if (stx &&
                !(
                    String(item?.user?.account) === stx
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

    useEffect(() => {
        loadData()
    }, [])

    return <div className="box">
        {load && <Loading />}
        <div className="page_contain">
            <div className="page_title_box" >
                <p>고객피드백 관리</p>
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

                    <InputSearch
                        className="input_text"
                        type="text"
                        placeholder="회원ID 검색"
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
                        optionNotKey={consts.noticeCategorys}
                        placeholder={'문의 유형 전체'}
                    />
                    <InputSelect
                        style={{ flex: 0.5 }}
                        name="status"
                        value={type}
                        setValue={setType}
                        option={consts.processStatusConsts2}
                        placeholder={'상태'}
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
                            <td style={{ width: "10%" }}>문의ID</td>
                            <td style={{ width: "10%" }}>문의 유형</td>
                            <td style={{ width: "50%" }}>제목</td>
                            <td style={{ width: "10%" }}>회원ID</td>
                            <td style={{ width: "10%" }}>답변여부</td>
                            <td style={{ width: "10%" }}>등록일</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"cs4-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td>{item?.idx}</td>
                            <td>{configOptions?.feedbackOptions?.find(x => x?.idx === item?.cate)?.title}</td>
                            <td>{item?.title}</td>
                            {/* <td>{numFormat(item?.view)}</td> */}
                            <td>{item?.user?.account}</td>
                            <td>
                                <p className={`tag_status ${item?.status === 1 ? 'active' : 'disabled'}`}>{consts.processStatusConsts2?.find(x => x?.idx === item?.status)?.title}</p>
                            </td>
                            <td>{dayjs(item?.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <FeedbackInfoBox detail={detail} dataList={dataList} onUpdate={loadData} closeFunc={() => {
                    setShow(false);
                }} />
            }
        </div >
    </div>
}