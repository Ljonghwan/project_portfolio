import { useState } from 'react';
import { Card, Table, Typography } from 'antd';
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title } = Typography;

const LIMIT = 20;

export default function Page() {
    const [page, setPage] = useState(1);

    const { allData, loading } = useAllData({
        url: '/admin/content/block/list',
        params: {},
        deps: ['block'],
    });

    const totalCount = allData.length;
    const pagedData = allData.slice((page - 1) * LIMIT, page * LIMIT);

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '차단자',
            render: (_, r) => r.blockerName || r.blockerNickname || '-',
        },
        {
            title: '피차단자',
            render: (_, r) => r.blockedName || r.blockedNickname || '-',
        },
        dateColumn('등록일', 'createdAt', { format: 'YYYY-MM-DD' }),
    ];

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>차단 목록</Title>
            </div>
            <Card>
                <Table
                    columns={columns}
                    dataSource={pagedData}
                    rowKey="idx"
                    loading={loading}
                    locale={{ emptyText: '데이터가 없습니다' }}
                    pagination={{
                        current: page,
                        total: totalCount,
                        pageSize: LIMIT,
                        onChange: (p) => setPage(p),
                        showSizeChanger: false,
                    }}
                />
            </Card>
        </>
    );
}
