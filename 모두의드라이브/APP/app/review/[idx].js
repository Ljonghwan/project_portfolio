import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reviewApi } from '../../src/api/review';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import { imageViewer } from '../../src/utils/imageViewer';

const NAVER_GREEN = '#2DB400';
const BOTTOM_BTN_HEIGHT = 92; // 52px btn + 20px top/bottom padding
const NAVER_APP_NAME = 'com.everydrive.mode';

async function openNaverMapPlace({ lat, lng, placeName }) {
    const name = placeName || '';
    if (lat != null && lng != null) {
        const appUrl = `nmap://place?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}&appname=${NAVER_APP_NAME}`;
        try {
            const supported = await Linking.canOpenURL(appUrl);
            if (supported) {
                await Linking.openURL(appUrl);
                return;
            }
        } catch {
            // fall through to web fallback
        }
    }
    const webUrl = `https://map.naver.com/p/search/${encodeURIComponent(name)}`;
    Linking.openURL(webUrl).catch(() => {
        showToast('error', '네이버맵을 열 수 없습니다.');
    });
}

async function openNaverRouteByCoords(sortedCourses) {
    const seg = (c) => `${c.lng},${c.lat},${encodeURIComponent(c.placeName)},,PLACE_POI`;
    const path = sortedCourses.map(seg).join('/');
    // nmap:// scheme — 출발/도착/경유지(v1~v5)
    const first = sortedCourses[0];
    const last = sortedCourses[sortedCourses.length - 1];
    const waypoints = sortedCourses.slice(1, -1);
    const wpParams = waypoints
        .map((c, i) => `&v${i + 1}lat=${c.lat}&v${i + 1}lng=${c.lng}&v${i + 1}name=${encodeURIComponent(c.placeName || '')}`)
        .join('');
    const appUrl = `nmap://route/car?slat=${first.lat}&slng=${first.lng}&sname=${encodeURIComponent(first.placeName || '')}&dlat=${last.lat}&dlng=${last.lng}&dname=${encodeURIComponent(last.placeName || '')}${wpParams}&appname=${NAVER_APP_NAME}`;
    try {
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
            await Linking.openURL(appUrl);
            return;
        }
    } catch {
        // fall through to web
    }
    const webUrl = `https://map.naver.com/p/directions/${path}/-/car`;
    Linking.openURL(webUrl).catch(() => {
        showToast('error', '네이버맵을 열 수 없습니다.');
    });
}

async function openAppleMapsPlace({ lat, lng, placeName }) {
    const name = placeName || '';
    const appUrl = (lat != null && lng != null)
        ? `maps://?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
        : `maps://?q=${encodeURIComponent(name)}`;
    try {
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
            await Linking.openURL(appUrl);
            return;
        }
    } catch {
        // fall through to web
    }
    const webUrl = (lat != null && lng != null)
        ? `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
        : `https://maps.apple.com/?q=${encodeURIComponent(name)}`;
    Linking.openURL(webUrl).catch(() => {
        showToast('error', '애플맵을 열 수 없습니다.');
    });
}

async function openAppleMapsRouteByCoords(sortedCourses) {
    const first = sortedCourses[0];
    const rest = sortedCourses.slice(1);
    const saddr = `${first.lat},${first.lng}`;
    const daddrChain = rest.map(c => `${c.lat},${c.lng}`).join('+to:');
    const appUrl = `maps://?saddr=${saddr}&daddr=${daddrChain}&dirflg=d`;
    try {
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
            await Linking.openURL(appUrl);
            return;
        }
    } catch {
        // fall through to web
    }
    const webUrl = `https://maps.apple.com/?saddr=${saddr}&daddr=${daddrChain}&dirflg=d`;
    Linking.openURL(webUrl).catch(() => {
        showToast('error', '애플맵을 열 수 없습니다.');
    });
}

