import OptionGrid from './OptionGrid';
import useConfigStore from '../../../store/configStore';

/**
 * 나이 필터 본문 — 통합 FilterBottomSheet 내부에서 렌더된다.
 */
export default function AgeFilterBody({ value, onChange }) {
    const filterAges = useConfigStore((s) => s.filterAges);
    // '무관(any)' 옵션은 "전체 = 선택 해제"와 동일하므로 UI 에서 제외한다.
    const options = (filterAges || [])
        .filter((a) => a.key !== 'any')
        .map((a) => ({ key: a.key, label: a.label }));

    return (
        <OptionGrid
            guideText="나이를 선택해 주세요."
            options={options}
            value={value}
            onChange={onChange}
        />
    );
}
