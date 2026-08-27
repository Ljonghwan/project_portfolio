import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import PhotoPickerSheet from '../../src/components/PhotoPickerSheet';
import RegionPickerSheet from '../../src/components/RegionPickerSheet';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import { getAge } from '../../src/utils/age';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]+$/;

export default function BasicProfileScreen() {
    const carTypes = useConfigStore((s) => s.carTypes);
    const driveLevels = useConfigStore((s) => s.driveLevels);
    const profileTags = useConfigStore((s) => s.profileTags);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signupData, updateSignupData } = useAuthStore();
    const [nickname, setNickname] = useState(signupData.nickname || '');
    const [regionSido, setRegionSido] = useState(signupData.regionSido || '');
    const [regionSigungu, setRegionSigungu] = useState(signupData.regionSigungu || '');
    const [cars, setCars] = useState(signupData.cars?.length ? signupData.cars : []);
    const [driveLevel, setDriveLevel] = useState(signupData.driveLevel || '');
    const [selectedTags, setSelectedTags] = useState(signupData.driveModes || []);
    const [job, setJob] = useState(signupData.job || '');
    const [hobby, setHobby] = useState(signupData.hobby || '');
    const [intro, setIntro] = useState(signupData.bio || '');
    const [nickFocused, setNickFocused] = useState(false);
    const [nickChecking, setNickChecking] = useState(false);
    // 재진입 시 다른 필드들과 동일하게 signupData 에서 복원 (아바타 미리보기 유지)
    const [profileImage, setProfileImage] = useState(signupData.profileImage || null);
    const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
    const [regionPickerVisible, setRegionPickerVisible] = useState(false);
    const [regionPickerMode, setRegionPickerMode] = useState('sido');

    const isOwner = signupData.role === 'owner';

    const toggleCarType = useCallback((carType) => {
        setCars(prev => {
            const exists = prev.find(c => c.carType === carType);
            if (exists) return prev.filter(c => c.carType !== carType);
            return [...prev, { carType, carModel: '' }];
        });
    }, []);

    const updateCarModel = useCallback((carType, model) => {
        setCars(prev => prev.map(c => c.carType === carType ? { ...c, carModel: model } : c));
    }, []);

    const toggleTag = useCallback((tagKey) => {
        setSelectedTags(prev => {
            if (prev.includes(tagKey)) return prev.filter(k => k !== tagKey);
            return [...prev, tagKey];
        });
    }, []);

    const computedAge = getAge(signupData.birthDate);

    const nicknameValid = nickname.length >= 2 && nickname.length <= 6;

    const carsValid = cars.length > 0 &&
        (isOwner ? cars.every(c => c.carModel?.trim().length > 0) : true);

    const canNext =
        nicknameValid && regionSido && regionSigungu &&
        carsValid && selectedTags.length > 0 &&
        job.trim().length > 0 && hobby.trim().length > 0 &&
        intro.trim().length > 0 &&
        // 서버/detail-profile 이 base64 유무로 사진을 판단하므로 버튼 활성 기준도 base64 로 정합
        (profileImage?.base64 || signupData.profileImage?.base64) &&
        (isOwner ? !!driveLevel : true);

    const handleNext = useCallback(async () => {
        if (!canNext) return;
        if (!NICKNAME_REGEX.test(nickname)) {
            showToast('error', '사용할 수 없는 닉네임입니다.', '한글/영문/숫자만 사용 가능합니다.');
            return;
        }
        // 닉네임 중복검사
        setNickChecking(true);
        try {
            const res = await authApi.checkNickname(nickname);
            if (!res.data?.available) {
                showToast('error', '이미 사용 중인 닉네임입니다.', '다른 닉네임을 입력해주세요.');
                setNickChecking(false);
                return;
            }
        } catch (e) {
            showToast('error', '닉네임 확인에 실패했습니다.', '다시 시도해주세요.');
            setNickChecking(false);
            return;
        }
        setNickChecking(false);

        updateSignupData({
            nickname,
            regionSido,
            regionSigungu,
            cars: isOwner ? cars : cars.map(c => ({ carType: c.carType, carModel: '' })),
            driveLevel: isOwner ? driveLevel : null,
            driveModes: selectedTags,
            job,
            hobby,
            bio: intro || null,
            // canNext(위) 와 동일하게 base64 기준으로 판단 — 객체 존재만 보면 base64 없는 새 선택이
            // base64 있는 기존 값을 덮어써서, 버튼은 활성인데 서버가 거절하는 상태가 된다
            profileImage: profileImage?.base64 ? profileImage : signupData.profileImage || null,
        });
        router.navigate('/auth/detail-profile');
    }, [canNext, nickname, regionSido, regionSigungu, isOwner, cars, driveLevel, selectedTags, job, hobby, intro, profileImage, signupData.profileImage, updateSignupData, router]);

    const displayName = signupData.name || '홍길동';
    const ageDecade = computedAge ? Math.floor(computedAge / 10) * 10 : null;
    const genderText = signupData.gender === 'M' ? '남' : signupData.gender === 'F' ? '여' : '';

    const openPhotoPicker = useCallback(() => setPhotoPickerVisible(true), []);
    const closePhotoPicker = useCallback(() => setPhotoPickerVisible(false), []);
    const openSidoPicker = useCallback(() => {
        setRegionPickerMode('sido');
        setRegionPickerVisible(true);
    }, []);
    const openSigunguPicker = useCallback(() => {
        setRegionPickerMode('sigungu');
        setRegionPickerVisible(true);
    }, []);
    const closeRegionPicker = useCallback(() => setRegionPickerVisible(false), []);

    const handleRegionSelect = useCallback((sido, sigungu) => {
        setRegionSido(sido);
        setRegionSigungu(sigungu || '');
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title={`${isOwner ? '오너' : '게스트'} 가입하기`} onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>기본 프로필</Text>
                    <Text style={styles.sectionDesc} allowFontScaling={false}>
                        안전한 서비스 이용을 위해 프로필은{' '}
                        <Text style={styles.requiredText} allowFontScaling={false}>모두 필수</Text>입니다.
                    </Text>
                </View>

                {/* Profile avatar */}
                <View style={styles.profileSection}>
                    <Pressable style={styles.profileImageWrap} onPress={openPhotoPicker} testID="basic-profile-image-btn">
                        <View style={styles.profileCircle}>
                            {profileImage?.uri ? (
                                <Image source={{ uri: profileImage.uri }} style={styles.profileImg} contentFit="cover" />
                            ) : (
                                <Image source={require('../../assets/icons/profile-avatar.svg')} style={styles.profileImg} />
                            )}
                        </View>
                        <View style={styles.cameraOverlay}>
                            <Image source={require('../../assets/icons/camera-circle.svg')} style={styles.cameraBg} />
                            <Image source={require('../../assets/icons/camera-icon.svg')} style={styles.cameraIcon} />
                        </View>
                    </Pressable>
                    <Text style={styles.profileName} allowFontScaling={false}>
                        <Text style={styles.profileNameBold} allowFontScaling={false}>{displayName}</Text>
                        {(ageDecade && genderText) ? (
                            <Text style={styles.profileNameSub} allowFontScaling={false}>({ageDecade}대,{genderText})</Text>
                        ) : null}
                    </Text>
                </View>

                {/* 닉네임 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>닉네임</Text>
                    <TextInput
                        style={[
                            styles.inputField,
                            nickFocused ? styles.inputFieldFocused : null,
                        ]}
                        value={nickname}
                        onChangeText={setNickname}
                        onFocus={() => setNickFocused(true)}
                        onBlur={() => setNickFocused(false)}
                        placeholder="2~6자, 한글/영문/숫자"
                        placeholderTextColor={COLORS.disabledBtn}
                        maxLength={7}
                        allowFontScaling={false}
                        testID="basic-profile-nickname-input"
                    />
                </View>

                {/* 사시는 곳 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>사시는 곳</Text>
                    <View style={styles.rowGapSm}>
                        <Pressable
                            style={[styles.selectBox, { flex: 1 }]}
                            onPress={openSidoPicker}
                            testID="basic-profile-region-sido-btn"
                        >
                            <Text style={regionSido ? styles.selectText : styles.selectPlaceholder} allowFontScaling={false}>
                                {regionSido || '시/도 선택'}
                            </Text>
                            <Image source={require('../../assets/icons/arrow-down.svg')} style={styles.iconSm} />
                        </Pressable>
                        <Pressable
                            style={[styles.selectBox, { flex: 1 }, !regionSido ? styles.selectBoxDisabled : null]}
                            onPress={() => { if (regionSido) openSigunguPicker(); }}
                            disabled={!regionSido}
                            testID="basic-profile-region-sigungu-btn"
                        >
                            <Text style={regionSigungu ? styles.selectText : styles.selectPlaceholder} allowFontScaling={false}>
                                {regionSigungu || '시/군/구 선택'}
                            </Text>
                            <Image source={require('../../assets/icons/arrow-down.svg')} style={styles.iconSm} />
                        </Pressable>
                    </View>
                </View>

                {/* 차종 */}
                <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>
                            {isOwner ? '차종' : '관심있는 차종을 선택하세요.'}
                        </Text>
                        <Text style={styles.fieldHint} allowFontScaling={false}>중복선택 가능</Text>
                    </View>
                    {isOwner ? (
                        <View style={styles.carList}>
                            {carTypes.map(ct => {
                                const isChecked = !!cars.find(c => c.carType === ct.key);
                                return (
                                    <View key={ct.key} style={styles.carRow}>
                                        <Pressable
                                            style={styles.carCheckArea}
                                            onPress={() => toggleCarType(ct.key)}
                                            testID={`basic-profile-car-${ct.key}-check`}
                                        >
                                            <Image source={isChecked ? require('../../assets/icons/check.svg') : require('../../assets/icons/uncheck.svg')} style={styles.checkIcon} />
                                            <Text style={[styles.carLabel, isChecked ? styles.carLabelActive : null]} allowFontScaling={false}>
                                                {ct.label}
                                            </Text>
                                        </Pressable>
                                        <TextInput
                                            style={styles.carInput}
                                            value={cars.find(c => c.carType === ct.key)?.carModel || ''}
                                            onChangeText={(t) => updateCarModel(ct.key, t)}
                                            placeholder={ct.placeholder}
                                            placeholderTextColor={COLORS.disabledBtn}
                                            maxLength={20}
                                            editable={isChecked}
                                            allowFontScaling={false}
                                            testID={`basic-profile-car-${ct.key}-input`}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.tagWrap}>
                            {carTypes.map(ct => {
                                const isChecked = !!cars.find(c => c.carType === ct.key);
                                return (
                                    <Pressable
                                        key={ct.key}
                                        style={[styles.tagChip, isChecked ? styles.tagChipActive : styles.tagChipInactive]}
                                        onPress={() => toggleCarType(ct.key)}
                                        testID={`basic-profile-cartag-${ct.key}`}
                                    >
                                        <Text style={[styles.tagChipText, isChecked ? styles.tagChipTextActive : null]} allowFontScaling={false}>
                                            {ct.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* 드라이브 레벨 (오너만) */}
                {isOwner ? (
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>회원님의 드라이브 레벨을 선택하세요.</Text>
                        <View style={styles.levelList}>
                            {driveLevels.map(level => {
                                const isSelected = driveLevel === level.key;
                                return (
                                    <Pressable
                                        key={level.key}
                                        style={[styles.levelItem, isSelected ? styles.levelItemActive : styles.levelItemInactive]}
                                        onPress={() => setDriveLevel(level.key)}
                                        testID={`basic-profile-drivelevel-${level.key}`}
                                    >
                                        {isSelected ? (
                                            <View style={styles.levelCheck}>
                                                <Image source={require('../../assets/icons/check-stroke.svg')} style={styles.levelCheckIcon} />
                                            </View>
                                        ) : null}
                                        <Text style={[styles.levelText, isSelected ? styles.levelTextActive : null]} allowFontScaling={false}>
                                            {level.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* 프로필 태그 */}
                <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>프로필 태그</Text>
                        <Text style={styles.fieldHint} allowFontScaling={false}>중복선택 가능</Text>
                    </View>
                    <View style={styles.tagWrap}>
                        {profileTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.key);
                            return (
                                <Pressable
                                    key={tag.key}
                                    style={[styles.tagChip, isSelected ? styles.tagChipActive : styles.tagChipInactive]}
                                    onPress={() => toggleTag(tag.key)}
                                    testID={`basic-profile-tag-${tag.key}`}
                                >
                                    <Text style={[styles.tagChipText, isSelected ? styles.tagChipTextActive : null]} allowFontScaling={false}>
                                        {tag.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* 직업 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>직업</Text>
                    <TextInput
                        style={styles.inputFieldGray}
                        value={job}
                        onChangeText={setJob}
                        placeholder="ex. 회사원, 의사, 자영업 등"
                        placeholderTextColor={COLORS.disabledBtn}
                        maxLength={20}
                        allowFontScaling={false}
                        testID="basic-profile-job-input"
                    />
                </View>

                {/* 취미 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>취미</Text>
                    <TextInput
                        style={styles.inputFieldGray}
                        value={hobby}
                        onChangeText={setHobby}
                        placeholder="ex. 드라이브, 골프, 음악감상 등"
                        placeholderTextColor={COLORS.disabledBtn}
                        maxLength={20}
                        allowFontScaling={false}
                        testID="basic-profile-hobby-input"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>한줄소개(30자 이내)</Text>
                    <TextInput
                        style={styles.inputFieldGray}
                        value={intro}
                        onChangeText={setIntro}
                        placeholder="간략한 소개를 입력해 주세요."
                        placeholderTextColor={COLORS.disabledBtn}
                        maxLength={30}
                        allowFontScaling={false}
                        testID="basic-profile-intro-input"
                    />
                </View>
            </KeyboardAwareScrollView>

            {/* Bottom button */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[styles.nextBtn, canNext && !nickChecking ? styles.nextBtnActive : null]}
                    onPress={handleNext}
                    disabled={!canNext || nickChecking}
                    testID="basic-profile-next-btn"
                >
                    {nickChecking ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.nextBtnText} allowFontScaling={false}>다음</Text>
                    )}
                </Pressable>
            </View>
            <PhotoPickerSheet
                visible={photoPickerVisible}
                onClose={closePhotoPicker}
                onImageSelected={setProfileImage}
            />
            <RegionPickerSheet
                visible={regionPickerVisible}
                onClose={closeRegionPicker}
                onSelect={handleRegionSelect}
                initialSido={regionSido}
                initialSigungu={regionSigungu}
                mode={regionPickerMode}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scroll: { flex: 1 },
    scrollContent: {
        padding: SPACING.xl,
        gap: SPACING.xxl,
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
    requiredText: {
        fontFamily: FONTS.extraBold,
        color: '#E02E2E',
    },

    /* Profile */
    profileSection: {
        alignItems: 'center',
        gap: SPACING.md,
    },
    profileImageWrap: {
        width: 64,
        height: 64,
    },
    profileCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    profileImg: {
        width: 64,
        height: 64,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBg: {
        width: 28,
        height: 28,
        position: 'absolute',
    },
    cameraIcon: {
        width: 18.67,
        height: 18.67,
        position: 'absolute',
    },
    profileName: {
        textAlign: 'center',
    },
    profileNameBold: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    profileNameSub: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textMedium,
    },

    /* Field group */
    fieldGroup: {
        gap: SPACING.sm,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fieldHint: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },

    /* Shared row */
    rowGapSm: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },

    /* Input */
    inputField: {
        height: 52,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.white,
        ...Platform.select({ android: { elevation: 0 } }),
    },
    inputFieldFocused: {
        borderColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        ...Platform.select({
            ios: { boxShadow: '2px 2px 12px rgba(56, 79, 238, 0.3)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },
    inputFieldGray: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        letterSpacing: 1
    },

    /* Select */
    selectBox: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingLeft: SPACING.md,
        paddingRight: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    selectPlaceholder: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.disabledBtn,
    },
    selectBoxDisabled: {
        opacity: 0.5,
    },
    iconSm: {
        width: 24,
        height: 24,
    },

    /* Car types */
    carList: {
        gap: SPACING.sm,
    },
    carRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    carCheckArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: 80,
    },
    checkIcon: {
        width: 24,
        height: 24,
    },
    carLabel: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    carLabelActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    carInput: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },

    /* Drive level */
    levelList: {
        gap: SPACING.sm,
    },
    levelItem: {
        height: 52,
        borderWidth: 1,
        borderRadius: 8,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelItemActive: {
        borderColor: COLORS.primary,
    },
    levelItemInactive: {
        borderColor: COLORS.borderLight,
    },
    levelCheck: {
        position: 'absolute',
        left: 11,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelCheckIcon: {
        width: 20,
        height: 20,
    },
    levelText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        lineHeight: 24,
        color: COLORS.grayMedium,
        textAlign: 'center',
    },
    levelTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },

    /* Profile tag chips */
    tagWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    tagChip: {
        height: 36,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: 18,
        borderWidth: 1,
    },
    tagChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tagChipInactive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.borderLight,
    },
    tagChipText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        lineHeight: 20,
        color: COLORS.grayMedium,
        textAlign: 'center',
    },
    tagChipTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
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
    nextBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextBtnActive: {
        backgroundColor: COLORS.primary,
    },
    nextBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
