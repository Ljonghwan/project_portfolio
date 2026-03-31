import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';

import LicenseListItem from '@/components/Item/LicenseListItem';

import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import { ToastMessage } from '@/libs/utils';
import API from '@/libs/api';

import { useUser, useConfig } from '@/libs/store';

export default function Component({ 
    country=consts.countryOptions[0].idx
}) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    
    const { reload } = useUser();
    const { configOptions } = useConfig();
    
    const [list, setList] = useState([]);

    const [load, setLoad] = useState(true);
    
    useEffect(() => {
      
        dataFunc();

    }, [])


    const dataFunc = async () => {

        setLoad(true);

        const sender = {
            country: country
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/provinceList', sender);
        
        console.log('error', error);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: "error" });
                return;
            }

            setList(data);

        }, consts.apiDelay)

    }

    return (
        <View style={{ flex: 1 }}>
            {load && <Loading style={{ backgroundColor: colors.white }} color={colors.black} fixed entering={false} /> }

            <ScrollView contentContainerStyle={{ gap: 15, paddingVertical: 20, paddingBottom: insets?.bottom + 20, }}>
                <View style={styles.list}>
                    {list?.map((x, i) => {
                        return (
                            <LicenseListItem key={i} item={x}/>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    );
}


const useStyle = () => {

	const insets = useSafeAreaInsets();
        
    const styles = StyleSheet.create({
        list: {
            gap: 10,
            paddingHorizontal: rootStyle.side,
        },
        title: {
            color: colors.main,
            fontSize: 18,
            fontFamily: fonts.extraBold,
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end'
        },
    });


  	return { styles }
}
