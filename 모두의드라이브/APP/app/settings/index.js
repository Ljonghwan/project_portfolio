import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import AppHeader from '../../src/components/AppHeader';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const socialIcon = user?.socialType === 'kakao'
        ? require('../../assets/icons/kakao-icon.svg')
        : require('../../assets/icons/apple-icon.svg');

    const phoneDisplay = user?.phone
        ? user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
        : '';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="설정" onBack={() => router.back()} />

            <View style={[styles.content, { paddingBottom: SPACING.xl + insets.bottom }]}>
                {/* 이메일 행 */}
                <View style={styles.emailRow}>
                    <Image source={socialIcon} style={styles.socialIcon} contentFit="contain" />
                    <Text style={styles.emailText} allowFontScaling={false} numberOfLines={1}>
                        {user?.email || ''}
                    </Text>
                </View>

                {/* 메뉴 카드 */}
                <View style={styles.menuCard}>
                    {/* 알림 설정 */}
                    <Pressable testID="settings-menu-notifications" style={styles.menuRow} onPress={() => router.navigate('/settings/notifications')}>
                        <Image source={require('../../assets/icons/settings-bell.svg')} style={styles.menuIcon} contentFit="contain" />
                        <Text style={styles.menuText} allowFontScaling={false}>알림 설정</Text>
                        <Image
                            source={require('../../assets/icons/chevron-right.svg')}
                            style={styles.chevronIcon}
                            tintColor="#C5C5CD"
                        />
                    </Pressable>

                    {/* 휴대폰번호 변경 */}
                    <Pressable testID="settings-menu-change-phone" style={styles.menuRow} onPress={() => router.navigate('/settings/change-phone')}>
                        <Image source={require('../../assets/icons/settings-phone.svg')} style={styles.menuIcon} contentFit="contain" />
                        <Text style={styles.menuText} numberOfLines={1} allowFontScaling={false}>휴대폰번호 변경</Text>
                        {phoneDisplay ? (
                            <Text style={styles.phoneText} numberOfLines={1} allowFontScaling={false}>{phoneDisplay}</Text>
                        ) : null}
                        <Image
                            source={require('../../assets/icons/chevron-right.svg')}
                            style={styles.chevronIcon}
                            tintColor="#C5C5CD"
                        />
                    </Pressable>

                    {/* 회원 탈퇴 */}
                    <Pressable testID="settings-menu-withdraw" style={styles.menuRow} onPress={() => router.navigate('/settings/withdraw-terms')}>
                        <Image source={require('../../assets/icons/settings-exit.svg')} style={styles.menuIcon} contentFit="contain" />
                        <Text style={styles.menuText} allowFontScaling={false}>회원 탈퇴</Text>
                        <Image
                            source={require('../../assets/icons/chevron-right.svg')}
                            style={styles.chevronIcon}
                            tintColor="#C5C5CD"
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
        gap: SPACING.xl,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    socialIcon: {
        width: 20,
        height: 20,
    },
    emailText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 24,
        gap: 32,
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4 },
        }),
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    menuIcon: {
        width: 24,
        height: 24,
    },
    menuText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    chevronIcon: {
        width: 24,
        height: 24,
    },
    phoneText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
});
