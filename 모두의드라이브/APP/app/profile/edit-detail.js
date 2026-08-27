import { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import useAuthStore from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import PhotoPickerSheet from '../../src/components/PhotoPickerSheet';
import usePopupStore from '../../src/store/popupStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import { logProfileComplete } from '../../src/utils/analytics';

const MAX_PHOTOS = 30;
const MIN_PHOTOS = 4;
const NUM_COLUMNS = 4;
const GRID_GAP = 8;

export default function EditDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: frameWidth } = useSafeAreaFrame();
    const { user, fetchMe } = useAuthStore();
    const showPopup = usePopupStore((s) => s.show);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [introduction, setIntroduction] = useState('');
    const [introFocused, setIntroFocused] = useState(false);
    const [photos, setPhotos] = useState([]); // [{ key, uri, base64, isNew, imageUrl }]
    const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null); // 탭-스왑: 선택된 사진 key
    const idCounter = useRef(0);

    const contentPadding = SPACING.xl * 2;
    const itemSize = (frameWidth - contentPadding - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

    // Pre-fill from user data
    useEffect(() => {
        if (!user) return;
        setIntroduction(user.introduction || '');

        if (user.photos?.length) {
            const sorted = [...user.photos].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            setPhotos(sorted.map((p, i) => ({
                key: `existing-${i}`,
                uri: STORAGE_URL + p.imageUrl,
                imageUrl: p.imageUrl,
                isNew: false,
            })));
            idCounter.current = sorted.length;
        }
        setLoading(false);
    }, [user]);

    const isFirstRegistration = !user?.photos?.length || user.photos.filter(p => !p.deleteAt).length === 0;
    const validPhotos = photos.filter(p => p && (p.uri || p.imageUrl));
    const canAddMore = validPhotos.length < MAX_PHOTOS;
    const maxSelectable = MAX_PHOTOS - validPhotos.length;

    const handlePhotoPickerSelect = useCallback((imageData) => {
        const items = Array.isArray(imageData) ? imageData : [imageData];
        const startIdx = idCounter.current + 1;
        const newPhotos = items.map((item, i) => ({
            key: `new-${startIdx + i}`,
            uri: item.uri,
            base64: item.base64,
            isNew: true,
        }));
        idCounter.current = startIdx + items.length - 1;
        setPhotos(prev => [...prev, ...newPhotos]);
    }, []);

    const removePhoto = useCallback((key) => {
        setPhotos(prev => prev.filter(p => p.key !== key));
        // 삭제된 사진이 선택 중이었던 경우에만 선택 해제
        setSelectedKey(prev => (prev === key ? null : prev));
    }, []);

    // 탭-스왑: 사진 탭 핸들러
    const handlePhotoTap = useCallback((key) => {
        if (selectedKey === null) {
            // 첫 번째 탭: 선택
            setSelectedKey(key);
        } else if (selectedKey === key) {
            // 같은 사진 다시 탭: 선택 해제
            setSelectedKey(null);
        } else {
            // 두 번째 탭: 스왑
            setPhotos(prev => {
                const idxA = prev.findIndex(p => p.key === selectedKey);
                const idxB = prev.findIndex(p => p.key === key);
                if (idxA === -1 || idxB === -1) return prev;
                const next = [...prev];
                [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
                return next;
            });
            setSelectedKey(null);
        }
    }, [selectedKey]);

    // Save
    const handleSave = useCallback(async () => {
        if (saving) return;

        // 저장 시점 유효성 검증
        if (validPhotos.length < MIN_PHOTOS) {
            showToast('error', `사진은 최소 ${MIN_PHOTOS}장 이상이어야 합니다.`);
            return;
        }
        const trimmedIntro = introduction.trim();
        if (trimmedIntro.length < 20) {
            showToast('error', '자기소개는 20자 이상 입력해 주세요.');
            return;
        }
        if (trimmedIntro.length > 1000) {
            showToast('error', '자기소개는 1000자 이내로 입력해 주세요.');
            return;
        }

        setSaving(true);
        try {
            const photosData = validPhotos.map((p, i) => {
                if (p.isNew && p.base64) {
                    const base64Str = p.base64.startsWith('data:')
                        ? p.base64
                        : `data:image/jpeg;base64,${p.base64}`;
                    return { base64: base64Str, isFullBody: i === 0 };
                }
                return { imageUrl: p.imageUrl, isFullBody: i === 0 };
            });

            const data = {
                introduction: introduction.trim(),
                photos: photosData,
            };

            const res = await authApi.updateProfile(data);
            logProfileComplete(user?.idx);
            await fetchMe();

            if (res.data?.photoPointAwarded) {
                router.back();
                showPopup('pointReward', {
                    points: '10,000',
                    autoDismissMs: 2000
                }, 50);
            } else {
                showToast('success', '상세 프로필이 수정되었습니다.');
                router.back();
            }
        } catch (e) {
            showToast('error', e.response?.data?.message || '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    }, [saving, introduction, validPhotos, fetchMe, showPopup, router, user?.idx]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="프로필 수정" onBack={() => router.back()} />

            <View style={styles.body}>
            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>상세 프로필</Text>
                    {isFirstRegistration && (
                        <Text style={styles.sectionDesc} allowFontScaling={false}>
                            상세 프로필을 작성하시면{' '}
                            <Text style={styles.pointText} allowFontScaling={false}>1만 포인트</Text>
                            가 지급됩니다.
                        </Text>
                    )}
                </View>

                {/* 소개글 */}
                <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>
                            {user?.nickname || '회원'}님을 소개해 주세요.
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
                        testID="profile-edit-detail-intro-input"
                    />
                </View>

                {/* 포토 프로필 */}
                <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>
                            포토 프로필
                        </Text>
                        <Text style={styles.fieldHint} allowFontScaling={false}>
                            {validPhotos.length}/{MAX_PHOTOS}
                        </Text>
                    </View>

                    {/* 스왑 안내 */}
                    {selectedKey !== null && (
                        <View style={styles.swapHint}>
                            <Text style={styles.swapHintText} allowFontScaling={false}>
                                교환할 사진을 선택하세요
                            </Text>
                        </View>
                    )}

                    {/* Photo grid with tap-to-swap */}
                    <View style={styles.photoGrid}>
                        {validPhotos.map((photo, idx) => {
                            const isFirst = idx === 0;
                            const isSelected = selectedKey === photo.key;
                            return (
                                <Pressable
                                    key={photo.key}
                                    style={[
                                        styles.photoBox,
                                        { width: itemSize, height: itemSize },
                                        isSelected && styles.photoBoxSelected,
                                    ]}
                                    onPress={() => handlePhotoTap(photo.key)}
                                    testID={`profile-edit-detail-photo-${idx}`}
                                >
                                    <Image
                                        source={{ uri: photo.uri }}
                                        style={styles.photoImage}
                                        contentFit="cover"
                                    />
                                    {isFirst && (
                                        <View style={styles.fullBodyBadge}>
                                            <Text style={styles.fullBodyBadgeText} allowFontScaling={false}>얼굴사진</Text>
                                        </View>
                                    )}
                                    {isSelected && (
                                        <View style={styles.selectedOverlay}>
                                            <View style={styles.selectedCheckCircle}>
                                                <Text style={styles.selectedCheckText} allowFontScaling={false}>✓</Text>
                                            </View>
                                        </View>
                                    )}
                                    <Pressable
                                        style={styles.photoRemoveBtn}
                                        onPress={() => removePhoto(photo.key)}
                                        hitSlop={8}
                                        testID={`profile-edit-detail-photo-remove-${idx}`}
                                    >
                                        <Ionicons name="close" size={10} color={COLORS.white} />
                                    </Pressable>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Add photo button */}
                    {canAddMore && (
                        <Pressable style={styles.addPhotoBtn} onPress={() => setPhotoPickerVisible(true)} testID="profile-edit-detail-photo-add">
                            <Image
                                source={require('../../assets/icons/image-add.svg')}
                                style={{ width: 24, height: 20 }}
                                contentFit="contain"
                            />
                            <Text style={styles.addPhotoBtnText} allowFontScaling={false}>
                                사진 추가 (최대 {maxSelectable}장 선택 가능)
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* 유의사항 */}
                <View style={styles.noticeSection}>
                    <Text style={styles.noticeTitle} allowFontScaling={false}>
                        [포토 프로필 등록시 유의사항]
                    </Text>
                    <View style={styles.noticeList}>
                        <Text style={styles.noticeItemRed} allowFontScaling={false}>
                            {'\u2022'} <Text style={styles.noticeRedBold}>첫 번째 사진은 반드시 얼굴사진</Text>으로 등록해 주세요.
                        </Text>
                        <Text style={styles.noticeItemRed} allowFontScaling={false}>
                            {'\u2022'} <Text style={styles.noticeRedBold}>최소 4장 필수</Text> (최대 30장)
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 연예인 등 타인 사진 도용 x
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 매칭시 상대 구별을 위해 얼굴 사진 필수
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 얼굴사진 외 나머지는 자유롭게 등록해 주세요.
                        </Text>
                        <Text style={styles.noticeItemSub} allowFontScaling={false}>
                            {'  '}(선글라스, 측면, 후면 모두 가능합니다.)
                        </Text>
                        <Text style={styles.noticeItem} allowFontScaling={false}>
                            {'\u2022'} 사진을 탭하여 순서를 변경할 수 있습니다.
                        </Text>
                    </View>
                </View>

                <View style={{ height: SPACING.xxxl }} />
            </KeyboardAwareScrollView>

            {/* Bottom bar */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[styles.saveBtn, !saving ? styles.saveBtnActive : null]}
                    onPress={handleSave}
                    disabled={saving}
                    testID="profile-edit-detail-save-btn"
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveBtnText} allowFontScaling={false}>저장</Text>
                    )}
                </Pressable>
            </View>

            <PhotoPickerSheet
                visible={photoPickerVisible}
                onClose={() => setPhotoPickerVisible(false)}
                onImageSelected={handlePhotoPickerSelect}
                allowMultiple={true}
                selectionLimit={maxSelectable}
            />

            {loading && (
                <View style={styles.loadingOverlay} onStartShouldSetResponder={() => true}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    body: {
        flex: 1,
    },
    scroll: { flex: 1 },
    scrollContent: {
        padding: SPACING.xl,
        gap: SPACING.xxl,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },

    /* Title */
    titleSection: {
        gap: 4,
        alignItems: 'center',
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
        color: '#F64B17',
    },

    /* Field */
    fieldGroup: {
        gap: SPACING.sm,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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

    /* Swap hint */
    swapHint: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 8,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
    },
    swapHintText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },

    /* Photo grid */
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
    },
    photoBox: {
        borderRadius: 8,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: COLORS.lightGray,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    photoBoxSelected: {
        borderColor: COLORS.primary,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(56, 79, 238, 0.3)',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedCheckCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedCheckText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: FONTS.extraBold,
    },
    fullBodyBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 100,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    fullBodyBadgeText: {
        fontSize: 9,
        fontFamily: FONTS.extraBold,
        lineHeight: 14,
        color: COLORS.white,
    },
    photoRemoveBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: COLORS.black,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoRemoveText: {
        color: COLORS.white,
        fontSize: 8,
        lineHeight: 10,
    },

    /* Add photo */
    addPhotoBtn: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    addPhotoBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textMedium,
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
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    },
    saveBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnActive: {
        backgroundColor: COLORS.primary,
    },
    saveBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