export default function ReviewDetailScreen() {
    const { idx } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState(null);
    const mountedRef = useRef(true);

    const loadDetail = useCallback(async () => {
        try {
            const res = await reviewApi.getDetail(Number(idx));
            if (mountedRef.current) setReview(res.data);
        } catch (e) {
            if (!mountedRef.current) return;
            const msg = e?.response?.data?.message || '리뷰를 불러올 수 없습니다.';
            showToast('error', msg);
            router.back();
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [idx, router]);

    useEffect(() => {
        mountedRef.current = true;
        loadDetail();
        return () => { mountedRef.current = false; };
    }, [loadDetail]);

    function handleNaverRoute() {
        if (!review?.courses?.length) return;
        const sorted = [...review.courses]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((c) => ({
                ...c,
                lat: c.lat != null ? Number(c.lat) : null,
                lng: c.lng != null ? Number(c.lng) : null,
            }));

        if (sorted.length === 1) {
            openNaverMapPlace({ lat: sorted[0].lat, lng: sorted[0].lng, placeName: sorted[0].placeName });
            return;
        }

        const hasAllCoords = sorted.every((c) => c.lat != null && c.lng != null);
        if (!hasAllCoords) {
            showToast('info', '좌표 정보가 없어 첫 장소 검색으로 이동합니다.');
            openNaverMapPlace({ placeName: sorted[0].placeName });
            return;
        }

        openNaverRouteByCoords(sorted);
    }

    function handleAppleRoute() {
        if (!review?.courses?.length) return;
        const sorted = [...review.courses]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((c) => ({
                ...c,
                lat: c.lat != null ? Number(c.lat) : null,
                lng: c.lng != null ? Number(c.lng) : null,
            }));

        if (sorted.length === 1) {
            openAppleMapsPlace({ lat: sorted[0].lat, lng: sorted[0].lng, placeName: sorted[0].placeName });
            return;
        }

        const hasAllCoords = sorted.every((c) => c.lat != null && c.lng != null);
        if (!hasAllCoords) {
            showToast('info', '좌표 정보가 없어 첫 장소 검색으로 이동합니다.');
            openAppleMapsPlace({ placeName: sorted[0].placeName });
            return;
        }

        openAppleMapsRouteByCoords(sorted);
    }

    if (loading) {
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID="review-detail-back-btn"
                    >
                        <Image
                            source={require('../../assets/icons/arrow-back.svg')}
                            style={styles.backIcon}
                            contentFit="contain"
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} allowFontScaling={false}>리뷰 보기</Text>
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    if (!review) return null;

    const user = review.user || {};
    const isOwner = user.role === 'owner';
    const photos = [...(review.photos || [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const courses = [...(review.courses || [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const hasCourses = courses.length > 0;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    testID="review-detail-back-btn"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.backIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>리뷰 보기</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: hasCourses ? BOTTOM_BTN_HEIGHT + insets.bottom + SPACING.xl : insets.bottom + SPACING.xl },
                ]}
            >
                {/* 작성자 + 후기 영역 */}
                <View style={styles.reviewSection}>
                    {/* [P-7] 작성자 행 — 프로필 이동 */}
                    <TouchableOpacity
                        style={styles.authorRow}
                        activeOpacity={0.7}
                        disabled={!user.idx}
                        onPress={() => user.idx && router.navigate(`/profile/${user.idx}`)}
                        testID="review-detail-author-btn"
                    >
                        <View style={styles.avatarWrap}>
                            {user.profileImage ? (
                                <Image
                                    source={{ uri: STORAGE_URL + user.profileImage }}
                                    style={styles.avatar}
                                    contentFit="cover"
                                />
                            ) : (
                                <Image
                                    source={require('../../assets/icons/profile-avatar.svg')}
                                    style={styles.avatar}
                                    contentFit="cover"
                                />
                            )}
                        </View>
                        <View style={styles.authorInfo}>
                            <Text style={styles.nickname} allowFontScaling={false} numberOfLines={1}>
                                {user.nickname || ''}
                            </Text>
                            <View style={[styles.roleBadge, { backgroundColor: isOwner ? COLORS.gold : COLORS.safety }]}>
                                <Text style={styles.roleBadgeText} allowFontScaling={false}>
                                    {isOwner ? '오너' : '게스트'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* 후기 텍스트 */}
                    {!!review.content && (
                        <Text style={styles.reviewContent} allowFontScaling={false}>
                            {review.content}
                        </Text>
                    )}

                    {/* 사진 그리드 (5장 가로) */}
                    {photos.length > 0 && (
                        <View style={styles.photoGrid}>
                            {photos.map((photo, i) => (
                                <TouchableOpacity
                                    key={photo.imageUrl + i}
                                    style={styles.photoCell}
                                    testID={`review-detail-photo-${i}`}
                                    onPress={() =>
                                        imageViewer({
                                            index: i,
                                            list: photos.map((p) => STORAGE_URL + p.imageUrl),
                                        })
                                    }
                                    activeOpacity={0.85}
                                >
                                    <Image
                                        source={{ uri: STORAGE_URL + photo.imageUrl }}
                                        style={styles.photoImage}
                                        contentFit="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* 코스 영역 */}
                {hasCourses && (
                    <View style={styles.courseSection}>
                        <Text style={styles.courseSectionTitle} allowFontScaling={false}>코스</Text>
                        <View style={styles.courseList}>
                            {courses.map((course, i) => {
                                const lat = course.lat != null ? Number(course.lat) : null;
                                const lng = course.lng != null ? Number(course.lng) : null;
                                const addr = course.roadAddress || course.address || '';
                                return (
                                    <View key={i}>
                                        <TouchableOpacity
                                            style={styles.courseItem}
                                            activeOpacity={0.7}
                                            onPress={() => openNaverMapPlace({ lat, lng, placeName: course.placeName })}
                                            testID={`review-detail-course-${i}`}
                                        >
                                            <Image
                                                source={require('../../assets/icons/location.svg')}
                                                style={styles.locationIcon}
                                                contentFit="contain"
                                            />
                                            <View style={styles.courseText}>
                                                <Text style={styles.placeName} allowFontScaling={false} numberOfLines={1}>
                                                    {course.placeName}
                                                </Text>
                                                {!!addr && (
                                                    <Text style={styles.placeAddress} allowFontScaling={false} numberOfLines={1}>
                                                        {addr}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                        {i < courses.length - 1 && (
                                            <View style={styles.courseDottedLine}>
                                                {[0, 1, 2].map((dot) => (
                                                    <View key={dot} style={styles.courseDot} />
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* 하단 네이버 경로보기 버튼 */}
            {hasCourses && (
                <View style={[styles.bottomBar, { paddingBottom: 20 + insets.bottom }]}>
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={styles.appleBtn}
                            onPress={handleAppleRoute}
                            testID="review-detail-apple-btn"
                            activeOpacity={0.85}
                        >
                            <Image
                                source={require('../../assets/icons/apple-icon.svg')}
                                style={styles.naverIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.naverBtnText} allowFontScaling={false}>Maps 경로보기</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        style={styles.naverBtn}
                        onPress={handleNaverRoute}
                        testID="review-detail-naver-btn"
                        activeOpacity={0.85}
                    >
                        <Image
                            source={require('../../assets/icons/naver-n.svg')}
                            style={styles.naverIcon}
                            contentFit="contain"
                        />
                        <Text style={styles.naverBtnText} allowFontScaling={false}>네이버 경로보기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    // 헤더
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
    // 스크롤
    scrollContent: {
        flexGrow: 1,
    },
    // 작성자 + 후기 영역
    reviewSection: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        padding: SPACING.xl,
        gap: 12,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        flexShrink: 0,
    },
    avatar: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.grayF1
    },
    authorInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.safety,
        flexShrink: 0,
    },
    nickname: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
        flexShrink: 1,
    },
    roleBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        flexShrink: 0,
    },
    roleBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 16,
    },
    reviewContent: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        lineHeight: 20,
    },
    // 사진 그리드 (5장)
    photoGrid: {
        flexDirection: 'row',
        gap: 4,
    },
    photoCell: {
        flex: 1,
        maxWidth: '19.1%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    // 코스 영역
    courseSection: {
        padding: SPACING.xl,
        gap: 12,
        flex: 1,
    },
    courseSectionTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    courseList: {
        gap: 0,
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationIcon: {
        width: 24,
        height: 24,
        flexShrink: 0,
    },
    courseText: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
    },
    placeName: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    placeAddress: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#686869',
        lineHeight: 20,
    },
    // 점선 연결
    courseDottedLine: {
        width: 24,
        height: 20,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingVertical: 2,
    },
    courseDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.primary,
    },
    // 하단 버튼
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        paddingHorizontal: SPACING.xl,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    naverBtn: {
        backgroundColor: NAVER_GREEN,
        borderRadius: 8,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1
    },
    naverIcon: {
        width: 20,
        height: 20,
    },
    naverBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },
    appleBtn: {
        backgroundColor: COLORS.apple,
        borderRadius: 8,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    }
});
