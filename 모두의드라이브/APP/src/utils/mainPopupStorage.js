import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

const GLOBAL_TODAY_KEY = 'mainPopup_globalHiddenToday';
const GLOBAL_UNTIL_KEY = 'mainPopup_globalHiddenUntil';

export async function setAllHiddenToday() {
    await AsyncStorage.setItem(GLOBAL_TODAY_KEY, dayjs().format('YYYY-MM-DD'));
}

export async function setAllHiddenForOneHour() {
    const until = Date.now() + 60 * 60 * 1000;
    await AsyncStorage.setItem(GLOBAL_UNTIL_KEY, String(until));
}

export async function isAllHiddenToday() {
    const today = dayjs().format('YYYY-MM-DD');
    const val = await AsyncStorage.getItem(GLOBAL_TODAY_KEY);
    return val === today;
}

export async function isAllHidden() {
    const untilVal = await AsyncStorage.getItem(GLOBAL_UNTIL_KEY);
    if (!untilVal) return false;
    const until = Number(untilVal);
    return Number.isFinite(until) && until > Date.now();
}

export async function filterVisiblePopups(popups) {
    if (await isAllHiddenToday()) return [];
    if (await isAllHidden()) return [];
    return popups;
}
