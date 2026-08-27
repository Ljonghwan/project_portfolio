import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/config';

const SuccessToast = ({ text1, text2 }) => (
    <View style={[styles.toastBase, styles.successToast]}>
        <Text style={[styles.toastText, styles.successText]} allowFontScaling={false}>{text1}</Text>
        {text2 ? <Text style={[styles.toastSubText, styles.successText]} allowFontScaling={false}>{text2}</Text> : null}
    </View>
);

const ErrorToast = ({ text1, text2 }) => (
    <View style={[styles.toastBase, styles.errorToast]}>
        <Text style={[styles.toastText, styles.errorText]} allowFontScaling={false}>{text1}</Text>
        {text2 ? <Text style={[styles.toastSubText, styles.errorText]} allowFontScaling={false}>{text2}</Text> : null}
    </View>
);

const InfoToast = ({ text1, text2 }) => (
    <View style={[styles.toastBase, styles.infoToast]}>
        <Text style={[styles.toastText, styles.infoText]} allowFontScaling={false}>{text1}</Text>
        {text2 ? <Text style={[styles.toastSubText, styles.infoText]} allowFontScaling={false}>{text2}</Text> : null}
    </View>
);

export const toastConfig = {
    success: (props) => <SuccessToast {...props} />,
    error: (props) => <ErrorToast {...props} />,
    info: (props) => <InfoToast {...props} />,
};

const styles = StyleSheet.create({
    toastBase: {
        width: '90%',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successToast: {
        backgroundColor: '#E8F5E8',
    },
    errorToast: {
        backgroundColor: '#FFE8E8',
    },
    infoToast: {
        backgroundColor: '#E8F0FF',
    },
    toastText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    toastSubText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 2,
    },
    successText: {
        color: '#2E9E2E',
    },
    errorText: {
        color: '#E02E2E',
    },
    infoText: {
        color: COLORS.primary,
    },
});
