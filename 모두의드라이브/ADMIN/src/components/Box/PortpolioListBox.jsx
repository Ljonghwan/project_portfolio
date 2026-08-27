import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { Virtuoso, TableVirtuoso } from 'react-virtuoso';
import Zoom from 'react-medium-image-zoom';
import _ from "lodash";
import dayjs from "dayjs";

import { useUser, usePopup, usePopupComponent, useConfig } from '@/store';

import Empty from "@/components/Empty";
import Loading from "@/components/Loading";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import ToggleButtons from "@/components/ToggleButtons";

import PortpolioInfoBox from '@/components/Box/PortpolioInfoBox';
import ChatInput from "@/components/Chat/ChatInput";

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

import { getProfile, hpHypen, numFormat, useDebounce, useDebouncedTimeout } from "@/libs/utils";

const sorts = [
    { key: 'idx', od: 'desc', label: '최신순' },
    { key: 'order', od: 'asc', label: '노출순' },
];

export default function Component({
    list = [],
    load,
    style,
    dataFunc=()=>{}
}) {

    const { token, mbData, logout } = useUser();
    const { openPopup } = usePopup();
    const { open, openPopupComponent } = usePopupComponent();
    const { configOptions } = useConfig();

    const navigate = useNavigate();
    const location = useLocation();

    const ref = useRef(null);

    // 상세보기
    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(null);

    // 필터링
    const [cate, setCate] = useState('');
    const [status, setStatus] = useState('');

    const [stx, setStx] = useState('');
    const [sort, setSort] = useState(sorts[0]); // 초기 활성화 버튼

    const [viewlist, setViewlist] = useState([]);

    const debouncedStx = useDebounce(stx, 200);

    // useEffect(() => {
    //     if(!show) dataFunc()
    // }, show);

    useEffect(() => {

        console.log('viewlist', viewlist);

    }, [viewlist])

    useEffect(() => {

        if (list?.length > 0) {
            setViewlist(
                _.orderBy(
                    list?.filter(filterFunc),
                    sort?.key,
                    sort?.od
                )
            )
        } else {
            setViewlist([]);
        }

    }, [
        list,
        cate,
        status,
        sort,
        debouncedStx,
    ]);

    const filterFunc = (item, index) => {
        return (
            (cate ? item?.cate?.includes(cate) : true) &&
            (status ? status == item?.status : true) &&
            (debouncedStx ?
                (
                    item.company?.includes(debouncedStx) ||
                    item.name?.includes(debouncedStx) ||
                    item.hp?.includes(debouncedStx) ||
                    item.email?.includes(debouncedStx)
                ) : true
            )
        )
    }

    const components = {
        TableRow: (props) => {
            return (
                <tr
                    {...props}
                    className='table_tr'
                    onClick={() => {
                        const index = props['data-index']; // Virtuoso가 넣어주는 index
                        console.log('클릭한 row:', viewlist?.[index]);
                        linkFunc(viewlist?.[index]);
                    }}
                    style={{ cursor: 'pointer' }}
                />
            );
        },
    };

    const linkFunc = (item) => {
        // if(!item) return;
        setShow(true);
        setDetail(item);
        return;

        openPopupComponent({
            title: '포트폴리오',
            component: <PortpolioInfoBox selected={item} mode={'pop'} />
        })
    }

    const closeFunc = () => {
        setShow(false);
        setDetail(null); 
        dataFunc();
    }
    
    return (
        <>
            <div className='box' style={style}>
                <div className='box_container' style={{ paddingBottom: 0 }}>
                    <div className='title_box' style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <p className='title'>포트폴리오 내역</p>
                        <button className='add_btn' onClick={() => linkFunc(null)}>등록</button>
                    </div>
                    
                    <div className='search_box'>
                        <InputSearch
                            className="input_text"
                            type="text"
                            placeholder="제목"
                            name="stx"
                            value={stx}
                            setValue={setStx}
                            autoComplete={"one-time-code"}
                        />
                        <InputSelect
                            style={{ flex: 0.5 }}
                            name="cate"
                            value={cate}
                            setValue={setCate}
                            optionNotKey={configOptions?.portpolioOptions}
                            placeholder={"프로젝트 유형"}
                        />
                        <InputSelect
                            style={{ flex: 0.5 }}
                            name="status"
                            value={status}
                            setValue={setStatus}
                            option={consts.viewStatusConsts}
                        />
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
                    </div>

                    <div className='sort_box'>
                        <p>총 {load ? "-" : numFormat(viewlist?.length)}건</p>

                        <ToggleButtons
                            buttons={sorts}
                            value={sort}
                            setValue={setSort}
                        />
                    </div>

                    <div className={`table_scroll ${viewlist?.length < 1 && !load ? 'empty' : ''}`}>
                        <TableVirtuoso
                            ref={ref}
                            components={components}
                            style={{ height: '100%', paddingBottom: 20 }}
                            endReached={() => {
                            }}
                            initialTopMostItemIndex={0}
                            data={viewlist}
                            fixedHeaderContent={(index) => (
                                <tr>
                                    <th className={`s`}>등록 일시</th>
                                    <th className={`s`}>제목</th>
                                    <th className={`s`}>프로젝트 유형</th>
                                    <th className={`s`}>조회수</th>
                                    <th className={`s`}>노출 상태</th>
                                    {/* <th className={`s`}>처리 상태</th> */}
                                </tr>
                            )}
                            itemContent={(index, item) => (
                                <>
                                    <td>{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</td>
                                    <td>{item?.title}</td>
                                    <td>{item?.cate?.toString()}</td>
                                    <td>{numFormat(item?.view)}</td>
                                    {/* <td>{item?.price}</td> */}

                                    <td>
                                        <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                            {item?.status === 1 ? (
                                                <button className='td_btn type2'>노출</button>
                                            ) : (
                                                <button className='td_btn type3'>미노출</button>
                                            )}
                                        </div>
                                        
                                        
                                        {/* <button className='td_btn type2'>수락</button> */}
                                        
                                        {/* <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                            <>
                                                <button className='td_btn type5' onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('거절!!')
                                                 }}>거절</button>
                                                <button className='td_btn type6' onClick={() => { }}>수락</button>
                                            </>
                                        </div> */}
                                    </td>


                                    {/* <td>
                                        <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                            <button className='td_btn type1'>요청중</button>
                                            <button className='td_btn type2'>수락</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                            <button className='td_btn type3'>거절</button>
                                            <button className='td_btn type4'>수락(종료)</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                            <button className='td_btn type5' onClick={() => { cencleFunc(item?.idx) }}>거절</button>
                                            <button className='td_btn type6' onClick={() => { okFunc(item?.idx) }}>수락</button>
                                        </div>
                                    </td> */}

                                </>
                            )}
                        />

                    </div>

                    {(viewlist?.length < 1 && !load) && (
                        <div className="null_box">
                            <Empty />
                        </div>
                    )}
                    {load && (
                        <Loading style={{ height: 'calc(100% - 290px)', top: 'unset', bottom: 0 }} />
                    )}

                </div>
            </div>

            {show &&
                <PortpolioInfoBox detail={detail} setDetail={setDetail} closeFunc={closeFunc} />
            }
        </>
    )
}
