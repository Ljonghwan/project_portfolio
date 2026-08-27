import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import routes from "@/libs/routes";
import API from "@/libs/api";
import { usePopup } from '@/store';

export default function Page() {

    const navigate = useNavigate();
    const { openPopup } = usePopup();

    const [data, setData] = useState(null);

    useEffect(() => {
        dataFunc();
    }, [])

    const dataFunc = async () => {
        const { data: result } = await API.post('/admin/operate/dashboard', {});
        setData(result);
    }

    if (!data) return <div className='loading'>로딩중...</div>;

    return (
        <>
            <div className='page_title'>
                <h2>대시보드</h2>
            </div>

            <div className='stat_grid'>
                <div className='stat_item' onClick={() => navigate(routes.member)} style={{ cursor: 'pointer' }}>
                    <span className='label'>전체회원</span>
                    <span className='value'>{(data.totalMembers || 0).toLocaleString()}명</span>
                </div>
                <div className='stat_item'>
                    <span className='label'>오늘가입</span>
                    <span className='value'>{(data.todaySignups || 0).toLocaleString()}명</span>
                </div>
                <div className='stat_item' onClick={() => navigate(routes.match)} style={{ cursor: 'pointer' }}>
                    <span className='label'>진행중매칭</span>
                    <span className='value'>{(data.activeMatches || 0).toLocaleString()}건</span>
                </div>
                <div className='stat_item' onClick={() => navigate(routes.report)} style={{ cursor: 'pointer' }}>
                    <span className='label'>미처리신고</span>
                    <span className='value'>{(data.pendingReports || 0).toLocaleString()}건</span>
                </div>
                <div className='stat_item' onClick={() => navigate(routes.inquiry)} style={{ cursor: 'pointer' }}>
                    <span className='label'>미답변문의</span>
                    <span className='value'>{(data.pendingInquiries || 0).toLocaleString()}건</span>
                </div>
            </div>
        </>
    )
}
