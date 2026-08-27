import { useState, useEffect } from 'react';
import { Card, Switch, Typography, Space, Alert, App as AntApp } from 'antd';
import API from "@/libs/api";

const { Title, Text } = Typography;

export default function Page() {
    const { message } = AntApp.useApp();
    const [enabled, setEnabled] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dataFunc();
    }, []);

    const dataFunc = async () => {
        const { data } = await API.post('/admin/setting/dev-login', {});
        if (data) {
            setEnabled(!!data.devLoginEnabled);
        }
        setLoaded(true);
    };

    const handleChange = async (checked) => {
        if (saving) return;
        setSaving(true);
        const prev = enabled;
        setEnabled(checked);
        const { error } = await API.post('/admin/setting/dev-login/save', { enabled: checked ? 1 : 0 });
        setSaving(false);
        if (error) {
            setEnabled(prev);
            message.error('저장에 실패했습니다.');
            return;
        }
        message.success(checked ? 'DEV 로그인이 활성화되었습니다.' : 'DEV 로그인이 비활성화되었습니다.');
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>DEV 로그인</Title>
            </div>
            <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        type="warning"
                        showIcon
                        message="라이브 검수 전용 토글"
                        description={
                            <div>
                                <div>활성화 시 라이브 앱 시작 화면 하단에 "DEV 로그인" 버튼이 노출되어 테스트 계정으로 즉시 로그인할 수 있습니다.</div>
                                <div style={{ marginTop: 6 }}>외부 노출 위험이 있으므로 <b>검수 종료 후 반드시 비활성화</b>해야 합니다.</div>
                                <div style={{ marginTop: 6 }}>테스트 계정(userIdx: 1,2,3,4,5,6)이 라이브 DB에 존재해야 동작합니다. 없는 계정은 별도 가입 필요.</div>
                            </div>
                        }
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Switch
                            checked={enabled}
                            loading={saving || !loaded}
                            onChange={handleChange}
                        />
                        <Text strong>{enabled ? '활성화됨 (라이브 노출 중)' : '비활성화됨'}</Text>
                    </div>
                </Space>
            </Card>
        </>
    );
}
