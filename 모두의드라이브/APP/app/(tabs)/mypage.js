import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
    Alert, Platform, Share, Linking, ActivityIndicator,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import dayjs from 'dayjs';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import usePointStore from '../../src/store/pointStore';
import client from '../../src/api/client';
import { getCouponList, useCoupon } from '../../src/api/coupon';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { imageViewer } from '../../src/utils/imageViewer';
import { showToast } from '../../src/utils/toast';
import usePopupStore from '../../src/store/popupStore';

const HEADER_BAR_HEIGHT = 56;
const TAB_BAR_HEIGHT = 64;

const APP_VERSION = Constants.expoConfig?.version || '0.0.0';

const SUB_TABS = [
    { key: 'service', label: '서비스 이용' },
    { key: 'photo', label: '상세프로필' },
    { key: 'gift', label: '쿠폰함' },
];

/* ──────────── 스켈레톤 UI ──────────── */
function Skeleton({ width, height, borderRadius = 8, style }) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                { width, height, borderRadius, backgroundColor: '#E8E8E8' },
                animStyle,
                style,
            ]}
        />
    );
}

/* ──────────── 포토 썸네일 (스켈레톤 포함) ──────────── */
function PhotoThumbnail({ uri, size, isFirst, onPress, testID }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Pressable
            style={[photoStyles.photoSlot, { width: size, height: size }]}
            onPress={onPress}
            testID={testID}
        >
            {!loaded && (
                <View style={StyleSheet.absoluteFill}>
                    <Skeleton width={size} height={size} borderRadius={8} />
                </View>
            )}
            <Image
                source={{ uri }}
                style={photoStyles.photoImage}
                contentFit="cover"
                onLoad={() => setLoaded(true)}
                transition={100}
            />
            {isFirst && (
                <View style={photoStyles.fullBodyBadge}>
                    <Text style={photoStyles.fullBodyBadgeText} allowFontScaling={false}>얼굴사진</Text>
                </View>
            )}
        </Pressable>
    );
}

/* ──────────── 포토프로필 탭 ──────────── */
const PHOTO_GRID_GAP = 8;
const PHOTO_COLUMNS = 4;

