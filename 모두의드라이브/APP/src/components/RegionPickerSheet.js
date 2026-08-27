import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { regionApi } from '../api/region';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../constants/config';
import useBottomSheetBackHandler from '../hooks/useBottomSheetBackHandler';

const SHEET_HEIGHT = 400;
const ITEM_HEIGHT = 54; // 52px item + 2px gap
const LIST_PADDING_TOP = SPACING.sm; // listContent paddingVertical

function calcContentOffset(list, selectedItem) {
    const index = list.indexOf(selectedItem);
    if (index > 2) {
        return { x: 0, y: Math.max(0, index * ITEM_HEIGHT - LIST_PADDING_TOP) };
    }
    return { x: 0, y: 0 };
}

export default function RegionPickerSheet({
    visible,
    onClose,
    onSelect,
    initialSido,
    initialSigungu,
    allowAll = false,
    // 'sido' | 'sigungu' | 'cascade'
    // sido: 시/도만 선택, sigungu: 시/군/구만 선택, cascade: 시/도→시/군/구 연속
    mode = 'cascade',
    // [C127] cascade 시 시작 step 강제: 'sido'(시/도부터) | 'sigungu'(시/군/구부터). 미지정 시 C126 자동.
    startStep,
}) {
    const insets = useSafeAreaInsets();
    // [C125-3] 단일 BottomSheetModal 로 통합. cascade 시 dismiss→present 2단 전환 제거,
    // step 상태로 시/도↔시/군/구 컨텐츠만 즉시 교체해 지연 없이 바로 선택 가능.
    const sheetRef = useRef(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    useBottomSheetBackHandler(sheetRef, sheetOpen);

    const [step, setStep] = useState('sido'); // 'sido' | 'sigungu'
    const [sidoList, setSidoList] = useState([]);
    const [sigunguList, setSigunguList] = useState([]);
    const [selectedSido, setSelectedSido] = useState('');
    const [selectedSigungu, setSelectedSigungu] = useState('');
    const [sidoLoading, setSidoLoading] = useState(false);
    const [sigunguLoading, setSigunguLoading] = useState(false);

    // [C127-B] onSelect 1회 호출 가드 — 선택 즉시 호출(race 방지) + onDismiss 중복 방지
    const selectedDoneRef = useRef(false);

    // ref로 최신값 유지 (콜백에서 사용)
    const selectedSidoRef = useRef(selectedSido);
    selectedSidoRef.current = selectedSido;
    const selectedSigunguRef = useRef(selectedSigungu);
    selectedSigunguRef.current = selectedSigungu;

    const loadSido = useCallback(async () => {
        setSidoLoading(true);
        try {
            const res = await regionApi.getSido();
            setSidoList(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setSidoList([]);
        } finally {
            setSidoLoading(false);
        }
    }, []);

    const loadSigungu = useCallback(async (sido) => {
        if (!sido) return;
        setSigunguLoading(true);
        try {
            const res = await regionApi.getSigungu(sido);
            setSigunguList(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            setSigunguList([]);
        } finally {
            setSigunguLoading(false);
        }
    }, []);

    // visible 변경 시 모드/startStep 에 따라 시트 열기
    useEffect(() => {
        if (visible) {
            setSelectedSido(initialSido || '');
            setSelectedSigungu(initialSigungu || '');
            selectedDoneRef.current = false;
            if (mode === 'sigungu') {
                setStep('sigungu');
                if (initialSido) loadSigungu(initialSido);
            } else if (startStep === 'sido') {
                // [C127-A] 시/도 변경 동선 — 시/도부터 (initialSido 있어도 step 은 sido)
                setStep('sido');
                loadSido();
                if (initialSido) loadSigungu(initialSido); // 새 시/도 미선택 후 뒤로 대비
            } else if ((startStep === 'sigungu' || mode === 'cascade') && initialSido) {
                // [C126/C127] 시/도 기선택 → 시/군/구부터. '뒤로' 버튼으로 시/도 변경 가능.
                setStep('sigungu');
                loadSigungu(initialSido);
                loadSido(); // 뒤로(시/도) 전환 즉각화 위해 프리로드
            } else {
                setStep('sido');
                loadSido();
            }
            sheetRef.current?.present();
        }
    }, [visible]);

    // contentOffset으로 즉시 스크롤 위치 설정
    const sidoContentOffset = useMemo(
        () => calcContentOffset(sidoList, selectedSido),
        [sidoList, selectedSido]
    );
    const sigunguContentOffset = useMemo(
        () => calcContentOffset(sigunguList, selectedSigungu),
        [sigunguList, selectedSigungu]
    );

    // [C127-B] 선택 즉시 onSelect 호출 (dismiss 애니메이션 전 → 호출부 ref 가 정확한 행을 가리킬 때 발화)
    const emitSelect = useCallback((sido, sigungu) => {
        if (selectedDoneRef.current) return;
        selectedDoneRef.current = true;
        onSelect(sido, sigungu);
    }, [onSelect]);

    const handleSidoSelect = useCallback((sido) => {
        setSelectedSido(sido);
        selectedSidoRef.current = sido;
        setSelectedSigungu('');
        selectedSigunguRef.current = '';
        if (mode === 'cascade') {
            // [C125-3] dismiss 없이 즉시 시/군/구 컨텐츠로 교체 (전환 애니메이션 지연 제거)
            loadSigungu(sido);
            setStep('sigungu');
        } else {
            // sido 단독 모드: 선택 즉시 콜백 후 종료
            emitSelect(sido, null);
            sheetRef.current?.dismiss();
        }
    }, [loadSigungu, mode, emitSelect]);

    const handleSigunguSelect = useCallback((sigungu) => {
        setSelectedSigungu(sigungu);
        selectedSigunguRef.current = sigungu;
        emitSelect(selectedSidoRef.current, sigungu);
        sheetRef.current?.dismiss();
    }, [emitSelect]);

    const handleAllSigunguSelect = useCallback(() => {
        emitSelect(selectedSidoRef.current, null);
        sheetRef.current?.dismiss();
    }, [emitSelect]);

    // 시/군/구 step에서 시/도로 되돌아가기 (단일 시트 장점 — dismiss 없이 즉시)
    const handleBackToSido = useCallback(() => {
        if (sidoList.length === 0) loadSido();
        setStep('sido');
    }, [sidoList.length, loadSido]);

    // 시트 onDismiss: 값 전달은 emitSelect(선택 즉시)에서 끝났으므로 여기선 onClose 만.
    // (선택 없이 pan-down/백버튼으로 닫으면 emitSelect 미호출 → onSelect 발생 안 함)
    const handleDismiss = useCallback(() => {
        onClose();
    }, [onClose]);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.7}
            />
        ),
        []
    );

    const isSigunguStep = step === 'sigungu';
    // cascade 에서 시/군/구 단계일 때만 '뒤로(시/도)' 버튼 노출
    const showBack = isSigunguStep && mode === 'cascade';

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={[SHEET_HEIGHT]}
            onDismiss={handleDismiss}
            onChange={(index) => setSheetOpen(index >= 0)}
            backdropComponent={renderBackdrop}
            enableDynamicSizing={false}
            enableOverDrag={false}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <View style={styles.header}>
                {showBack ? (
                    <Pressable onPress={handleBackToSido} hitSlop={8} style={styles.backBtn} testID="regionpicker-back">
                        <Image source={require('../../assets/icons/arrow-back.svg')} style={styles.backIcon} contentFit="contain" />
                    </Pressable>
                ) : null}
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    {isSigunguStep ? '시/군/구 선택' : '시/도 선택'}
                </Text>
            </View>

            <BottomSheetScrollView
                style={styles.listScroll}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                contentOffset={isSigunguStep ? sigunguContentOffset : sidoContentOffset}
                showsVerticalScrollIndicator={false}
            >
                {isSigunguStep ? (
                    sigunguLoading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        </View>
                    ) : (
                        <>
                            {allowAll && (
                                <Pressable
                                    style={[styles.listItem, !selectedSigungu ? styles.listItemSelected : null]}
                                    onPress={handleAllSigunguSelect}
                                    testID="regionpicker-sigungu-all"
                                >
                                    <Text
                                        style={[styles.listItemText, !selectedSigungu ? styles.listItemTextSelected : null]}
                                        allowFontScaling={false}
                                    >
                                        전체
                                    </Text>
                                </Pressable>
                            )}
                            {sigunguList.map((item) => {
                                const isSelected = item === selectedSigungu;
                                return (
                                    <Pressable
                                        key={item}
                                        style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                                        onPress={() => handleSigunguSelect(item)}
                                        testID={`regionpicker-sigungu-${item}`}
                                    >
                                        <Text
                                            style={[styles.listItemText, isSelected ? styles.listItemTextSelected : null]}
                                            allowFontScaling={false}
                                        >
                                            {item}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </>
                    )
                ) : (
                    sidoLoading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        </View>
                    ) : (
                        sidoList.map((item) => {
                            const isSelected = item === selectedSido;
                            return (
                                <Pressable
                                    key={item}
                                    style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                                    onPress={() => handleSidoSelect(item)}
                                    testID={`regionpicker-sido-${item}`}
                                >
                                    <Text
                                        style={[styles.listItemText, isSelected ? styles.listItemTextSelected : null]}
                                        allowFontScaling={false}
                                    >
                                        {item}
                                    </Text>
                                </Pressable>
                            );
                        })
                    )
                )}
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    sheetBg: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handleIndicator: {
        backgroundColor: COLORS.disabledBtn,
        width: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    backBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        width: 20,
        height: 20,
    },
    headerTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
    },
    loadingWrap: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listScroll: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        gap: 2,
    },
    listItem: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderCurve: 'continuous',
    },
    listItemSelected: {
        backgroundColor: COLORS.primaryBg,
    },
    listItemText: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    listItemTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
});
