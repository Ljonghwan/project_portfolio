import { useEffect, useState } from "react";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import DataTable from "@/components/DataTable";
import dayjs from "dayjs";

import EventInfoBox from "@/components/Box/EventInfoBox";

import Loading from "@/components/Loading";
import consts from "@/libs/consts";

import API from "@/libs/api";
import { toast } from "react-toastify";
import Zoom from 'react-medium-image-zoom';
import _ from "lodash";

import { numFormat } from "@/libs/utils";

export default function Cs4() {

    const [load, setLoad] = useState(true);

    const [stx, setStx] = useState("");
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
        const { data, error } = await API.post('/admin/event/list', sender);

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
            if (sdate && dayjs(item?.updatedAt).diff(dayjs(sdate + "00:00:00"), "second") < 0) {
                return false
            }

            if (edate && dayjs(item?.updatedAt).diff(dayjs(edate + "23:59:59"), "second") > 0) {
                return false
            }

            if (stx &&
                !(
                    String(item?.title).includes(stx)
                )
            ) return false

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
                <p>이벤트 템플릿 관리</p>
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
                <button className="btn4" style={{ height: 36 }} onClick={() => {
                    itemClick();
                }}>템플릿 등록</button>
            </div>

            <div className="mt_20" style={{ height: "100%" }}>
                <DataTable
                    datas={viewList}
                    header={() => {
                        return <>
                            <td style={{ width: "20%" }}>배경 이미지</td>
                            <td style={{ width: "50%" }}>템플릿명</td>
                            <td style={{ width: "20%" }}>등록(수정)일</td>
                            <td style={{ width: "10%" }}>상태</td>
                        </>
                    }}
                    body={(item, index) => {
                        return <tr key={"cs4-ti" + index} className="hand" onClick={() => {
                            itemClick(item);
                        }}>
                            <td>
                                <img src={consts.s3Url + item?.image} style={{ width: 150, aspectRatio: 1, borderRadius: 8, objectFit: 'cover' }}/>
                            </td>
                            <td>{item?.title}</td>
                            
                            <td>{dayjs(item?.updatedAt).format("YYYY-MM-DD HH:mm")}</td>
                            <td>
                                {item?.status === 1 && <p className='tag_status stop'>노출</p>}
                                {item?.status === 2 && <p className='tag_status delete'>미노출</p>}
                            </td>
                        </tr>
                    }}
                />
            </div>

            {show &&
                <EventInfoBox detail={detail} dataList={dataList} onUpdate={loadData} closeFunc={() => {
                    setShow(false);
                }} />
            }
        </div >
    </div>
}