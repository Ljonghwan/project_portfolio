import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, Modal, ActivityIndicator, Keyboard, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { reviewApi } from '../../src/api/review';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import { resizeForUpload } from '../../src/utils/image';
import usePointStore from '../../src/store/pointStore';
import usePlaceSearchStore from '../../src/store/placeSearchStore';
import useConfigStore from '../../src/store/configStore';

const BOTTOM_BAR_HEIGHT = 92;
const MAX_PHOTOS = 10;
const MIN_PHOTOS = 2;
const MAX_COURSES = 10;
const MIN_COURSES = 2;

export default function ReviewWriteScreen() {
    const { matchIdx, targetNickname, targetUserIdx } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const reviewBonusEnabled = useConfigStore(s => s.reviewBonusEnabled);

    const [content, setContent] = useState('');
    const [courses, setCourses] = useState([
        { placeName: '', address: '', roadAddress: '', lat: null, lng: null },
        { placeName: '', address: '', roadAddress: '', lat: null, lng: null },
    ]);
    const [photos, setPhotos] = useState([]); // [{uri, base64, ext}]
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const contentLen = content.length;
    const canSubmit = contentLen >= 20 && contentLen <= 1000
        && courses.slice(0, MIN_COURSES).every(c => c.placeName.trim())
        && photos.length >= MIN_PHOTOS;

    // ── 장소 검색 페이지에서 결과 수신 ──
    useFocusEffect(
        useCallback(() => {
            const pending = usePlaceSearchStore.getState().pending;
            if (pending && typeof pending.index === 'number') {
                const { index, place } = pending;
                setCourses(prev => prev.map((c, i) =>
                    i === index
                        ? {
                            placeName: place.placeName || '',
                            address: place.address || '',
                            roadAddress: place.roadAddress || '',
                            lat: (place.lat !== undefined && place.lat !== null) ? Number(place.lat) : null,
                            lng: (place.lng !== undefined && place.lng !== null) ? Number(place.lng) : null,
                        }
                        : c
                ));
                usePlaceSearchStore.getState().clear();
            }
        }, [])
    );

    // ── 코스 관리 ──
    function addCourse() {
        if (courses.length >= MAX_COURSES) return;
        setCourses(prev => [...prev, { placeName: '', address: '', roadAddress: '', lat: null, lng: null }]);
    }

    function removeCourse(index) {
        if (courses.length <= MIN_COURSES) return;
        setCourses(prev => prev.filter((_, i) => i !== index));
    }

    function openSearch(index) {
        Keyboard.dismiss();
        router.navigate(`/review/place-search?index=${index}`);
    }

    // 후기 작성 완료 후: manner-eval 등 중간 화면을 제거하고 매칭 상세로 복귀
    function navigateAfterSuccess() {
        router.back();
        return;
        
        try {
            while (router.canDismiss && router.canDismiss()) {
                router.dismiss();
            }
        } catch (_) { }
        if (matchIdx) {
            router.replace(`/match/${matchIdx}`);
        } else {
            router.replace('/(tabs)/home');
        }
    }

    // ── 사진 업로드 ──
    async function pickPhoto() {
        if (photos.length >= MAX_PHOTOS) {
            showToast('info', `사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
            return;
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.', [{ text: '확인' }]);
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1, // iOS 펜 마크업 적색 라인 손실 방지 (압축은 resizeForUpload 담당)
            base64: true,
            selectionLimit: MAX_PHOTOS - photos.length,
        });
        if (result.canceled) return;
        const resized = await Promise.all(result.assets.map(resizeForUpload));
        const newPhotos = resized.map(asset => {
            const ext = (asset.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
            return {
                uri: asset.uri,
                base64: asset.base64,
                ext,
            };
        });
        setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    }

    function removePhoto(index) {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    }

    // ── 제출 전 검증 (미충족 항목별 안내 토스트) ──
    function handleSubmitPress() {
        if (submitting) return;
        if (contentLen < 20) { showToast('info', '후기를 20자 이상 작성해주세요.'); return; }
        if (contentLen > 1000) { showToast('info', '후기는 1000자 이내로 작성해주세요.'); return; }
        if (!courses.slice(0, MIN_COURSES).every(c => c.placeName.trim())) {
            showToast('info', '코스를 2곳 이상 입력해주세요.');
            return;
        }
        if (photos.length < MIN_PHOTOS) {
            showToast('info', '사진을 2장 이상 첨부해주세요.');
            return;
        }
        setConfirmVisible(true);
    }

    // ── 제출 ──
    async function handleSubmit() {
        setConfirmVisible(false);
        if (submitting) return;
        setSubmitting(true);
        Keyboard.dismiss();
        try {
            const photoData = photos.map(p => ({
                base: `data:image/${p.ext};base64,${p.base64}`,
                ext: p.ext,
            }));
            await reviewApi.createReview({
                matchIdx: Number(matchIdx),
                content: content.trim(),
                courses: courses
                    .filter(c => c.placeName.trim())
                    .map((c, i) => ({
                        placeName: c.placeName.trim(),
                        address: c.address || '',
                        roadAddress: c.roadAddress || '',
                        lat: (c.lat !== undefined && c.lat !== null) ? Number(c.lat) : null,
                        lng: (c.lng !== undefined && c.lng !== null) ? Number(c.lng) : null,
                        sortOrder: i,
                    })),
                photos: photoData,
            });
            usePointStore.getState().fetchBalance();
            setSuccessVisible(true);
        } catch (e) {
            const msg = e?.response?.data?.message || '후기 등록에 실패했습니다.';
            showToast('error', msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    testID="review-write-back-btn"
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.backIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>드라이브 후기 작성</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                keyboardShouldPersistTaps="handled"
            >
                {/* 포인트 안내 */}
                <View style={styles.section}>
                    {reviewBonusEnabled && (
                        <Text style={styles.pointGuide} allowFontScaling={false}>
                            {'드라이브 후기를 남겨주시면 '}
                            <Text style={styles.pointHighlight}>500포인트</Text>
                            {'가 지급됩니다.'}
                        </Text>
                    )}
                    <Text style={styles.pointGuide} allowFontScaling={false}>
                        드라이브 후기는 모든 회원들에게 공개됩니다.
                    </Text>
                </View>

                {/* 후기 입력 */}
                <View style={styles.section}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>후기</Text>
                        <View style={styles.fieldLabelRight}>
                            <Text style={styles.fieldGuide} allowFontScaling={false}>20자이상~1000이내</Text>
                            <Text style={[styles.fieldGuide, contentLen > 0 && contentLen < 20 && styles.fieldGuideWarn]} allowFontScaling={false}>
                                {contentLen}/1000
                            </Text>
                        </View>
                    </View>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="모든 유저가 볼 수 있는 드라이브 코스 후기를 남겨주세요."
                        placeholderTextColor={COLORS.grayCC}
                        value={content}
                        onChangeText={t => setContent(t.slice(0, 1000))}
                        multiline
                        maxLength={1000}
                        allowFontScaling={false}
                        testID="review-write-content-input"
                        textAlignVertical="top"
                    />
                </View>

                {/* 드라이브 코스 */}
                <View style={styles.section}>
                    <View style={styles.courseTitleWrap}>
                        <Text style={styles.courseTitleMain} allowFontScaling={false}>드라이브 코스를 등록해 주세요.</Text>
                        <Text style={styles.courseTitleSub} allowFontScaling={false}>(필수 2코스, 최대 10코스)</Text>
                    </View>

                    {courses.map((course, index) => {
                        const isRequired = index < MIN_COURSES;
                        const isFilled = !!course.placeName.trim();
                        return (
                            <View key={index} style={styles.courseRow}>
                                <Text style={styles.courseNum} allowFontScaling={false}>{index + 1}</Text>
                                <View style={styles.courseInputWrap}>
                                    <View style={styles.courseInputRow}>
                                        <View style={[styles.courseInput, isFilled && styles.courseInputFilled]}>
                                            <Text
                                                style={[styles.courseInputText, !isFilled && styles.courseInputPlaceholder]}
                                                allowFontScaling={false}
                                                numberOfLines={1}
                                            >
                                                {isFilled ? course.placeName : '장소를 입력하세요'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.searchBtn}
                                            onPress={() => openSearch(index)}
                                            testID={`review-write-search-btn-${index}`}
                                        >
                                            <Text style={styles.searchBtnText} allowFontScaling={false}>장소 검색</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {isFilled && (course.roadAddress || course.address) ? (
                                        <View style={styles.courseAddressBox}>
                                            <Text style={styles.courseAddressText} allowFontScaling={false} numberOfLines={1}>
                                                {course.roadAddress || course.address}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                                {isRequired ? (
                                    <Text style={styles.requiredLabel} allowFontScaling={false}>필수</Text>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => removeCourse(index)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        testID={`review-write-remove-course-${index}`}
                                    >
                                        <View style={styles.minusIcon}>
                                            <View style={styles.minusLine} />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}

                    {courses.length < MAX_COURSES && (
                        <TouchableOpacity
                            style={styles.addCourseBtn}
                            onPress={addCourse}
                            testID="review-write-add-course-btn"
                        >
                            <Image
                                source={require('../../assets/icons/add-fill.svg')}
                                style={styles.addCourseIcon}
                                contentFit="contain"
                                tintColor={COLORS.primary}
                            />
                            <Text style={styles.addCourseBtnText} allowFontScaling={false}>장소 추가</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 사진 업로드 */}
                <View style={styles.section}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>사진 업로드 (2장 이상 필수)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
                        {photos.length < MAX_PHOTOS && (
                            <TouchableOpacity
                                style={styles.photoAdd}
                                onPress={pickPhoto}
                                testID="review-write-photo-add-btn"
                            >
                                <Image
                                    source={require('../../assets/icons/image-add.svg')}
                                    style={styles.photoAddIcon}
                                    contentFit="contain"
                                    tintColor={COLORS.grayCC}
                                />
                            </TouchableOpacity>
                        )}
                        {photos.map((photo, i) => (
                            <View key={i} style={styles.photoItem}>
                                <Image source={{ uri: photo.uri }} style={styles.photoThumb} contentFit="cover" />
                                <TouchableOpacity
                                    style={styles.photoDelete}
                                    onPress={() => removePhoto(i)}
                                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                                    testID={`review-write-photo-delete-${i}`}
                                >
                                    <View style={styles.photoDeleteInner}>
                                        <Image
                                            source={require('../../assets/icons/close.svg')}
                                            style={styles.photoDeleteIcon}
                                            contentFit="contain"
                                            tintColor={COLORS.white}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 신고/차단 */}
                {/* <View style={styles.reportRow}>
                    <TouchableOpacity
                        onPress={() => targetUserIdx && router.navigate('/profile/' + targetUserIdx + '?action=report')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID="review-write-report-btn"
                    >
                        <Text style={styles.reportLink} allowFontScaling={false}>신고하기</Text>
                    </TouchableOpacity>
                    <View style={styles.reportDivider} />
                    <TouchableOpacity
                        onPress={() => targetUserIdx && router.navigate('/profile/' + targetUserIdx + '?action=block')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID="review-write-block-btn"
                    >
                        <Text style={styles.reportLink} allowFontScaling={false}>차단하기</Text>
                    </TouchableOpacity>
                </View> */}
            </ScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                {/* <TouchableOpacity
                    style={styles.giftBtn}
                    onPress={() => showToast('info', '선물하기는 준비 중입니다.')}
                    activeOpacity={0.85}
                    testID="review-write-gift-btn"
                >
                    <Text style={styles.giftBtnText} allowFontScaling={false}>선물하기</Text>
                </TouchableOpacity> */}
                <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                    onPress={handleSubmitPress}
                    disabled={submitting}
                    activeOpacity={0.85}
                    testID="review-write-submit-btn"
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText} allowFontScaling={false}>등록</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* 등록 전 확인 팝업 */}
            <Modal
                visible={confirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.popup}>
                        <TouchableOpacity
                            style={styles.popupClose}
                            onPress={() => setConfirmVisible(false)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            testID="review-write-confirm-close-btn"
                        >
                            <Image
                                source={require('../../assets/icons/close.svg')}
                                style={styles.popupCloseIcon}
                                contentFit="contain"
                                tintColor={COLORS.black}
                            />
                        </TouchableOpacity>
                        <View style={styles.popupBody}>
                            <View style={styles.popupTextWrap}>
                                <Text style={styles.popupTitle} allowFontScaling={false}>드라이브 후기 등록</Text>
                                <Text style={styles.popupDesc} allowFontScaling={false}>
                                    {'작성 완료한 후에는 수정/삭제가\n불가능하므로 신중하게 남겨주세요.'}
                                </Text>
                            </View>
                            <View style={styles.popupBtns}>
                                <TouchableOpacity
                                    style={styles.popupCancelBtn}
                                    onPress={() => setConfirmVisible(false)}
                                    testID="review-write-confirm-cancel-btn"
                                >
                                    <Text style={styles.popupCancelText} allowFontScaling={false}>닫기</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.popupConfirmBtn}
                                    onPress={handleSubmit}
                                    testID="review-write-confirm-ok-btn"
                                >
                                    <Text style={styles.popupConfirmText} allowFontScaling={false}>확인</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 등록 후 성공 팝업 */}
            <Modal
                visible={successVisible}
                transparent
                animationType="fade"
                onRequestClose={() => { setSuccessVisible(false); navigateAfterSuccess(); }}
            >
                <View style={styles.overlay}>
                    <View style={styles.popup}>
                        <TouchableOpacity
                            style={styles.popupClose}
                            onPress={() => { setSuccessVisible(false); navigateAfterSuccess(); }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            testID="review-write-success-close-btn"
                        >
                            <Image
                                source={require('../../assets/icons/close.svg')}
                                style={styles.popupCloseIcon}
                                contentFit="contain"
                                tintColor={COLORS.black}
                            />
                        </TouchableOpacity>
                        <View style={styles.popupBody}>
                            <View style={styles.popupTextWrap}>
                                {reviewBonusEnabled ? (
                                    <Text style={styles.popupSuccessTitle} allowFontScaling={false}>
                                        <Text style={styles.popupPointText}>500P</Text>
                                        {'가 지급되었습니다.'}
                                    </Text>
                                ) : (
                                    <Text style={styles.popupSuccessTitle} allowFontScaling={false}>
                                        {'드라이브 후기가 등록되었습니다.'}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.popupBtns}>
                                <TouchableOpacity
                                    style={styles.popupConfirmBtn}
                                    onPress={() => { setSuccessVisible(false); navigateAfterSuccess(); }}
                                    testID="review-write-success-ok-btn"
                                >
                                    <Text style={styles.popupConfirmText} allowFontScaling={false}>확인</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.white },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        gap: 12,
    },
    backBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    backIcon: { width: 24, height: 24 },
    headerTitle: {
        flex: 1,
        fontSize: FONT_SIZE.h3,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 30,
    },
    scrollContent: { flexGrow: 1 },
    section: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        gap: 8,
    },

    // 포인트 안내
    pointGuide: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    pointHighlight: { fontFamily: FONTS.extraBold, color: '#F64B17' },

    // 후기 입력
    fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    fieldLabelRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fieldLabel: { fontSize: FONT_SIZE.body, fontFamily: FONTS.medium, color: COLORS.black },
    fieldGuide: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMedium, lineHeight: 16 },
    fieldGuideWarn: { color: COLORS.error },
    contentInput: {
        height: 200,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        padding: 12,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 3,
    },

    // 드라이브 코스
    courseTitleWrap: { gap: 4 },
    courseTitleMain: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    courseTitleSub: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
    courseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    courseNum: {
        width: 8,
        height: 52,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 52,
    },
    courseInputWrap: { flex: 1, gap: 8 },
    courseInputRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    courseInput: {
        flex: 1,
        height: 52,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    courseInputFilled: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 3,
    },
    courseInputText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    courseInputPlaceholder: { color: COLORS.grayCC },
    searchBtn: {
        width: 80,
        height: 52,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    searchBtnText: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 20,
    },
    courseAddressBox: {
        height: 44,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    courseAddressText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    requiredLabel: {
        width: 32,
        height: 52,
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.semiBold,
        color: '#E02E2E',
        lineHeight: 52,
        textAlign: 'center',
    },
    removeBtn: {
        width: 32,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    minusIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.textMedium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    minusLine: {
        width: 10,
        height: 1.5,
        backgroundColor: COLORS.textMedium,
    },
    addCourseBtn: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    addCourseIcon: { width: 20, height: 20 },
    addCourseBtnText: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 20,
    },

    // 사진 업로드
    photoList: { gap: 8, paddingVertical: 4 },
    photoAdd: {
        width: 64,
        height: 64,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoAddIcon: { width: 24, height: 24 },
    photoItem: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden' },
    photoThumb: { width: 64, height: 64, borderRadius: 8 },
    photoDelete: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    photoDeleteInner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#070B25',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    photoDeleteIcon: { width: 8, height: 8 },

    // 신고/차단
    reportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.md,
    },
    reportLink: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    reportDivider: { width: 1, height: 12, backgroundColor: COLORS.grayCC },

    // 하단 버튼
    bottomBar: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.grayEE,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    giftBtn: {
        width: 120,
        height: 52,
        backgroundColor: COLORS.grayEE,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    giftBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textMedium,
        lineHeight: 24,
    },
    submitBtn: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: { backgroundColor: COLORS.grayEE },
    submitBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },

    // 공통 팝업
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    popup: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
    },
    popupClose: {
        alignSelf: 'flex-end',
        padding: 12,
    },
    popupCloseIcon: { width: 24, height: 24 },
    popupBody: { paddingHorizontal: 32, paddingBottom: 32, gap: 32 },
    popupTextWrap: { gap: 8, alignItems: 'center' },
    popupTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
        textAlign: 'center',
        width: '100%',
    },
    popupDesc: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        lineHeight: 20,
        textAlign: 'center',
        width: '100%',
    },
    popupSuccessTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
        textAlign: 'center',
        width: '100%',
    },
    popupPointText: { color: '#F64B17' },
    popupBtns: { flexDirection: 'row', gap: 8 },
    popupCancelBtn: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.grayEE,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupCancelText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textMedium,
        lineHeight: 24,
    },
    popupConfirmBtn: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupConfirmText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },
});
