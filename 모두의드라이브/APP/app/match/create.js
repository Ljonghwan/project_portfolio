import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Pressable, TextInput, ActivityIndicator, Keyboard, BackHandler, Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import dayjs from 'dayjs';

import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import { matchApi } from '../../src/api/match';
import { showToast } from '../../src/utils/toast';
import DatePicker from 'react-native-date-picker';
import RegionPickerSheet from '../../src/components/RegionPickerSheet';
import PhotoPickerSheet from '../../src/components/PhotoPickerSheet';
import usePopupStore from '../../src/store/popupStore';

// ─── 상수 ──────────────────────────────────────────────────────────────────────

const TOTAL_STEPS_1TO1 = 5;
const TOTAL_STEPS_GROUP = 6;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp'];
const MAX_PHOTOS = 10;

const MATCH_TYPE_META = {
    one_to_one: {
        label: '1:1 매칭',
        desc: '호스트와 1:1 드라이브를 즐겨요',
        iconActive: require('../../assets/icons/match-type-1to1.svg'),
        iconInactive: require('../../assets/icons/match-type-1to1-off.svg'),
    },
    group: {
        label: '모임 매칭',
        desc: '오너/게스트 여러명을 참여시켜요',
        iconActive: require('../../assets/icons/match-type-group-on.svg'),
        iconInactive: require('../../assets/icons/match-type-group.svg'),
    },
};

// ─── 시간 유틸 ────────────────────────────────────────────────────────────────

