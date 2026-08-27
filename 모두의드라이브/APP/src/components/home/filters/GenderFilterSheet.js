import OptionGrid from './OptionGrid';
import useConfigStore from '../../../store/configStore';

/**
 * 성별 필터 본문 — 통합 FilterBottomSheet 내부에서 렌더된다.
 */
export default function GenderFilterBody({ value, onChange }) {
    const filterGenders = useConfigStore((s) => s.filterGenders);
    // '무관(any)' 옵션은 "전체 = 선택 해제"와 동일하므로 UI 에서 제외한다.
    const options = (filterGenders || [])
        .filter((g) => g.key !== 'any')
        .map((g) => ({ key: g.key, label: g.label }));

    return (
        <OptionGrid
            guideText="성별을 선택해 주세요."
            options={options}
            value={value}
            onChange={onChange}
        />
    );
}
