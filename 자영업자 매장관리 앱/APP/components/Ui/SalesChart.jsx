import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

import Text from '@/components/Text';

import { formatToMan } from '@/libs/utils';
import dayjs from 'dayjs';

export default function SalesChart({ data, type='day' }) {


    const maxValue = Math.max(...data.map(item => item?.value || 0));

	const barData = data.map((item, index) => ({
		value: item.value,
		label: dayjs(item.label).format(type === 'month' ? 'M월' : 'D일'),
		frontColor: colors.primary,
		topLabelComponent: () => (
			<Text style={styles.topLabel} numberOfLines={1}>{formatToMan(item?.value)}</Text>
		),
	}));

	return (
		<View style={styles.container}>
			<BarChart
				data={barData}
				barWidth={18}
				spacing={31}
				barBorderRadius={2.8} 
				showRules
				rulesType={'solid'}
				rulesColor={'#b1b1b150'}
				noOfSections={2}
				xAxisThickness={1}
				xAxisColor={'#b1b1b150'}


				hideYAxisText={true}
				yAxisLabelWidth={0}
				yAxisThickness={0}
				yAxisTextStyle={{ color: colors.white }}
				xAxisLabelTextStyle={styles.axisText}
				maxValue={maxValue * 1.1}
				isAnimated={true}
				showYAxisIndices={false}
				height={160}
				renderTooltip={() => null}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 32,
		marginBottom: 10,
		overflow: 'hidden'
	},
	topLabel: {
		fontSize: 9,
		fontFamily: fonts.bold,
		color: colors.text767676,
		marginBottom: 4,
		width: 40,
		textAlign: 'center',
	},
	axisText: {
		fontSize: 10,
		fontFamily: fonts.bold,
		color: colors.text767676,
	}
});
