import React, { useState } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions, Keyboard } from 'react-native';

import { Dropdown, SelectCountry } from 'react-native-element-dropdown';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    style,
    value,
    setValue,
    onBlur=()=>{},
    placeholder=""
}) {

    const { styles } = useStyle();

    const [isFocus, setIsFocus] = useState(false);

    const renderItem = item => {
        return (
            <View style={styles.item}>
                <View style={[rootStyle.flex, { gap: 6 }]}>
                    <Text style={styles.itemIcon}>{item.label}</Text>
                    {/* <Text style={styles.itemText}>{item.value}</Text> */}
                    <Text style={styles.itemText}>{item.title}</Text>
                </View>
                <Text style={styles.itemText}>{item.value}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.root, style]}>
            <Dropdown
                mode={Platform.OS === 'ios' ? 'modal' : 'default'}
                style={[styles.dropdown, isFocus && { borderColor: colors.main }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                selectedTextProps={{ allowFontScaling: false }}
                containerStyle={styles.containerStyle}
                itemContainerStyle={styles.itemContainerStyle}
                renderRightIcon={() => (
                    <Image source={images.down} style={rootStyle.default} />
                )}
                renderItem={renderItem}
                fontFamily={fonts.medium}
                data={consts.countryOptions}
                maxHeight={150}
                labelField="label"
                valueField="idx"
                value={value}
                onFocus={() => {
                    Keyboard.dismiss();
                    setIsFocus(true);
                }}
                onBlur={() => {
                    setIsFocus(false);
                }}
                onChange={item => {
                    setValue(item.idx);
                    setIsFocus(false);
                    onBlur();
                }}

            />
        </View>
    );
};


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
        },
        inputLabelBox: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        inputLabel: {
            color: colors.main,
            fontSize: 20,
            fontFamily: fonts.extraBold
        },
        inputLabelRequired: {
            color: colors.text_popup,
            fontSize: 20,
        },
        dropdown: {
            borderWidth: 1,
            borderColor: colors.sub_1,
            height: 48,
            paddingHorizontal: 14,
            borderRadius: 13,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            width: 90
        },
        placeholderStyle: {
            fontSize: 18,
            color: colors.sub_1,
            fontFamily: fonts.medium
        },
        selectedTextStyle: {
            fontSize: Platform.OS === 'ios' ? 26 : 20,
            color: colors.main,
            fontFamily: fonts.medium
        },
        containerStyle: {
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.black,
            width: width - (rootStyle.side * 2)
        },
        itemContainerStyle: {
            paddingHorizontal: 12,
        },
        item: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 50,
        },
        itemIcon: {
            fontSize: Platform.OS === 'ios' ? 26 : 20,
        },
        itemText: {
            fontFamily: fonts.medium,
            fontSize: 18,
            color: colors.main,
        },

    });

    return { styles }
}