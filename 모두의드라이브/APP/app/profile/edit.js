import { useState, useCallback, useEffect } from 'react';
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

export default function ProfileEditScreen() {
    const carTypes = useConfigStore((s) => s.carTypes);
    const driveLevels = useConfigStore((s) => s.driveLevels);
    const profileTags = useConfigStore((s) => s.profileTags);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, fetchMe } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Basic profile fields
    const [nickname, setNickname] = useState('');
    const [regionSido, setRegionSido] = useState('');
    const [regionSigungu, setRegionSigungu] = useState('');
    const [cars, setCars] = useState([]);
    const [driveLevel, setDriveLevel] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [job, setJob] = useState('');
    const [hobby, setHobby] = useState('');
    const [intro, setIntro] = useState('');
    const [profileImage, setProfileImage] = useState(null); // { uri, base64, isNew } or { uri (remote) }
    const [nickFocused, setNickFocused] = useState(false);

    // Sheets
    const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
    const [regionPickerVisible, setRegionPickerVisible] = useState(false);
    const [regionPickerMode, setRegionPickerMode] = useState('sido');

    const isOwner = user?.role === 'owner';

    // Pre-fill from user data on mount
    useEffect(() => {
        if (!user) return;
        setNickname(user.nickname || '');
        setRegionSido(user.regionSido || '');
        setRegionSigungu(user.regionSigungu || '');
        setCars(user.cars?.length ? user.cars.map(c => ({ carType: c.carType, carModel: c.carModel || '' })) : []);
        setDriveLevel(user.ownerProfile?.driveLevel || '');

        // driveModes is stored as JSON string in DB
        let parsedTags = [];
        try {
            parsedTags = typeof user.driveModes === 'string' ? JSON.parse(user.driveModes) : (user.driveModes || []);
        } catch { parsedTags = []; }
        setSelectedTags(Array.isArray(parsedTags) ? parsedTags : []);

        setJob(user.job || '');
        setHobby(user.hobby || '');
        setIntro(user.bio || '');
        if (user.profileImage) {
            const { STORAGE_URL } = require('../../src/constants/config');
            setProfileImage({ uri: STORAGE_URL + user.profileImage, isNew: false });
        }

        setLoading(false);
    }, [user]);

    // Computed display values
    const displayName = user?.name || '';
    const computedAge = getAge(user?.birthDate);
    const ageDecade = computedAge ? Math.floor(computedAge / 10) * 10 : null;
    const genderText = user?.gender === 'M' ? '남' : user?.gender === 'F' ? '여' : '';

    // Handlers
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

    const openProfilePhotoPicker = useCallback(() => {
        setPhotoPickerVisible(true);
    }, []);

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

    const handlePhotoSelected = useCallback((imageData) => {
        setProfileImage({ uri: imageData.uri, base64: imageData.base64, isNew: true });
    }, []);

    // Validation
    const nicknameValid = nickname.length >= 2 && nickname.length <= 6;

    const carsValid = cars.length > 0 &&
        (isOwner ? cars.every(c => c.carModel?.trim().length > 0) : true);

    const canSave =
        nicknameValid && regionSido && regionSigungu &&
        carsValid && selectedTags.length > 0 &&
        job.trim().length > 0 && hobby.trim().length > 0 &&
        intro.trim().length > 0 &&
        (isOwner ? !!driveLevel : true);

    const handleSave = useCallback(async () => {
        if (!canSave) return;
        if (!NICKNAME_REGEX.test(nickname)) {
            showToast('error', '사용할 수 없는 닉네임입니다.', '한글/영문/숫자만 사용 가능합니다.');
            return;
        }

        setSaving(true);
        try {
            // Build profileImage data
            let profileImageData = undefined;
            if (profileImage?.isNew && profileImage.base64) {
                const base64Str = profileImage.base64.startsWith('data:')
                    ? profileImage.base64
                    : `data:image/jpeg;base64,${profileImage.base64}`;
                profileImageData = { base64: base64Str };
            }

            const data = {
                nickname,
                regionSido,
                regionSigungu,
                cars: isOwner ? cars : cars.map(c => ({ carType: c.carType, carModel: '' })),
                driveLevel: isOwner ? driveLevel : null,
                driveModes: selectedTags,
                job,
                hobby,
                bio: intro || null,
            };

            // Only include profileImage if changed
            if (profileImageData !== undefined) {
                data.profileImage = profileImageData;
            }

            await authApi.updateProfile(data);
            await fetchMe();

            showToast('success', '프로필이 수정되었습니다.');
            router.back();
        } catch (e) {
            showToast('error', e.response?.data?.message || '프로필 수정에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    }, [canSave, nickname, regionSido, regionSigungu, isOwner, cars, driveLevel, selectedTags, job, hobby, intro, profileImage, fetchMe, router]);

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <AppHeader title="프로필 수정" onBack={() => router.back()} />
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="프로필 수정" onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
            >
                {/* ====== Section 1: 기본 프로필 ====== */}
                <View style={styles.titleSection}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>기본 프로필</Text>
                    <Text style={styles.sectionDesc} allowFontScaling={false}>
                        안전한 서비스 이용을 위해 프로필은{' '}
                        <Text style={styles.requiredText} allowFontScaling={false}>모두 필수</Text>입니다.
                    </Text>
                </View>

                {/* Profile avatar */}
                <View style={styles.profileSection}>
                    <Pressable style={styles.profileImageWrap} onPress={openProfilePhotoPicker} testID="profile-edit-image-btn">
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
                        testID="profile-edit-nickname-input"
                    />
                </View>

                {/* 사시는 곳 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>사시는 곳</Text>
                    <View style={styles.rowGapSm}>
                        <Pressable
                            style={[styles.selectBox, { flex: 1 }]}
                            onPress={openSidoPicker}
                            testID="profile-edit-region-sido-btn"
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
                            testID="profile-edit-region-sigungu-btn"
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
                                            testID={`profile-edit-car-${ct.key}-check`}
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
                                            testID={`profile-edit-car-${ct.key}-input`}
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
                                        testID={`profile-edit-cartag-${ct.key}`}
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
                                        testID={`profile-edit-drivelevel-${level.key}`}
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
                                    testID={`profile-edit-tag-${tag.key}`}
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
                        testID="profile-edit-job-input"
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
                        testID="profile-edit-hobby-input"
                    />
                </View>

                {/* 한줄소개 */}
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
                        testID="profile-edit-intro-input"
                    />
                </View>

                {/* Bottom spacer for scroll */}
                <View style={{ height: SPACING.xxxl }} />
            </KeyboardAwareScrollView>

            {/* Bottom bar */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[styles.saveBtn, canSave && !saving ? styles.saveBtnActive : null]}
                    onPress={handleSave}
                    disabled={!canSave || saving}
                    testID="profile-edit-save-btn"
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
                onClose={closePhotoPicker}
                onImageSelected={handlePhotoSelected}
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
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        borderRadius: 100,
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
