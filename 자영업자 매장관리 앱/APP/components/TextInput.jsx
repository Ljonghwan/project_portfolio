import { Image } from 'expo-image';
import React, { forwardRef, useState, useEffect } from 'react';
import { TextInput as RNTextInput, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation } from 'expo-router';

import Timer from '@/components/Timer';

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

// 눈 감김 아이콘 (비밀번호 숨김)
const EyeClosedIcon = () => (
	<Image source={images.eye_closed} style={rootStyle.default} />
);

// 눈 뜸 아이콘 (비밀번호 표시)
const EyeOpenIcon = () => (
	<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
		<Path
			d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
			stroke={colors.eyeIconGray}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<Circle cx="12" cy="12.5" r="3" stroke={colors.eyeIconGray} strokeWidth="2" />
	</Svg>
);

export default function Component({
	iref,
	autoFocus = false,
	placeholder,
	value,
	valid,
	displayValue = null,
	onChangeText,
	secureTextEntry = false,
	keyboardType = 'default',
	autoCapitalize = 'none',
	editable = true,
	isRemove=true,
	style,
	containerStyle,
	inputContainerStyle,
	inputContainerDisabledStyle,
	placeholderTextColor,
	maxLength = 255,
	onMaxEdit,
	onFocus = () => { },
	timer = false,
	timerState,
	icon,
	rightIcon,
	iconStyle,
	withText,
	...props
}) {
	const navigation = useNavigation();

	const [t, setT] = useState(timer);

	const [isFocused, setIsFocused] = useState(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	useEffect(() => {

		if (autoFocus && iref) {
			const unsub = navigation.addListener('transitionEnd', () => {
				iref.current?.focus();
			});

			return unsub;
		}
	}, [])


	useEffect(() => {
		setT(timer);
	}, [timer]);

	const handleTogglePassword = () => {
		setIsPasswordVisible(!isPasswordVisible);
	};

	const handleClear = () => {
		onChangeText('');
	};

	const onChage = text => {

		let v = text;

		if (['number-pad', 'numeric', 'numbers-and-punctuation'].includes(keyboardType)) {
			v = v.replace(/[^0-9]/g, '');
		}

		if(valid === 'price') {
    		v = v?.replace(/^0+/, '') || '';
		}

		if(valid === 'percent') {
			// 숫자와 . 만 허용
			let cleaned = v.replace(/[^0-9.]/g, '');

			// 맨 앞 . 은 0. 으로 변경
			if (cleaned.startsWith('.')) {
				cleaned = '0' + cleaned;
			}
			
			// . 이 2개 이상이면 첫번째만 유지
			const parts = cleaned.split('.');
			if (parts.length > 2) {
				cleaned = parts[0] + '.' + parts.slice(1).join('');
			}
			// 소수점 1자리까지만 허용
			if (parts.length === 2 && parts[1].length > 1) {
				cleaned = parts[0] + '.' + parts[1].slice(0, 1);
			}
			// 최대값 100 체크
			const num = parseFloat(cleaned);
			if (num > 100) {
				cleaned = '100';
			}

			v = cleaned;
		}

		console.log('v', v);

		onChangeText(v);

		if (onMaxEdit && maxLength === v?.length) {
			onMaxEdit();
		}
	}

	return (
		<View style={[styles.container, containerStyle]}>
			<View
				style={[
					styles.inputContainer,
					inputContainerStyle,
					isFocused && styles.inputContainerFocused,
					!editable && styles.inputContainerDisabled,
					!editable && inputContainerDisabledStyle
				]}
			>
				{icon && (
					<View>
						<Image source={icon} style={iconStyle} />
					</View>
				)}

				<RNTextInput
					ref={iref}
					// autoFocus={autoFocus}
					style={[styles.input, style]}
					placeholder={placeholder}
					placeholderTextColor={placeholderTextColor || colors.textSecondary}
					value={displayValue || value}
					onChangeText={onChage}
					secureTextEntry={secureTextEntry && !isPasswordVisible}
					keyboardType={keyboardType}
					maxLength={maxLength}
					autoCapitalize={autoCapitalize}
					autoCorrect={false}
					textContentType={'oneTimeCode'}

					editable={editable}
					hitSlop={{ top: 20, bottom: 20 }}
					onFocus={() => {
						setIsFocused(true);
						onFocus();
					}}
					onBlur={() => {
						setIsFocused(false);
						if(valid === 'percent') {
							if (value.endsWith('.')) {
								onChage(value.slice(0, -1));
							}
						}
					}}
					allowFontScaling={false}
					{...props}
				/>

				{!secureTextEntry && editable && value?.length > 0 && isRemove && (
					<TouchableOpacity
						onPress={handleClear}
						style={styles.iconButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<CloseIcon />
					</TouchableOpacity>
				)}

				{secureTextEntry && (
					<TouchableOpacity
						onPress={handleTogglePassword}
						style={styles.iconButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						{isPasswordVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
					</TouchableOpacity>
				)}

				{rightIcon && (
					<View>
						<Image source={rightIcon} style={iconStyle} />
					</View>
				)}

				{withText && (
					<View>
						<Text style={{...rootStyle.font(16, colors.header, fonts.medium)}}>{withText}</Text>
					</View>
				)}

				{t && (
					<Timer timeOut={timerState} />
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		height: 48,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.white,
		paddingHorizontal: 16,
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
		height: '100%',
	},
	iconButton: {
		padding: 2,
	},
});
