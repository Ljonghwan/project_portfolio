import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/config';

export default function PointLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.white } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="charge" />
            <Stack.Screen name="refund" />
            <Stack.Screen name="payment" />
        </Stack>
    );
}
