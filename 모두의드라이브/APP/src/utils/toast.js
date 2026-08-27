import { Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * 키보드를 닫고 토스트 메시지를 표시한다.
 * @param {'success'|'error'|'info'} type
 * @param {string} text1 - 제목
 * @param {string} [text2] - 부제목 (선택)
 * @param {number} [visibilityTime=2000]
 */
export function showToast(type, text1, text2, visibilityTime = 3000) {
    Keyboard.dismiss();
    Toast.show({
        type,
        text1,
        text2,
        visibilityTime,
    });
}
