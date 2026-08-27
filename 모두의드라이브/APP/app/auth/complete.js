import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
// CommonActions 제거 — expo-router의 router.replace로 통일
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import useMatchStore from '../../src/store/matchStore';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { getAge } from '../../src/utils/age';

const checkImage = require('../../assets/images/check-complete.gif');

export default function CompleteScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, signupData, resetSignupData } = useAuthStore();
    const getLabel = useConfigStore(s => s.getLabel);

    const nickname = user?.nickname || signupData?.nickname || '회원';
    const name = user?.name || signupData?.name || '회원';
    const role = user?.role || signupData?.role;
    const roleLabel = role === 'owner' ? '오너' : '게스트';
    const driveLevel = user?.driveLevel || signupData?.driveLevel;
    const driveLevelLabel = driveLevel ? getLabel('driveLevels', driveLevel) : '-';
    const birthDate = signupData?.birthDate;
    const computedAge = getAge(birthDate);
    const ageDecade = computedAge ? Math.floor(computedAge / 10) * 10 : null;
    const cars = user?.cars || signupData?.cars || [];
    const carLabel = cars.map(c => getLabel('carTypes', c.carType)).join(', ') || '-';

    const infoItems = [
        { label: '회원유형', value: roleLabel },
        { label: '닉네임', value: nickname },
    ];

    if (role === 'owner' && driveLevel) {
        infoItems.push({ label: '레벨', value: driveLevelLabel });
    }

    if (role === 'guest' && cars.length > 0) {
        infoItems.push({ label: '관심차종', value: carLabel });
    }

    if (ageDecade) {
        infoItems.push({ label: '나이', value: `${ageDecade}대` });
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText} allowFontScaling={false}>
                        안녕하세요. {name}님
                    </Text>
                    <Text style={styles.greetingText} allowFontScaling={false}>
                        <Text style={styles.greetingBlue}>회원가입을 환영</Text>
                        합니다.
                    </Text>
                </View>

                {/* Info list */}
                <View style={styles.infoList}>
                    {infoItems.map((item) => (
                        <View key={item.label} style={styles.infoItem}>
                            <Text style={styles.infoLabel} allowFontScaling={false}>{item.label}</Text>
                            <Text style={styles.infoValue} allowFontScaling={false}>{item.value}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Check image */}
            <View style={styles.imageWrap}>
                <Image
                    source={checkImage}
                    style={styles.checkImage}
                    contentFit="cover"
                />
            </View>

            {/* Bottom button */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => {
                        resetSignupData();
                        useMatchStore.getState().prefetchHome();
                        if (router.canDismiss()) router.dismissAll();
                        router.replace('/(tabs)/home');
                    }}
                    activeOpacity={0.85}
                    testID="signup-complete-btn"
                >
                    <Text style={styles.completeBtnText} allowFontScaling={false}>완료</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    /* Content */
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xxxl,
        paddingTop: SPACING.xxxl,
        gap: SPACING.xl,
    },

    /* Greeting */
    greetingSection: {
        gap: 0,
    },
    greetingText: {
        fontSize: 24,
        fontFamily: FONTS.extraBold,
        lineHeight: 36,
        color: COLORS.textPrimary,
    },
    greetingBlue: {
        color: COLORS.primary,
    },

    /* Info list */
    infoList: {
        gap: SPACING.md,
    },
    infoItem: {
        gap: SPACING.xs,
    },
    infoLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.copyrightText,
    },
    infoValue: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },

    /* Check image */
    imageWrap: {
        alignItems: 'flex-end',
        paddingRight: SPACING.xxxl,
    },
    checkImage: {
        width: 199,
        height: 200,
    },

    /* Bottom bar */
    bottomBar: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        backgroundColor: COLORS.white,
    },
    completeBtn: {
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
