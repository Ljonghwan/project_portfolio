import {  View, StyleSheet } from 'react-native';

import Text from '@/components/Text';

import colors from '@/libs/colors';

export default function Component({
    title
}) {

    return (
        <View style={styles.root}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.greyF1,
        borderRadius: 8,
        height: 24,
        paddingHorizontal: 8
    },
    title: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: -0.3,
        color: colors.grey6
    }
});
