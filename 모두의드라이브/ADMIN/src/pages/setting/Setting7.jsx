import { useState, useEffect } from 'react';
import { Card, Switch, Typography, Space, Alert, App as AntApp } from 'antd';
import API from "@/libs/api";

const { Title, Text } = Typography;

export default function Page() {
    const { message } = AntApp.useApp();
    const [enabled, setEnabled] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dataFunc();
    }, []);

    const dataFunc = async () => {
        const { data } = await API.post('/admin/setting/review-bonus', {});
        if (data) {
            setEnabled(data.reviewBonusEnabled !== false);
        }
        setLoaded(true);
    };

    const handleChange = async (checked) => {
        if (saving) return;
        setSaving(true);
        const prev = enabled;
        setEnabled(checked);
        const { error } = await API.post('/admin/setting/review-bonus/save', { enabled: checked ? 1 : 0 });
        setSaving(false);
        if (error) {
            setEnabled(prev);
            message.error('저장에 실패했습니다.');
            return;
        }
        message.success(checked ? '리뷰 500P 증정이 활성화되었습니다.' : '리뷰 500P 증정이 비활성화되었습니다.');
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>리뷰 작성 500P 증정</Title>
            </div>
            <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        type="info"
                        showIcon
                        message="리뷰/매너평가 작성 보상"
                        description={
                            <div>
                                <div>활성화 시 드라이브 후기 / 매너 평가 작성을 완료한 회원에게 무료포인트 500P가 자동 지급됩니다.</div>
                                <div style={{ marginTop: 6 }}>비활성화하면 보상 지급이 즉시 중단되며, 앱 작성 화면의 500P 안내 문구와 완료 팝업도 표시되지 않습니다.</div>
                            </div>
                        }
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Switch
                            checked={enabled}
                            loading={saving || !loaded}
                            onChange={handleChange}
                        />
                        <Text strong>{enabled ? '활성화됨 (지급 중)' : '비활성화됨 (지급 중단)'}</Text>
                    </div>
                </Space>
            </Card>
        </>
    );
}
