import { PropsWithChildren, ReactElement } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";

import Text from '@/components/Text';
import Filter from '@/components/Filter';
import Select from '@/components/Select';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import { useUser } from '@/libs/store';

import { numFormat, elapsedTime } from '@/libs/utils';

export default function Component({
    style,
    item=null,
    editFunc=()=>{},
    deleteAlert=()=>{},
    reportStart=()=>{}
}) {

    const { mbData } = useUser();

    const filterFunc = ({ value }) => {
        if(value === 1) editFunc(item);
        else if(value === 2) deleteAlert(item);
    }

    const filterOtherFunc = ({ value }) => {
        if(value === 1) reportStart({ value: 1, data: item });
        else if(value === 2) reportStart({ value: 2, data: item });
    }

    return (
        <View style={styles.root}>
            {item?.isBlock ? (
                <View style={styles.item} >
                    <View>
                        <Image source={images.profile} style={styles.itemImage}/>
                    </View>

                    <View style={styles.container}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start' }]}>
                            <Text style={styles.listItemDate} numberOfLines={3}>{`${elapsedTime(item?.createAt)}`}</Text>
                            
                            {/* <Manager level={item?.creator?.type}/> */}
                        </View>
                        <Text style={styles.listItemContent}>차단된 사용자입니다.</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.item} >
                    <View>
                        <Image source={item?.creator?.profile ? consts.s3Url + item?.creator?.profile : images.profile} style={styles.itemImage}/>
                    </View>

                    <View style={styles.container}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start' }]}>
                            <Text style={styles.listItemName} numberOfLines={1}>{item?.creator?.nickName}</Text>
                            <Text style={styles.listItemDate} numberOfLines={3}>{` · ${elapsedTime(item?.createAt)}`}</Text>
                            
                            {/* <Manager level={item?.creator?.type}/> */}
                        </View>
                        <Text style={styles.listItemContent}>{item?.content}</Text>
                    </View>
                    
                    <Select
                        // ref={(ref) => (inputRefs.current.type = ref)}
                        setState={(v) => {
                            mbData?.idx === item?.creator?.idx ? filterFunc({ value: v }) : filterOtherFunc({ value: v });
                        }}
                        list={mbData?.idx === item?.creator?.idx ? consts.editOptions : consts.reportOptions}
                    >
                        <Image source={images.more} style={rootStyle.default} />
                    </Select>
                   
                </View>
            )}
            
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: 20,
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 12,
        borderTopColor: colors.greyE,
        borderTopWidth: 1,
        position: 'relative'
    },
    itemImage: {
        width: 32,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder
    },
    container: {
        gap: 4,
        flex: 1
    },
    listItemName: {
        flexShrink: 1, 
        fontSize: 12,
        lineHeight: 20,
        color: colors.dark,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.3
    },
    listItemDate: {
        fontSize: 12,
        lineHeight: 20,
        color: colors.grey9,
        letterSpacing: -0.3
    },
    listItemTitle: {
        fontSize: 12,
        color: colors.dark,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.56
    },
    listItemContent: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.grey6,
        letterSpacing: -0.35
    },
    count: {
        fontSize: 10,
        color: colors.dark,
        letterSpacing: -0.25
    }
});
