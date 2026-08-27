import { Stack } from 'expo-router';

export default function ChatLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="[roomIdx]" />
            <Stack.Screen name="more/[roomIdx]" />
            <Stack.Screen
                name="members"
                options={{
                    presentation: 'transparentModal',
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}