function PhotoProfileTab({ user, router }) {
    const { width: frameWidth } = useSafeAreaFrame();
    const photos = (user?.photos || [])
        .filter(p => !p.deleteAt)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const hasPhotos = photos.length > 0;

    const handlePhotoPress = useCallback((idx) => {
        const list = photos.map(p => STORAGE_URL + p.imageUrl);
        imageViewer({ index: idx, list });
    }, [photos]);

    // 4개/줄 고정 사이즈 계산 (좌우 SPACING.xl 패딩 고려)
    const contentPadding = SPACING.xl * 2;
    const itemSize = (frameWidth - contentPadding - PHOTO_GRID_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS;

    return (
        <View style={photoStyles.container}>
            {hasPhotos ? (
                <>
                    <View style={photoStyles.gridWrap}>
                        {photos.map((photo, idx) => (
                            <PhotoThumbnail
                                key={photo.imageUrl || idx}
                                uri={STORAGE_URL + photo.imageUrl}
                                size={itemSize}
                                isFirst={idx === 0}
                                onPress={() => handlePhotoPress(idx)}
                                testID={`mypage-photo-${idx}`}
                            />
                        ))}
                    </View>
                    <Pressable
                        style={photoStyles.editBtn}
                        onPress={() => router.navigate('/profile/edit-detail')}
                        testID="mypage-photo-edit-btn"
                    >
                        <Text style={photoStyles.editBtnText} allowFontScaling={false}>수정하기</Text>
                    </Pressable>
                </>
            ) : (
                <View style={[photoStyles.emptyWrap, { gap: SPACING.xxxxl }]}>
                    <Text style={photoStyles.emptyText} allowFontScaling={false}>
                        등록된 상세프로필이 없습니다.
                    </Text>
                    <Pressable
                        style={photoStyles.editBtn}
                        onPress={() => router.navigate('/profile/edit-detail')}
                        testID="mypage-photo-add-btn"
                    >
                        <Text style={photoStyles.editBtnText} allowFontScaling={false}>등록하기</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const photoStyles = StyleSheet.create({
    container: {
        paddingVertical: SPACING.xl,
        gap: SPACING.xl,
    },
    gridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: PHOTO_GRID_GAP,
    },
    photoSlot: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
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
        textAlign: 'center',
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: SPACING.xxxl,
        gap: SPACING.lg,
    },
    emptyText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
    },
    editBtn: {
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        width: '100%'
    },
    editBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
});

/* ──────────── 쿠폰함 탭 ──────────── */
function CouponStamp({ status }) {
    if (status !== 'used' && status !== 'expired') return null;
    const src = status === 'expired'
        ? require("../../assets/icons/stamp2.svg")
        : require("../../assets/icons/stamp.svg");
    return (
        <View style={couponStyles.stamp} pointerEvents="none">
            <Image source={src} style={couponStyles.stampImage} contentFit="contain" />
        </View>
    );
}

function CouponItem({ item, onPress }) {
    const isActive = item.status === 'active';
    const region = [item.coupon?.storeAddress, item.coupon?.storeAddressDetail]
        .filter(Boolean)
        .join(' ');
    return (
        <Pressable
            style={[couponStyles.card, !isActive && couponStyles.cardInactive]}
            onPress={() => onPress(item)}
            testID={`mypage-coupon-${item.idx}`}
        >
            <View style={couponStyles.cardInfo}>
                <Text style={couponStyles.storeName} allowFontScaling={false} numberOfLines={1}>
                    {item.coupon?.storeName || '매장명'}
                </Text>
                <Text style={couponStyles.couponName} allowFontScaling={false} numberOfLines={1}>
                    {item.coupon?.couponName || '쿠폰'}
                </Text>
                {region ? (
                    <View style={couponStyles.regionRow}>
                        <Image
                            source={require('../../assets/icons/location.svg')}
                            style={{ width: 16, height: 16 }}
                            tintColor="#969698"
                        />
                        <Text style={couponStyles.regionText} allowFontScaling={false} numberOfLines={1}>
                            {region}
                        </Text>
                    </View>
                ) : null}
            </View>
            {item.coupon?.imageUrl ? (
                <Image
                    source={{ uri: STORAGE_URL + item.coupon.imageUrl }}
                    style={couponStyles.cardImage}
                />
            ) : (
                <View style={couponStyles.cardImage} />
            )}
            {!isActive ? <CouponStamp status={item.status} /> : null}
        </Pressable>
    );
}

function GiftTab({ insets }) {
    const showPopup = usePopupStore((s) => s.show);
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchList = useCallback(async () => {
        try {
            const data = await getCouponList();
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            console.warn('coupon list error', e);
            setList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchList();
    }, [fetchList]));

    const handlePress = useCallback((item) => {
        showPopup('couponUse', {
            userCouponIdx: item.idx,
            couponName: item.coupon?.couponName,
            storeName: item.coupon?.storeName,
            imageUrl: item.coupon?.imageUrl,
            expireAt: item.expireAt,
            status: item.status,
            onUsed: () => {
                setList((prev) => prev.map((c) => (c.idx === item.idx ? { ...c, status: 'used', usedAt: new Date().toISOString() } : c)));
            },
        });
    }, [showPopup]);

    if (loading) {
        return (
            <View style={[couponStyles.empty, { paddingVertical: SPACING.xxxl }]}>
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
            </View>
        );
    }

    if (list.length === 0) {
        return (
            <View style={[couponStyles.empty, { paddingVertical: SPACING.xxxxl * 2 }]}>
                <Text style={couponStyles.emptyText} allowFontScaling={false}>
                    보유한 쿠폰이 없습니다.
                </Text>
            </View>
        );
    }

    return (
        <View style={[couponStyles.list, { paddingBottom: SPACING.xxxxl + insets.bottom }]}>
            {list.map((item) => (
                <CouponItem key={item.idx} item={item} onPress={handlePress} />
            ))}
        </View>
    );
}

const couponStyles = StyleSheet.create({
    list: {
        paddingVertical: SPACING.xl,
        gap: SPACING.sm,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: SPACING.xxxl,
    },
    emptyText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 3,
        position: 'relative',
    },
    cardInactive: {
        backgroundColor: '#F1F1F1',
        shadowOpacity: 0,
        elevation: 0,
    },
    cardInfo: {
        flex: 1,
        gap: 4,
        justifyContent: 'center',
    },
    storeName: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: '#070B25',
    },
    couponName: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: '#070B25',
    },
    regionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    regionText: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: '#969698',
        flexShrink: 1,
    },
    cardImage: {
        width: 64,
        aspectRatio: 1
    },
    stamp: {
        position: 'absolute',
        right: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stampImage: {
        width: 61,
        aspectRatio: 61/44
    },
    stampUsed: {
    },
    stampUsedText: {
        fontSize: 14,
        fontFamily: FONTS.extraBold,
        color: '#E56565',
        letterSpacing: 1,
    },
    stampExpired: {
        borderColor: '#C5C5CD',
    },
    stampExpiredText: {
        fontSize: 14,
        fontFamily: FONTS.extraBold,
        color: '#C5C5CD',
        letterSpacing: 1,
    },
});

