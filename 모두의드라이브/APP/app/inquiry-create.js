import { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetView,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../src/constants/config';
import useConfigStore from '../src/store/configStore';
import AppHeader from '../src/components/AppHeader';
import PhotoPickerSheet from '../src/components/PhotoPickerSheet';
import { showToast } from '../src/utils/toast';
import { createInquiry } from '../src/api/inquiry';
import { matchApi } from '../src/api/match';
import useBottomSheetBackHandler from '../src/hooks/useBottomSheetBackHandler';

function formatDriveDate(dateStr, startTime) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hm = startTime ? String(startTime).slice(0, 5) : '';
    return hm ? `${y}.${m}.${day} ${hm}` : `${y}.${m}.${day}`;
}

export default function InquiryCreateScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const categories = useConfigStore((s) => s.inquiryCategories);
    const matchStatuses = useConfigStore((s) => s.matchStatuses) ?? [];
    const matchStatusLabelMap = matchStatuses.reduce((acc, s) => {
        acc[s.key] = s.label;
        return acc;
    }, {});
    const params = useLocalSearchParams();

    // BottomSheet refs
    const categorySheetRef = useRef(null);
    const [categorySheetOpen, setCategorySheetOpen] = useState(false);
    useBottomSheetBackHandler(categorySheetRef, categorySheetOpen);

    const matchSheetRef = useRef(null);
    const [matchSheetOpen, setMatchSheetOpen] = useState(false);
    useBottomSheetBackHandler(matchSheetRef, matchSheetOpen);

    // Form state
    const [category, setCategory] = useState(params?.category ? String(params.category) : null);
    const [content, setContent] = useState('');
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [images, setImages] = useState([]);

    // 매칭 목록
    const [matchList, setMatchList] = useState([]);
    const [matchListLoading, setMatchListLoading] = useState(false);

    // Photo picker
    const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

    const [saving, setSaving] = useState(false);
    const [contentFocused, setContentFocused] = useState(false);

    const isNoshow = category === 'noshow';
    const categoryLabel = categories.find((c) => c.key === category)?.label || '';

    // ---- Category Sheet ----
    const openCategorySheet = useCallback(() => {
        categorySheetRef.current?.present();
    }, []);

    const handleSelectCategory = useCallback((key) => {
        const prevIsNoshow = category === 'noshow';
        const nextIsNoshow = key === 'noshow';
        if (prevIsNoshow !== nextIsNoshow) {
            setSelectedMatch(null);
            setImages([]);
        }
        setCategory(key);
        categorySheetRef.current?.dismiss();
    }, [category]);

    const renderCategoryBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    // ---- Match Sheet ----
    const fetchMatchList = useCallback(async () => {
        setMatchListLoading(true);
        try {
            const res = await matchApi.getInquiryTargets();
            setMatchList(res.data?.list || []);
        } catch (e) {
            setMatchList([]);
        } finally {
            setMatchListLoading(false);
        }
    }, []);

    const openMatchSheet = useCallback(() => {
        if (matchList.length === 0) fetchMatchList();
        matchSheetRef.current?.present();
    }, [matchList.length, fetchMatchList]);

    const handleSelectMatch = useCallback((match) => {
        setSelectedMatch(match);
        matchSheetRef.current?.dismiss();
    }, []);

    // matchIdx 파라미터로 진입한 경우 매칭 자동 선택
    useEffect(() => {
        if (!params?.matchIdx || !isNoshow) return;
        if (selectedMatch) return;
        const targetIdx = Number(params.matchIdx);
        if (!targetIdx) return;
        (async () => {
            setMatchListLoading(true);
            try {
                const res = await matchApi.getInquiryTargets();
                const list = res.data?.list || [];
                setMatchList(list);
                const found = list.find((m) => Number(m.idx) === targetIdx);
                if (found) setSelectedMatch(found);
            } catch (e) {
                // ignore
            } finally {
                setMatchListLoading(false);
            }
        })();
    }, [params?.matchIdx, isNoshow, selectedMatch]);

    // ---- Photo ----
    const handlePhotoSelected = useCallback((result) => {
        setPhotoPickerVisible(false);
        if (!result) return;
        const toAdd = Array.isArray(result) ? result : [result];
        setImages((prev) => {
            const combined = [...prev, ...toAdd];
            return combined.slice(0, 3);
        });
    }, []);

    const handleRemoveImage = useCallback((index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // ---- Submit ----
    const handleSubmit = useCallback(async () => {
        if (saving) return;

        if (!category) {
            showToast('error', '문의유형을 선택해주세요.');
            return;
        }
        if (!content.trim()) {
            showToast('error', '문의 내용을 입력해주세요.');
            return;
        }
        if (isNoshow) {
            if (!selectedMatch) {
                showToast('error', '매칭을 선택해주세요.');
                return;
            }
        }

        const imagePayload = images.map((img) => {
            if (!img.base64) return null;
            const ext = img.mimeType?.split('/').pop()?.toLowerCase()
                || img.uri?.split('.').pop()?.toLowerCase()
                || 'jpg';
            const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp'].includes(ext) ? ext : 'jpg';
            return {
                base: `data:image/${safeExt};base64,${img.base64}`,
                ext: safeExt,
            };
        }).filter(Boolean);

        if (isNoshow && imagePayload.length === 0) {
            showToast('error', '첨부사진을 등록해주세요.');
            return;
        }

        setSaving(true);
        try {
            await createInquiry({
                category,
                content: content.trim(),
                matchIdx: isNoshow && selectedMatch ? selectedMatch.idx : undefined,
                images: imagePayload,
            });

            showToast('success', '등록되었습니다.');
            router.back();
        } catch (e) {
            const errCode = e?.response?.data?.code;
            if (errCode === 20100) {
                showToast('error', '이미 이의제기한 매칭입니다.');
            } else {
                showToast('error', '문의 등록에 실패했습니다. 다시 시도해주세요.');
            }
        } finally {
            setSaving(false);
        }
    }, [saving, category, content, isNoshow, selectedMatch, images, router]);

    return (
        <View testID="inquiry-create-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="문의등록" onClose={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* 1. 문의유형 선택 */}
                <View style={styles.field}>
                    <Text allowFontScaling={false} style={styles.fieldHint}>
                        원하시는 지원 서비스를 선택하여 문의주세요.
                    </Text>
                    <TouchableOpacity
                        testID="inquiry-create-category-btn"
                        activeOpacity={0.8}
                        onPress={openCategorySheet}
                        style={styles.selectBox}
                    >
                        <Text
                            allowFontScaling={false}
                            style={[styles.selectText, !category && styles.selectPlaceholder]}
                        >
                            {category ? categoryLabel : '선택해주세요'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#C5C5CD" />
                    </TouchableOpacity>
                </View>

                {/* 2. 노쇼 전용 필드 */}
                {isNoshow && (
                    <>
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={styles.fieldLabel}>
                                매칭 선택
                            </Text>
                            <TouchableOpacity
                                testID="inquiry-create-match-btn"
                                activeOpacity={0.8}
                                onPress={openMatchSheet}
                                style={styles.selectBox}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#969698" style={styles.calendarIcon} />
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.selectText, !selectedMatch && styles.selectPlaceholder]}
                                    numberOfLines={1}
                                >
                                    {selectedMatch
                                        ? `${formatDriveDate(selectedMatch.driveDate, selectedMatch.driveStartTime)} · ${selectedMatch.title}`
                                        : '매칭을 선택해주세요'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </>
                )}

                {/* 3. 문의 내용 */}
                <View style={styles.field}>
                    <Text allowFontScaling={false} style={styles.fieldLabel}>
                        문의 내용
                    </Text>
                    <TextInput
                        testID="inquiry-create-content-input"
                        allowFontScaling={false}
                        style={[styles.contentInput, contentFocused && styles.contentInputFocused]}
                        value={content}
                        onChangeText={setContent}
                        placeholder="문의 내용을 입력해 주세요."
                        placeholderTextColor="#C5C5CD"
                        multiline
                        textAlignVertical="top"
                        onFocus={() => setContentFocused(true)}
                        onBlur={() => setContentFocused(false)}
                    />
                </View>

                {/* 4. 첨부사진 */}
                <View style={styles.field}>
                    <View style={styles.photoLabelRow}>
                        <Text allowFontScaling={false} style={styles.photoLabel}>
                            첨부사진
                        </Text>
                        <Text allowFontScaling={false} style={styles.photoLabelSub}>
                            {isNoshow ? ' (필수, 최대3장)' : ' (선택, 최대3장)'}
                        </Text>
                    </View>
                    {isNoshow && (
                        <Text allowFontScaling={false} style={styles.photoHint}>
                            대화방 캡쳐, 네이버지도 당시 현재위치, 시간 확인되는 사진 캡쳐 제출해 주세요
                        </Text>
                    )}
                    <View style={styles.photoRow}>
                        {images.map((img, index) => (
                            <View key={index} style={styles.photoThumbWrap}>
                                <Image
                                    source={{ uri: img.uri }}
                                    style={styles.photoThumb}
                                    contentFit="cover"
                                />
                                <TouchableOpacity
                                    testID={`inquiry-create-photo-delete-${index}`}
                                    style={styles.photoDeleteBtn}
                                    onPress={() => handleRemoveImage(index)}
                                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                                >
                                    <Ionicons name="close" size={10} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {images.length < 3 && (
                            <TouchableOpacity
                                testID="inquiry-create-photo-add-btn"
                                activeOpacity={0.7}
                                onPress={() => setPhotoPickerVisible(true)}
                                style={styles.photoAddBtn}
                            >
                                <Ionicons name="image-outline" size={28} color="#C5C5CD" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAwareScrollView>

            {/* 하단 고정 버튼 */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.xl }]}>
                <TouchableOpacity
                    testID="inquiry-create-submit-btn"
                    activeOpacity={0.85}
                    onPress={handleSubmit}
                    disabled={saving}
                    style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text allowFontScaling={false} style={styles.submitBtnText}>
                            문의하기
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* 문의유형 BottomSheet */}
            <BottomSheetModal
                ref={categorySheetRef}
                backdropComponent={renderCategoryBackdrop}
                enablePanDownToClose
                enableDynamicSizing={true}
                enableOverDrag={false}
                onChange={(index) => setCategorySheetOpen(index >= 0)}
                onDismiss={() => setCategorySheetOpen(false)}
            >
                <BottomSheetView style={[styles.sheetContent, { paddingBottom: insets.bottom + SPACING.xl }]}>
                    <Text allowFontScaling={false} style={styles.sheetTitle}>
                        문의유형 선택
                    </Text>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.key}
                            testID={`inquiry-create-cat-${cat.key}`}
                            activeOpacity={0.7}
                            onPress={() => handleSelectCategory(cat.key)}
                            style={[
                                styles.sheetItem,
                                category === cat.key && styles.sheetItemActive,
                            ]}
                        >
                            <Text
                                allowFontScaling={false}
                                style={[
                                    styles.sheetItemText,
                                    category === cat.key && styles.sheetItemTextActive,
                                ]}
                            >
                                {cat.label}
                            </Text>
                            {category === cat.key && (
                                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </BottomSheetView>
            </BottomSheetModal>

            {/* 매칭 선택 BottomSheet */}
            <BottomSheetModal
                ref={matchSheetRef}
                backdropComponent={renderCategoryBackdrop}
                snapPoints={['50%']}
                enableOverDrag={false}
                enableDynamicSizing={false}
                onChange={(index) => setMatchSheetOpen(index >= 0)}
                onDismiss={() => setMatchSheetOpen(false)}
            >
                <BottomSheetView style={[styles.sheetContent, { paddingBottom: insets.bottom + SPACING.xl }]}>
                    <Text allowFontScaling={false} style={styles.sheetTitle}>
                        매칭 선택
                    </Text>
                    {matchListLoading ? (
                        <View style={styles.matchEmpty}>
                            <ActivityIndicator size="small" color={COLORS.textPrimary || '#070B25'} />
                        </View>
                    ) : matchList.length === 0 ? (
                        <View style={styles.matchEmpty}>
                            <Text allowFontScaling={false} style={styles.matchEmptyText}>
                                이의신청 가능한 매칭이 없습니다.
                            </Text>
                        </View>
                    ) : (
                        <BottomSheetScrollView
                            style={styles.matchListScroll}
                            contentContainerStyle={[styles.matchListContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                            showsVerticalScrollIndicator={false}
                        >
                            {matchList.map((m) => {
                                const active = selectedMatch?.idx === m.idx;
                                return (
                                    <TouchableOpacity
                                        key={m.idx}
                                        testID={`inquiry-create-match-${m.idx}`}
                                        activeOpacity={0.7}
                                        onPress={() => handleSelectMatch(m)}
                                        style={[styles.matchItem, active && styles.matchItemActive]}
                                    >
                                        <View style={styles.matchItemHeader}>
                                            <Text allowFontScaling={false} style={styles.matchItemDate}>
                                                {formatDriveDate(m.driveDate, m.driveStartTime)}
                                            </Text>
                                            <View style={styles.matchStatusBadge}>
                                                <Text allowFontScaling={false} style={styles.matchStatusBadgeText}>
                                                    {matchStatusLabelMap[m.status] || m.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text allowFontScaling={false} style={styles.matchItemTitle} numberOfLines={1}>
                                            {m.title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </BottomSheetScrollView>
                    )}
                </BottomSheetView>
            </BottomSheetModal>

            {/* 사진 선택 시트 */}
            <PhotoPickerSheet
                visible={photoPickerVisible}
                onClose={() => setPhotoPickerVisible(false)}
                onImageSelected={handlePhotoSelected}
                allowMultiple={true}
                selectionLimit={3 - images.length}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.xl,
        gap: SPACING.xxl,
        paddingBottom: SPACING.xl,
    },
    field: {
        gap: SPACING.sm,
    },
    fieldHint: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: '#686869',
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: '#686869',
    },
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        height: 52,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        justifyContent: 'space-between',
    },
    selectText: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: '#070B25',
    },
    selectPlaceholder: {
        color: '#C5C5CD',
    },
    calendarIcon: {
        marginRight: SPACING.sm,
    },
    contentInput: {
        backgroundColor: '#F5F5F5',
        height: 160,
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: '#070B25',
        textAlignVertical: 'top',
    },
    contentInputFocused: {
        paddingHorizontal: SPACING.md,
    },
    photoLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    photoLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: '#070B25',
    },
    photoLabelSub: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
    photoHint: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#969698',
        lineHeight: 18,
    },
    photoRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        flexWrap: 'wrap',
    },
    photoAddBtn: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoThumbWrap: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    photoThumb: {
        width: '100%',
        height: '100%',
    },
    photoDeleteBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#070B25',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    submitBtn: {
        backgroundColor: '#384FEE',
        height: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    sheetContent: {
        padding: SPACING.xl,
        gap: SPACING.sm,
    },
    sheetTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: '#070B25',
        marginBottom: SPACING.sm,
    },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
    },
    sheetItemActive: {
        backgroundColor: '#EDEFFF',
    },
    sheetItemText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.regular,
        color: '#070B25',
    },
    sheetItemTextActive: {
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
    matchListScroll: {
        maxHeight: 360,
    },
    matchListContent: {
        gap: SPACING.sm,
        paddingBottom: SPACING.sm,
    },
    matchEmpty: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    matchEmptyText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
    matchItem: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: SPACING.md,
        gap: SPACING.xs,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    matchItemActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#EDEFFF',
    },
    matchItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    matchItemDate: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: '#070B25',
    },
    matchStatusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: '#E5E5E8',
    },
    matchStatusBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: '#686869',
        lineHeight: 16,
    },
    matchItemTitle: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.semiBold,
        color: '#070B25',
    },
});
