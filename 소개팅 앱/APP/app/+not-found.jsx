import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import routes from '@/libs/routes';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: '페이지를 찾을 수 없음' }} />
            <View style={styles.container}>
                <Text style={styles.title}>404</Text>
                <Text style={styles.text}>페이지를 찾을 수 없습니다.</Text>
                <Link href={routes.tabs} style={styles.link} replace>
                    홈으로 돌아가기
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 18,
        marginVertical: 10,
    },
    link: {
        marginTop: 20,
        color: '#007AFF',
        fontSize: 16,
    },
});