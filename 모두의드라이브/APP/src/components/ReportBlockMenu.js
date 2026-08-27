import { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, Modal,
    ActivityIndicator, TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { authApi } from '../api/auth';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../constants/config';
import { showToast } from '../utils/toast';

const REPORT_REASONS = [
    { key: 'ad_spam', label: '광고/홍보/허위 게시물' },
    { key: 'offensive', label: '불쾌감을 주는 언행(욕설,음란,비방 등)' },
    { key: 'abuse', label: '어뷰징성(좋아요 및 댓글 유도) 게시물' },
    { key: 'other', label: '기타(신고 사유 작성)' },
];

export default function ReportBlockMenu({
    targetIdx,
    targetNickname,
    matchIdx,
    reportType = 'user',
    directAction,
    children,
}) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const reportSheetRef = useRef(null);
    const otherInputRef = useRef(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [otherModalVisible, setOtherModalVisible] = useState(false);
    const [otherReasonText, setOtherReasonText] = useState('');
    const [reporting, setReporting] = useState(false);
    const [blocking, setBlocking] = useState(false);

    const handleTriggerPress = useCallback(() => {
        if (directAction === 'report') {
            reportSheetRef.current?.present();
        } else if (directAction === 'block') {
            handleBlockConfirm();
        } else {
            setMenuVisible(true);
        }
    }, [directAction]);

    useEffect(() => {
        if (!otherModalVisible) return;
        const timer = setTimeout(() => {
            otherInputRef.current?.focus();
        }, 450);
        return () => clearTimeout(timer);
    }, [otherModalVisible]);

    const renderBackdrop = useCallback(
        (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />,
        []
    );

    function handleMenuAction(key) {
        setMenuVisible(false);
        if (key === 'report') {
            setTimeout(() => {
                reportSheetRef.current?.present();
            }, 300);
        } else if (key === 'block') {
            handleBlockConfirm();
        }
    }

    function handleBlockConfirm() {
        Alert.alert(
            '차단하기',
            `${targetNickname || '이 사용자'}를 차단하시겠습니까?\n차단 시 서로의 게시글과 프로필이 표시되지 않습니다.`,
            [
                { text: '취소', style: 'cancel' },
                { text: '차단', style: 'destructive', onPress: doBlock },
            ]
        );
    }

    async function doBlock() {
        if (blocking) return;
        setBlocking(true);
        try {
            await authApi.blockUser(Number(targetIdx));
            showToast('success', '사용자를 차단했습니다.');
            router.back();
        } catch (e) {
            showToast('error', e?.response?.data?.message || '차단에 실패했습니다.');
        } finally {
            setBlocking(false);
        }
    }

    function handleReasonSelect(key) {
        if (key === 'other') {
            reportSheetRef.current?.dismiss();
            setTimeout(() => {
                setOtherReasonText('');
                setOtherModalVisible(true);
            }, 300);
        } else {
            reportSheetRef.current?.dismiss();
            setTimeout(() => {
                Alert.alert(
                    '신고하기',
                    '신고하시겠습니까?',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '신고하기', onPress: () => submitReport(key) },
                    ]
                );
            }, 300);
        }
    }

    async function submitReport(reason, detail) {
        if (reporting) return;
        setReporting(true);
        try {
            await authApi.reportUser({
                reportedIdx: Number(targetIdx),
                matchIdx: matchIdx ? Number(matchIdx) : undefined,
                reportType,
                reason,
                detail: detail || undefined,
            });
            showToast('success', '신고가 접수되었습니다.');
        } catch (e) {
            showToast('error', e?.response?.data?.message || '신고에 실패했습니다.');
        } finally {
            setReporting(false);
        }
    }

    function handleOtherSubmit() {
        if (!otherReasonText.trim()) {
            showToast('error', '신고 사유를 입력해주세요.');
            return;
        }
        setOtherModalVisible(false);
        submitReport('other', otherReasonText.trim());
    }

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleTriggerPress}
                testID={
                    directAction === 'report' ? 'report-direct-trigger'
                    : directAction === 'block' ? 'block-direct-trigger'
                    : 'report-block-trigger'
                }
            >
                {children}
            </TouchableOpacity>

            {/* 액션시트 */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={s.menuOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={[s.menuSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
                        <TouchableOpacity
                            style={s.menuItem}
                            testID="report-menu-report"
                            onPress={() => handleMenuAction('report')}
                        >
                            <Text style={s.menuItemText} allowFontScaling={false}>신고하기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.menuItem}
                            testID="report-menu-block"
                            onPress={() => handleMenuAction('block')}
                        >
                            <Text style={[s.menuItemText, s.menuItemDestructive]} allowFontScaling={false}>차단하기</Text>
                        </TouchableOpacity>
                        <View style={s.menuDivider} />
                        <TouchableOpacity
                            style={s.menuItem}
                            testID="report-menu-cancel"
                            onPress={() => setMenuVisible(false)}
                        >
                            <Text style={s.menuCancelText} allowFontScaling={false}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* 사유 선택 바텀시트 */}
            <BottomSheetModal
                ref={reportSheetRef}
                enableOverDrag={false}
                enableDynamicSizing={true}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={s.sheetIndicator}
                backgroundStyle={s.sheetBg}
            >
                <BottomSheetView style={[s.sheetContent, { paddingBottom: insets.bottom + SPACING.xl}]}>
                    <View style={s.header}>
                        <Text style={s.title} allowFontScaling={false}>
                            {reportType === 'post' ? '게시글 신고하기' : '유저 신고하기'}
                        </Text>
                        <Text style={s.subtitle} allowFontScaling={false}>신고 사유를 선택해 주세요.</Text>
                    </View>
                    <View style={s.reasonList}>
                        {REPORT_REASONS.map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                style={s.reasonBtn}
                                testID={`report-reason-${item.key}`}
                                onPress={() => handleReasonSelect(item.key)}
                            >
                                <Text style={[s.reasonBtnText, { fontSize: width < 340 ? FONT_SIZE.sm : FONT_SIZE.h4}]} allowFontScaling={false}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>

            {/* 기타 사유 작성 모달 */}
            <Modal
                visible={otherModalVisible}
                transparent
                navigationBarTranslucent
                statusBarTranslucent
                animationType="fade"
                onRequestClose={() => setOtherModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={s.otherOverlay}
                    behavior={'padding'}
                >
                    <Pressable style={s.otherDismiss} onPress={() => setOtherModalVisible(false)} testID="report-other-overlay" />
                    <Pressable style={s.otherCard} onPress={() => {}} testID="report-other-card">
                        <View style={s.otherInner}>
                            <Text style={s.otherTitle} allowFontScaling={false}>신고 사유 작성</Text>
                            <TextInput
                                ref={otherInputRef}
                                style={s.otherInput}
                                value={otherReasonText}
                                onChangeText={setOtherReasonText}
                                placeholder="내용을 입력하세요."
                                placeholderTextColor="#C5C5CD"
                                multiline
                                textAlignVertical="top"
                                maxLength={300}
                                allowFontScaling={false}
                                testID="report-other-input"
                            />
                            <View style={s.otherBtnRow}>
                                <TouchableOpacity
                                    style={s.otherCancelBtn}
                                    testID="report-other-cancel"
                                    onPress={() => setOtherModalVisible(false)}
                                >
                                    <Text style={s.otherCancelText} allowFontScaling={false}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.otherSubmitBtn]}
                                    testID="report-other-submit"
                                    onPress={handleOtherSubmit}
                                    disabled={!otherReasonText.trim() || reporting}
                                >
                                    {reporting ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <Text style={s.otherSubmitText} allowFontScaling={false}>신고하기</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    menuOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    menuSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: SPACING.md,
    },
    menuItem: {
        height: 56, alignItems: 'center', justifyContent: 'center',
    },
    menuItemText: {
        fontSize: FONT_SIZE.h4, fontFamily: FONTS.semiBold, color: COLORS.black, lineHeight: 24,
    },
    menuItemDestructive: { color: '#FF3B30' },
    menuDivider: {
        height: 8, backgroundColor: '#F5F5F5',
    },
    menuCancelText: {
        fontSize: FONT_SIZE.h4, fontFamily: FONTS.semiBold, color: COLORS.grayMedium, lineHeight: 24,
    },
    sheetIndicator: { backgroundColor: '#DDDDDD' },
    sheetBg: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    sheetContent: { flex: 1, paddingTop: SPACING.md },
    header: { paddingHorizontal: SPACING.xl, gap: 4, marginBottom: 12 },
    title: { fontSize: FONT_SIZE.h4, fontFamily: FONTS.extraBold, color: COLORS.black, lineHeight: 24 },
    subtitle: { fontSize: FONT_SIZE.sm, fontFamily: FONTS.regular, color: COLORS.grayMedium, lineHeight: 20 },
    reasonList: { paddingHorizontal: SPACING.xl, gap: 4 },
    reasonBtn: {
        height: 52, borderRadius: 12, borderWidth: 1,
        borderColor: COLORS.borderLight, paddingHorizontal: 20, justifyContent: 'center',
    },
    reasonBtnText: { fontSize: FONT_SIZE.h4, fontFamily: FONTS.semiBold, color: COLORS.grayMedium, lineHeight: 24 },
    otherOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        // 키보드 영역을 피해 약간 상단에 배치
        justifyContent: 'flex-start', alignItems: 'center',
        paddingHorizontal: SPACING.xl, paddingTop: 120,
    },
    otherDismiss: {
        ...StyleSheet.absoluteFillObject,
    },
    otherCard: {
        width: '100%', backgroundColor: COLORS.white,
        borderRadius: 20, padding: 12,
    },
    otherInner: { padding: 20, gap: 20 },
    otherTitle: {
        fontSize: FONT_SIZE.h4, fontFamily: FONTS.extraBold,
        color: COLORS.black, lineHeight: 24, textAlign: 'center',
    },
    otherInput: {
        height: 200, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 12,
        fontSize: FONT_SIZE.h4, fontFamily: FONTS.semiBold, color: COLORS.black, lineHeight: 24,
        shadowColor: COLORS.primary, shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
        backgroundColor: COLORS.white,
    },
    otherBtnRow: { flexDirection: 'row', gap: 8 },
    otherCancelBtn: {
        flex: 1, height: 52, borderRadius: 8,
        backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center',
    },
    otherCancelText: {
        fontSize: FONT_SIZE.h4, fontFamily: FONTS.semiBold, color: '#969698', lineHeight: 24,
    },
    otherSubmitBtn: {
        width: 150, height: 52, borderRadius: 8,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },
    otherSubmitBtnDisabled: { opacity: 0.5 },
    otherSubmitText: {
        fontSize: FONT_SIZE.h4, fontFamily: FONTS.semiBold, color: COLORS.white, lineHeight: 24,
    },
});
