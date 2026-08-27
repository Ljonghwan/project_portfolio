import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** 업로드 기준 너비. 이보다 좁은 원본은 축소하지 않는다 (업스케일 금지).
 *  서버 `saveImage` 가 resize 미지정 시 1024 로 깎으므로(`server/service/utils.js`) 값을 맞춰 둔다 —
 *  더 크게 올려봐야 저장 화질은 같고 전송량만 늘어난다. */
const MAX_WIDTH = 1024;
const QUALITY = 0.9;

/**
 * 업로드 전 이미지 1장을 리사이즈·압축한다.
 *
 * - **리사이즈는 너비 MAX_WIDTH 초과일 때만, 압축(JPEG 재인코딩)은 항상** 수행한다.
 *   ≤MAX_WIDTH 를 조기 반환하면 호출부의 `quality: 1` 무압축 원본이 그대로 올라가
 *   오히려 용량이 커진다 (1000x1000 실측 4.19배).
 * - **결과가 원본보다 크면 원본을 그대로 보낸다** — 축소한 경우도 포함. 최종 저장
 *   해상도는 서버가 보장하므로 앱은 바이트가 작은 쪽만 고르면 된다.
 * - 실패하면 원본을 그대로 반환한다 — 리사이즈 때문에 업로드가 죽으면 안 된다
 * - 반환 base64 는 **raw** (data URI prefix 없음). 호출부가 각자 prefix 를 붙이는
 *   기존 계약을 그대로 유지한다 — 여기서 붙이면 서버 saveImage 가 무음 실패한다
 *
 * @param {{uri: string, base64?: string, width?: number, height?: number, mimeType?: string}} asset
 *        expo-image-picker 의 asset (또는 같은 모양의 객체)
 * @returns {Promise<typeof asset>} 같은 모양의 객체. 리사이즈됐으면 JPEG 로 교체된 값
 */
export async function resizeForUpload(asset) {
    if (!asset?.uri) return asset;
    try {
        const context = ImageManipulator.manipulate(asset.uri);
        // ImageManipulator 는 업스케일도 실제로 수행한다 — 초과분만 줄인다
        if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
        const image = await context.renderAsync();
        const result = await image.saveAsync({
            format: SaveFormat.JPEG,
            compress: QUALITY,
            base64: true,
        });
        // base64 가 비면 서버가 "사진 없음"으로 거절한다 — 그럴 바엔 원본을 쓴다
        if (!result?.base64) return asset;
        // 결과가 원본보다 크면 원본을 쓴다 — 축소 여부와 무관하게 항상.
        // 최종 저장 해상도는 서버가 보장하므로(원본이 더 크면 서버가 깎는다) 여기서는
        // 바이트가 작은 쪽이 언제나 이득이고, 재인코딩이 1회 줄어 화질도 유리하다.
        // (이미 강하게 압축된 원본을 compress 0.9 로 다시 구우면 커진다 — 1080폭 q0.70 실측 +20%)
        if (asset.base64 && result.base64.length >= asset.base64.length) return asset;
        return {
            ...asset,
            uri: result.uri,
            base64: result.base64,
            width: result.width,
            height: result.height,
            mimeType: 'image/jpeg',
        };
    } catch {
        return asset;
    }
}

// 검증용 훅 — __DEV__ 빌드에서만 전역에 붙는다 (릴리스 번들에서는 통째로 제거됨).
// Metro 디버거에서 `__imageUtil.resizeForUpload({uri, width, height})` 로 호출해
// 반환 base64 길이(=업로드 용량)를 직접 잰다. analytics.js 의 `__analytics` 와 같은 패턴.
if (__DEV__) {
    global.__imageUtil = { resizeForUpload, MAX_WIDTH, QUALITY };
}
