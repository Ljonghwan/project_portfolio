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

import { Calendar, CalendarList } from 'react-native-calendars';

import dayjs from 'dayjs';

import Text from '@/components/Text';
import Select from '@/components/Select';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import { ToastMessage } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function DatePicker({
	key = "",
	children,
	transformOrigin = 'top center',
	top = 0,
	right = 'auto',
	left = null,
	onDateChange,
	initialStartDate,
	initialEndDate,
	disabled = false,
	max = null,
	mode = 'range',
	minDate,
	activeDays = [],
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

			activeDays.forEach(date => {
				range[date] = {
					customStyles: {
						container: {
							borderRadius: 1000,
							borderWidth: 1,
							borderColor: colors.primary,
							backgroundColor: colors.calendarActive,
						}
					}
				};
			});

			range[start.format('YYYY-MM-DD')] = {
				customStyles: {
					container: {
						borderRadius: 1000,
						borderWidth: 1,
						borderColor: colors.primary,
						backgroundColor: colors.primary,
					},
					text: {
						color: colors.white,
					}
				}
			};


			setMarkedDates(range);
			setCurrentMonth(end.format('YYYY-MM-DD'));
		}


	}, [startDate, endDate, activeDays])

	const onPress = () => {
		Keyboard.dismiss();
		onLayout();

		setOpen(true);
		setView(true);

		setStartDate(initialStartDate);
		setCurrentMonth(dayjs(initialStartDate).format('YYYY-MM-DD'));

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
		if (mode === 'pick') {
			setStartDate(day.dateString);
			setEndDate(day.dateString);
			// onDateChange({ startDate: day.dateString, endDate: day.dateString });
			// onClose();
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
				animationType={'none'}
				onRequestClose={onClose}
				transparent
				statusBarTranslucent={true}
				navigationBarTranslucent={true}
			>
				<Pressable
					style={[styles.modal, {}]}
					onPress={() => {
						if (mode !== 'range') onClose();
					}}
				>
					<View style={[styles.container, mode !== 'range' && {}]} >

						{view ? (
							<Animated.View
								entering={customEntering}
								exiting={customExiting}
								style={[
									styles.box,
									{
										top: layout?.y + layout?.height + (Platform.OS === 'ios' ? 0 : insets?.top) + top,
										right: !right ? width - (layout?.x + (layout?.width)) : right,
										left: left || 'auto',
										transformOrigin
									}
								]}
							>
								<Pressable onPress={(e) => e.stopPropagation()}>
									<View style={{ gap: 12 }}>

										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
											<TouchableOpacity style={styles.arrow} hitSlop={15} onPress={() => {
												console.log('prev')
												setCurrentMonth(dayjs(currentMonth).subtract(1, 'year').format('YYYY-MM-DD'));
											}}>
												<Image source={images.arrow_left} style={{ width: 6, aspectRatio: 6 / 11 }} />
											</TouchableOpacity>
											<Text style={styles.year}>{dayjs(currentMonth).format('YYYY년')}</Text>
											<TouchableOpacity style={styles.arrow} hitSlop={15} onPress={() => {
												setCurrentMonth(dayjs(currentMonth).add(1, 'year').format('YYYY-MM-DD'));
											}}>
												<Image source={images.arrow_right} style={{ width: 6, aspectRatio: 6 / 11 }} />
											</TouchableOpacity>
										</View>

										{/* <TouchableOpacity style={[rootStyle.flex, { gap: 6 }]}>
													<Text style={styles.year}>{dayjs(currentMonth).format('YYYY년')}</Text>
													<Image source={images.arrow_down} style={{ width: 11, aspectRatio: 11/6 }} />
												</TouchableOpacity>
												*/}

										{/* 상단 네비게이션 */}
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
											<TouchableOpacity style={styles.arrow} hitSlop={15} onPress={() => {
												console.log('prev')
												setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM-DD'));
											}}>
												<Image source={images.arrow_left} style={{ width: 6, aspectRatio: 6 / 11 }} />
											</TouchableOpacity>
											<Text style={styles.month}>{dayjs(currentMonth).format('M월')}</Text>
											<TouchableOpacity style={styles.arrow} hitSlop={15} onPress={() => {
												setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM-DD'));
											}}>
												<Image source={images.arrow_right} style={{ width: 6, aspectRatio: 6 / 11 }} />
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
										markingType="custom"
										markedDates={markedDates}
										onDayPress={onDayPress}
										hideArrows={true}
										renderHeader={() => <></>}

										theme={styles.theme}
										style={styles.calendar}
										minDate={minDate}
									/>



									{/* 하단 버튼 */}
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 12 }}>
										<Button type={2} onPress={onConfirm} textStyle={{ fontSize: 14 }} disabled={!activeDays.includes(startDate)}>선택 날짜로 이동</Button>
									</View>
								</Pressable>

							</Animated.View>
						) : <View />}
					</View>
				</Pressable>
			</Modal>



		</View>
	);
}

const useStyle = () => {

	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		modal: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			margin: 0,
			flex: 1,
			width: '100%',
			height: '100%',
			justifyContent: 'center',
			alignItems: 'center',
			// backgroundColor: 'rgba(0, 0, 0, 0.6)',
		},
		container: {
			flex: 1,
			width: '100%',
			alignItems: "center",
			justifyContent: 'center',
			paddingHorizontal: rootStyle.side
		},

		box: {
			position: 'absolute',
			width: '100%',
			maxWidth: 320,
			paddingHorizontal: 12,
			paddingVertical: 16,
			backgroundColor: colors.white,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.grey6,
		},

		calendar: {
			backgroundColor: colors.white,
		},
		year: {
			fontSize: 16,
			color: colors.black,
			fontFamily: fonts.medium,
		},
		month: {
			fontSize: 14,
			color: colors.text_info
		},
		arrow: {
			width: 32,
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
			color: colors.text_info,
		},
		theme: {
			calendarBackground: colors.white,
			weekVerticalMargin: 5,
			// selectedDayBackgroundColor: rootStyle.fColor,
			// selectedDayTextColor: '#fff',
			dayTextColor: colors.text_info,
			// textDisabledColor: '#999',
			textDayHeaderFontSize: 14,
			textDayFontFamily: fonts.regular,
			textDayFontSize: 14,
			todayTextColor: colors.text_info,
			// textMonthFontWeight: 'bold',
			// textMonthFontSize: 20,
			// monthTextColor: '#000',

			'stylesheet.calendar.header': {
				dayTextAtIndex0: {
					color: colors.text_info
				},
				dayTextAtIndex1: {
					color: colors.text_info
				},
				dayTextAtIndex2: {
					color: colors.text_info
				},
				dayTextAtIndex3: {
					color: colors.text_info
				},
				dayTextAtIndex4: {
					color: colors.text_info
				},
				dayTextAtIndex5: {
					color: colors.text_info
				},
				dayTextAtIndex6: {
					color: colors.text_info
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
