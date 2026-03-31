import { useEffect, useState, useRef, useCallback } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';

import API from '@/libs/api';
import { ToastMessage } from '@/libs/utils';

export default function Component({
    onPress = null
}) {

    const { styles } = useStyle();

    const [list, setList] = useState([]);

    const [load, setLoad] = useState(true);

    useFocusEffect(
        useCallback(() => {
            dataFunc()
        }, [])
    );

    const dataFunc = async () => {

        const { data, error } = await API.post('/v2/my/favList');
            console.log('data', data)
        setList(data || []);

    }

    const deleteFunc = async (type) => {

        const sender = {
            type: type
        }
        const { data, error } = await API.post('/v2/my/favDelete', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        }

        dataFunc();

    }

    const addFunc = (type) => {
        router.push({
            pathname: routes.callFav,
            params: {
                key: type
            }
        })
    }

    return (
        <View style={{ gap: 7 }}>
            <View style={styles.flexBox}>
                {[1, 2].map((index) => {
                    let findData = list.find(fav => fav?.type === index);

                    return (
                        <TouchableOpacity key={"lg-box" + index} style={styles.cardBox} onPress={() => {
                            if (findData && onPress) {
                                onPress(findData)
                            } else {
                                addFunc(index)
                            }
                        }}>
                            <View style={styles.cardLargeTopBox}>
                                <Image
                                    source={index === 1 ? images.house_green : images.building_green}
                                    style={rootStyle.default}
                                />
                                <Text style={rootStyle.font(16, colors.taseta, fonts.medium)}>{lang({ id: index === 1 ? "house" : "office" })}</Text>
                            </View>
                            <Text numberOfLines={1} style={styles.cardLargeText}>{findData?.name || ""}</Text>
                            <View style={styles.cardLargeBotBox}>
                                <TouchableOpacity onPress={() => {
                                    if (findData) deleteFunc(index)
                                    else addFunc(index);
                                }}>
                                    <Image
                                        source={findData ? images.min_btn_green : images.add_btn_green}
                                        style={rootStyle.default}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )

                })}
            </View>
            <View style={styles.flexBox}>
                {[3, 4, 5].map((index) => {
                    let findData = list.find(fav => fav?.type === index);
                    return (
                        <TouchableOpacity key={"sm-box" + index} style={styles.cardBox} onPress={() => {
                            if (findData && onPress) {
                                onPress(findData)
                            } else {
                                addFunc(index)
                            }
                        }}>
                            <Text numberOfLines={1} style={styles.cardSmalText}>
                                {findData ? findData?.name : lang({ id: "new_place" })}
                            </Text>
                            <View style={styles.cardLargeBotBox}>
                                <TouchableOpacity onPress={() => {
                                    if (findData) deleteFunc(index)
                                    else addFunc(index);
                                }}>
                                    <Image
                                        source={findData ? images.min_btn_green : images.add_btn_green}
                                        style={rootStyle.size_24}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        flexBox: {
            width: "100%",
            flexDirection: "row",
            gap: 7
        },
        cardBox: {
            flex: 1,
            flexDirection: "column",
            gap: 5,
            padding: 15,
            backgroundColor: colors.taseta_sub_2,
            borderWidth: 1,
            borderRadius: 12,
            borderColor: colors.taseta
        },
        cardLargeText: {
            ...rootStyle.font(16, colors.taseta, fonts.medium)
        },
        cardSmalText: {
            ...rootStyle.font(14, colors.taseta, fonts.medium)
        },
        cardLargeTopBox: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 5
        },
        cardLargeBotBox: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 7
        }
    })

    return { styles }
}
