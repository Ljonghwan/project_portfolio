import { useState, useEffect } from 'react';
import { Card, Button, Tabs, Typography, Space, App as AntApp } from 'antd';
import API from "@/libs/api";
import TiptapEditor from '@/components/TiptapEditor';

const { Title } = Typography;

const TERM_TABS = [
    { key: '1', label: '이용약관' },
    { key: '2', label: '개인정보처리방침' },
    { key: '3', label: '이벤트 및 마케팅 활용 동의' },
    { key: '4', label: '회원탈퇴약관' },
];

export default function Page() {
    const { message, modal } = AntApp.useApp();
    const [activeTab, setActiveTab] = useState('1');
    const [contents, setContents] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dataFunc();
    }, []);

    const dataFunc = async () => {
        const { data } = await API.post('/admin/setting/term', {});
        if (data) {
            const map = {};
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.type) map[String(item.type)] = item.comment || '';
                });
            }
            setContents(map);
        }
    };

    const handleChange = (value) => {
        setContents(prev => ({ ...prev, [activeTab]: value }));
    };

    const handleCancel = () => {
        dataFunc();
    };

    const handleSave = () => {
        modal.confirm({
            title: '저장',
            content: '저장하시겠습니까?',
            okText: '확인',
            cancelText: '취소',
            onOk: async () => {
                setLoading(true);
                const { error } = await API.post('/admin/setting/terms/save', {
                    type: Number(activeTab),
                    content: contents[activeTab] || '',
                });
                setLoading(false);
                if (!error) {
                    message.success('저장되었습니다.');
                }
            },
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>약관</Title>
            </div>
            <Card>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={TERM_TABS.map(tab => ({
                    key: tab.key,
                    label: tab.label,
                    children: (
                        <TiptapEditor
                            value={contents[tab.key] || ''}
                            onChange={(val) => setContents(prev => ({ ...prev, [tab.key]: val }))}
                            placeholder="내용을 입력해 주세요."
                        />
                    ),
                }))}
            />

            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>취소</Button>
                    <Button type="primary" loading={loading} onClick={handleSave}>저장</Button>
                </Space>
            </div>
        </Card>
        </>
    );
}
