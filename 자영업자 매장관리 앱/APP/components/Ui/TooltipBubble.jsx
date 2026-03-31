import React from 'react';
import { View, StyleSheet } from 'react-native';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

const TooltipBubble = ({ text, style }) => {
    return (
        <View style={[styles.container, style]}>
            {/* 말풍선 본체 */}
            <View style={styles.bubble}>
                <Text style={styles.text}>{text}</Text>
            </View>
            {/* 아래쪽 삼각형 꼬리 */}
            <View style={styles.tail} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    bubble: {
        backgroundColor: colors.tooltipBubble,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20, // 완전히 둥근 모서리
    },
    text: {
        color: colors.white,
        fontSize: 14,
        fontFamily: fonts.medium,
    },
    tail: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.tooltipBubble,
        marginTop: -1, // 본체와 자연스럽게 연결
    },
});

export default TooltipBubble;