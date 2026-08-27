import OptionGrid from './OptionGrid';
import useConfigStore from '../../../store/configStore';

/**
 * 차종 필터 본문 — 통합 FilterBottomSheet 내부에서 렌더된다.
 */
export default function CarTypeFilterBody({ value, onChange }) {
    const carTypes = useConfigStore((s) => s.carTypes);
    const options = (carTypes || []).map((c) => ({ key: c.key, label: c.label }));

    return (
        <OptionGrid
            guideText="차종을 선택해 주세요."
            options={options}
            value={value}
            onChange={onChange}
        />
    );
}
