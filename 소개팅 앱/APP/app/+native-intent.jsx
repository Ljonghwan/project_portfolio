// app/+native-intent.tsx
export function redirectSystemPath({ path, initial }) {
    // 네이버 로그인 콜백은 무시 (라우팅 안 함)
    if (path.includes('thirdPartyLoginResult')) {
        return null;
    }

    return path;
}