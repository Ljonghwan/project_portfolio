import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Pressable, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, Modal, Keyboard } from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
} from "react-native-reanimated";
import {
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";

import { Calendar, CalendarList } from 'react-native-calendars';


import dayjs from 'dayjs';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import { ToastMessage } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function DatePicker({
	key = "",
	children,
	transformOrigin = 'top center',
	right = 'auto',
	left = null,
	onDateChange,
	initialStartDate,
	initialEndDate,
	disabled = false,
	max = null,
	mode = 'range',
	minDate
}) {

	const { styles } = useStyle();

	const insets = useSafeAreaInsets();
	const { width } = useSafeAreaFrame();

	const ref = useRef(null);
	const cref = useRef(null);

	const [open, setOpen] = useState(false);
	const [view, setView] = useState(false);

	const [layout, setLayout] = useState({});

	const menuOpacity = useSharedValue(1);


	const [markedDates, setMarkedDates] = useState({});
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM-DD'));

	useEffect(() => {
		setStartDate(initialStartDate);
		setEndDate(initialEndDate);
	}, [initialStartDate, initialEndDate])

	useEffect(() => {
		if (startDate && endDate) {
			const start = dayjs(startDate);
			const end = dayjs(endDate);

			const range = {};
			for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, 'day')) {
				const dateStr = d.format('YYYY-MM-DD');
				range[dateStr] = {
					color: (start.format('YYYY-MM-DD') === dateStr || end.format('YYYY-MM-DD') === dateStr) ? colors.datePickerSelected : colors.datePickerRange,
					textColor: (start.format('YYYY-MM-DD') === dateStr || end.format('YYYY-MM-DD') === dateStr) ? colors.fafafa : colors.black,
				};
			}

			range[start.format('YYYY-MM-DD')].startingDay = true;
			range[end.format('YYYY-MM-DD')].endingDay = true;

			setMarkedDates(range);
			setCurrentMonth(end.format('YYYY-MM-DD'));
		}


	}, [startDate, endDate])

	const onPress = () => {
		Keyboard.dismiss();
		onLayout();

		setOpen(true);
		setView(true);

		menuOpacity.value = 0.5;
	};

	const onClose = () => {
		menuOpacity.value = 1;

		setView(false);
		setTimeout(() => {
			setOpen(false);
		}, 200)
	};

	const onConfirm = () => {
		if (!startDate && !endDate) {
			ToastMessage('날짜를 선택해주세요.');
			return;
		}
		onDateChange({ startDate, endDate: endDate || startDate });
		onClose();
	}

	const animatedMenuStyle = useAnimatedStyle(() => ({
		opacity: withTiming(menuOpacity.value, { duration: 200 }),
	}));


	const customEntering = (targetValues) => {
		'worklet';
		const animations = {
			// originX: withTiming(targetValues.targetOriginX, { duration: 300 }),
			opacity: withTiming(1, { duration: 200 }),
			transform: [
				{ scale: withSpring(1, { damping: 100, stiffness: 1000 }) },
			],
		};
		const initialValues = {
			// originX: -width,
			opacity: 0,
			transform: [
				{ scale: 0 }
			],
		};
		return {
			initialValues,
			animations,
		};
	};

	const customExiting = (targetValues) => {
		'worklet';
		const animations = {
			// originX: withTiming(targetValues.targetOriginX, { duration: 300 }),
			opacity: withTiming(0, { duration: 200 }),
			transform: [
				{ scale: withTiming(0, { duration: 200 }) },
			],
		};
		const initialValues = {
			// originX: -width,
			opacity: 1,
			transform: [
				{ scale: 1 }
			],
		};
		return {
			initialValues,
			animations,
		};
	};


	const onLayout = (e) => {

		ref.current?.measureInWindow((x, y, width, height) => {
			console.log('e.nativeEvent.layout', x, y, width, height)

			setLayout({ x, y, width, height });
		});

	};


	// ✅ 날짜 클릭
	const onDayPress = (day) => {
		if(mode === 'pick') {
			onDateChange({ startDate: day.dateString, endDate: day.dateString });
			onClose();
		}
		
		if (!startDate || (startDate && endDate)) {
			setStartDate(day.dateString);
			setEndDate(null);
			setMarkedDates({
				[day.dateString]: { startingDay: true, endingDay: true, color: colors.datePickerSelected, textColor: colors.fafafa }
			});
			setCurrentMonth(dayjs(day.dateString).format('YYYY-MM-DD'));

			

		} else {
			const start = dayjs(startDate);
			const end = dayjs(day.dateString);
			if (end.isBefore(start)) {
				setStartDate(day.dateString);
				setEndDate(null);
				setMarkedDates({
					[day.dateString]: { startingDay: true, endingDay: true, color: colors.datePickerSelected, textColor: colors.fafafa }
				});
			} else {
				// ✅ 한 달 초과 체크
				const diffDays = end.diff(start, 'day');
				const maxDays = max || 31; // max prop이 있으면 사용, 없으면 31일

				if (diffDays > maxDays) {
					ToastMessage(`최대 ${maxDays}일까지 선택 가능합니다.`);
					setCurrentMonth(start.format('YYYY-MM-DD'));
					return;
				}

				setEndDate(day.dateString);
				setCurrentMonth(dayjs(day.dateString).format('YYYY-MM-DD'));
			}
		}
	};

	// ✅ 빠른 선택 버튼
	const selectQuick = (type) => {
		const today = dayjs();

		if (type === 'today') {
			setStartDate(today.format('YYYY-MM-DD'));
			setEndDate(today.format('YYYY-MM-DD'));
			setCurrentMonth(today.format('YYYY-MM-DD'));

		} else {
			const start = today.startOf(type);
			const end = today.endOf(type);

			setStartDate(start.format('YYYY-MM-DD'));
			setEndDate(end.format('YYYY-MM-DD'));
			setCurrentMonth(end.format('YYYY-MM-DD'));
		}
	};



	return (
		<View>

			<AnimatedTouchable key={key} ref={ref} disabled={disabled} onPress={onPress} onLayout={onLayout} style={[{ alignSelf: 'center' }, animatedMenuStyle]}>
				{children}
			</AnimatedTouchable>

			<Modal
				visible={Boolean(open)}
				animationType={mode === 'range' ? 'none' : 'fade'}
				onRequestClose={onClose}
				transparent
				statusBarTranslucent={true}
				navigationBarTranslucent={true}
			>
				<TouchableWithoutFeedback
					style={[styles.fullScreen, { }]}
					onPress={() => {
						if(mode !== 'range') onClose();
					}}
				>
					<View style={[styles.container, mode !== 'range' && { backgroundColor: colors.dim }]}>
						{view && (
							<Animated.View
								entering={customEntering}
								exiting={customExiting}
								style={[
									styles.box,
									mode === 'range' ? {
										top: layout?.y + layout?.height + (Platform.OS === 'ios' ? 0 : insets?.top),
										right: !right ? width - (layout?.x + (layout?.width)) : right,
										left: left || 'auto',
										transformOrigin
									} : {
									}
								]}
							>
								<View style={{ gap: 12 }}>
									{/* 상단 네비게이션 */}
									<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
										<TouchableOpacity style={styles.arrow} hitSlop={15} onPress={() => {
											console.log('prev')
											setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM-DD'));
										}}>
											<Image source={images.arrow_left} style={rootStyle.default20} />
										</TouchableOpacity>
										<Text style={styles.month}>{dayjs(currentMonth).format('YYYY년 MM월')}</Text>
										<TouchableOpacity style={styles.arrow} hitSlop={15} onPress={() => {
											setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM-DD'));
										}}>
											<Image source={images.arrow_right} style={rootStyle.default20} />
										</TouchableOpacity>
									</View>

									{/* 빠른 선택 */}
									{mode === 'range' && (
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
											<TouchableOpacity style={styles.quick} onPress={() => selectQuick('today')}>
												<Text style={styles.quickText}>오늘</Text>
											</TouchableOpacity>
											<TouchableOpacity style={styles.quick} onPress={() => selectQuick('week')}>
												<Text style={styles.quickText}>이번주</Text>
											</TouchableOpacity>
											<TouchableOpacity style={styles.quick} onPress={() => selectQuick('month')}>
												<Text style={styles.quickText}>이번달</Text>
											</TouchableOpacity>
										</View>
									)}
									
								</View>

								<Calendar
									ref={cref}
									key={currentMonth}
									current={currentMonth}
									markingType="period"
									markedDates={markedDates}
									onDayPress={onDayPress}
									hideArrows={true}
									renderHeader={() => <></>}

									theme={styles.theme}
									style={styles.calendar}
									minDate={minDate}
								// dayComponent={({ date, marking, state }) => {
								// 	return (
								// 		<TouchableOpacity
								// 			style={[styles.day]}
								// 			onPress={() => {
								// 				setSelected(date.dateString);
								// 				handleClose();
								// 			}}
								// 		>
								// 			<View style={[
								// 				styles.dayBg, 
								// 				{
								// 					backgroundColor: marking?.selected ? '#fff' : 'transparent'
								// 				}
								// 			]}>
								// 				<Text
								// 					style={{
								// 						textAlign: 'center',
								// 						color: marking?.selected ? colors.fafafa : state === 'disabled' ? colors.textC4C4C4 : colors.text313131
								// 					}}
								// 					font={fonts.interMedium}
								// 				>
								// 					{date.day}
								// 				</Text>

								// 			</View>


								// 		</TouchableOpacity>
								// 	);
								// }}
								/>



								{/* 하단 버튼 */}
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 12 }}>
									<TouchableOpacity onPress={onClose} hitSlop={15}>
										<Text style={{ color: 'gray', fontSize: 12 }}>취소</Text>
									</TouchableOpacity>
									<TouchableOpacity
										hitSlop={15}
										onPress={onConfirm}
									>
										<Text style={{ color: colors.blue, fontSize: 12, fontFamily: fonts.medium }}>확인</Text>
									</TouchableOpacity>
								</View>

							</Animated.View>
						)}
					</View>
				</TouchableWithoutFeedback>
			</Modal>

		</View>
	);
}

