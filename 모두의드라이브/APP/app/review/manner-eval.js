import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, Modal, ActivityIndicator, Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import dayjs from 'dayjs';

import useConfigStore from '../../src/store/configStore';
import { reviewApi } from '../../src/api/review';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import usePointStore from '../../src/store/pointStore';
import ReportBlockMenu from '../../src/components/ReportBlockMenu';

const THUMB_SIZE = 24;
const BUBBLE_WIDTH = 52;
const BUBBLE_HEIGHT = 26;
const ARROW_SIZE = 5;

function computeAgeGroup(birthDate) {
    if (!birthDate) return '';
    const year = dayjs(birthDate).year();
    if (!year) return '';
    const ageGroup = Math.floor((dayjs().year() - year) / 10) * 10;
    return ageGroup >= 20 && ageGroup <= 60 ? `${ageGroup}대` : '';
}

function ReportBlockLinks({ targetUserIdx, targetNickname, matchIdx, testIDPrefix }) {
    if (!targetUserIdx) return null;
    return (
        <View style={styles.reportRow}>
            <ReportBlockMenu
                targetIdx={targetUserIdx}
                targetNickname={targetNickname}
                matchIdx={matchIdx}
                reportType="user"
                directAction="report"
            >
                <View
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    testID={`${testIDPrefix}-report-btn`}
                >
                    <Text style={styles.reportLink} allowFontScaling={false}>신고하기</Text>
                </View>
            </ReportBlockMenu>
            <View style={styles.reportDivider} />
            <ReportBlockMenu
                targetIdx={targetUserIdx}
                targetNickname={targetNickname}
                matchIdx={matchIdx}
                reportType="user"
                directAction="block"
            >
                <View
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    testID={`${testIDPrefix}-block-btn`}
                >
                    <Text style={styles.reportLink} allowFontScaling={false}>차단하기</Text>
                </View>
            </ReportBlockMenu>
        </View>
    );
}

