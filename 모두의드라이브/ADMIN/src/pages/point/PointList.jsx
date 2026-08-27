import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

import routes from "@/libs/routes";
import API from "@/libs/api";
import { usePopup, useConfigLabelMap, useConfigSelect } from '@/store';

export default function Page() {

    const navigate = useNavigate();
    const { openPopup } = usePopup();
    const pointTypeLabelMap = useConfigLabelMap('pointTypes');
    const pointTypeOptions = useConfigSelect('pointTypes');

    const [list, setList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(() => history.state?.page || 1);
    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dataFunc();
        history.replaceState({ ...history.state, page }, '');
    }, [page, type, reason])

    const dataFunc = async () => {
        setLoading(true);
        const [{ data }] = await Promise.all([
            API.post('/admin/point/list', { page, limit: 20, type, reason, keyword }),
            new Promise(r => setTimeout(r, 1000)),
        ]);
        setList(data?.list || []);
        setTotalCount(data?.totalCount || 0);
        setLoading(false);
    }

    const searchFunc = () => {
        if (page === 1) {
            dataFunc();
        } else {
            setPage(1);
        }
    }

    return (
        <>
            <div className='page_title'>
                <h2>포인트 내역</h2>
                <span className='count'>총 {totalCount}건</span>
            </div>

            <div className='search_box'>
                <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
                    <option value="">전체 유형</option>
                    {pointTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <input type="text" placeholder="회원명/닉네임 검색" value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchFunc()}
                />
                <button className='btn_search' onClick={searchFunc}>검색</button>
            </div>

            <div className='table_wrap'>
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>회원</th>
                            <th>유형</th>
                            <th>사유</th>
                            <th>금액</th>
                            <th>잔액</th>
                            <th>일시</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={7} className='empty'>로딩중...</td></tr>
                        )}
                        {!loading && list.length === 0 && (
                            <tr><td colSpan={7} className='empty'>데이터가 없습니다.</td></tr>
                        )}
                        {!loading && list.map((item, i) => (
                            <tr key={item.idx}>
                                <td>{totalCount - ((page - 1) * 20) - i}</td>
                                <td>{item.nickname || item.name}</td>
                                <td><span className={`badge ${item.type}`}>{pointTypeLabelMap[item.type] || item.type}</span></td>
                                <td>{item.reason}</td>
                                <td className={['earn', 'charge', 'refund'].includes(item.type) ? 'plus' : 'minus'}>
                                    {['earn', 'charge', 'refund'].includes(item.type) ? '+' : '-'}{(item.amount || 0).toLocaleString()}P
                                </td>
                                <td>{(item.balanceAfter || 0).toLocaleString()}P</td>
                                <td>{item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalCount > 20 && (
                <div className='pagination'>
                    {Array.from({ length: Math.ceil(totalCount / 20) }, (_, i) => (
                        <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
                    ))}
                </div>
            )}
        </>
    )
}