function timeToMinutes(timeStr) {
    if (!timeStr) return -1;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function isStartTimeValid(driveDate, startTime) {
    if (!driveDate || !startTime) return false;
    const today = dayjs().format('YYYY-MM-DD');
    if (driveDate !== today) return true;
    const nowPlus1h = dayjs().add(1, 'hour');
    const [h, m] = startTime.split(':').map(Number);
    const startDt = dayjs().hour(h).minute(m).second(0);
    return startDt.isAfter(nowPlus1h);
}

function isEndTimeValid(startTime, endTime) {
    if (!startTime || !endTime) return false;
    // [M1] 종료 < 시작이면 익일 종료로 간주. 지속시간 >= 60분이면 유효.
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const duration = (endMin < startMin ? endMin + 1440 : endMin) - startMin;
    return duration >= 60;
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function MatchCreateScreen() {
    const router = useRouter();
    const { editIdx } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { height: frameHeight } = useSafeAreaFrame();
    const user = useAuthStore(s => s.user);
    const {
        matchTypes,
        filterGenders,
        filterAges,
        driveTypes: configDriveTypes,
        carTypes: configCarTypes,
    } = useConfigStore();

    const [step, setStep] = useState(editIdx ? 1 : 0);
    const [saving, setSaving] = useState(false);
    const [checking, setChecking] = useState(false);
    const [editLoading, setEditLoading] = useState(!!editIdx);
    const [formData, setFormData] = useState({
        // STEP0
        matchType: null,
        authorRole: user?.role ?? null,
        // STEP1
        meetingRegions: [{ sido: null, sigungu: null, label: '' }],
        destinations: [{ sido: null, sigungu: null, label: '' }],
        // STEP2
        driveDate: null,
        driveStartTime: null,
        driveEndTime: null,
        // STEP3
        carTypes: [],
        driveTypes: [],
        // STEP4 (1:1) or STEP4+5 (group)
        targetGender: null,
        targetAge: [],
        // group only
        ownerRecruitOn: true,
        ownerMaxCount: 1,
        ownerGender: null,
        ownerAge: [],
        guestRecruitOn: true,
        guestMaxCount: 1,
        guestGender: null,
        guestAge: [],
        // STEP5 (1:1) or STEP6 (group)
        title: '',
        content: '',
        photos: [],
    });

    // 시간 선택 DatePicker
    const [timeTarget, setTimeTarget] = useState(null);
    const [timeSheetOpen, setTimeSheetOpen] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date());

    // 지역 선택 시트
    const [regionSheetVisible, setRegionSheetVisible] = useState(false);
    const regionTargetRef = useRef(null); // { type: 'meeting'|'destination', rowIndex: number }
    // [C126/C127] 시트 열 때 해당 행의 기선택 시/도(시군구) + 시작 step 을 RegionPickerSheet 에 전달
    const [regionInitial, setRegionInitial] = useState({ sido: null, sigungu: null, startStep: undefined });

    // 사진 선택 시트
    const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

    // 월 커서 (STEP2 캘린더)
    const today = useMemo(() => dayjs().startOf('day'), []);
    const [cursor, setCursor] = useState(() => today.startOf('month'));

    // ─── 캘린더 주 계산 ───────────────────────────────────────────────────────
    const weeks = useMemo(() => {
        const start = cursor.startOf('month');
        const startWeekday = start.day();
        const daysInMonth = cursor.daysInMonth();
        const cells = [];
        for (let i = 0; i < startWeekday; i++) {
            cells.push({ date: start.subtract(startWeekday - i, 'day'), outside: true });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: start.date(d), outside: false });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ date: cells[cells.length - 1].date.add(1, 'day'), outside: true });
        }
        while (cells.length < 42) {
            cells.push({ date: cells[cells.length - 1].date.add(1, 'day'), outside: true });
        }
        const rows = [];
        for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
        return rows;
    }, [cursor]);

    const cellH = frameHeight >= 760 ? 44 : frameHeight >= 660 ? 40 : 36;

    // ─── 유효성 ───────────────────────────────────────────────────────────────
    const step0Valid = !!formData.matchType;
    const hasDestination = formData.destinations.some(d => d.sido);
    const step1Valid = !!formData.meetingRegions[0]?.sido && hasDestination;

    const startOk = isStartTimeValid(formData.driveDate, formData.driveStartTime);
    const endOk = isEndTimeValid(formData.driveStartTime, formData.driveEndTime);
    const showTimeWarning = (!!formData.driveStartTime && !startOk) ||
        (!!formData.driveStartTime && !!formData.driveEndTime && !endOk);
    const step2Valid = !!formData.driveDate && !!formData.driveStartTime && !!formData.driveEndTime &&
        startOk && endOk;

    const isGroup = formData.matchType === 'group';
    const isGuestAuthor = user?.role === 'guest';
    const TOTAL_STEPS = isGroup ? TOTAL_STEPS_GROUP : TOTAL_STEPS_1TO1;
    const showCarTypes = isGuestAuthor || isGroup;
    const step3Valid = formData.driveTypes.length > 0 && (!showCarTypes || formData.carTypes.length > 0);

    let step4Valid, step5Valid;
    if (isGroup) {
        const ownerOk = !formData.ownerRecruitOn || (!!formData.ownerGender && formData.ownerAge.length > 0);
        step4Valid = ownerOk;
        const guestOk = !formData.guestRecruitOn || (!!formData.guestGender && formData.guestAge.length > 0);
        step5Valid = guestOk;
    } else {
        step4Valid = !!formData.targetGender && formData.targetAge.length > 0;
        step5Valid = !!formData.title.trim();
    }
    const step6Valid = !!formData.title.trim();

    // ─── 네비게이션 ──────────────────────────────────────────────────────────
    function handleBack() {
        if (step === 0 || (editIdx && step === 1)) {
            router.back();
        } else {
            setStep(s => s - 1);
        }
    }

    function handleCancel() {
        usePopupStore.getState().show('confirm', {
            title: '게시물 작성을 취소하시겠습니까?',
            cancelText: '아니오',
            confirmText: '네',
            onConfirm: () => router.back(),
        });
    }

    useEffect(() => {
        const onBackPress = () => {
            if (timeSheetOpen) {
                setTimeSheetOpen(false);
                return true;
            }
            if (regionSheetVisible) {
                setRegionSheetVisible(false);
                return true;
            }
            if (photoSheetVisible) {
                setPhotoSheetVisible(false);
                return true;
            }
            handleBack();
            return true;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
    }, [timeSheetOpen, regionSheetVisible, photoSheetVisible, step]);

    // ─── 수정 모드: 기존 데이터 로드 ─────────────────────────────────────────
    useEffect(() => {
        if (!editIdx) return;
        (async () => {
            setEditLoading(true);
            try {
                const res = await matchApi.getDetail(editIdx);
                const m = res.data;
                const role = m.authorRole;
                const isGroupEdit = m.matchType === 'group';
                setFormData(d => ({
                    ...d,
                    matchType: m.matchType,
                    meetingRegions: (m.meetingRegions || []).length > 0
                        ? (m.meetingRegions).map(r => ({
                            sido: r.sido,
                            sigungu: r.sigungu || null,
                            label: r.sigungu ? `${r.sido} ${r.sigungu}` : r.sido,
                        }))
                        : [{ sido: null, sigungu: null, label: '' }],
                    destinations: (m.destinations || []).length > 0
                        ? (m.destinations).map(r => ({
                            sido: r.sido,
                            sigungu: r.sigungu || null,
                            label: r.sigungu ? `${r.sido} ${r.sigungu}` : r.sido,
                        }))
                        : [{ sido: null, sigungu: null, label: '' }],
                    driveDate: m.driveDate ? dayjs(m.driveDate).format('YYYY-MM-DD') : null,
                    driveStartTime: m.driveStartTime ? m.driveStartTime.substring(0, 5) : null,
                    driveEndTime: m.driveEndTime ? m.driveEndTime.substring(0, 5) : null,
                    carTypes: Array.isArray(m.carTypes) ? m.carTypes : [],
                    driveTypes: Array.isArray(m.driveTypes) ? m.driveTypes : [],
                    // 1:1 매칭
                    targetGender: !isGroupEdit
                        ? (role === 'owner'
                            ? (Array.isArray(m.guestGender) ? m.guestGender[0] : null)
                            : (Array.isArray(m.ownerGender) ? m.ownerGender[0] : null))
                        : null,
                    targetAge: !isGroupEdit
                        ? (role === 'owner'
                            ? (Array.isArray(m.guestAge) ? m.guestAge : [])
                            : (Array.isArray(m.ownerAge) ? m.ownerAge : []))
                        : [],
                    // 모임매칭
                    ownerRecruitOn: isGroupEdit ? (m.ownerMaxCount || 0) > 0 : true,
                    ownerMaxCount: m.ownerMaxCount || 1,
                    ownerGender: isGroupEdit ? (Array.isArray(m.ownerGender) ? m.ownerGender[0] : null) : null,
                    ownerAge: isGroupEdit ? (Array.isArray(m.ownerAge) ? m.ownerAge : []) : [],
                    guestRecruitOn: isGroupEdit ? (m.guestMaxCount || 0) > 0 : true,
                    guestMaxCount: m.guestMaxCount || 1,
                    guestGender: isGroupEdit ? (Array.isArray(m.guestGender) ? m.guestGender[0] : null) : null,
                    guestAge: isGroupEdit ? (Array.isArray(m.guestAge) ? m.guestAge : []) : [],
                    title: m.title || '',
                    content: m.content || '',
                    photos: (m.photos || []).map(p => ({
                        type: 'existing',
                        idx: p.idx,
                        imageUrl: p.imageUrl,
                        uri: STORAGE_URL + p.imageUrl,
                    })),
                }));
                if (m.driveDate) {
                    setCursor(dayjs(m.driveDate).startOf('month'));
                }
            } catch {
                showToast('error', '매칭 정보를 불러오지 못했습니다.');
                router.back();
            } finally {
                setEditLoading(false);
            }
        })();
    }, [editIdx]);

    async function handleNext() {
        if (checking) return;
        if (step === 0 && step0Valid) setStep(1);
        else if (step === 1 && step1Valid) setStep(2);
        else if (step === 2 && step2Valid) {
            // 같은 시간대에 내가 쓴 글이 이미 있으면 여기서 알려준다 (최종 등록에서 서버가 다시 막는다)
            setChecking(true);
            try {
                const res = await matchApi.checkSchedule({
                    driveDate: formData.driveDate,
                    driveStartTime: formData.driveStartTime,
                    driveEndTime: formData.driveEndTime,
                    matchIdx: editIdx ? Number(editIdx) : undefined,
                });
                if (res.data?.conflict) {
                    showToast('error', '해당 시간대에 이미 등록한 매칭글이 있습니다.');
                    return;
                }
            } catch {
                // 검사 실패로 작성 흐름을 막지 않는다 — 등록 시 서버가 최종 방어한다
            } finally {
                setChecking(false);
            }
            setStep(3);
        }
        else if (step === 3 && step3Valid) setStep(4);
        else if (step === 4 && step4Valid) {
            if (isGroup && !formData.ownerRecruitOn && !formData.guestRecruitOn) {
                showToast('error', '오너 또는 게스트 중 하나는 모집해야 합니다.');
                return;
            }
            setStep(5);
        } else if (isGroup && step === 5 && step5Valid) {
            if (!formData.ownerRecruitOn && !formData.guestRecruitOn) {
                showToast('error', '오너 또는 게스트 중 하나는 모집해야 합니다.');
                return;
            }
            setStep(6);
        }
    }

    function handleSubmit() {
        if (saving) return;
        Keyboard.dismiss();
        usePopupStore.getState().show('confirm', {
            title: editIdx ? '게시물을 수정하시겠습니까?' : '게시물을 등록하시겠습니까?',
            cancelText: '아니오',
            confirmText: '네',
            onConfirm: doSubmit,
        });
    }

    async function doSubmit() {
        if (saving) return;
        setSaving(true);
        try {
            const authorRole = user?.role;
            const matchType = formData.matchType;
            const isGroupMatch = matchType === 'group';

            let finalOwnerMaxCount, finalGuestMaxCount;
            if (!isGroupMatch) {
                finalOwnerMaxCount = authorRole === 'guest' ? 1 : 0;
                finalGuestMaxCount = authorRole === 'owner' ? 1 : 0;
            } else {
                finalOwnerMaxCount = formData.ownerRecruitOn ? formData.ownerMaxCount : 0;
                finalGuestMaxCount = formData.guestRecruitOn ? formData.guestMaxCount : 0;
            }

            // 사진 base64 변환
            const images = formData.photos.map((p) => {
                if (!p.base64) return null;
                const rawExt = p.mimeType?.split('/').pop()?.toLowerCase()
                    || p.uri?.split('.').pop()?.toLowerCase() || 'jpg';
                const ext = ALLOWED_IMAGE_EXTS.includes(rawExt) ? rawExt : 'jpg';
                return { base: `data:image/${ext};base64,${p.base64}`, ext };
            }).filter(Boolean);

            const body = {
                matchType,
                driveDate: formData.driveDate,
                driveStartTime: formData.driveStartTime,
                driveEndTime: formData.driveEndTime,
                carTypes: (isGroupMatch || authorRole === 'guest') ? formData.carTypes : [],
                driveTypes: formData.driveTypes,
                ownerMaxCount: finalOwnerMaxCount,
                guestMaxCount: finalGuestMaxCount,
                title: formData.title.trim(),
                content: formData.content.trim(),
                meetingRegions: formData.meetingRegions.filter(r => r.sido),
                destinations: formData.destinations.filter(r => r.sido),
            };

            if (isGroupMatch) {
                body.ownerGender = formData.ownerRecruitOn ? formData.ownerGender : null;
                body.ownerAge = formData.ownerRecruitOn ? formData.ownerAge : [];
                body.guestGender = formData.guestRecruitOn ? formData.guestGender : null;
                body.guestAge = formData.guestRecruitOn ? formData.guestAge : [];
            } else {
                body.targetGender = formData.targetGender;
                body.targetAge = formData.targetAge;
            }

            if (editIdx) {
                const keepPhotoIdxs = formData.photos
                    .filter(p => p.type === 'existing')
                    .map(p => p.idx);
                const newImages = formData.photos
                    .filter(p => p.type === 'new')
                    .map(p => {
                        if (!p.base64) return null;
                        const rawExt = p.mimeType?.split('/').pop()?.toLowerCase()
                            || p.uri?.split('.').pop()?.toLowerCase() || 'jpg';
                        const ext = ALLOWED_IMAGE_EXTS.includes(rawExt) ? rawExt : 'jpg';
                        return { base: `data:image/${ext};base64,${p.base64}`, ext };
                    }).filter(Boolean);
                await matchApi.update({ ...body, matchIdx: Number(editIdx), keepPhotoIdxs, images: newImages });
                showToast('success', '매칭이 수정되었습니다.');
            } else {
                await matchApi.create({ ...body, images });
                showToast('success', '매칭이 등록되었습니다.');
            }
            router.back();
        } catch (e) {
            const msg = e?.response?.data?.message || '등록 중 오류가 발생했습니다.';
            showToast('error', msg);
        } finally {
            setSaving(false);
        }
    }

    // ─── 시간 선택 ───────────────────────────────────────────────────────────
    function openTimePicker(target) {
        const current = target === 'start' ? formData.driveStartTime : formData.driveEndTime;
        if (current) {
            const [h, m] = current.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            setPickerDate(d);
        } else {
            const d = new Date();
            d.setHours(9, 0, 0, 0);
            setPickerDate(d);
        }
        setTimeTarget(target);
        setTimeSheetOpen(true);
    }

    // ─── 지역 선택 ───────────────────────────────────────────────────────────
    function openRegionSheet(type, rowIndex, startStep) {
        // [C127-B] 닫히는 중 다른 박스 탭으로 인한 race 방지 — 이미 열려있으면 무시
        if (regionSheetVisible) return;
        regionTargetRef.current = { type, rowIndex };
        // [C126] 편집 대상 행의 기선택 값을 initial 로 전달 (시/도 있으면 시/군/구부터)
        const key = type === 'meeting' ? 'meetingRegions' : 'destinations';
        const row = formData[key]?.[rowIndex];
        const sido = row?.sido || null;
        // [C127-A] 시/군/구 박스인데 시/도 미선택이면 시/도부터 강제
        const effectiveStep = (startStep === 'sigungu' && !sido) ? 'sido' : startStep;
        setRegionInitial({ sido, sigungu: row?.sigungu || null, startStep: effectiveStep });
        setRegionSheetVisible(true);
    }

    const handleRegionSelect = useCallback((sido, sigungu) => {
        const { type, rowIndex } = regionTargetRef.current;
        const key = type === 'meeting' ? 'meetingRegions' : 'destinations';
        const label = sigungu ? `${sido} ${sigungu}` : sido;
        setFormData(d => {
            const updated = [...d[key]];
            updated[rowIndex] = { sido, sigungu: sigungu || null, label };
            return { ...d, [key]: updated };
        });
    }, []);

    // ─── 사진 선택 ───────────────────────────────────────────────────────────
    const handlePhotoSelected = useCallback((asset) => {
        setFormData(d => {
            const remaining = MAX_PHOTOS - d.photos.length;
            if (remaining <= 0) return d;
            if (Array.isArray(asset)) {
                const toAdd = asset.slice(0, remaining).map(a => ({ ...a, type: 'new' }));
                return { ...d, photos: [...d.photos, ...toAdd] };
            }
            return { ...d, photos: [...d.photos, { ...asset, type: 'new' }] };
        });
    }, []);

    // ─── 렌더 ────────────────────────────────────────────────────────────────

    if (editLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
                <StatusBar style="dark" />
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
            </View>
        );
    }

    const matchTypeLabel = formData.matchType
        ? (MATCH_TYPE_META[formData.matchType]?.label ?? '')
        : '매칭 만들기';

    const nextEnabled =
        step === 0 ? step0Valid :
        step === 1 ? step1Valid :
        step === 2 ? step2Valid :
        step === 3 ? step3Valid :
        step === 4 ? step4Valid :
        step === 5 ? step5Valid :
        step6Valid;

    const isLastStep = step === TOTAL_STEPS;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    testID="create-back-btn"
                    onPress={handleBack}
                    style={styles.headerIconBtn}
                    hitSlop={8}
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.headerIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false} numberOfLines={1}>
                    {editIdx ? '매칭 수정' : step === 0 ? '' : matchTypeLabel}
                </Text>

                {step > 0 && (
                    <TouchableOpacity
                        testID="create-cancel-btn"
                        onPress={handleCancel}
                        hitSlop={8}
                    >
                        <Text style={styles.cancelText} allowFontScaling={false}>취소</Text>
                    </TouchableOpacity>
                )}
                
            </View>

            {/* 스텝 인디케이터 (step 0에서는 숨김) */}
            {step > 0 && <StepIndicator step={step} total={TOTAL_STEPS} />}

            {/* 본문 */}
            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bottomOffset={120}
            >
                {step === 0 && (
                    <Step0TypeSelect
                        formData={formData}
                        setFormData={setFormData}
                        matchTypes={matchTypes}
                        onTypeSelect={() => setStep(1)}
                    />
                )}
                {step === 1 && (
                    <Step1Regions
                        formData={formData}
                        setFormData={setFormData}
                        openRegionSheet={openRegionSheet}
                    />
                )}
                {step === 2 && (
                    <Step2DateTime
                        formData={formData}
                        setFormData={setFormData}
                        today={today}
                        cursor={cursor}
                        setCursor={setCursor}
                        weeks={weeks}
                        cellH={cellH}
                        showTimeWarning={showTimeWarning}
                        openTimePicker={openTimePicker}
                    />
                )}
                {step === 3 && (
                    <Step3DriveType
                        formData={formData}
                        setFormData={setFormData}
                        configDriveTypes={configDriveTypes}
                        configCarTypes={configCarTypes}
                        showCarTypes={showCarTypes}
                    />
                )}
                {step === 4 && !isGroup && (
                    <Step4Conditions
                        formData={formData}
                        setFormData={setFormData}
                        filterGenders={filterGenders}
                        filterAges={filterAges}
                        isGuestAuthor={isGuestAuthor}
                    />
                )}
                {step === 4 && isGroup && (
                    <Step4GroupOwner
                        formData={formData}
                        setFormData={setFormData}
                        filterGenders={filterGenders}
                        filterAges={filterAges}
                        isGuestAuthor={isGuestAuthor}
                    />
                )}
                {step === 5 && isGroup && (
                    <Step5GroupGuest
                        formData={formData}
                        setFormData={setFormData}
                        filterGenders={filterGenders}
                        filterAges={filterAges}
                        isGuestAuthor={isGuestAuthor}
                    />
                )}
                {((step === 5 && !isGroup) || (step === 6 && isGroup)) && (
                    <Step5Content
                        formData={formData}
                        setFormData={setFormData}
                        onAddPhoto={() => setPhotoSheetVisible(true)}
                    />
                )}
            </KeyboardAwareScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    testID="create-next-btn"
                    onPress={isLastStep ? handleSubmit : handleNext}
                    disabled={!nextEnabled || saving || checking}
                    style={[styles.nextBtn, (!nextEnabled || saving || checking) && styles.nextBtnDisabled]}
                >
                    {(saving || checking) ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.nextBtnText} allowFontScaling={false}>
                            {isLastStep ? (editIdx ? '수정하기' : '등록하기') : '다음'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* 시간 선택 DatePicker */}
            <DatePicker
                modal
                open={timeSheetOpen}
                date={pickerDate}
                mode="time"
                minuteInterval={5}
                title={timeTarget === 'start' ? '시작 시간' : '종료 시간'}
                confirmText="확인"
                cancelText="취소"
                onConfirm={(date) => {
                    const h = String(date.getHours()).padStart(2, '0');
                    const m = String(date.getMinutes()).padStart(2, '0');
                    const timeStr = `${h}:${m}`;
                    if (timeTarget === 'start') {
                        setFormData(d => ({ ...d, driveStartTime: timeStr, driveEndTime: null }));
                    } else {
                        setFormData(d => ({ ...d, driveEndTime: timeStr }));
                    }
                    setTimeSheetOpen(false);
                }}
                onCancel={() => setTimeSheetOpen(false)}
            />

            {/* 지역 선택 시트 */}
            <RegionPickerSheet
                visible={regionSheetVisible}
                onClose={() => setRegionSheetVisible(false)}
                onSelect={handleRegionSelect}
                initialSido={regionInitial.sido}
                initialSigungu={regionInitial.sigungu}
                startStep={regionInitial.startStep}
            />

            {/* 사진 선택 시트 */}
            <PhotoPickerSheet
                visible={photoSheetVisible}
                onClose={() => setPhotoSheetVisible(false)}
                onImageSelected={handlePhotoSelected}
                allowMultiple
                selectionLimit={MAX_PHOTOS}
            />
        </View>
    );
}

