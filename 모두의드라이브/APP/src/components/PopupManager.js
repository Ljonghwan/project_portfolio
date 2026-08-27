import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import usePopupStore from '../store/popupStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../constants/config';
import { useCoupon } from '../api/coupon';
import { showToast } from '../utils/toast';
import { setAllHiddenToday, setAllHiddenForOneHour } from '../utils/mainPopupStorage';
import { navigateByLinkType } from '../utils/navigateByLinkType';
const pointsRewardsIcon = require('../../assets/icons/points-rewards-card.svg');
const couponDecoIcon = require('../../assets/icons/coupon.svg');

function UpdateContent({ props, onClose }) {
    const { currentVersion, latestVersion, forceUpdate, iosStoreUrl, aosStoreUrl } = props;

    const handleUpdate = () => {
        const url = Platform.OS === 'ios' ? iosStoreUrl : aosStoreUrl;
        const isSafe = url?.startsWith('https://apps.apple.com/') || url?.startsWith('https://play.google.com/store/');
        if (url && isSafe) Linking.openURL(url);
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.infoSection}>
                    <Text style={styles.updateTitle}>업데이트가 필요해요</Text>
                    <Image
                        source={require('../../assets/icons/software-update.svg')}
                        style={styles.updateIcon}
                    />
                    <View style={styles.versionInfo}>
                        <Text style={styles.bodyText}>현재 버전 {currentVersion}</Text>
                        <Text style={styles.bodyText}>최신 버전 {latestVersion}</Text>
                    </View>
                </View>
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate} activeOpacity={0.85} testID="popup-update-confirm-btn">
                        <Text style={styles.primaryBtnText}>업데이트하기</Text>
                    </TouchableOpacity>
                    {!forceUpdate && (
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7} testID="popup-update-later-btn">
                            <Text style={styles.laterText}>다음에 하기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

function SuspendContent({ props, onClose }) {
    return (
        <View style={styles.suspendCard}>
            <Text style={styles.suspendTitle}>이용 정지된 회원입니다.</Text>
            <Text style={styles.suspendReason}>사유: {props.reason}</Text>
            <View style={styles.suspendButtons}>
                <TouchableOpacity style={styles.suspendBtn} onPress={onClose} testID="popup-suspend-ok-btn">
                    <Text style={styles.suspendBtnText}>확인</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function PointRewardContent({ props, onClose }) {
    return (
        <View style={styles.pointCard}>
            <View style={styles.pointContent}>
                <View style={styles.pointIconAndPoints}>
                    <Image source={pointsRewardsIcon} style={{ width: 64, height: 64 }} />
                    <Text style={styles.pointsText}>{props.points || '10,000'}P</Text>
                </View>
                <Text style={styles.pointMessage}>포인트가 지급되었습니다.</Text>
            </View>
        </View>
    );
}

function ConfirmContent({ props, onClose }) {
    return (
        <View style={styles.suspendCard}>
            <Text style={[styles.suspendTitle, props.titleColor && { color: props.titleColor }]}>{props.title}</Text>
            {props.message && <Text style={styles.suspendReason}>{props.message}</Text>}
            <View style={styles.confirmButtons}>
                {props.cancelText && (
                    <TouchableOpacity
                        style={[styles.confirmBtn, styles.confirmBtnCancel]}
                        onPress={() => { props.onCancel?.(); onClose(); }}
                        testID="popup-confirm-cancel-btn"
                    >
                        <Text style={styles.confirmBtnCancelText}>{props.cancelText}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.confirmBtn, styles.confirmBtnOk]}
                    onPress={() => { props.onConfirm?.(); onClose(); }}
                    testID="popup-confirm-ok-btn"
                >
                    <Text style={styles.confirmBtnOkText}>{props.confirmText || '확인'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ReferralPointEarnedContent({ props, onClose }) {
    const amount = props.amount || '10,000';
    return (
        <View style={styles.referralCard}>
            <View style={styles.referralContent}>
                <Text style={styles.referralMessage} allowFontScaling={false}>
                    <Text allowFontScaling={false}>친구에게 </Text>
                    <Text style={styles.referralAmount} allowFontScaling={false}>{amount}P</Text>
                    <Text allowFontScaling={false}> 혜택이 선물되었습니다!</Text>
                </Text>
            </View>
            <View style={styles.referralButtons}>
                <TouchableOpacity
                    style={styles.referralBtnClose}
                    onPress={() => { props.onCancel?.(); onClose(); }}
                    activeOpacity={0.85}
                    testID="popup-referral-close-btn"
                >
                    <Text style={styles.referralBtnCloseText} allowFontScaling={false}>닫기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.referralBtnConfirm}
                    onPress={() => { props.onConfirm?.(); onClose(); }}
                    activeOpacity={0.85}
                    testID="popup-referral-confirm-btn"
                >
                    <Text style={styles.referralBtnConfirmText} allowFontScaling={false}>확인</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function CouponUseContent({ props, onClose }) {
    const initialUsed = props.status === 'used';
    const isExpired = props.status === 'expired';
    const [used, setUsed] = useState(initialUsed);
    const [submitting, setSubmitting] = useState(false);
    const expireText = props.expireAt ? `유효기한: ${dayjs(props.expireAt).format('YYYY.MM.DD')}` : null;
    const readOnly = used || isExpired;

    const handleConfirm = async () => {
        if (submitting || used) return;
        setSubmitting(true);
        try {
            await useCoupon(props.userCouponIdx);
            setUsed(true);
            props.onUsed?.();
        } catch (e) {
            showToast('error', e?.message || '쿠폰 사용에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.couponCard}>
            <View style={styles.couponDecoWrap} pointerEvents="none">
                <Image source={couponDecoIcon} style={styles.couponDeco} contentFit="contain" />
            </View>
            <View style={styles.couponHeader}>
                <TouchableOpacity onPress={onClose} hitSlop={8} testID="popup-coupon-close-btn">
                    <Image
                        source={require('../../assets/icons/close.svg')}
                        style={{ width: 24, height: 24 }}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.couponBody}>
                <Text style={styles.couponTitle} allowFontScaling={false}>쿠폰 사용하기</Text>
                <View style={styles.couponImageWrap}>
                    {props.imageUrl ? (
                        <Image
                            source={{ uri: STORAGE_URL + props.imageUrl }}
                            style={styles.couponImage}
                        />
                    ) : (
                        <View style={styles.couponImage} />
                    )}
                </View>
                <View style={styles.couponInfo}>
                    <Text style={styles.couponInfoName} allowFontScaling={false}>
                        {props.couponName || '쿠폰'}
                    </Text>
                    <Text style={styles.couponInfoStore} allowFontScaling={false}>
                        {props.storeName || '매장명'}
                    </Text>
                    {expireText ? (
                        <Text style={styles.couponInfoExpire} allowFontScaling={false}>
                            {expireText}
                        </Text>
                    ) : null}
                </View>
                {readOnly ? (
                    <View style={styles.couponUsedStampWrap}>
                        <Image
                            source={isExpired
                                ? require("../../assets/icons/stamp2.svg")
                                : require("../../assets/icons/stamp.svg")}
                            style={styles.couponBigStamp}
                            contentFit="contain"
                        />
                    </View>
                ) : (
                    <>
                        <Text style={styles.couponHint} allowFontScaling={false}>
                            매장 직원에게 쿠폰을 보여주세요.
                        </Text>
                        <TouchableOpacity
                            style={[styles.couponBtn, submitting && { opacity: 0.7 }]}
                            onPress={handleConfirm}
                            disabled={submitting}
                            activeOpacity={0.85}
                            testID="popup-coupon-confirm-btn"
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={styles.couponBtnText} allowFontScaling={false}>
                                    매장 직원 확인
                                </Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

function MainPopupContent({ props, onClose }) {
    const router = useRouter();
    const popups = Array.isArray(props.popups) ? props.popups : [];
    const [pageIdx, setPageIdx] = useState(0);
    const [todayChecked, setTodayChecked] = useState(false);

    if (popups.length === 0) return null;

    const handleClose = async () => {
        if (todayChecked) {
            await setAllHiddenToday();
        } else {
            await setAllHiddenForOneHour();
        }
        onClose();
    };

    const handleImagePress = () => {
        const current = popups[pageIdx];
        if (!current) return;
        if (current.linkType && current.linkType !== 'none') {
            onClose();
            navigateByLinkType(router, current.linkType, current.linkTarget);
        }
    };

    return (
        <View style={styles.mainPopupCard}>
            <View style={styles.mainPopupBody}>
                {popups.length > 1 ? (
                    <PagerView
                        style={styles.mainPopupPager}
                        initialPage={0}
                        onPageSelected={(e) => setPageIdx(e.nativeEvent.position)}
                    >
                        {popups.map((p) => (
                            <Pressable
                                key={p.idx}
                                onPress={handleImagePress}
                                style={styles.mainPopupImageWrap}
                                testID={`popup-main-image-${p.idx}`}
                            >
                                <Image
                                    source={{ uri: STORAGE_URL + p.imageUrl }}
                                    style={styles.mainPopupImage}
                                    contentFit="cover"
                                />
                            </Pressable>
                        ))}
                    </PagerView>
                ) : (
                    <Pressable
                        onPress={handleImagePress}
                        style={styles.mainPopupImageWrap}
                        testID={`popup-main-image-${popups[0].idx}`}
                    >
                        <Image
                            source={{ uri: STORAGE_URL + popups[0].imageUrl }}
                            style={styles.mainPopupImage}
                            contentFit="cover"
                        />
                    </Pressable>
                )}
                {popups.length > 1 && (
                    <View style={styles.mainPopupIndicator}>
                        <Text style={styles.mainPopupIndicatorActive} allowFontScaling={false}>{pageIdx + 1}</Text>
                        <Text style={styles.mainPopupIndicatorTotal} allowFontScaling={false}>/{popups.length}</Text>
                    </View>
                )}
            </View>
            <View style={styles.mainPopupFooter}>
                <Pressable
                    style={styles.mainPopupTodayRow}
                    onPress={() => setTodayChecked(v => !v)}
                    testID="popup-main-today-toggle"
                >
                    <Image
                        source={todayChecked
                            ? require('../../assets/icons/check.svg')
                            : require('../../assets/icons/uncheck.svg')}
                        style={styles.mainPopupCheck}
                        contentFit="contain"
                    />
                    <Text style={styles.mainPopupTodayText} allowFontScaling={false}>오늘하루 보지 않기</Text>
                </Pressable>
                <TouchableOpacity
                    style={styles.mainPopupCloseBtn}
                    onPress={handleClose}
                    hitSlop={8}
                    testID="popup-main-close-btn"
                >
                    <Image
                        source={require('../../assets/icons/close.svg')}
                        style={styles.mainPopupCloseIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function WithdrawConfirmContent({ props, onClose }) {
    return (
        <View style={styles.withdrawCard}>
            <View style={styles.withdrawContent}>
                <Text style={styles.withdrawMessage} allowFontScaling={false}>
                    탈퇴하시겠습니까?
                </Text>
                <View style={styles.withdrawButtons}>
                    <TouchableOpacity
                        style={styles.withdrawBtnLeft}
                        onPress={() => { onClose(); props.onConfirm?.(); }}
                        activeOpacity={0.85}
                        testID="popup-withdraw-confirm-btn"
                    >
                        <Text style={styles.withdrawBtnLeftText} allowFontScaling={false}>탈퇴</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.withdrawBtnRight}
                        onPress={() => { onClose(); props.onCancel?.(); }}
                        activeOpacity={0.85}
                        testID="popup-withdraw-cancel-btn"
                    >
                        <Text style={styles.withdrawBtnRightText} allowFontScaling={false}>아니오</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const POPUP_COMPONENTS = {
    update: UpdateContent,
    forceUpdate: UpdateContent,
    suspend: SuspendContent,
    pointReward: PointRewardContent,
    referralPointEarned: ReferralPointEarnedContent,
    confirm: ConfirmContent,
    withdrawConfirm: WithdrawConfirmContent,
    couponUse: CouponUseContent,
    mainPopup: MainPopupContent,
};

export default function PopupManager() {
    const queue = usePopupStore((s) => s.queue);
    const close = usePopupStore((s) => s.close);
    const timerRef = useRef(null);

    const current = queue[0];

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (current?.props?.autoDismissMs) {
            timerRef.current = setTimeout(() => {
                close(current.id);
                current.props?.onDismiss?.();
            }, current.props.autoDismissMs);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [current?.id]);

    if (!current) return null;

    const ContentComponent = POPUP_COMPONENTS[current.type];
    if (!ContentComponent) return null;

    const isForceUpdate = current.type === 'forceUpdate' ||
        (current.type === 'update' && current.props?.forceUpdate);

    const handleClose = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        current.props?.onClose?.();
        close(current.id);
    };

    const isMainPopup = current.type === 'mainPopup';

    const handleMainPopupBack = async () => {
        await setAllHiddenForOneHour();
        handleClose();
    };

    return (
        <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={isForceUpdate ? () => {} : (isMainPopup ? handleMainPopupBack : handleClose)}
        >
            <Pressable
                style={[styles.overlay, isMainPopup && styles.overlayMainPopup]}
                onPress={(isForceUpdate || isMainPopup) ? undefined : handleClose}
                testID="popup-dim"
            >
                <View
                    style={isMainPopup ? styles.overlayContentMainPopup : styles.overlayContent}
                    onStartShouldSetResponder={() => true}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <ContentComponent props={current.props} onClose={handleClose} />
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    overlayMainPopup: {
        paddingHorizontal: 0,
    },
    overlayContent: {
        width: '100%',
    },
    overlayContentMainPopup: {
        alignItems: 'center',
    },
    // Update popup
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        width: '100%',
    },
    cardContent: {
        padding: SPACING.xxxl,
        gap: SPACING.xxxl,
    },
    infoSection: {
        alignItems: 'center',
        gap: SPACING.xl,
    },
    updateTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        textAlign: 'center',
        lineHeight: 24,
    },
    updateIcon: {
        width: 68,
        height: 68,
    },
    versionInfo: {
        alignItems: 'center',
        gap: SPACING.xs,
    },
    bodyText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        textAlign: 'center',
        lineHeight: 20,
    },
    actionSection: {
        alignItems: 'center',
        gap: SPACING.sm,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        height: 52,
        width: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },
    laterText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        textAlign: 'center',
        textDecorationLine: 'underline',
        lineHeight: 20,
    },
    // Suspend popup
    suspendCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.xxl,
        width: '100%',
    },
    suspendTitle: {
        fontSize: FONT_SIZE.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    suspendReason: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        lineHeight: 20,
    },
    suspendButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    suspendBtn: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.splashBg,
    },
    suspendBtnText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
    // Point reward popup
    pointCard: {
        width: '100%',
        height: 200,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointContent: {
        alignItems: 'center',
        gap: SPACING.md,
    },
    pointIconAndPoints: {
        alignItems: 'center',
    },
    pointsText: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.point,
        textAlign: 'center',
    },
    pointMessage: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    // Confirm popup
    confirmButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    confirmBtn: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnCancel: {
        backgroundColor: COLORS.lightGray,
    },
    confirmBtnCancelText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    confirmBtnOk: {
        backgroundColor: COLORS.primary,
    },
    confirmBtnOkText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
    // Referral point earned popup
    referralCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        width: '100%',
        padding: SPACING.xxxl,
        gap: SPACING.xxxl,
    },
    referralContent: {
        alignItems: 'center',
    },
    referralMessage: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    referralAmount: {
        color: COLORS.point,
    },
    referralButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    referralBtnClose: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    referralBtnCloseText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    referralBtnConfirm: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    referralBtnConfirmText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
    // Withdraw confirm popup
    withdrawCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        width: '100%',
    },
    withdrawContent: {
        padding: SPACING.xxxl,
        gap: SPACING.xxxl,
    },
    withdrawMessage: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    withdrawButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    withdrawBtnLeft: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    withdrawBtnLeftText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    withdrawBtnRight: {
        width: 150,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    withdrawBtnRightText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
    // Coupon use popup
    couponCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        position: 'relative',
    },
    couponDecoWrap: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    couponDeco: {
        width: 120,
        height: 120,
    },
    couponHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 12,
        width: '100%',
    },
    couponBody: {
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.xxxl,
        paddingBottom: SPACING.xxxl,
        gap: SPACING.xxl,
        alignItems: 'center',
        width: '100%',
    },
    couponTitle: {
        fontSize: 24,
        fontFamily: FONTS.extraBold,
        lineHeight: 36,
        color: '#070B25',
        textAlign: 'center',
        width: '100%',
    },
    couponImageWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    couponImage: {
        width: 100,
        aspectRatio: 1
    },
    couponInfo: {
        gap: 4,
        width: '100%',
    },
    couponInfoName: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: '#070B25',
        textAlign: 'center',
    },
    couponInfoStore: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: '#686869',
        textAlign: 'center',
    },
    couponInfoExpire: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: '#070B25',
        textAlign: 'center',
    },
    couponHint: {
        fontSize: 13,
        fontFamily: FONTS.semiBold,
        lineHeight: 20,
        color: '#384FEE',
        textAlign: 'center',
        width: '100%',
    },
    couponBtn: {
        height: 52,
        borderRadius: 8,
        backgroundColor: '#384FEE',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    couponBtnText: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
    couponUsedStampWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    couponBigStamp: {
        width: 61,
        aspectRatio: 61/44
    },
    // Main popup
    mainPopupCard: {
        width: 310,
        alignSelf: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
    },
    mainPopupBody: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#D9D9D9',
    },
    mainPopupPager: {
        flex: 1,
    },
    mainPopupImageWrap: {
        width: '100%',
        height: '100%',
    },
    mainPopupImage: {
        width: '100%',
        height: '100%',
    },
    mainPopupIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 2,
    },
    mainPopupIndicatorActive: {
        fontFamily: FONTS.extraBold,
        fontSize: 11,
        lineHeight: 16,
        color: COLORS.white,
    },
    mainPopupIndicatorTotal: {
        fontFamily: FONTS.regular,
        fontSize: 11,
        lineHeight: 16,
        color: '#969698',
    },
    mainPopupFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 4,
    },
    mainPopupTodayRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mainPopupCheck: {
        width: 24,
        height: 24,
    },
    mainPopupTodayText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        lineHeight: 20,
        color: '#070B25',
    },
    mainPopupCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#F2EFF3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainPopupCloseIcon: {
        width: 20,
        height: 20,
    },
});
