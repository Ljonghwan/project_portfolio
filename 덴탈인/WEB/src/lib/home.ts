// 홈 화면 카테고리 칩/탭 라벨(서버 homeCategory 도메인). p2-6 BUG-4.
// 값은 codesHydrate가 /api/codes로 채움(CodesProvider가 첫 렌더에서 동기 hydrate → SSR HTML부터 라벨 존재, pop 0).
// 키 = 홈 칩 식별자(8개 jobType 슬러그 + 'etc'). 아이콘/HOT 리본/라우팅 슬러그/카운트는 front 디자인 자산(page.tsx).
export const HOME_CATEGORY_LABELS: Record<string, string> = {};