// ─── 스텝 인디케이터 ──────────────────────────────────────────────────────────

function StepIndicator({ step, total }) {
    const pct = step / total;
    return (
        <View style={indStyles.wrap}>
            <View style={indStyles.badgeRow}>
                <View style={indStyles.badge}>
                    <Text style={indStyles.badgeText} allowFontScaling={false}>STEP {step}</Text>
                </View>
            </View>
            <View style={indStyles.track}>
                <View style={[indStyles.fill, { width: `${pct * 100}%` }]} />
            </View>
        </View>
    );
}

const indStyles = StyleSheet.create({
    wrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, gap: SPACING.xs },
    badgeRow: { flexDirection: 'row' },
    badge: {
        backgroundColor: COLORS.primary,
        borderRadius: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    badgeText: {
        fontFamily: FONTS.extraBold,
        fontSize: 11,
        lineHeight: 16,
        color: COLORS.white,
    },
    track: {
        height: 4,
        backgroundColor: '#EEEEEE',
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
});

// ─── STEP0: 매칭 유형 선택 ────────────────────────────────────────────────────

function Step0TypeSelect({ formData, setFormData, matchTypes, onTypeSelect }) {
    const types = matchTypes?.length > 0
        ? matchTypes
        : [{ key: 'one_to_one', label: '1:1' }, { key: 'group', label: '모임' }];

    return (
        <View style={s0Styles.wrap}>
            <Text style={s0Styles.title} allowFontScaling={false}>
                어떤 드라이브 매칭을 만드시겠어요?
            </Text>
            <View style={s0Styles.cards}>
                {types.map((type) => {
                    const meta = MATCH_TYPE_META[type.key];
                    if (!meta) return null;
                    const selected = formData.matchType === type.key;
                    return (
                        <TouchableOpacity
                            key={type.key}
                            testID={`create-type-${type.key}`}
                            style={[s0Styles.card, selected && s0Styles.cardActive]}
                            onPress={() => {
                                setFormData(d => ({ ...d, matchType: type.key }));
                                // onTypeSelect?.();
                            }}
                            activeOpacity={0.85}
                        >
                            <View style={s0Styles.cardText}>
                                <Text
                                    style={[s0Styles.cardTitle, selected && s0Styles.cardTitleActive]}
                                    allowFontScaling={false}
                                >
                                    {meta.label}
                                </Text>
                                <Text
                                    style={[s0Styles.cardDesc, selected && s0Styles.cardDescActive]}
                                    allowFontScaling={false}
                                >
                                    {meta.desc}
                                </Text>
                            </View>
                            <Image
                                source={selected ? meta.iconActive : meta.iconInactive}
                                style={s0Styles.cardIcon}
                                contentFit="contain"
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const s0Styles = StyleSheet.create({
    wrap: { gap: SPACING.xxl },
    title: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    cards: { gap: SPACING.md, flexDirection: 'row', alignItems: 'stretch' },
    card: {
        flex: 1,
        gap: SPACING.xxxl,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 20,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
    },
    cardActive: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    cardIcon: { width: 56, height: 56, alignSelf: 'flex-end' },
    cardText: { flex: 1, gap: 6 },
    cardTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textMedium,
    },
    cardTitleActive: { color: COLORS.primary },
    cardDesc: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        color: COLORS.grayMedium,
    },
    cardDescActive: { color: COLORS.primary },
});

// ─── STEP1: 지역/목적지 선택 ─────────────────────────────────────────────────

const MAX_REGIONS = 3;
const minusOutlineIcon = require('../../assets/icons/minus-outline.svg');
const plusCircleIcon = require('../../assets/icons/plus-circle-blue.svg');
const chevronDownIcon = require('../../assets/icons/chevron-down.svg');

function Step1Regions({ formData, setFormData, openRegionSheet }) {
    function addRow(key) {
        setFormData(d => {
            if (d[key].length >= MAX_REGIONS) return d;
            return { ...d, [key]: [...d[key], { sido: null, sigungu: null, label: '' }] };
        });
    }
    function removeRow(key, idx) {
        setFormData(d => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));
    }

    function renderSection(key, title) {
        const rows = key === 'meeting' ? formData.meetingRegions : formData.destinations;
        const dataKey = key === 'meeting' ? 'meetingRegions' : 'destinations';
        return (
            <View style={s1Styles.section}>
                <Text style={s1Styles.sectionLabel} allowFontScaling={false}>{title}</Text>
                {rows.map((r, i) => (
                    <View key={i} style={s1Styles.row}>
                        <Pressable
                            testID={`create-${key}-sido-${i}`}
                            style={s1Styles.selectBox}
                            onPress={() => openRegionSheet(key, i, 'sido')}
                        >
                            <Text
                                style={[s1Styles.selectText, r.sido && s1Styles.selectTextFilled]}
                                allowFontScaling={false}
                                numberOfLines={1}
                            >
                                {r.sido || '시/도 선택'}
                            </Text>
                            <Image source={chevronDownIcon} style={s1Styles.chevron} tintColor={r.sido ? COLORS.textPrimary : COLORS.grayMedium} />
                        </Pressable>
                        <Pressable
                            testID={`create-${key}-sigungu-${i}`}
                            style={s1Styles.selectBox}
                            onPress={() => openRegionSheet(key, i, 'sigungu')}
                        >
                            <Text
                                style={[s1Styles.selectText, r.sigungu && s1Styles.selectTextFilled]}
                                allowFontScaling={false}
                                numberOfLines={1}
                            >
                                {r.sigungu || '시/군/구 선택'}
                            </Text>
                            <Image source={chevronDownIcon} style={s1Styles.chevron} tintColor={r.sigungu ? COLORS.textPrimary : COLORS.grayMedium} />
                        </Pressable>
                        {i === 0 ? (
                            <Text style={s1Styles.requiredText} allowFontScaling={false}>필수</Text>
                        ) : (
                            <TouchableOpacity
                                testID={`create-remove-${key}-${i}`}
                                onPress={() => removeRow(dataKey, i)}
                                hitSlop={8}
                                style={s1Styles.removeBtn}
                            >
                                <Image source={minusOutlineIcon} style={s1Styles.removeIcon} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                {rows.length < MAX_REGIONS && (
                    <TouchableOpacity
                        testID={`create-add-${key}`}
                        style={s1Styles.addRowBtn}
                        onPress={() => addRow(dataKey)}
                        activeOpacity={0.7}
                    >
                        <Image source={plusCircleIcon} style={s1Styles.plusIcon} />
                        <Text style={s1Styles.addRowText} allowFontScaling={false}>
                            추가하기(최대 {MAX_REGIONS}곳)
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={s1Styles.wrap}>
            {renderSection('meeting', '만나실 지역을 선택해 주세요.')}
            {renderSection('destination', '드라이브 하실 목적지를 선택해 주세요.')}
        </View>
    );
}

const s1Styles = StyleSheet.create({
    wrap: { gap: SPACING.xl },
    section: { gap: SPACING.sm },
    sectionLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    selectBox: {
        flex: 1,
        height: 52,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 12,
        paddingRight: 4,
    },
    selectText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.grayMedium,
    },
    selectTextFilled: {
        color: '#070B25',
    },
    chevron: {
        width: 20,
        height: 20,
    },
    requiredText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: '#E02E2E',
        width: 32,
        textAlign: 'center',
    },
    removeBtn: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        width: 20,
        height: 20,
    },
    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
    },
    plusIcon: {
        width: 24,
        height: 24,
    },
    addRowText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
    },
});

// ─── STEP2: 날짜/시간 선택 ───────────────────────────────────────────────────

function Step2DateTime({
    formData, setFormData,
    today, cursor, setCursor,
    weeks, cellH,
    showTimeWarning,
    openTimePicker,
}) {
    return (
        <View style={s2Styles.wrap}>
            {/* 날짜 선택 */}
            <Text style={s2Styles.sectionTitle} allowFontScaling={false}>날짜를 선택해 주세요.</Text>
            <View style={s2Styles.calCard}>
                {/* 월 네비게이션 */}
                <View style={s2Styles.calHeader}>
                    <Pressable
                        onPress={() => {
                            setCursor(c => {
                                const prev = c.subtract(1, 'month');
                                return prev.isBefore(today.startOf('month')) ? c : prev;
                            });
                        }}
                        hitSlop={12}
                        style={s2Styles.calArrow}
                        testID="create-cal-prev"
                    >
                        <Text style={s2Styles.calArrowText} allowFontScaling={false}>{'‹'}</Text>
                    </Pressable>
                    <Text style={s2Styles.calMonth} allowFontScaling={false}>
                        {cursor.format('YYYY.M')}
                    </Text>
                    <Pressable
                        onPress={() => setCursor(c => c.add(1, 'month'))}
                        hitSlop={12}
                        style={s2Styles.calArrow}
                        testID="create-cal-next"
                    >
                        <Text style={s2Styles.calArrowText} allowFontScaling={false}>{'›'}</Text>
                    </Pressable>
                </View>
                {/* 요일 헤더 */}
                <View style={s2Styles.weekRow}>
                    {WEEKDAYS.map((w, i) => (
                        <View key={w} style={s2Styles.weekCell}>
                            <Text
                                style={[s2Styles.weekText, i === 0 && s2Styles.sunText]}
                                allowFontScaling={false}
                            >
                                {w}
                            </Text>
                        </View>
                    ))}
                </View>
                {/* 날짜 그리드 */}
                {weeks.map((row, rIdx) => (
                    <View key={rIdx} style={s2Styles.dayRow}>
                        {row.map((cell, cIdx) => {
                            const dateStr = cell.date.format('YYYY-MM-DD');
                            const isSelected = dateStr === formData.driveDate;
                            const isToday = cell.date.isSame(today, 'day');
                            const isPast = cell.date.isBefore(today, 'day');
                            const disabled = cell.outside || isPast;
                            const isSunday = cell.date.day() === 0;
                            return (
                                <Pressable
                                    key={cIdx}
                                    testID={!disabled ? `create-date-${dateStr}` : undefined}
                                    style={[s2Styles.dayCell, { height: cellH }]}
                                    disabled={disabled}
                                    onPress={() => {
                                        setFormData(d => ({
                                            ...d,
                                            driveDate: dateStr,
                                            driveStartTime: null,
                                            driveEndTime: null,
                                        }));
                                    }}
                                >
                                    <View style={[
                                        s2Styles.dayCircle,
                                        isToday && !isSelected && s2Styles.dayCircleToday,
                                    ]}>
                                        <View style={[
                                            s2Styles.dayCircleInner,
                                            isSelected && s2Styles.dayCircleSelectedInner,
                                        ]}>
                                            <Text
                                                style={[
                                                    s2Styles.dayText,
                                                    disabled && s2Styles.dayTextDisabled,
                                                    isSunday && !disabled && s2Styles.sunText,
                                                    isSelected && s2Styles.dayTextSelected,
                                                ]}
                                                allowFontScaling={false}
                                            >
                                                {cell.date.date()}
                                            </Text>
                                        </View>
                                    </View>
                                    {isToday && (
                                        <Text
                                            style={[
                                                s2Styles.todayLabel,
                                                isSelected && s2Styles.todayLabelSelected,
                                            ]}
                                            allowFontScaling={false}
                                        >
                                            오늘
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* 시간 선택 */}
            <View style={s2Styles.timeSection}>
                <View style={s2Styles.timeRow}>
                    {/* 시작 시간 */}
                    <View style={s2Styles.timeField}>
                        <Text style={s2Styles.timeLabel} allowFontScaling={false}>시작 시간</Text>
                        <TouchableOpacity
                            testID="create-start-time-btn"
                            style={s2Styles.timeInput}
                            onPress={() => openTimePicker('start')}
                            disabled={!formData.driveDate}
                        >
                            <Text
                                style={[
                                    s2Styles.timeInputText,
                                    !formData.driveStartTime && s2Styles.timeInputPlaceholder,
                                ]}
                                allowFontScaling={false}
                            >
                                {formData.driveStartTime ?? '선택'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={s2Styles.timeDash} allowFontScaling={false}>-</Text>
                    {/* 종료 시간 */}
                    <View style={s2Styles.timeField}>
                        <Text style={s2Styles.timeLabel} allowFontScaling={false}>종료 시간</Text>
                        <TouchableOpacity
                            testID="create-end-time-btn"
                            style={s2Styles.timeInput}
                            onPress={() => openTimePicker('end')}
                            disabled={!formData.driveStartTime}
                        >
                            <Text
                                style={[
                                    s2Styles.timeInputText,
                                    !formData.driveEndTime && s2Styles.timeInputPlaceholder,
                                ]}
                                allowFontScaling={false}
                            >
                                {formData.driveEndTime ?? '선택'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 시간 경고 */}
                {showTimeWarning && (
                    <View style={s2Styles.warningRow}>
                        <Image
                            source={require('../../assets/icons/alarm-warning.svg')}
                            style={s2Styles.warningIcon}
                            contentFit="contain"
                        />
                        <Text style={s2Styles.warningText} allowFontScaling={false}>
                            시작 시간은 1시간 이후부터 등록가능합니다. 종료시간은 시작시간 1시간 이후로 등록해 주세요.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const s2Styles = StyleSheet.create({
    wrap: { gap: SPACING.xxl },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    calCard: { gap: SPACING.xs },
    calHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xl,
        paddingVertical: SPACING.sm,
    },
    calArrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    calArrowText: {
        fontFamily: FONTS.extraBold,
        fontSize: 24,
        color: COLORS.textPrimary,
    },
    calMonth: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    weekRow: { flexDirection: 'row', paddingVertical: SPACING.sm },
    weekCell: { flex: 1, alignItems: 'center' },
    weekText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    sunText: { color: '#E02E2E' },
    dayRow: { flexDirection: 'row', alignItems: 'center' },
    dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleToday: { borderWidth: 1.5, borderColor: COLORS.primary },
    dayCircleInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleSelectedInner: { backgroundColor: COLORS.primary },
    dayText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    dayTextDisabled: { color: COLORS.disabledBtn },
    dayTextSelected: { fontFamily: FONTS.extraBold, color: COLORS.white },
    todayLabel: {
        fontFamily: FONTS.extraBold,
        fontSize: 11,
        lineHeight: 14,
        color: COLORS.primary,
    },
    todayLabelSelected: { color: COLORS.white },
    timeSection: { gap: SPACING.md },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    timeField: { flex: 1, gap: SPACING.xs },
    timeLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },
    timeInput: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
    },
    timeInputText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    timeInputPlaceholder: { color: COLORS.grayMedium },
    timeDash: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
        paddingBottom: 14,
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.xs,
    },
    warningIcon: { width: 16, height: 16, marginTop: 2, flexShrink: 0 },
    warningText: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        color: '#E02E2E',
        lineHeight: 20,
    },
});

// ─── STEP3: 차종/드라이브 타입 ───────────────────────────────────────────────

const checkStrokeIcon = require('../../assets/icons/check-stroke.svg');

function Step3DriveType({
    formData, setFormData,
    configDriveTypes, configCarTypes,
    showCarTypes,
}) {
    const driveTypes = configDriveTypes?.length > 0
        ? configDriveTypes
        : [
            { key: 'ballad', label: '발라드한 여유로운 드라이브' },
            { key: 'groove', label: '그루브한 부드러운 드라이브' },
            { key: 'rhythmical', label: '리드미컬한 경쾌한 드라이브' },
            { key: 'winding', label: '와인딩' },
        ];
    const carTypes = configCarTypes?.length > 0
        ? configCarTypes
        : [
            { key: 'sedan', label: '세단' },
            { key: 'sports', label: '스포츠' },
            { key: 'suv', label: 'SUV' },
            { key: 'bike', label: '바이크' },
        ];

    function toggleDriveType(key) {
        setFormData(d => {
            const cur = d.driveTypes || [];
            return {
                ...d,
                driveTypes: cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key],
            };
        });
    }

    function toggleCarType(key) {
        setFormData(d => {
            const cur = d.carTypes || [];
            return {
                ...d,
                carTypes: cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key],
            };
        });
    }

    return (
        <View style={s3Styles.wrap}>
            {/* 차종 (게스트 작성 또는 모임매칭 시, 2열 그리드) */}
            {showCarTypes && (
                <View style={s3Styles.section}>
                    <View style={s3Styles.sectionHeader}>
                        <Text style={s3Styles.sectionTitle} allowFontScaling={false}>
                            차종을 선택해 주세요.
                        </Text>
                        <Text style={s3Styles.multiLabel} allowFontScaling={false}>
                            중복선택 가능
                        </Text>
                    </View>
                    <View style={s3Styles.carGrid}>
                        {carTypes.map((c) => {
                            const active = formData.carTypes.includes(c.key);
                            return (
                                <TouchableOpacity
                                    key={c.key}
                                    testID={`create-step3-cartype-${c.key}`}
                                    style={[s3Styles.gridBtn, active && s3Styles.gridBtnActive]}
                                    onPress={() => toggleCarType(c.key)}
                                    activeOpacity={0.8}
                                >
                                    {active && (
                                        <Image source={checkStrokeIcon} style={s3Styles.checkIcon} />
                                    )}
                                    <Text
                                        style={[s3Styles.gridBtnText, active && s3Styles.gridBtnTextActive]}
                                        allowFontScaling={false}
                                    >
                                        {c.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* 드라이브 타입 (1열 전체 너비) */}
            <View style={s3Styles.section}>
                <View style={s3Styles.sectionHeader}>
                    <Text style={s3Styles.sectionTitle} allowFontScaling={false}>
                        드라이브 타입을 선택해 주세요.
                    </Text>
                    <Text style={s3Styles.multiLabel} allowFontScaling={false}>
                        중복선택 가능
                    </Text>
                </View>
                <View style={s3Styles.driveGrid}>
                    {driveTypes.map((d) => {
                        const active = formData.driveTypes.includes(d.key);
                        return (
                            <TouchableOpacity
                                key={d.key}
                                testID={`create-step3-drivetype-${d.key}`}
                                style={[s3Styles.gridBtn, s3Styles.driveBtn, active && s3Styles.gridBtnActive]}
                                onPress={() => toggleDriveType(d.key)}
                                activeOpacity={0.8}
                            >
                                {active && (
                                    <Image source={checkStrokeIcon} style={s3Styles.checkIcon} />
                                )}
                                <Text
                                    style={[s3Styles.gridBtnText, active && s3Styles.gridBtnTextActive]}
                                    allowFontScaling={false}
                                >
                                    {d.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const s3Styles = StyleSheet.create({
    wrap: { gap: SPACING.xl },
    section: { gap: SPACING.md },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    multiLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: '#686869',
    },
    carGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    driveGrid: {
        gap: SPACING.sm,
    },
    gridBtn: {
        width: '48.5%',
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: COLORS.white,
    },
    gridBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    driveBtn: {
        width: '100%',
    },
    checkIcon: {
        position: 'absolute',
        left: 11,
        width: 20,
        height: 20,
    },
    gridBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: '#969698',
    },
    gridBtnTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
});

// ─── STEP4: 희망 게스트 조건 ─────────────────────────────────────────────────

function Step4Conditions({
    formData, setFormData,
    filterGenders, filterAges,
    isGuestAuthor,
}) {
    const genders = filterGenders || [];
    const ages = filterAges || [];

    function toggleAge(key) {
        setFormData(d => {
            const current = d.targetAge || [];
            if (key === 'any') return { ...d, targetAge: ['any'] };
            const without = current.filter(k => k !== 'any');
            if (without.includes(key)) {
                return { ...d, targetAge: without.filter(k => k !== key) };
            }
            return { ...d, targetAge: [...without, key] };
        });
    }

    const targetLabel = isGuestAuthor ? '오너' : '게스트';

    return (
        <View style={s4Styles.wrap}>
            <Text style={s4Styles.pageTitle} allowFontScaling={false}>원하시는 {targetLabel}를 선택해 주세요.</Text>

            {/* 성별 */}
            <View style={s4Styles.section}>
                <View style={s4Styles.sectionHeader}>
                    <Text style={s4Styles.sectionTitle} allowFontScaling={false}>성별</Text>
                </View>
                <View style={s4Styles.grid}>
                    {genders.map((g) => {
                        const active = formData.targetGender === g.key;
                        return (
                            <TouchableOpacity
                                key={g.key}
                                testID={`create-step4-gender-${g.key}`}
                                style={[s4Styles.gridBtn, active && s4Styles.gridBtnActive]}
                                onPress={() => setFormData(d => ({ ...d, targetGender: g.key }))}
                                activeOpacity={0.8}
                            >
                                {active && <Image source={checkStrokeIcon} style={s4Styles.checkIcon} />}
                                <Text
                                    style={[s4Styles.gridBtnText, active && s4Styles.gridBtnTextActive]}
                                    allowFontScaling={false}
                                >
                                    {g.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* 나이대 */}
            <View style={s4Styles.section}>
                <View style={s4Styles.sectionHeader}>
                    <Text style={s4Styles.sectionTitle} allowFontScaling={false}>나이</Text>
                    <Text style={s4Styles.multiLabel} allowFontScaling={false}>중복선택 가능</Text>
                </View>
                <View style={s4Styles.grid}>
                    {ages.map((a) => {
                        const active = formData.targetAge.includes(a.key);
                        return (
                            <TouchableOpacity
                                key={a.key}
                                testID={`create-step4-age-${a.key}`}
                                style={[s4Styles.gridBtn, active && s4Styles.gridBtnActive]}
                                onPress={() => toggleAge(a.key)}
                                activeOpacity={0.8}
                            >
                                {active && <Image source={checkStrokeIcon} style={s4Styles.checkIcon} />}
                                <Text
                                    style={[s4Styles.gridBtnText, active && s4Styles.gridBtnTextActive]}
                                    allowFontScaling={false}
                                >
                                    {a.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

// ─── 모임매칭 공용: 모집인원 + 성별 + 나이 섹션 ──────────────────────────────

function GroupConditionSection({
    title, recruitOn, onToggleRecruit,
    maxCount, onChangeCount, maxLimit,
    gender, onSelectGender, age, onToggleAge,
    filterGenders, filterAges,
    testPrefix,
}) {
    const genders = filterGenders || [];
    const ages = filterAges || [];

    return (
        <View style={s4Styles.wrap}>
            <Text style={s4Styles.pageTitle} allowFontScaling={false}>{title}</Text>

            {/* 모집 인원 */}
            <View style={s4Styles.section}>
                <View style={s4Styles.recruitHeader}>
                    <Text style={s4Styles.sectionTitle} allowFontScaling={false}>
                        모집 인원(최대{maxLimit}명)
                    </Text>
                    <View style={s4Styles.recruitToggle}>
                        <Text style={s4Styles.recruitLabel} allowFontScaling={false}>모집</Text>
                        <Switch
                            testID={`${testPrefix}-recruit-toggle`}
                            value={recruitOn}
                            onValueChange={onToggleRecruit}
                            trackColor={{ false: '#DDD', true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        />
                    </View>
                </View>
                {recruitOn && (
                    <View style={s4Styles.inlineCounter}>
                        <TouchableOpacity
                            testID={`${testPrefix}-count-minus`}
                            style={[s4Styles.inlineCounterBtn, maxCount <= 1 && s4Styles.inlineCounterBtnDisabled]}
                            onPress={() => onChangeCount(Math.max(1, maxCount - 1))}
                            disabled={maxCount <= 1}
                            hitSlop={8}
                        >
                            <Text
                                style={[s4Styles.inlineCounterBtnText, maxCount <= 1 && s4Styles.inlineCounterBtnTextDisabled]}
                                allowFontScaling={false}
                            >−</Text>
                        </TouchableOpacity>
                        <Text testID={`${testPrefix}-count-value`} style={s4Styles.inlineCounterValue} allowFontScaling={false}>
                            {maxCount}명
                        </Text>
                        <TouchableOpacity
                            testID={`${testPrefix}-count-plus`}
                            style={[s4Styles.inlineCounterBtn, maxCount >= maxLimit && s4Styles.inlineCounterBtnDisabled]}
                            onPress={() => onChangeCount(Math.min(maxLimit, maxCount + 1))}
                            disabled={maxCount >= maxLimit}
                            hitSlop={8}
                        >
                            <Text
                                style={[s4Styles.inlineCounterBtnText, maxCount >= maxLimit && s4Styles.inlineCounterBtnTextDisabled]}
                                allowFontScaling={false}
                            >+</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* 성별 */}
            {recruitOn && (
                <View style={s4Styles.section}>
                    <View style={s4Styles.sectionHeader}>
                        <Text style={s4Styles.sectionTitle} allowFontScaling={false}>성별</Text>
                    </View>
                    <View style={s4Styles.grid}>
                        {genders.map((g) => {
                            const active = gender === g.key;
                            return (
                                <TouchableOpacity
                                    key={g.key}
                                    testID={`${testPrefix}-gender-${g.key}`}
                                    style={[s4Styles.gridBtn, active && s4Styles.gridBtnActive]}
                                    onPress={() => onSelectGender(g.key)}
                                    activeOpacity={0.8}
                                >
                                    {active && <Image source={checkStrokeIcon} style={s4Styles.checkIcon} />}
                                    <Text
                                        style={[s4Styles.gridBtnText, active && s4Styles.gridBtnTextActive]}
                                        allowFontScaling={false}
                                    >{g.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* 나이 */}
            {recruitOn && (
                <View style={s4Styles.section}>
                    <View style={s4Styles.sectionHeader}>
                        <Text style={s4Styles.sectionTitle} allowFontScaling={false}>나이</Text>
                        <Text style={s4Styles.multiLabel} allowFontScaling={false}>중복선택 가능</Text>
                    </View>
                    <View style={s4Styles.grid}>
                        {ages.map((a) => {
                            const active = (age || []).includes(a.key);
                            return (
                                <TouchableOpacity
                                    key={a.key}
                                    testID={`${testPrefix}-age-${a.key}`}
                                    style={[s4Styles.gridBtn, active && s4Styles.gridBtnActive]}
                                    onPress={() => onToggleAge(a.key)}
                                    activeOpacity={0.8}
                                >
                                    {active && <Image source={checkStrokeIcon} style={s4Styles.checkIcon} />}
                                    <Text
                                        style={[s4Styles.gridBtnText, active && s4Styles.gridBtnTextActive]}
                                        allowFontScaling={false}
                                    >{a.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
}

function Step4GroupOwner({ formData, setFormData, filterGenders, filterAges, isGuestAuthor }) {
    function toggleAge(key) {
        setFormData(d => {
            const current = d.ownerAge || [];
            if (key === 'any') return { ...d, ownerAge: ['any'] };
            const without = current.filter(k => k !== 'any');
            if (without.includes(key)) return { ...d, ownerAge: without.filter(k => k !== key) };
            return { ...d, ownerAge: [...without, key] };
        });
    }

    // 작성자가 게스트면 오너는 본인 외이므로 max 4, 작성자가 오너면 본인 + 3 = 4 → max 3
    const ownerLimit = isGuestAuthor ? 4 : 3;

    return (
        <GroupConditionSection
            title="원하시는 오너를 선택해 주세요."
            recruitOn={formData.ownerRecruitOn}
            onToggleRecruit={(v) => setFormData(d => ({ ...d, ownerRecruitOn: v }))}
            maxCount={formData.ownerMaxCount}
            onChangeCount={(v) => setFormData(d => ({ ...d, ownerMaxCount: v }))}
            maxLimit={ownerLimit}
            gender={formData.ownerGender}
            onSelectGender={(g) => setFormData(d => ({ ...d, ownerGender: g }))}
            age={formData.ownerAge}
            onToggleAge={toggleAge}
            filterGenders={filterGenders}
            filterAges={filterAges}
            testPrefix="create-group-owner"
        />
    );
}

function Step5GroupGuest({ formData, setFormData, filterGenders, filterAges, isGuestAuthor }) {
    function toggleAge(key) {
        setFormData(d => {
            const current = d.guestAge || [];
            if (key === 'any') return { ...d, guestAge: ['any'] };
            const without = current.filter(k => k !== 'any');
            if (without.includes(key)) return { ...d, guestAge: without.filter(k => k !== key) };
            return { ...d, guestAge: [...without, key] };
        });
    }

    // 작성자가 게스트면 본인 + 3 = 4 → max 3, 작성자가 오너면 게스트는 본인 외이므로 max 4
    const guestLimit = isGuestAuthor ? 3 : 4;

    return (
        <GroupConditionSection
            title="원하시는 게스트를 선택해 주세요."
            recruitOn={formData.guestRecruitOn}
            onToggleRecruit={(v) => setFormData(d => ({ ...d, guestRecruitOn: v }))}
            maxCount={formData.guestMaxCount}
            onChangeCount={(v) => setFormData(d => ({ ...d, guestMaxCount: v }))}
            maxLimit={guestLimit}
            gender={formData.guestGender}
            onSelectGender={(g) => setFormData(d => ({ ...d, guestGender: g }))}
            age={formData.guestAge}
            onToggleAge={toggleAge}
            filterGenders={filterGenders}
            filterAges={filterAges}
            testPrefix="create-group-guest"
        />
    );
}

const s4Styles = StyleSheet.create({
    wrap: { gap: SPACING.xl },
    pageTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    section: { gap: SPACING.md },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    multiLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: '#686869',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    gridBtn: {
        width: '48.5%',
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: COLORS.white,
    },
    gridBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    checkIcon: {
        position: 'absolute',
        left: 11,
        width: 20,
        height: 20,
    },
    gridBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: '#969698',
    },
    gridBtnTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    recruitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recruitToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    recruitLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMedium,
    },
    inlineCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
        height: 52,
    },
    inlineCounterBtn: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineCounterBtnDisabled: { opacity: 0.3 },
    inlineCounterBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: 20,
        color: COLORS.primary,
    },
    inlineCounterBtnTextDisabled: { color: COLORS.disabledBtn },
    inlineCounterValue: {
        flex: 1,
        textAlign: 'center',
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.primary,
    },
});

// ─── STEP5: 소개글 + 사진 등록 ───────────────────────────────────────────────

function Step5Content({ formData, setFormData, onAddPhoto }) {
    
    const { width: frameWidth } = useSafeAreaFrame();

    function removePhoto(idx) {
        setFormData(d => ({ ...d, photos: d.photos.filter((_, i) => i !== idx) }));
    }

    return (
        <View style={s5Styles.wrap}>

            <Text style={s5Styles.pageTitle} allowFontScaling={false}>
                제목을 작성해 주세요.
            </Text>
            {/* 제목 */}
            <View style={s5Styles.titleBox}>
                <TextInput
                    testID="create-title-input"
                    style={s5Styles.titleInput}
                    value={formData.title}
                    onChangeText={(t) => setFormData(d => ({ ...d, title: t }))}
                    placeholder="제목 (최대 10자)"
                    placeholderTextColor={COLORS.grayMedium}
                    maxLength={10}
                    allowFontScaling={false}
                />
            </View>

            <Text style={s5Styles.pageTitle} allowFontScaling={false}>
                소개글을 작성해 주세요.
            </Text>

            {/* 소개글 */}
            <View style={s5Styles.inputBox}>
                <TextInput
                    testID="create-content-input"
                    style={s5Styles.input}
                    value={formData.content}
                    onChangeText={(t) => {
                        if (t.length <= 1000) setFormData(d => ({ ...d, content: t }));
                    }}
                    multiline
                    placeholder="매칭에 대한 소개글을 자유롭게 작성해 주세요."
                    placeholderTextColor={COLORS.grayMedium}
                    maxLength={1000}
                    textAlignVertical="top"
                    allowFontScaling={false}
                />
                <Text style={s5Styles.counter} allowFontScaling={false}>
                    {formData.content.length}/1000
                </Text>
            </View>

            {/* 사진 등록 */}
            <View style={s5Styles.photoSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={s5Styles.photoLabel} allowFontScaling={false}>
                        {frameWidth <= 360 ? "사진등록" : "사진을 등록해 주세요."} <Text style={s5Styles.optionalLabel}>(선택사항, 최대 {MAX_PHOTOS}장)</Text>
                    </Text>
                    <TouchableOpacity
                        testID="create-photo-add-btn"
                        style={s5Styles.photoAddCell2}
                        onPress={onAddPhoto}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={require('../../assets/icons/add2.svg')}
                            style={s5Styles.photoAddIcon}
                        />
                        <Text style={s5Styles.photoAddText} allowFontScaling={false}>사진 등록</Text>
                    </TouchableOpacity>
                </View>
                <View style={s5Styles.photoGrid}>
                    {formData.photos.map((p, i) => (
                        <View key={i} style={s5Styles.photoCell} testID={`create-photo-${i}`}>
                            <Image
                                source={{ uri: p.uri }}
                                style={s5Styles.photoImg}
                                contentFit="cover"
                                transition={200}
                            />
                            <TouchableOpacity
                                style={s5Styles.photoRemove}
                                onPress={() => removePhoto(i)}
                                hitSlop={4}
                                testID={`create-photo-remove-${i}`}
                            >
                                <Ionicons name="close" size={14} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const s5Styles = StyleSheet.create({
    wrap: { gap: SPACING.xl },
    titleBox: {
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        height: 48,
        justifyContent: 'center'
    },
    titleInput: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        padding: 0,
    },
    pageTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    inputBox: {
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 12,
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    input: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        minHeight: 160,
        lineHeight: 22,
    },
    counter: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        color: COLORS.grayMedium,
        textAlign: 'right',
    },
    photoSection: { gap: SPACING.md },
    photoLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    optionalLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: '#969698',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    photoCell: {
        width: '22.8%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    photoImg: {
        width: '100%',
        height: '100%',
    },
    photoRemove: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoAddCell: {
        width: '23%',
        aspectRatio: 1,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: COLORS.lightGray,
    },
    photoAddIcon: {
        fontFamily: FONTS.semiBold,
        fontSize: 22,
        color: COLORS.white,
    },
    photoAddText: {
        fontFamily: FONTS.extraBold,
        fontSize: 13,
        color: COLORS.white,
    },
    photoAddCell2: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12
    },
    photoAddIcon: {
        width: 20,
        height: 20
    }
});

// ─── 공통 스타일 ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIcon: { width: 24, height: 24 },
    headerTitle: {
        flex: 1,
        textAlign: 'left',
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.textPrimary,
        marginLeft: SPACING.md,
    },
    cancelText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.grayMedium,
        width: 40,
        textAlign: 'right',
    },
    scroll: { flex: 1 },
    scrollContent: { padding: SPACING.xl, paddingTop: SPACING.xxl },
    bottomBar: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        backgroundColor: COLORS.white,
    },
    nextBtn: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextBtnDisabled: { backgroundColor: COLORS.disabledBtn },
    nextBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.white,
    },
});
