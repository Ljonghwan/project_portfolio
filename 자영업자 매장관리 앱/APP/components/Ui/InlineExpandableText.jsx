import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    maxLines,
    ...rest
}) {

    const [expanded, setExpanded] = useState(false);
    const [shouldTruncate, setShouldTruncate] = useState(false);
    const [truncatedText, setTruncatedText] = useState('');

    const onTextLayout = (e) => {
        const lines = e.nativeEvent.lines;
        if (lines.length > maxLines && !expanded) {
            setShouldTruncate(true);

            // 1.5줄까지의 텍스트만 가져오기
            let text = '';
            const targetLines = Math.floor(maxLines - 1);

            for (let i = 0; i < targetLines; i++) {
                text += lines[i].text;
            }

            // 마지막 부분 조금 더 추가 (0.5줄 분량)
            if (lines[targetLines]) {
                const halfLineLength = Math.floor(lines[targetLines].text.length * 0.7);
                text += lines[targetLines].text.substring(0, halfLineLength);
            }

            setTruncatedText(text.trim());
        }

    }

    return (
        (!expanded && shouldTruncate) ? (
            <Text style={[styles.default, style]}>
                {truncatedText}{' '}
                <Text
                    style={{ color: colors.text9C9EA3 }}
                >
                    ...더보기
                </Text>
            </Text>
        ) : (
            <Text
                style={[styles.default, style]}
                onTextLayout={onTextLayout}
                {...rest}
            />
        )
    )
}

const styles = StyleSheet.create({
    default: {
        fontSize: 14,
        color: colors.dark,
        fontFamily: fonts.regular,
    },
});
