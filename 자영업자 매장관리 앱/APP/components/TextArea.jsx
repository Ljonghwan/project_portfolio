import { Image } from 'expo-image';
import React, { forwardRef, useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

// X 아이콘 (입력 삭제)
const CloseIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <Path
            d="M10 18.3334C14.6024 18.3334 18.3334 14.6025 18.3334 10.0001C18.3334 5.39771 14.6024 1.66675 10 1.66675C5.39765 1.66675 1.66669 5.39771 1.66669 10.0001C1.66669 14.6025 5.39765 18.3334 10 18.3334Z"
            fill={colors.iconGray}
            stroke={colors.iconGray}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5"
            stroke={colors.white}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default function TextArea({
    iref,
    placeholder,
    value,
    onChangeText,
    scrollEnabled = true,
    editable = true,
    style,
    containerStyle,
    inputContainerStyle,
    maxLength = 500,
    showCharCount = true, // 글자 수 표시 여부
    minHeight = 120, // 최소 높이
    maxHeight = 120, // 최대 높이 (선택사항)
    onFocus = () => { },
    onBlur = () => { },
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
        onChangeText('');
    };

    const onChage = (text) => {
        onChangeText(text);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <View
                style={[
                    styles.inputContainer,
                    { minHeight },
                    maxHeight && { maxHeight },
                    inputContainerStyle,
                    isFocused && styles.inputContainerFocused,
                    !editable && styles.inputContainerDisabled,
                ]}
            >
                <RNTextInput
                    ref={iref}
                    style={[
                        styles.input,
                        style,
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChage}
                    maxLength={maxLength}
                    scrollEnabled={scrollEnabled}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType={'oneTimeCode'}
                    multiline={true}
                    textAlignVertical="top" // Android용
                    editable={editable}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus();
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur();
                    }}
                    allowFontScaling={false}
                    {...props}
                />

            </View>

            {showCharCount && (
                <View style={styles.charCountContainer}>
                    <Text style={styles.charCount}>
                        {value?.length || 0}/{maxLength}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // 위에서부터 정렬
        width: '100%',
        alignSelf: 'stretch',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12, // 상하 여백 추가
        gap: 10,

    },
    inputContainerFocused: {
        borderColor: colors.primary,
    },
    inputContainerDisabled: {
        backgroundColor: colors.white,
    },
    input: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textPrimary,
        padding: 0,
        // iOS에서 multiline일 때 padding 조정
        paddingTop: 0,
        height: '100%',
    },
    iconButton: {
        padding: 2,
        marginTop: 2, // X 버튼을 약간 아래로
    },
    charCountContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    charCount: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: fonts.regular,
    },
});