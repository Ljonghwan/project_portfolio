import { View, StyleSheet } from 'react-native';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    dotStyle,
    ...rest
}) {

    return (
        <View style={styles.container}>
            <View style={[{ width: 15, height: style?.lineHeight || styles.default.lineHeight, alignItems: 'center', justifyContent: 'center' }, dotStyle ]}>
                <View style={[styles.dot, { backgroundColor: style?.color || styles.dot.backgroundColor } ]}/>
            </View>
            <Text
                style={[styles.default, style]}
                {...rest}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4
    },
    dot: {
        backgroundColor: colors.textSecondary,
        borderRadius: 1000,
        width: 2.5,
        height: 2.5,
    },
    default: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 22,
        letterSpacing: -0.3,
    },
});
