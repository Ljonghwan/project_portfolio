import dayjs from 'dayjs';
import { Tag } from 'antd';

/**
 * 역순 번호 컬럼 (NO)
 */
export function noColumn({ totalCount, page, limit = 20, width = 60 } = {}) {
    return {
        title: 'NO',
        width,
        align: 'center',
        render: (_, __, i) => totalCount - ((page - 1) * limit) - i,
    };
}

/**
 * 날짜/시간 컬럼
 */
export function dateColumn(title, dataIndex, { width = 170, format = 'YYYY-MM-DD HH:mm' } = {}) {
    return {
        title,
        dataIndex,
        width,
        align: 'center',
        render: (v) => v ? dayjs(v).format(format) : '-',
    };
}

/**
 * 태그 컬럼 (상태 표시)
 */
export function tagColumn(title, dataIndex, labelMap, colorMap = {}, { width = 100 } = {}) {
    return {
        title,
        dataIndex,
        width,
        align: 'center',
        render: (v) => {
            const label = labelMap[v] || v || '-';
            const color = colorMap[v];
            return color ? <Tag color={color}>{label}</Tag> : <Tag>{label}</Tag>;
        },
    };
}

/**
 * 숫자 포맷 컬럼 (포인트, 금액 등)
 */
export function numberColumn(title, dataIndex, { width = 120, suffix = '', color } = {}) {
    return {
        title,
        dataIndex,
        width,
        align: 'right',
        render: (v) => {
            const text = `${(v || 0).toLocaleString()}${suffix}`;
            return color ? <span style={{ color }}>{text}</span> : text;
        },
    };
}

/**
 * 텍스트 컬럼 (기본 — 값이 없으면 '-')
 */
export function textColumn(title, dataIndex, { width, ellipsis = false } = {}) {
    return {
        title,
        dataIndex,
        ...(width && { width }),
        ...(ellipsis && { ellipsis: true }),
        render: (v) => v || '-',
    };
}
