import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { Virtuoso, TableVirtuoso } from 'react-virtuoso';
import Zoom from 'react-medium-image-zoom';
import _ from "lodash";
import dayjs from "dayjs";

import { useUser, usePopup, usePopupComponent } from '@/store';

import Empty from "@/components/Empty";
import Loading from "@/components/Loading";

import InputDate from "@/components/InputDate";
import InputSelect from "@/components/InputSelect";
import InputSearch from "@/components/InputSearch";
import ToggleButtons from "@/components/ToggleButtons";

import BoardInfoBox from '@/components/Box/BoardInfoBox';
import ChatInput from "@/components/Chat/ChatInput";

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

import { getProfile, hpHypen, numFormat, useDebounce, useDebouncedTimeout } from "@/libs/utils";

const sorts = [
    { key: 'idx', od: 'desc', label: '최신순' },
    { key: 'createAt', od: 'asc', label: '오래된 순' },
];

export default function Component({
    list = [],
    load,
    style,
    type
}) {

    const { token, mbData, logout } = useUser();
    const { openPopup } = usePopup();
    const { open, openPopupComponent } = usePopupComponent();

    const navigate = useNavigate();
    const location = useLocation();

    const ref = useRef(null);

    // 필터링
    const [sdate, setsdate] = useState('');
    const [edate, setedate] = useState('');

    const [cate, setCate] = useState('');
    const [stx, setStx] = useState('');
    const [sort, setSort] = useState(sorts[0]); // 초기 활성화 버튼

    const [viewlist, setViewlist] = useState([]);

    const debouncedStx = useDebounce(stx, 200);

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
        sdate,
        edate,
        cate,
        sort,
        debouncedStx,
    ]);

    const filterFunc = (item, index) => {
        return (
            (cate ? cate == item?.status : true) &&
            (sdate ? dayjs(item.createAt).isSameOrAfter(dayjs(sdate), 'day') : true) &&
            (edate ? dayjs(item.createAt).isSameOrBefore(dayjs(edate), 'day') : true) &&
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

    const testFunc = async (data) => {
        const sender = {
            files: data
        }
        await API.post('/admin/board/test', sender);
    }

    const linkFunc = (item) => {
        if(!item) return;
        
        openPopupComponent({
            title: '프로필',
            component: <BoardInfoBox selected={item} mode={'pop'} type={type}/>
        })
    }
    
    return (
        <>
            <div className='box' style={style}>
                {/* <div className='box_cate'>
                    {consts.boardCateConsts?.map((x, i) => {
                        return (
                            <p key={i} className={cate === x.idx ? 'active' : ''} onClick={() => setCate(x.idx)}>{x.title}</p>
                        )
                    })}
                </div> 
                
                */}
                {/* <ChatInput submit={testFunc}  />  */}

                <div className='box_container' style={{ paddingBottom: 0 }}>
                    <div className='title_box'>
                        <p className='title'>문의 내역</p>
                    </div>
                    
                    <div className='search_box'>
                        <InputSearch
                            className="input_text"
                            type="text"
                            placeholder="회사명, 담당자, 연락처, 이메일"
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
                            option={consts.boardCateConsts}
                        />
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
                                type === 'subscription' ? (
                                    <tr>
                                        <th className={`s`}>신청 일시</th>
                                        <th className={`s`}>회사명</th>
                                        <th className={`s`}>담당자명</th>
                                        <th className={`s`}>연락처</th>
                                        <th className={`s`}>이메일</th>
                                        <th className={`m`}>필요한 개발 종류</th>
                                        <th className={`s`}>개발 대상</th>
                                        <th className={`m`}>희망 플랜</th>
                                        <th className={`s`}>처리 상태</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className={`s`}>신청 일시</th>
                                        <th className={`s`}>회사명</th>
                                        <th className={`s`}>담당자명</th>
                                        <th className={`s`}>연락처</th>
                                        <th className={`s`}>이메일</th>
                                        <th className={`m`}>신청 서비스</th>
                                        <th className={`s`}>프로젝트 예산</th>
                                        <th className={`s`}>처리 상태</th>
                                    </tr>
                                ) 
                                
                            )}
                            itemContent={(index, item) => (
                                type === 'subscription' ? (
                                    <>
                                        <td>{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</td>
                                        <td>{item?.company}</td>
                                        <td>{item?.name}</td>
                                        <td>{hpHypen(item?.hp)}</td>
                                        <td>{item?.email}</td>
                                        <td>{item?.projects}</td>
                                        <td>{item?.services}</td>
                                        <td>{item?.plan}</td>

                                        <td>
                                            <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                                {item?.status === 1 ? (
                                                    <button className='td_btn type2'>접수</button>
                                                ) : (
                                                    <button className='td_btn type3'>처리완료</button>
                                                )}
                                            </div>
                                            
                                        </td>

                                    </>
                                    
                                ) : (
                                    <>
                                        <td>{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</td>
                                        <td>{item?.company}</td>
                                        <td>{item?.name}</td>
                                        <td>{hpHypen(item?.hp)}</td>
                                        <td>{item?.email}</td>
                                        <td>{item?.services}</td>
                                        <td>{item?.price}</td>

                                        <td>
                                            <div className='flex' style={{ justifyContent: 'center', gap: 8 }}>
                                                {item?.status === 1 ? (
                                                    <button className='td_btn type2'>접수</button>
                                                ) : (
                                                    <button className='td_btn type3'>처리완료</button>
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
                                )
                                
                            )}
                        />

                    </div>

                    {(viewlist?.length < 1 && !load) && (
                        <div className="null_box">
                            <Empty />
                        </div>
                    )}
                    {load && (
                        <Loading style={{ height: 'calc(100% - 270px)', top: 'unset', bottom: 0 }} />
                    )}

                </div>
            </div>
        </>
    )
}
