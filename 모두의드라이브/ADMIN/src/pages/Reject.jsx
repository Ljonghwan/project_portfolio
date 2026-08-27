import { Result } from 'antd';

export default function Page() {
    return (
        <Result
            status="403"
            title="접근 권한이 없습니다"
            subTitle="관리자에게 문의해주세요."
        />
    );
}
