import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Pressable,
    Share,
    TextInput,
    ActivityIndicator,
    Keyboard,
    Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../src/constants/config';
import AppHeader from '../src/components/AppHeader';
import { showToast } from '../src/utils/toast';
import { getReferralInfo, registerReferral } from '../src/api/invite';
import useConfigStore from '../src/store/configStore';
import usePopupStore from '../src/store/popupStore';
import usePointStore from '../src/store/pointStore';

export default function InviteScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { referralMaxCount, shareText, shareUrl } = useConfigStore();
    const showPopup = usePopupStore((s) => s.show);
    const refreshBalance = usePointStore((s) => s.refreshBalance);

    const inputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [referralCode, setReferralCode] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    const fetchInfo = useCallback(async () => {
        try {
            const data = await getReferralInfo();
            setReferralCode(data.referralCode || '');
            setReferralCount(data.referralCount || 0);
            setPointsEarned(data.pointsEarned || 0);
        } catch {
            showToast('error', '정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInfo();
    }, [fetchInfo]);

    const copyCode = async () => {
        if (!referralCode) return;
        try {
            await Clipboard.setStringAsync(referralCode);
            showToast('success', '추천 코드가 클립보드에 저장되었어요.');
        } catch {
            showToast('error', '클립보드 복사에 실패했습니다.');
        }
    };

    const shareInvite = async () => {
        try {
            const body = (shareText || '모두의 드라이브 - 모드') + '\n추천코드: ' + referralCode;
            if (Platform.OS === 'ios') {
                await Share.share({ message: body, url: shareUrl || '' });
            } else {
                await Share.share({ message: shareUrl ? `${body}\n${shareUrl}` : body });
            }
        } catch {
            // user cancelled
        }
    };

    const handleRegisterPress = () => {
        setShowCodeInput(true);
        setCodeInput('');
        inputRef.current?.focus();
    };

    const handleSubmitCode = async () => {
        const trimmed = codeInput.trim();
        if (!trimmed) {
            showToast('error', '추천코드를 입력해주세요.');
            return;
        }
        Keyboard.dismiss();
        setSubmitting(true);
        try {
            await registerReferral(trimmed.toUpperCase());
            setCodeInput('');
            refreshBalance();
            showPopup('referralPointEarned', {
                amount: '10,000',
                onConfirm: () => { fetchInfo(); },
                onCancel: () => { fetchInfo(); },
                onClose: () => { fetchInfo(); },
            });
        } catch (e) {
            const msg = e?.response?.data?.message || '추천코드 등록에 실패했습니다.';
            showToast('error', msg);
        } finally {
            setShowCodeInput(false);
            setSubmitting(false);
        }
    };

    const handleOverlayClose = () => {
        Keyboard.dismiss();
        setShowCodeInput(false);
        setCodeInput('');
    };

    const maxCount = referralMaxCount || 2;

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <AppHeader title="친구 초대하기" onBack={() => router.back()} />
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    return (
        <View testID="invite-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="친구 초대하기" onBack={() => router.back()} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + SPACING.bottom},
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.headerTopRow}>
                        <Text style={styles.headerTitle} allowFontScaling={false}>
                            {'드라이브 친구 찾기,\n지인과 함께 공유해요'}
                        </Text>
                        <Image
                            source={require('../assets/icons/user-location.svg')}
                            style={{ width: 48, height: 48 }}
                            contentFit="contain"
                        />
                    </View>

                    <View style={styles.cardRow}>
                        {/* Card 1: 소개 수 */}
                        <View style={styles.statCardSelected}>
                            <View style={styles.cardTop}>
                                <Image
                                    source={require('../assets/icons/gift.svg')}
                                    style={{ width: 24, height: 24 }}
                                    contentFit="contain"
                                />
                                <Text style={styles.cardLabelSelected} allowFontScaling={false}>소개 수</Text>
                            </View>
                            <View style={styles.cardBottom}>
                                <View style={styles.cardBottomRight}>
                                    <Text style={styles.cardValueSelected} allowFontScaling={false}>
                                        {referralCount}/{maxCount}
                                    </Text>
                                    <Text style={styles.cardSubSelected} allowFontScaling={false}>
                                        (최대{maxCount}회)
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Card 2: 포인트 적립 */}
                        <View style={styles.statCard}>
                            <View style={styles.cardTop}>
                                <Image
                                    source={require('../assets/icons/point.svg')}
                                    style={{ width: 24, height: 24 }}
                                    contentFit="contain"
                                />
                                <Text style={styles.cardLabel} allowFontScaling={false}>포인트 적립</Text>
                            </View>
                            <View style={styles.cardBottom}>
                                <View style={styles.cardBottomRight}>
                                    <Text style={styles.cardValue} allowFontScaling={false}>
                                        {pointsEarned.toLocaleString()}P
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    <Image
                        source={require('../assets/icons/gift.svg')}
                        style={{ width: 36, height: 36 }}
                        contentFit="contain"
                    />
                    <Text style={styles.contentTitle} allowFontScaling={false}>
                        친구를 초대하고 포인트를 획득하세요.
                    </Text>
                    <Text style={styles.contentSubtitle} allowFontScaling={false}>
                        (최대 {maxCount}회)
                    </Text>

                    <View style={styles.descriptionWrap}>
                        <Text style={styles.descriptionText} allowFontScaling={false}>
                            초대 코드를 통해 친구가 가입할 경우,
                        </Text>
                        <Text style={styles.descriptionBold} allowFontScaling={false}>
                            회원님께 "추천 포인트 10,000P"
                        </Text>
                        <Text style={styles.descriptionText} allowFontScaling={false}>
                            가 적립됩니다.
                        </Text>
                    </View>

                    {/* 내 추천코드 */}
                    <Text style={styles.codeLabel} allowFontScaling={false}>내 추천코드</Text>
                    <TouchableOpacity
                        testID="invite-code-copy"
                        style={styles.codeBox}
                        onPress={copyCode}
                        activeOpacity={0.7}
                        disabled={!referralCode}
                    >
                        <Text style={styles.codeText} allowFontScaling={false}>
                            {referralCode}
                        </Text>
                    </TouchableOpacity>

                    {/* 친구에게 보내기 */}
                    <TouchableOpacity
                        testID="invite-share-btn"
                        style={[styles.shareBtn, !referralCode && { opacity: 0.4 }]}
                        onPress={shareInvite}
                        activeOpacity={0.7}
                        disabled={!referralCode}
                    >
                        <Image
                            source={require('../assets/icons/send-01.svg')}
                            style={{ width: 20, height: 20 }}
                            contentFit="contain"
                            tintColor={COLORS.primary}
                        />
                        <Text style={styles.shareBtnText} allowFontScaling={false}>
                            친구에게 보내기
                        </Text>
                    </TouchableOpacity>

                    {/* 추천인 초대 코드 입력하기 버튼 */}
                    <TouchableOpacity
                        testID="invite-register-btn"
                        style={styles.registerBtn}
                        onPress={handleRegisterPress}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={require('../assets/icons/gift.svg')}
                            style={{ width: 20, height: 20 }}
                            contentFit="contain"
                        />
                        <Text
                            style={styles.registerBtnText}
                            allowFontScaling={false}
                        >
                            추천인 초대 코드 입력하기
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 오버레이 */}
            {showCodeInput && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.overlay}
                    pointerEvents="box-none"
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayClose} />
                </Animated.View>
            )}

            {/* 키보드 위 입력바 */}
            <KeyboardStickyView
                offset={{ closed: 100, opened: 0 }}
                style={{ zIndex: 20, marginTop: -100, elevation: 20 }}
                // enabled={showCodeInput}
            >
                <View style={[styles.stickyInputBar, {  }]}>
                    <TextInput
                        ref={inputRef}
                        testID="invite-code-input"
                        style={[styles.stickyInput, inputFocused && styles.stickyInputFocused]}
                        value={codeInput}
                        onChangeText={setCodeInput}
                        placeholder="친구추천코드입력"
                        placeholderTextColor={COLORS.disabledBtn}
                        allowFontScaling={false}
                        autoCapitalize="characters"
                        // autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleSubmitCode}
                        editable={!submitting}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                    />
                    <TouchableOpacity
                        testID="invite-submit-btn"
                        style={[
                            styles.stickySubmitBtn,
                            (!codeInput.trim() || submitting) && { backgroundColor: COLORS.disabledBtn },
                        ]}
                        onPress={handleSubmitCode}
                        disabled={submitting || !codeInput.trim()}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Text style={styles.stickySubmitText} allowFontScaling={false}>등록</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardStickyView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    /* Header Section */
    headerSection: {
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xxxl,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xl,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 28,
    },
    /* Stat Cards */
    cardRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    statCardSelected: {
        flex: 1,
        height: 120,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: SPACING.lg,
        justifyContent: 'space-between',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    statCard: {
        flex: 1,
        height: 120,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.white,
        padding: SPACING.lg,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    cardLabelSelected: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    cardLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    cardBottom: {
        alignItems: 'flex-end',
    },
    cardBottomRight: {
        alignItems: 'flex-end',
    },
    cardValueSelected: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    cardSubSelected: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.primary,
        marginTop: 2,
    },
    cardValue: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
    },

    /* Content Section */
    contentSection: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xxxl,
        alignItems: 'center',
    },
    contentTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    contentSubtitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        marginTop: SPACING.xs,
    },
    descriptionWrap: {
        marginTop: SPACING.xl,
        alignItems: 'center',
    },
    descriptionText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        textAlign: 'center',
        lineHeight: 20,
    },
    descriptionBold: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 24,
    },

    /* 내 추천코드 */
    codeLabel: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        marginTop: SPACING.xxxl,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    codeBox: {
        width: '100%',
        height: 52,
        backgroundColor: COLORS.primaryBg,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },

    /* 친구에게 보내기 */
    shareBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 52,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    shareBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },

    /* 오버레이 + 키보드 입력바 */
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10,
    },
    stickyInputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 20,
    },
    stickyInput: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.lightGray,
        paddingHorizontal: 12,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    stickyInputFocused: {
        paddingHorizontal: 12,
    },
    stickySubmitBtn: {
        width: 80,
        height: 52,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stickySubmitText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },

    /* 추천인 초대 코드 입력하기 */
    registerBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    registerBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
});
