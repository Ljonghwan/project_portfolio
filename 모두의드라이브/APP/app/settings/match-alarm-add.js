import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppHeader from '../../src/components/AppHeader';
import RegionPickerSheet from '../../src/components/RegionPickerSheet';
import matchAlarmApi from '../../src/api/matchAlarm';
import { showToast } from '../../src/utils/toast';
import useConfigStore from '../../src/store/configStore';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

// ============================================================
// OptionButton - 선택/미선택 스타일 버튼
// ============================================================
function OptionButton({ label, selected, onPress, testID }) {
    return (
        <Pressable
            testID={testID}
            onPress={onPress}
            style={[styles.optionBtn, selected && styles.optionBtnSelected]}
        >
            {selected && (
                <Image
                    source={require('../../assets/icons/check-stroke.svg')}
                    style={styles.checkIcon}
                    contentFit="contain"
                />
            )}
            <Text
                style={[styles.optionBtnText, selected && styles.optionBtnTextSelected]}
                allowFontScaling={false}
            >
                {label}
            </Text>
        </Pressable>
    );
}

// ============================================================
// 메인 화면
// ============================================================
export default function MatchAlarmAddScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { filterGenders, filterAges, matchTypes } = useConfigStore();

    const GENDERS = filterGenders?.length > 0 ? filterGenders : [];
    const AGES = filterAges?.length > 0 ? filterAges : [];
    const MATCH_TYPES = matchTypes?.length > 0 ? matchTypes : [];

    // 폼 상태
    const [matchType, setMatchType] = useState(null);
    const [regionSido, setRegionSido] = useState('');
    const [regionSigungu, setRegionSigungu] = useState('');
    const [gender, setGender] = useState(null);
    const [age, setAge] = useState(null);

    // 지역 피커
    const [regionPickerVisible, setRegionPickerVisible] = useState(false);

    const [saving, setSaving] = useState(false);

    // 적용하기
    const handleSubmit = useCallback(async () => {
        if (!matchType) { showToast('info', '매칭 유형을 선택해 주세요.'); return; }
        if (!regionSido) { showToast('info', '지역(시/도)을 선택해 주세요.'); return; }
        if (!gender) { showToast('info', '성별을 선택해 주세요.'); return; }
        if (!age) { showToast('info', '나이대를 선택해 주세요.'); return; }

        setSaving(true);
        try {
            await matchAlarmApi.create({
                matchType,
                regionSido,
                regionSigungu: regionSigungu || null,
                gender,
                age,
            });
            showToast('success', '알림 조건이 등록됐습니다.');
            router.back();
        } catch (e) {
            showToast('error', e?.response?.data?.msg || '등록에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    }, [matchType, regionSido, regionSigungu, gender, age, router]);

    const isFormValid = matchType && regionSido && gender && age;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="매칭 알림 추가" onBack={() => router.back()} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* 매칭 유형 선택 */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel} allowFontScaling={false}>매칭 유형 선택</Text>
                    <View style={styles.optionGrid}>
                        {MATCH_TYPES.map((item) => (
                            <OptionButton
                                testID={`match-alarm-add-type-${item.key}`}
                                key={item.key}
                                label={`${item.label} 매칭`}
                                selected={matchType === item.key}
                                onPress={() => setMatchType(item.key)}
                            />
                        ))}
                    </View>
                </View>

                {/* 지역 선택 */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel} allowFontScaling={false}>지역 선택</Text>
                    <Pressable
                        style={styles.regionSelect}
                        onPress={() => setRegionPickerVisible(true)}
                        testID="match-alarm-add-region"
                    >
                        <Text
                            style={[styles.regionSelectText, regionSido && styles.regionSelectTextActive]}
                            allowFontScaling={false}
                            numberOfLines={1}
                        >
                            {regionSido ? [regionSido, regionSigungu || '전체'].join(' ') : '지역 선택'}
                        </Text>
                        <Image
                            source={require('../../assets/icons/arrow-down.svg')}
                            style={styles.arrowIcon}
                            contentFit="contain"
                        />
                    </Pressable>
                </View>

                {/* 성별 선택 */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel} allowFontScaling={false}>성별 선택</Text>
                    <View style={styles.optionGrid}>
                        {GENDERS.map((item) => (
                            <OptionButton
                                testID={`match-alarm-add-gender-${item.key}`}
                                key={item.key}
                                label={item.label}
                                selected={gender === item.key}
                                onPress={() => setGender(item.key)}
                            />
                        ))}
                        {/* 홀수 맞추기용 빈 자리 */}
                        <View style={[styles.optionBtn, { opacity: 0 }]} pointerEvents="none" />
                    </View>
                </View>

                {/* 나이 선택 */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel} allowFontScaling={false}>나이 선택</Text>
                    <View style={styles.optionGrid}>
                        {AGES.map((item) => (
                            <OptionButton
                                testID={`match-alarm-add-age-${item.key}`}
                                key={item.key}
                                label={item.label}
                                selected={age === item.key}
                                onPress={() => setAge(item.key)}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* 하단 적용하기 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    testID="match-alarm-add-submit"
                    style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={saving || !isFormValid}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText} allowFontScaling={false}>적용하기</Text>
                    )}
                </Pressable>
            </View>

            <RegionPickerSheet
                visible={regionPickerVisible}
                onClose={() => setRegionPickerVisible(false)}
                onSelect={(sido, sigungu) => {
                    setRegionSido(sido);
                    setRegionSigungu(sigungu || '');
                }}
                initialSido={regionSido}
                initialSigungu={regionSigungu}
                allowAll
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        padding: SPACING.xl,
        gap: SPACING.xl,
        paddingBottom: SPACING.xl,
    },

    // 섹션
    section: {
        gap: SPACING.sm,
    },
    sectionLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },

    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    optionBtn: {
        flex: 1,
        minWidth: '47%',
        maxWidth: '48.5%',
        height: 52,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        position: 'relative',
    },
    optionBtnSelected: {
        borderColor: COLORS.primary,
    },
    checkIcon: {
        width: 20,
        height: 20,
        position: 'absolute',
        left: 11,
    },
    optionBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: '#969698',
        textAlign: 'center',
    },
    optionBtnTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },

    // 지역 선택 드롭다운
    regionSelect: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: SPACING.md,
        paddingRight: 4,
    },
    regionSelectText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
        lineHeight: 24,
    },
    regionSelectTextActive: {
        color: COLORS.textPrimary,
    },
    arrowIcon: {
        width: 24,
        height: 24,
    },

    // 하단 버튼
    bottomBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        padding: SPACING.xl,
    },
    submitBtn: {
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: COLORS.disabledBtn,
    },
    submitBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.white,
        lineHeight: 24,
    },

});
