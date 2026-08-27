import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    Alert, ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import useAuthStore from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import usePopupStore from '../../src/store/popupStore';
import { showToast } from '../../src/utils/toast';
import { resizeForUpload } from '../../src/utils/image';
import { logProfileComplete } from '../../src/utils/analytics';

export default function DetailProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signupData, updateSignupData, setLogin } = useAuthStore();
    const [introduction, setIntroduction] = useState(signupData.introduction || '');
    const [introFocused, setIntroFocused] = useState(false);
    const [photos, setPhotos] = useState(signupData.photos || []);
    const [loading, setLoading] = useState(false);
    const showPopup = usePopupStore((s) => s.show);

    const isOwner = signupData.role === 'owner';
    const displayNickname = signupData.nickname || '닉네임';

    const pickImage = useCallback(async (index) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '사진 접근 권한이 필요합니다. 설정에서 허용해 주세요.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 1, // iOS 펜 마크업 적색 라인 손실 방지 (압축은 resizeForUpload 담당)
                base64: true,
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = await resizeForUpload(result.assets[0]);
                setPhotos(prev => {
                    const next = [...prev];
                    next[index] = { uri: asset.uri, base64: asset.base64 };
                    return next;
                });
            }
        } catch (e) {
            showToast('error', '사진을 불러오는 중 문제가 발생했습니다.');
        }
    }, []);

    const removePhoto = useCallback((index) => {
        setPhotos(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    const validPhotos = photos.filter(p => p && p.uri);
    const canComplete = introduction.length >= 20 && validPhotos.length >= 4;

    const doSignup = useCallback(async (hasDetailProfile) => {
        const photosWithPrefix = hasDetailProfile
            ? validPhotos.map(p => ({
                ...p,
                base64: p.base64?.startsWith('data:') ? p.base64 : `data:image/jpeg;base64,${p.base64}`,
            }))
            : [];
        const profileImageWithPrefix = signupData.profileImage?.base64
            ? {
                ...signupData.profileImage,
                base64: signupData.profileImage.base64.startsWith('data:')
                    ? signupData.profileImage.base64
                    : `data:image/jpeg;base64,${signupData.profileImage.base64}`,
            }
            : null;
        const data = {
            ...signupData,
            introduction: hasDetailProfile ? introduction : null,
            photos: photosWithPrefix,
            profileImage: profileImageWithPrefix,
        };

        const res = await authApi.signup(data);
        const result = res.data;

        await setLogin(result.token, result.refreshToken, result.user);

        // '건너뛰기'로 온 가입에서는 상세 프로필이 없으므로 발송하지 않는다
        if (hasDetailProfile) logProfileComplete(result.user?.idx);

        router.replace('/auth/referral');

        if (hasDetailProfile) {
            showPopup('pointReward', {
                points: '10,000',
                autoDismissMs: 2000,
            }, 50);
        } 
    }, [signupData, introduction, validPhotos, setLogin, showPopup, router]);

    const handleSkip = useCallback(async () => {
        updateSignupData({ introduction: null, photos: [] });
        setLoading(true);
        try {
            await doSignup(false);
        } catch (e) {
            showToast('error', e.response?.data?.message || '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [updateSignupData, doSignup]);

    const handleComplete = useCallback(async () => {
        if (introduction.length < 20) {
            showToast('error', '소개글은 20자 이상 입력해주세요.');
            return;
        }
        if (introduction.length > 1000) {
            showToast('error', '소개글은 1000자 이내로 입력해주세요.');
            return;
        }
        if (validPhotos.length < 4) {
            showToast('error', '포토 프로필 4장을 등록해주세요.');
            return;
        }
        updateSignupData({ introduction, photos: validPhotos });
        setLoading(true);
        try {
            await doSignup(true);
        } catch (e) {
            showToast('error', e.response?.data?.message || '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [introduction, validPhotos, signupData, doSignup]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader
                title={`${isOwner ? '오너' : '게스트'} 가입하기`}
                onBack={() => router.back()}
                rightLabel="건너뛰기"
                onRightPress={handleSkip}
                rightDisabled={loading}
            />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>상세 프로필</Text>
                    <Text style={styles.sectionDesc} allowFontScaling={false}>
                        상세 프로필을 작성하시면{' '}
                        <Text style={styles.pointText}>1만 포인트</Text>
                        가 지급됩니다.
                    </Text>
                </View>

                {/* 소개글 */}
                <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>
                            {displayNickname}님을 소개해 주세요.
                        </Text>
                        <Text style={styles.fieldHint} allowFontScaling={false}>20자이상~1000이내</Text>
                    </View>
                    <TextInput
                        style={[
                            styles.textArea,
                            introFocused && styles.textAreaFocused,
                        ]}
                        value={introduction}
                        onChangeText={setIntroduction}
                        onFocus={() => setIntroFocused(true)}
                        onBlur={() => setIntroFocused(false)}
                        placeholder="소개글을 입력하세요."
                        placeholderTextColor={COLORS.disabledBtn}
                        multiline
                        maxLength={1000}
                        textAlignVertical="top"
                        allowFontScaling={false}
                        testID="detail-profile-intro-input"
                    />
                </View>

                {/* 포토 프로필 */}
                <View style={styles.fieldGroup}>
                    <View style={styles.photoHeader}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>
                            포토 프로필을 등록해 주세요.
                        </Text>
                    </View>

                    <View style={styles.photoGridWrap}>
                        {/* 얼굴사진 badge */}
                        <View style={styles.photoBadge}>
                            <Text style={styles.photoBadgeText} allowFontScaling={false}>얼굴사진</Text>
                        </View>

                        <View style={styles.photoGrid}>
                            {[0, 1, 2, 3].map(i => {
                                const photo = photos[i];
                                return (
                                    <Pressable
                                        key={i}
                                        style={styles.photoBox}
                                        onPress={() => photo?.uri ? removePhoto(i) : pickImage(i)}
                                        testID={`detail-profile-photo-${i}`}
                                    >
                                        {photo?.uri ? (
                                            <View style={styles.photoFilled}>
                                                <Image
                                                    source={{ uri: photo.uri }}
                                                    style={styles.photoImage}
                                                    contentFit="cover"
                                                />
                                                <Pressable
                                                    style={styles.photoRemoveBtn}
                                                    onPress={() => removePhoto(i)}
                                                    hitSlop={8}
                                                    testID={`detail-profile-photo-${i}-remove`}
                                                >
                                                    <Ionicons name="close" size={12} color={COLORS.white} />
                                                </Pressable>
                                            </View>
                                        ) : (
                                            <Image
                                                source={require('../../assets/icons/image-add.svg')}
                                                style={{ width: 24, height: 20 }}
                                            />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* 유의사항 */}
                <View style={styles.noticeSection}>
                    <Text style={styles.noticeTitle} allowFontScaling={false}>
                        [포토 프로필 등록시 유의사항]
                    </Text>
                    <View style={styles.noticeList}>
                        <Text style={styles.noticeItemRed} allowFontScaling={false}>
                            {'\u2022'} <Text style={styles.noticeRedBold}>4장 필수</Text>
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 연예인 등 타인 사진 도용 x
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 매칭시 상대 구별을 위해 얼굴 사진 필수
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 얼굴사진 외 3장은 자유롭게 등록해 주세요.
                        </Text>
                        <Text style={styles.noticeItemSub} allowFontScaling={false}>
                            {'  '}(선글라스, 측면, 후면 모두 가능합니다.)
                        </Text>
                    </View>
                </View>
            </KeyboardAwareScrollView>

            {/* Bottom button */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[
                        styles.completeBtn,
                        canComplete && styles.completeBtnActive,
                    ]}
                    onPress={handleComplete}
                    disabled={!canComplete || loading}
                    testID="detail-profile-complete-btn"
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.completeBtnText} allowFontScaling={false}>회원가입 완료</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    /* Scroll */
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xxxl,
    },

    /* Title */
    titleSection: {
        gap: 4,
        marginBottom: SPACING.xxl,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    sectionDesc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    pointText: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },

    /* Field */
    fieldGroup: {
        marginBottom: SPACING.xxl,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    fieldHint: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        lineHeight: 16,
        color: COLORS.textMedium,
    },

    /* TextArea */
    textArea: {
        height: 200,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        borderCurve: 'continuous',
        padding: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        lineHeight: 24,
        color: COLORS.textPrimary,
        textAlignVertical: 'top',
        backgroundColor: COLORS.white,
        ...Platform.select({ android: { elevation: 0 } }),
    },
    textAreaFocused: {
        borderColor: COLORS.primary,
        padding: SPACING.md,
        ...Platform.select({
            ios: { boxShadow: '2px 2px 12px rgba(56, 79, 238, 0.3)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },

    /* Photo */
    photoHeader: {
        marginBottom: SPACING.sm,
    },
    photoGridWrap: {
        position: 'relative',
    },
    photoBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 100,
        alignSelf: 'flex-start',
        height: 20,
        justifyContent: 'center',
        zIndex: 1,
    },
    photoBadgeText: {
        fontSize: 11,
        fontFamily: FONTS.extraBold,
        lineHeight: 16,
        color: COLORS.white,
        textAlign: 'center',
    },
    photoGrid: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: 10,
    },
    photoBox: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    photoFilled: {
        width: '100%',
        height: '100%',
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    photoRemoveBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoRemoveText: {
        color: COLORS.white,
        fontSize: 10,
    },

    /* Notice */
    noticeSection: {
        gap: SPACING.sm,
    },
    noticeTitle: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    noticeList: {
        gap: 0,
    },
    noticeItemRed: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        lineHeight: 20,
        color: '#E02E2E',
    },
    noticeRedBold: {
        fontFamily: FONTS.semiBold,
        color: '#E02E2E',
    },
    noticeItem: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    noticeItemSub: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },

    /* Bottom bar */
    bottomBar: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        backgroundColor: COLORS.white,
    },
    completeBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeBtnActive: {
        backgroundColor: COLORS.primary,
    },
    completeBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
