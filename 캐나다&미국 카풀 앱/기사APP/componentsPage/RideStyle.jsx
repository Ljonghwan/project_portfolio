import { StyleSheet, Text } from 'react-native';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
  style,
  ...rest
}) {

    return (
        <Text
            style={[styles.default, style]}
            allowFontScaling={false}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 14,
        color: colors.dark,
        fontFamily: fonts.regular,
    },
});
