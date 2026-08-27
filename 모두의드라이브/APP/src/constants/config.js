// 라이브 환경 (TestFlight / Android Release 빌드 시 자동 적용)
// * 포트폴리오 공개용: 실제 주소는 비공개 처리
const LIVE_API_URL = process.env.EXPO_PUBLIC_API_URL;
const LIVE_STORAGE_URL = process.env.EXPO_PUBLIC_STORAGE_URL;

// 로컬 개발 환경
const DEV_API_URL = process.env.EXPO_PUBLIC_DEV_API_URL;

// 개발 빌드는 개발 API(개발서버 DB)를 본다 — 라이브 데이터에 쓰기가 남지 않는다.
// 릴리스 빌드는 자동으로 라이브를 보므로 원복을 잊어도 스토어 빌드는 안전하다.
export const API_URL = __DEV__ ? DEV_API_URL : LIVE_API_URL;
export const STORAGE_URL = __DEV__ ? DEV_API_URL : LIVE_STORAGE_URL;

export const COLORS = {
    primary: '#384FEE',
    primaryDark: '#070B25',
    kakao: '#F9E000',
    kakaoText: '#401C26',
    apple: '#000000',
    white: '#FFFFFF',
    black: '#070B25',
    gray: '#999999',
    grayMedium: '#969698',
    lightGray: '#F5F5F5',
    border: '#E0E0E0',
    borderLight: '#EEEEEE',
    error: '#FF3B30',
    success: '#34C759',
    point: '#F64B17',
    background: '#FFFFFF',
    textPrimary: '#070B25',
    textSecondary: '#666666',
    textLight: '#999999',
    splashBg: '#05081A',
    copyrightText: '#969698',
    disabled: '#CCCCCC',
    disabledBtn: '#C5C5CD',
    textMedium: '#686869',
    primaryLight: '#B8C1FF',
    primaryBg: '#EDEFFF',
    primaryMediumDark: '#8E9DFF',
    primaryDeep: '#1F35CD',
    secondary: '#FFC72C',
    safety: '#4FC34F',
    danger: '#FF3232',
    grayF1: '#F1F1F1',
    grayEE: '#EEEEEE',
    grayCC: '#CCCCCC',
    gold: '#EFBF04',
    badge: '#FE6614',
};

export const FONT_SIZE = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
    splash: 32,
    subtitle: 20,
    h4: 16,
};

export const FONTS = {
    jalnan: 'Jalnan',
    thin: 'Pretendard-Thin',
    extraLight: 'Pretendard-ExtraLight',
    light: 'Pretendard-Light',
    regular: 'Pretendard-Regular',
    medium: 'Pretendard-Medium',
    semiBold: 'Pretendard-SemiBold',
    bold: 'Pretendard-Bold',
    extraBold: 'Pretendard-ExtraBold',
    black: 'Pretendard-Black',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    bottom: 60
};