const useStyle = () => {

	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		fullScreen: {
			flex: 1,
		},
		container: {
			flex: 1,
			alignItems: "center",
			justifyContent: 'center',
			paddingHorizontal: rootStyle.side
		},

		box: {
			position: 'absolute',
			width: '100%',
			maxWidth: 320,
			shadowColor: colors.black,
			shadowOffset: { width: 0, height: 2 }, //: -1
			shadowOpacity: 0.1,
			shadowRadius: 30, // blur 정도
			elevation: 5, // Android용 
			paddingHorizontal: 12,
			paddingVertical: 16,
			backgroundColor: colors.fafafa,
			borderRadius: 8
		},

		calendar: {
			backgroundColor: colors.fafafa,
		},
		month: {
			fontSize: 14,
			color: colors.text313131
		},
		arrow: {
			width: 28,
			height: 24,
			alignItems: 'center',
			justifyContent: 'center',
		},
		quick: {
			height: 25,
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: 15,
			borderRadius: 4,
			borderWidth: 1,
			borderColor: colors.datePickerBorder,
		},
		quickText: {
			fontSize: 12,
			color: colors.text313131,
		},
		theme: {
			calendarBackground: colors.fafafa,
			weekVerticalMargin: 0,
			// selectedDayBackgroundColor: rootStyle.fColor,
			// selectedDayTextColor: '#fff',
			// dayTextColor: '#000',
			// textDisabledColor: '#999',
			textDayHeaderFontSize: 12,
			textDayFontFamily: fonts.regular,
			textDayFontSize: 14,
			todayTextColor: colors.blue,
			// textMonthFontWeight: 'bold',
			// textMonthFontSize: 20,
			// monthTextColor: '#000',

			'stylesheet.calendar.header': {
				dayTextAtIndex0: {
					color: colors.text313131
				},
				dayTextAtIndex1: {
					color: colors.text313131
				},
				dayTextAtIndex2: {
					color: colors.text313131
				},
				dayTextAtIndex3: {
					color: colors.text313131
				},
				dayTextAtIndex4: {
					color: colors.text313131
				},
				dayTextAtIndex5: {
					color: colors.text313131
				},
				dayTextAtIndex6: {
					color: colors.text313131
				}
			},
			'stylesheet.day.period': {
				base: {
					width: width <= 330 ? 34 : 40,
					height: 46,
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 2,
				},
				fillers: {
					position: 'absolute',
					height: 46,
					flexDirection: 'row',
					left: 0,
					right: 0,
					zIndex: 1
				},
				leftFiller: {
					backgroundColor: colors.datePickerSelected,
					height: 46,
					flex: 1
				},
				rightFiller: {
					backgroundColor: colors.datePickerSelected,
					height: 46,
					flex: 1
				},
			}

		}

	});


	return { styles }
}