/* ──────────── 상단 파란 영역: 프로필 + 매너점수/포인트 카드 ──────────── */
function TopProfile({ user, configStore, point, pointLoading, onEditPress, onPointPress, onChargePress, onRefundPress }) {
    if (!user) return null;
    const isOwner = user.role === 'owner';
    const roleLabel = configStore.getLabel('roles', user.role) || (isOwner ? '오너' : '게스트');
    const birthYear = user.birthDate ? dayjs(user.birthDate).year() : null;
    const age = birthYear ? `${Math.floor((dayjs().year() - birthYear) / 10) * 10}대` : '';
    const genderLabel = configStore.getLabel('genders', user.gender);
    const driveLevelLabel = isOwner && user.ownerProfile?.driveLevel
        ? configStore.getLabel('driveLevels', user.ownerProfile.driveLevel).split('(')[0]
        : '';

    const totalPoint = point?.total ?? 0;
    const paidPoint = point?.paid ?? 0;
    const freePoint = point?.free ?? 0;

    return (
        <View style={styles.topBlue}>
            {/* 프로필 행 */}
            <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                    <View style={styles.avatarWrap}>
                        {user.profileImage ? (
                            <Image source={{ uri: STORAGE_URL + user.profileImage }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <Image source={require('../../assets/icons/profile-avatar.svg')} style={styles.avatar} />
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <View style={styles.nicknameRow}>
                            <Text style={styles.nickname} allowFontScaling={false} numberOfLines={1}>
                                {user.nickname}
                            </Text>
                            <View style={[styles.roleBadge, { backgroundColor: isOwner ? COLORS.secondary : COLORS.safety }]}>
                                <Text style={styles.roleBadgeText} allowFontScaling={false}>{roleLabel}</Text>
                            </View>
                        </View>
                        <View style={styles.tagRow}>
                            {age ? <Tag label={age} /> : null}
                            {genderLabel ? <Tag label={genderLabel === '남' || user.gender === 'M' ? '남성' : (genderLabel === '여' || user.gender === 'F' ? '여성' : genderLabel)} /> : null}
                            {driveLevelLabel ? <Tag label={driveLevelLabel} /> : null}
                        </View>
                    </View>
                </View>
                <Pressable style={styles.editBtn} onPress={onEditPress} testID="mypage-profile-edit-btn">
                    <Image source={require('../../assets/icons/mypage-edit.svg')} style={{ width: 16, height: 16 }} tintColor={COLORS.white} />
                    <Text style={styles.editBtnText} allowFontScaling={false}>수정</Text>
                </Pressable>
            </View>

            {/* 매너점수 + 포인트 카드 */}
            <Pressable style={styles.statCard} onPress={onPointPress} testID="mypage-point-card">
                <View style={styles.mannerCol}>
                    <Text style={styles.mannerScore} allowFontScaling={false}>
                        {user.mannerScore != null ? Math.round(Number(user.mannerScore)) : '-'}
                    </Text>
                    <View style={styles.mannerLabelRow}>
                        <Image source={require('../../assets/icons/smile.svg')} style={{ width: 18, height: 18 }} />
                        <Text style={styles.mannerLabel} allowFontScaling={false}>매너점수</Text>
                    </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.pointCol}>
                    {pointLoading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <>
                            <Text
                                style={[styles.pointTotal, totalPoint < 0 && { color: '#FF3B3B' }]}
                                allowFontScaling={false}
                            >
                                {totalPoint.toLocaleString()}P
                            </Text>
                            <Text
                                style={[styles.pointSub, paidPoint < 0 && { color: '#FF3B3B' }]}
                                allowFontScaling={false}
                            >
                                유료 포인트 {paidPoint.toLocaleString()}P
                            </Text>
                            <Text
                                style={[styles.pointSub, freePoint < 0 && { color: '#FF3B3B' }]}
                                allowFontScaling={false}
                            >
                                무료 포인트 {freePoint.toLocaleString()}P
                            </Text>
                        </>
                    )}
                </View>
            </Pressable>

            {/* 충전하기 / 환불하기 버튼 */}
            <View style={styles.actionBtnRow}>
                <Pressable style={styles.chargeBtnOrange} onPress={onChargePress} testID="mypage-charge-btn">
                    <Text style={styles.actionBtnText} allowFontScaling={false}>충전하기</Text>
                </Pressable>
                {Platform.OS !== 'ios' && (
                    <Pressable style={styles.refundBtnOutline} onPress={onRefundPress} testID="mypage-refund-btn">
                        <Text style={styles.actionBtnText} allowFontScaling={false}>환불하기</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

function Tag({ label }) {
    return (
        <View style={styles.tag}>
            <Text style={styles.tagText} allowFontScaling={false}>{label}</Text>
        </View>
    );
}

/* ──────────── 서브탭 ──────────── */
function SubTabs({ active, onChange }) {
    return (
        <View style={styles.subTabsWrap}>
            {SUB_TABS.map((t) => {
                const isActive = active === t.key;
                return (
                    <Pressable key={t.key} onPress={() => onChange(t.key)} style={styles.subTab} testID={`mypage-subtab-${t.key}`}>
                        <Text
                            style={[
                                styles.subTabText,
                                isActive ? styles.subTabTextActive : styles.subTabTextInactive,
                            ]}
                            allowFontScaling={false}
                        >
                            {t.label}
                        </Text>
                        {isActive ? <View style={styles.subTabIndicator} /> : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

/* ──────────── 메뉴 카드 ──────────── */
function MenuCard({ title, items }) {
    return (
        <View style={styles.menuCard}>
            {title ? (
                <Text style={styles.menuCardTitle} allowFontScaling={false}>{title}</Text>
            ) : null}
            {items.map((item, i) => (
                <Pressable key={i} style={styles.menuRow} onPress={item.onPress} testID={`mypage-menu-${item.label}`}>
                    <Image
                        source={item.icon}
                        style={{ width: 24, height: 24 }}
                        contentFit="contain"
                    />
                    <Text style={styles.menuRowText} allowFontScaling={false}>{item.label}</Text>
                    {item.rightText ? (
                        <Text style={styles.menuRowRightText} allowFontScaling={false}>{item.rightText}</Text>
                    ) : null}
                    {item.showChevron !== false && (
                        <Image
                            source={require('../../assets/icons/chevron-right.svg')}
                            style={{ width: 24, height: 24 }}
                            tintColor="#C5C5CD"
                        />
                    )}
                </Pressable>
            ))}
        </View>
    );
}

/* ══════════════════════════════ 메인 ══════════════════════════════ */
export default function MyPageScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, logout, fetchMe } = useAuthStore();
    const configStore = useConfigStore();
    const { total: pointTotal, paid: pointPaid, free: pointFree, loaded: pointLoaded, refreshBalance } = usePointStore();
    const [activeSubTab, setActiveSubTab] = useState('service');
    const [config, setConfig] = useState(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        fetchMe();
        (async () => {
            try {
                const res = await client.post('/config');
                setConfig(res.data);
            } catch {}
        })();
    }, []);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle('light');
    }, []));

    useFocusEffect(useCallback(() => {
        refreshBalance();
        fetchMe();
    }, [refreshBalance, fetchMe]));

    const handleLogout = useCallback(() => {
        if (loggingOut) return;
        setLoggingOut(true);
        Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
            {
                text: '취소',
                style: 'cancel',
                onPress: () => setLoggingOut(false),
            },
            {
                text: '로그아웃',
                onPress: async () => {
                    try {
                        await logout();
                        if (router.canDismiss()) router.dismissAll();
                        router.replace('/');
                    } finally {
                        setLoggingOut(false);
                    }
                },
            },
        ]);
    }, [logout, router, loggingOut]);

    const handleShareApp = useCallback(async () => {
        const shareText = config?.shareText || '모두의 드라이브 - 모드';
        const shareUrl = config?.shareUrl || '';
        try {
            if (Platform.OS === 'ios') {
                await Share.share({ message: shareText, url: shareUrl });
            } else {
                await Share.share({ message: shareUrl ? `${shareText}\n${shareUrl}` : shareText });
            }
        } catch (e) {
            console.warn('share error', e);
        }
    }, [config]);

    // TODO: 실제 화면/라우트 연결
    const notImplemented = useCallback((name) => () => {
        showToast('info', `${name} 기능은 준비 중입니다.`);
    }, []);

    const serviceItems = [
        { label: '포인트 내역', icon: require('../../assets/icons/mypage-money.svg'), onPress: () => router.navigate('/point') },
        { label: '결제카드 관리', icon: require('../../assets/icons/mypage-card.svg'), onPress: notImplemented('결제카드 관리') },
        { label: '좋아요', icon: require('../../assets/icons/mypage-thumb.svg'), onPress: () => router.navigate('/match/like-list') },
        { label: '내평가 보기', icon: require('../../assets/icons/mypage-review.svg'), onPress: () => router.navigate('/review/my-evaluations') },
        { label: '차단 목록', icon: require('../../assets/icons/mypage-block.svg'), onPress: () => router.navigate('/settings/block-list') },
    ];
    const newsItems = [
        { label: '이벤트', icon: require('../../assets/icons/mypage-event.svg'), onPress: () => router.navigate('/news') },
        { label: '공지사항', icon: require('../../assets/icons/mypage-megaphone.svg'), onPress: () => router.navigate('/notice') },
    ];
    const guideItems = [
        { label: '자주 묻는 질문', icon: require('../../assets/icons/mypage-faq.svg'), onPress: () => router.navigate('/faq') },
        { label: '1:1 문의하기', icon: require('../../assets/icons/mypage-inquiry.svg'), onPress: () => router.navigate('/inquiry') },
        { label: '이용약관', icon: require('../../assets/icons/mypage-document.svg'), onPress: () => router.navigate('/settings/terms') },
        { label: '개인정보 처리방침', icon: require('../../assets/icons/mypage-security.svg'), onPress: () => router.navigate('/settings/privacy') },
    ];
    const appItems = [
        { label: '앱 공유하기', icon: require('../../assets/icons/mypage-share.svg'), onPress: handleShareApp, showChevron: false },
        {
            label: `버전정보 ${APP_VERSION}`,
            icon: require('../../assets/icons/mypage-mobile.svg'),
            rightText: '업데이트',
            showChevron: false,
            onPress: () => {
                const url = Platform.OS === 'ios'
                    ? (config?.iosStoreUrl || 'https://apps.apple.com')
                    : (config?.aosStoreUrl || 'https://play.google.com');
                Linking.openURL(url).catch(() => {});
            },
        },
        {
            label: '로그아웃',
            icon: require('../../assets/icons/mypage-logout.svg'),
            onPress: handleLogout,
            showChevron: false,
        },
    ];

    return (
        <View testID="mypage-screen" style={styles.container}>
            {Platform.OS === 'android' && <StatusBar style="light" />}
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + HEADER_BAR_HEIGHT,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ backgroundColor: COLORS.primary }}>
                    <TopProfile
                        user={user}
                        configStore={configStore}
                        point={{ total: pointTotal, paid: pointPaid, free: pointFree }}
                        pointLoading={!pointLoaded}
                        onEditPress={() => { try { router.navigate('/profile/edit'); } catch {} }}
                        onPointPress={() => router.navigate('/point')}
                        onChargePress={() => router.navigate('/point/charge')}
                        onRefundPress={() => router.navigate('/point/refund')}
                    />
                </View>
                <View style={styles.contentArea}>
                    <SubTabs active={activeSubTab} onChange={setActiveSubTab} />

                    {activeSubTab === 'service' && (
                        <View style={[styles.cardList, { paddingBottom: SPACING.xxxxl + insets.bottom }]}>
                            <MenuCard items={serviceItems} />
                            <MenuCard title="새소식" items={newsItems} />
                            <MenuCard title="이용 안내" items={guideItems} />
                            <MenuCard title="앱정보" items={appItems} />
                        </View>
                    )}
                    {activeSubTab === 'photo' && (
                        <PhotoProfileTab user={user} router={router} />
                    )}
                    {activeSubTab === 'gift' && (
                        <GiftTab insets={insets} />
                    )}
                    {/* 아래쪽 bounce 영역까지 흰색 확장 */}
                    <View style={styles.bottomOverscrollBg} pointerEvents="none" />
                </View>
            </ScrollView>

            {/* 고정 상단 헤더 — 홈 화면과 동일하게 absolute 로 띄워 스크롤 시에도 유지 */}
            <View
                style={[
                    styles.fixedTopBar,
                    { paddingTop: insets.top, height: insets.top + HEADER_BAR_HEIGHT },
                ]}
                pointerEvents="box-none"
            >
                <View style={styles.fixedTopBarInner}>
                    <Pressable hitSlop={8} onPress={() => router.navigate('/settings')} testID="mypage-settings-btn">
                        <Image
                            source={require('../../assets/icons/mypage-settings.svg')}
                            style={{ width: 24, height: 24 }}
                            tintColor={COLORS.white}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

/* ══════════════════════════════ 스타일 ══════════════════════════════ */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },

    /* 상단 파란 영역 */
    topBlue: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.md,
        gap: SPACING.xl,
    },
    /* 고정 상단 헤더 (설정 아이콘) */
    fixedTopBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        zIndex: 10,
    },
    fixedTopBarInner: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },

    /* 프로필 행 */
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xl,
    },
    profileLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: COLORS.grayF1,
    },
    avatar: {
        width: 52,
        height: 52,
    },
    profileInfo: {
        flex: 1,
        gap: 4,
    },
    nicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 4,
    },
    nickname: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
        flexShrink: 1,
    },
    roleBadge: {
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        // [C128-1] 배경색은 인라인으로 역할별 분기 (오너=secondary, 게스트=safety)
    },
    roleBadgeText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.textPrimary,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 2,
    },
    tag: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 100,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    tagText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.white,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    editBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.white,
        textAlign: 'center',
    },

    /* 매너점수/포인트 카드 */
    statCard: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 12,
        padding: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mannerCol: {
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    mannerScore: {
        fontFamily: FONTS.bold || FONTS.extraBold,
        fontSize: 40,
        lineHeight: 48,
        color: '#FFCE52',
        textAlign: 'center',
    },
    mannerLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mannerLabel: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.white,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: COLORS.primary,
    },
    pointCol: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        gap: 4,
        justifyContent: 'center',
    },
    pointTotal: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: COLORS.white,
    },
    pointSub: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.white,
    },

    /* 충전/환불 버튼 행 */
    actionBtnRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    chargeBtnOrange: {
        flex: 1,
        height: 52,
        backgroundColor: '#F64B17',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    refundBtnOutline: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
        textAlign: 'center',
    },

    /* 본문 */
    contentArea: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: SPACING.xl,
        paddingBottom: 0,
    },
    bottomOverscrollBg: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        height: 1000,
        backgroundColor: COLORS.white,
    },

    /* 서브탭 */
    subTabsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING.sm,
    },
    subTab: {
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subTabText: {
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
    },
    subTabTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    subTabTextInactive: {
        fontFamily: FONTS.semiBold,
        color: '#C5C5CD',
    },
    subTabIndicator: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        backgroundColor: COLORS.primary,
    },

    /* 카드 리스트 */
    cardList: {
        gap: SPACING.sm,
        paddingBottom: SPACING.xxxxl,
        paddingTop: SPACING.xl,
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 24,
        gap: 32,
        justifyContent: 'center',
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4 },
        }),
    },
    menuCardTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: '#969698',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    menuRowText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    menuRowRightText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.primary,
        textDecorationLine: 'underline',
        textAlign: 'right',
    },

    emptyWrap: {
        paddingVertical: 80,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.md || FONT_SIZE.sm,
        color: COLORS.textMedium,
    },
});
