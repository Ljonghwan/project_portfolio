import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/config';

export default function SettingsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.white } }} />
    );
}
