import { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Keyboard } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../constants/config';
import { showToast } from '../utils/toast';
import { resizeForUpload } from '../utils/image';
import useBottomSheetBackHandler from '../hooks/useBottomSheetBackHandler';

export default function PhotoPickerSheet({ visible, onClose, onImageSelected, allowMultiple = false, selectionLimit = 1 }) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    useBottomSheetBackHandler(sheetRef, sheetOpen);

    useEffect(() => {
        if (visible) {
            Keyboard.dismiss();
            sheetRef.current?.present();
        }
    }, [visible]);

    const handleDismiss = useCallback(() => {
        onClose();
    }, [onClose]);

    const pickImage = useCallback(async (source) => {
        try {
            const options = {
                mediaTypes: ['images'],
                // 원본 그대로 받는다 (iOS 펜 마크업 적색 라인 손실 방지).
                // 리사이즈·압축은 resizeForUpload 가 담당한다.
                quality: 1,
                // 리사이즈를 건너뛰거나 실패했을 때 쓸 원본 base64
                base64: true,
            };
            let result;
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다. 설정에서 허용해 주세요.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('권한 필요', '사진 접근 권한이 필요합니다. 설정에서 허용해 주세요.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    ...options,
                    allowsMultipleSelection: allowMultiple,
                    selectionLimit: allowMultiple ? selectionLimit : 1,
                });
            }
            if (!result.canceled && result.assets?.length) {
                // base64:true 를 줘도 asset.base64 가 비는 경우가 있다(iCloud 미다운로드 원본, HEIC 변환
                // 실패, 대용량 등). 서버는 base64 로만 저장하므로 이걸 그대로 넘기면 화면엔 사진이
                // 보이는데 서버는 "사진 없음"으로 거절하는 불일치가 생긴다 — 여기서 끊는다.
                const usable = result.assets.filter(a => a.base64);
                if (!usable.length) {
                    showToast('error', '이 사진은 사용할 수 없습니다.', '다른 사진을 선택해 주세요.');
                    return;
                }
                if (usable.length < result.assets.length) {
                    showToast('error', '일부 사진을 사용할 수 없어 제외했습니다.', '다른 사진을 선택해 주세요.');
                }
                const resized = await Promise.all(usable.map(resizeForUpload));
                if (allowMultiple && resized.length > 1) {
                    // 여러 장 선택: 배열로 전달
                    onImageSelected(resized.map(a => ({ uri: a.uri, base64: a.base64, mimeType: a.mimeType })));
                } else {
                    // 단일 선택: 단일 객체로 전달
                    const asset = resized[0];
                    onImageSelected({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
                }
            }
        } catch (e) {
            console.log('e', e);
            showToast('error', '사진을 불러오는 중 문제가 발생했습니다.');
        } finally {
            sheetRef.current?.dismiss();
        }
    }, [onImageSelected, allowMultiple, selectionLimit]);

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

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={[204]}
            detached={true}
            bottomInset={insets.bottom + 20}
            style={styles.detachedSheet}
            onDismiss={handleDismiss}
            onChange={(index) => setSheetOpen(index >= 0)}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            enableDynamicSizing={false}
            enableOverDrag={false}
            backgroundStyle={styles.sheetBg}
            handleComponent={null}
        >
            <View style={styles.content}>
                <View style={styles.optionsCard}>
                    <Pressable style={styles.optionItem} onPress={() => pickImage('library')} testID="photopicker-album-btn">
                        <View style={styles.optionCircle}>
                            <Image source={require('../../assets/icons/picker-album.svg')} style={{ width: 20, height: 20 }} />
                        </View>
                        <Text style={styles.optionLabel} allowFontScaling={false}>앨범</Text>
                    </Pressable>
                    <Pressable style={styles.optionItem} onPress={() => pickImage('camera')} testID="photopicker-camera-btn">
                        <View style={styles.optionCircle}>
                            <Image source={require('../../assets/icons/picker-camera.svg')} style={{ width: 24, height: 24 }} />
                        </View>
                        <Text style={styles.optionLabel} allowFontScaling={false}>카메라</Text>
                    </Pressable>
                </View>
                <Pressable style={styles.cancelBtn} onPress={() => sheetRef.current?.dismiss()} testID="photopicker-cancel-btn">
                    <Text style={styles.cancelText} allowFontScaling={false}>취소</Text>
                </Pressable>
            </View>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    detachedSheet: {
        marginHorizontal: SPACING.xl,
    },
    sheetBg: {
        backgroundColor: 'transparent',
    },
    content: {
        flex: 1,
        gap: SPACING.md,
    },
    optionsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderCurve: 'continuous',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxxl,
        paddingHorizontal: SPACING.xl,
        gap: SPACING.xl,
    },
    optionItem: {
        alignItems: 'center',
        gap: SPACING.sm,
    },
    optionCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        lineHeight: 20,
        color: COLORS.primary,
    },
    cancelBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabled,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.textMedium,
    },
});
