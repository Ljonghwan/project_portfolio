import { useState, useEffect } from 'react';
import { Card, Button, Typography, Table, App as AntApp } from 'antd';
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import API from "@/libs/api";

const { Title, Text } = Typography;

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(null);

    useEffect(() => {
        fetchList();
    }, []);

    const fetchList = async () => {
        setLoading(true);
        const { data } = await API.post('/admin/reset/list');
        setLoading(false);
        if (data) setProcesses(data);
    };

    const handleReset = (record) => {
        modal.confirm({
            title: `${record.label} 데이터 초기화`,
            icon: <ExclamationCircleFilled />,
            width: 560,
            content: (
                <div>
                    <p style={{ color: '#ff4d4f', fontWeight: 600, marginBottom: 12 }}>
                        이 작업은 되돌릴 수 없습니다.
                    </p>
                    <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                        <p style={{ margin: 0, lineHeight: 1.7 }}>{record.description}</p>
                    </div>
                    <details>
                        <summary style={{ cursor: 'pointer', color: '#888', fontSize: 12 }}>기술 상세 보기 (개발자용)</summary>
                        <div style={{ marginTop: 8 }}>
                            <p style={{ margin: '4px 0', fontSize: 12 }}>삭제 테이블:</p>
                            <div style={{ maxHeight: 160, overflow: 'auto', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                {record.tables.map(t => <div key={t} style={{ fontSize: 11 }}>{t}</div>)}
                            </div>
                            {record.partials?.length > 0 && (
                                <>
                                    <p style={{ margin: '8px 0 4px', fontSize: 12 }}>부분 삭제 (조건부):</p>
                                    <div style={{ background: '#fffbe6', padding: 8, borderRadius: 4 }}>
                                        {record.partials.map(p => <div key={p} style={{ fontSize: 11 }}>{p}</div>)}
                                    </div>
                                </>
                            )}
                            {record.folders.length > 0 && (
                                <>
                                    <p style={{ margin: '8px 0 4px', fontSize: 12 }}>삭제되는 파일 폴더:</p>
                                    <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                        {record.folders.map(f => <div key={f} style={{ fontSize: 11 }}>/uploads/{f}/</div>)}
                                    </div>
                                </>
                            )}
                        </div>
                    </details>
                </div>
            ),
            okText: '초기화 실행',
            okType: 'danger',
            cancelText: '취소',
            onOk: async () => {
                setExecuting(record.key);
                const { data, error } = await API.post('/admin/reset/execute', { processKey: record.key });
                setExecuting(null);
                if (!error && data) {
                    message.success(`${record.label} 데이터가 초기화되었습니다.`);
                }
            },
        });
    };

    const columns = [
        {
            title: '프로세스',
            dataIndex: 'label',
            key: 'label',
            width: 120,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: '설명',
            dataIndex: 'description',
            key: 'description',
            render: (text) => <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{text}</Text>,
        },
        {
            title: '실행',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    loading={executing === record.key}
                    onClick={() => handleReset(record)}
                >
                    초기화
                </Button>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>데이터 초기화</Title>
            </div>
            <Card>
                <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6 }}>
                    <Text type="danger" strong>주의: 초기화된 데이터는 복구할 수 없습니다. 개발/디버깅 용도로만 사용하세요.</Text>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                        각 항목별로 어떤 데이터가 사라지는지 "설명" 컬럼에서 확인한 후 신중하게 실행하세요.
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={processes}
                    rowKey="key"
                    loading={loading}
                    pagination={false}
                />
            </Card>
        </>
    );
}