export default function MannerEvalScreen() {
    const {
        matchIdx, targetNickname, targetUserIdx,
        targetRole, targetGender, targetBirthDate, targetDriveLevel, targetProfileImage,
    } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: frameWidth } = useSafeAreaFrame();
    const configStore = useConfigStore();
    const reviewBonusEnabled = useConfigStore(s => s.reviewBonusEnabled);

    const [mannerScore, setMannerScore] = useState(90);
    const [selectedItems, setSelectedItems] = useState([]);
    const [content, setContent] = useState('');
    const [sliderWidth, setSliderWidth] = useState(0);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasMyDriveReview, setHasMyDriveReview] = useState(false);

    useEffect(() => {
        if (!matchIdx) return;
        (async () => {
            try {
                const res = await reviewApi.checkMyReview(Number(matchIdx));
                if (res?.data?.hasMyDriveReview) setHasMyDriveReview(true);
            } catch (_) {}
        })();
    }, [matchIdx]);

    const allEvalItems = configStore.mannerEvalItems || [];
    const evalItems = targetRole
        ? allEvalItems.filter(i => !i.targetType || i.targetType === targetRole)
        : allEvalItems;
    const driveLevelLabel = (configStore.driveLevels || [])
        .find(d => d.key === targetDriveLevel)?.label?.replace(/\s*\(.*\)$/, '') || '';
    const ageGroup = computeAgeGroup(targetBirthDate);
    const genderLabel = targetGender === 'M' ? '남성' : targetGender === 'F' ? '여성' : '';
    const roleLabel = targetRole === 'owner' ? '오너' : targetRole === 'guest' ? '게스트' : '';

    const contentLen = content.length;
    const canSubmit = selectedItems.length > 0 && contentLen >= 50 && contentLen <= 1000;

    const trackWidth = sliderWidth > 0 ? sliderWidth : (frameWidth - 40);
    const bubbleLeft = ((mannerScore - 50) / 50) * (trackWidth - THUMB_SIZE) + THUMB_SIZE / 2 - BUBBLE_WIDTH / 2;

    function toggleItem(key) {
        setSelectedItems(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    async function handleSubmit() {
        setConfirmVisible(false);
        if (submitting) return;
        setSubmitting(true);
        Keyboard.dismiss();
        try {
            const res = await reviewApi.createMannerEval({
                matchIdx: Number(matchIdx),
                evaluateeIdx: targetUserIdx ? Number(targetUserIdx) : undefined,
                mannerScore,
                items: selectedItems,
                content: content.trim(),
            });
            setHasMyDriveReview(!!res?.data?.hasMyDriveReview);
            usePointStore.getState().fetchBalance();
            setSuccessVisible(true);
        } catch (e) {
            const msg = e?.response?.data?.message || '매너 평가 등록에 실패했습니다.';
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
                    testID="manner-eval-back-btn"
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.backIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>리뷰 작성</Text>
            </View>

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                keyboardShouldPersistTaps="handled"
            >
                {/* 포인트 안내 */}
                {reviewBonusEnabled && (
                    <View style={[styles.section, { paddingTop: 0 }]}>
                        <Text style={styles.pointGuide} allowFontScaling={false}>
                            {'후기를 남겨주시면 '}
                            <Text style={styles.pointHighlight}>500 포인트</Text>
                            {'가 지급됩니다.'}
                        </Text>
                    </View>
                )}

                {/* 상대방 프로필 카드 */}
                <View style={styles.section}>
                    <View style={styles.profileCard}>
                        <View style={styles.profileRow}>
                            <View style={styles.profileAvatarWrap}>
                                <Image
                                    source={
                                        targetProfileImage
                                            ? { uri: STORAGE_URL + targetProfileImage }
                                            : require('../../assets/icons/profile-avatar.svg')
                                    }
                                    style={styles.profileAvatar}
                                    contentFit="cover"
                                />
                            </View>
                            <View style={styles.profileInfo}>
                                <View style={styles.profileNameRow}>
                                    <Text style={styles.profileNickname} allowFontScaling={false} numberOfLines={1}>
                                        {targetNickname || ''}
                                    </Text>
                                    {!!roleLabel && (
                                        <View style={styles.roleBadge}>
                                            <Text style={styles.roleBadgeText} allowFontScaling={false}>{roleLabel}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.profileTagRow}>
                                    {!!ageGroup && (
                                        <View style={styles.profileTag}>
                                            <Text style={styles.profileTagText} allowFontScaling={false}>{ageGroup}</Text>
                                        </View>
                                    )}
                                    {!!genderLabel && (
                                        <View style={styles.profileTag}>
                                            <Text style={styles.profileTagText} allowFontScaling={false}>{genderLabel}</Text>
                                        </View>
                                    )}
                                    {!!driveLevelLabel && (
                                        <View style={styles.profileTag}>
                                            <Text style={styles.profileTagText} allowFontScaling={false}>{driveLevelLabel}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 매너 점수 슬라이더 */}
                <View style={styles.section}>
                    <View style={styles.sliderLabel}>
                        <Image
                            source={require('../../assets/icons/smile.svg')}
                            style={{ width: 18, height: 18 }}
                            contentFit="contain"
                        />
                        <Text style={styles.sliderTitle} allowFontScaling={false}>매너를 평가해 주세요</Text>
                    </View>
                    <View
                        style={styles.sliderWrap}
                        onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}
                    >
                        {sliderWidth > 0 && (
                            <View style={[styles.scoreBubbleWrap, { left: bubbleLeft }]}>
                                <View style={styles.scoreBubble}>
                                    <Text style={styles.scoreBubbleText} allowFontScaling={false}>{mannerScore}점</Text>
                                </View>
                                <View style={styles.scoreBubbleArrow} />
                            </View>
                        )}
                        <Slider
                            style={styles.slider}
                            minimumValue={50}
                            maximumValue={100}
                            step={1}
                            value={mannerScore}
                            onValueChange={setMannerScore}
                            minimumTrackTintColor={COLORS.secondary}
                            maximumTrackTintColor={COLORS.grayEE}
                            thumbTintColor={COLORS.secondary}
                        />
                    </View>
                </View>

                {/* 평가 항목 */}
                <View style={styles.section}>
                    {evalItems.map(item => {
                        const selected = selectedItems.includes(item.key);
                        const labelText = item.emoji ? `${item.emoji} ${item.label}` : item.label;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={[styles.evalItem, selected && styles.evalItemSelected]}
                                onPress={() => toggleItem(item.key)}
                                activeOpacity={0.8}
                                testID={`manner-eval-item-${item.key}`}
                            >
                                {selected && (
                                    <Image
                                        source={require('../../assets/icons/check-stroke.svg')}
                                        style={styles.evalCheckIcon}
                                        contentFit="contain"
                                    />
                                )}
                                <Text
                                    style={[styles.evalItemText, selected && styles.evalItemTextSelected]}
                                    allowFontScaling={false}
                                >
                                    {labelText}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 후기 입력 */}
                <View style={styles.section}>
                    <View style={styles.contentLabelRow}>
                        <Text style={styles.contentLabel} allowFontScaling={false}>후기</Text>
                        <Text style={styles.contentLenGuide} allowFontScaling={false}>50자이상~1000이내</Text>
                    </View>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="후기를 남겨주세요."
                        placeholderTextColor={COLORS.grayCC}
                        value={content}
                        onChangeText={t => setContent(t.slice(0, 1000))}
                        multiline
                        maxLength={1000}
                        allowFontScaling={false}
                        testID="manner-eval-content-input"
                    />
                    <Text style={styles.contentCounter} allowFontScaling={false}>{contentLen}/1000</Text>
                </View>

                {/* 신고/차단 링크 */}
                <ReportBlockLinks
                    targetUserIdx={targetUserIdx}
                    targetNickname={targetNickname}
                    matchIdx={matchIdx}
                    testIDPrefix="manner-eval"
                />
                {/* <Text style={styles.privacyNote} allowFontScaling={false}>
                    매너평가는 회원님과 상대방에게만 공개됩니다.
                </Text> */}
            </KeyboardAwareScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                    onPress={() => canSubmit && setConfirmVisible(true)}
                    disabled={!canSubmit || submitting}
                    activeOpacity={0.85}
                    testID="manner-eval-submit-btn"
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
                            testID="manner-eval-confirm-close-btn"
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
                                <Text style={styles.popupTitle} allowFontScaling={false}>평가 및 리뷰 등록</Text>
                                <Text style={styles.popupDesc} allowFontScaling={false}>
                                    {'평가를 완료한 후에는 수정/삭제가\n불가능하므로 신중하게 남겨주세요.'}
                                </Text>
                            </View>
                            <View style={styles.popupBtns}>
                                <TouchableOpacity
                                    style={styles.popupCancelBtn}
                                    onPress={() => setConfirmVisible(false)}
                                    testID="manner-eval-confirm-cancel-btn"
                                >
                                    <Text style={styles.popupCancelText} allowFontScaling={false}>닫기</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.popupConfirmBtn}
                                    onPress={handleSubmit}
                                    testID="manner-eval-confirm-ok-btn"
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
                onRequestClose={() => { setSuccessVisible(false); router.back(); }}
            >
                <View style={styles.overlay}>
                    <View style={styles.popup}>
                        <TouchableOpacity
                            style={styles.popupClose}
                            onPress={() => { setSuccessVisible(false); router.back(); }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            testID="manner-eval-success-x-btn"
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
                                        {'매너 평가가 등록되었습니다.'}
                                    </Text>
                                )}
                                {!hasMyDriveReview && reviewBonusEnabled && (
                                    <>
                                        <Text style={styles.popupSuccessTitle2} allowFontScaling={false}>
                                            <Text style={styles.popupPointText}>+500P</Text>
                                            {' 더 받기'}
                                        </Text>
                                        <Text style={styles.popupDesc} allowFontScaling={false}>
                                            {'드라이브 후기를 남겨주시면\n추가 '}
                                            <Text style={styles.popupPointText}>500P</Text>
                                            {'가 지급됩니다.'}
                                        </Text>
                                    </>
                                )}
                                {!hasMyDriveReview && !reviewBonusEnabled && (
                                    <Text style={styles.popupDesc} allowFontScaling={false}>
                                        {'드라이브 후기도 함께 남겨주세요.'}
                                    </Text>
                                )}
                            </View>
                            {hasMyDriveReview ? (
                                <View style={styles.popupBtns}>
                                    <TouchableOpacity
                                        style={styles.popupConfirmBtn}
                                        onPress={() => { setSuccessVisible(false); router.back(); }}
                                        testID="manner-eval-success-ok-btn"
                                    >
                                        <Text style={styles.popupConfirmText} allowFontScaling={false}>확인</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.popupBtns}>
                                    <TouchableOpacity
                                        style={styles.popupCancelBtn}
                                        onPress={() => { setSuccessVisible(false); router.back(); }}
                                        testID="manner-eval-success-close-btn"
                                    >
                                        <Text style={styles.popupCancelText} allowFontScaling={false}>닫기</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.popupConfirmBtn}
                                        onPress={() => {
                                            setSuccessVisible(false);
                                            router.replace('/review/write?matchIdx=' + matchIdx + '&targetNickname=' + (targetNickname || '') + '&targetUserIdx=' + (targetUserIdx || ''));
                                        }}
                                        testID="manner-eval-success-ok-btn"
                                    >
                                        <Text style={styles.popupConfirmText} allowFontScaling={false}>드라이브 후기</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        gap: 12,
    },
    backBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 30,
    },
    scrollContent: {
        flexGrow: 1,
    },
    section: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        gap: 8,
    },
    // 포인트 안내
    pointGuide: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    pointHighlight: {
        fontFamily: FONTS.extraBold,
        color: '#F64B17',
    },
    // 프로필 카드
    profileCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: SPACING.xl,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    profileAvatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        flexShrink: 0,
    },
    profileAvatar: {
        width: 52,
        height: 52,
    },
    profileInfo: {
        flex: 1,
        gap: 4,
    },
    profileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 4,
    },
    profileNickname: {
        flexShrink: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },
    roleBadge: {
        backgroundColor: COLORS.secondary,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 16,
    },
    profileTagRow: {
        flexDirection: 'row',
        gap: 2,
    },
    profileTag: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 100,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileTagText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 16,
    },
    // 슬라이더
    sliderLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sliderTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    sliderWrap: {
        position: 'relative',
        paddingTop: BUBBLE_HEIGHT + ARROW_SIZE + 6,
    },
    scoreBubbleWrap: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
        width: BUBBLE_WIDTH,
    },
    scoreBubble: {
        backgroundColor: COLORS.secondary,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignItems: 'center',
    },
    scoreBubbleText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 16,
    },
    scoreBubbleArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderTopWidth: ARROW_SIZE,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS.secondary,
    },
    slider: {
        width: '100%',
        height: 20,
    },
    // 평가 항목
    evalItem: {
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    evalItemSelected: {
        borderColor: COLORS.primary,
    },
    evalCheckIcon: {
        position: 'absolute',
        left: 11,
        width: 20,
        height: 20,
    },
    evalItemText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: '#969698',
        lineHeight: 24,
        textAlign: 'center',
    },
    evalItemTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    // 후기 입력
    contentLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contentLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.black,
        lineHeight: 20,
    },
    contentLenGuide: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.regular,
        color: '#686869',
        lineHeight: 16,
    },
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
        textAlignVertical: 'top',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 0,
    },
    contentCounter: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.regular,
        color: '#969698',
        lineHeight: 16,
        alignSelf: 'flex-end',
    },
    // 신고/차단
    reportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingTop: SPACING.xl,
    },
    reportLink: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    reportDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#C5C5CD',
    },
    privacyNote: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#686869',
        lineHeight: 20,
        textAlign: 'center',
        paddingTop: 8,
        paddingHorizontal: SPACING.xl,
    },
    // 하단 버튼
    bottomBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#C5C5CD',
    },
    submitBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },
    // 팝업
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    popup: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        width: '100%',
    },
    popupClose: {
        alignSelf: 'flex-end',
        padding: 12,
    },
    popupCloseIcon: { width: 24, height: 24 },
    popupBody: {
        paddingHorizontal: 32,
        paddingBottom: 32,
        gap: 32,
    },
    popupTextWrap: {
        gap: 8,
        alignItems: 'center',
    },
    popupTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
        textAlign: 'center',
    },
    popupSuccessTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
        textAlign: 'center',
    },
    popupSuccessTitle2: {
        fontSize: FONT_SIZE.h3,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 30,
        textAlign: 'center',
    },
    popupPointText: {
        color: '#F64B17',
    },
    popupDesc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        lineHeight: 20,
        textAlign: 'center',
    },
    popupBtns: {
        flexDirection: 'row',
        gap: 8,
    },
    popupCancelBtn: {
        flex: 1,
        height: 52,
        backgroundColor: '#EEEEEE',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupCancelText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: '#969698',
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
