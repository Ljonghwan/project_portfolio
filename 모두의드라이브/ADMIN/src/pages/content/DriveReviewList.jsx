import { useState } from 'react';
import { Card, Table, Button, Space, Typography, App as AntApp } from 'antd';
import API from "@/libs/api";
import { useAllData } from '@/hooks/useListPage';
import { noColumn, dateColumn } from '@/hooks/columnHelpers';

const { Title } = Typography;

const LIMIT = 20;

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [page, setPage] = useState(1);

    const { allData, loading, reload } = useAllData({
        url: '/admin/content/drive-review/list',
        params: {},
        deps: ['drive_review'],
    });

    const totalCount = allData.length;
    const pagedData = allData.slice((page - 1) * LIMIT, page * LIMIT);

    const handleDelete = (idx) => {
        modal.confirm({
            title: '삭제',
            content: '이 후기를 삭제하시겠습니까?',
            okText: '삭제',
            okButtonProps: { danger: true },
            cancelText: '취소',
            onOk: async () => {
                const { error } = await API.post('/admin/content/drive-review/delete', { idx });
                if (!error) {
                    message.success('삭제되었습니다.');
                    reload();
                }
            },
        });
    };

    const columns = [
        noColumn({ totalCount, page, limit: LIMIT }),
        {
            title: '작성자',
            width: 140,
            render: (_, r) => r.authorName || r.authorNickname || '-',
        },
        {
            title: '내용',
            ellipsis: true,
            render: (_, r) => {
                const c = r.content || '';
                return c.length > 40 ? c.slice(0, 40) + '...' : c || '-';
            },
        },
        {
            title: '코스수',
            dataIndex: 'courseCount',
            width: 90,
            align: 'center',
            render: (v) => v || 0,
        },
        {
            title: '사진수',
            dataIndex: 'photoCount',
            width: 90,
            align: 'center',
            render: (v) => v || 0,
        },
        dateColumn('등록일', 'createdAt', { format: 'YYYY-MM-DD', width: 120 }),
        {
            title: '관리',
            width: 80,
            align: 'center',
            render: (_, r) => (
                <Button size="small" danger onClick={() => handleDelete(r.idx)}>삭제</Button>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>드라이브 후기 목록</Title>
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
