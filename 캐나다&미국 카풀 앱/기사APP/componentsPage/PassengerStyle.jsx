import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";

import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Radio2 from '@/components/Radio2';
import RadioRideStyle from '@/components/RadioRideStyle';

import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import lang from '@/libs/lang';
import images from '@/libs/images';
import routes from '@/libs/routes';
import consts from '@/libs/consts';

import { ToastMessage } from '@/libs/utils';
import API from '@/libs/api';

import { useUser, useConfig } from '@/libs/store';


export default function Component({ 
    titleBox=false,
    userStyle,
    onSubmit=()=>{}
}) {

    const { styles } = useStyle();
    
    const { reload } = useUser();
    const { configOptions } = useConfig();
    
    const [ luggage, setLuggage ] = useState(userStyle?.luggage || '');
    const [ smoke, setSmoke ] = useState(userStyle?.smoke || '');
    const [ pet, setPet ] = useState(userStyle?.pet || '');
    const [ snowboard, setSnowboard ] = useState(userStyle?.snowboard || '');
    const [ bicycle, setBicycle ] = useState(userStyle?.bicycle || '');
    const [ tire, setTire ] = useState(userStyle?.tire || '');


    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

      
    useEffect(() => {
      
        setDisabled( !(luggage && smoke && pet && snowboard && bicycle && tire ));

    }, [luggage, smoke, pet, snowboard, bicycle, tire])


    const submitFunc = async () => {

        setLoad(true);
        
        const sender = {
            luggage,
            smoke,
            pet,
            snowboard,
            bicycle,
            tire
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/user/insertDetail', sender);
        
        console.log('error', error);
        

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: "error" });
                return;
            }
            
            ToastMessage(lang({ id: 'saving_successfully' }));

            reload();
            onSubmit();
        }, consts.apiDelay)

        
    }

    return (
        <View style={{ flex: 1, gap: 20 }}>
            <ScrollView contentContainerStyle={{ gap: 15, paddingVertical: 20 }}>

                {titleBox && (
                    <View style={styles.titleBox}>
                        <Text style={styles.main}>{lang({ id: 'set_your_ride' })}</Text>
                        <Text style={styles.subTitle}>{`Let us know how you like to ride so we can find the best matches for you!`}</Text>
                    </View>
                )}
                
                <View style={styles.list}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start' }]}>
                        <Text style={styles.title}>
                            {lang({ id: 'how_much_luggage' })}
                        </Text>
                        <Icon img={images.question_green} imgStyle={rootStyle.default} onPress={() => router.push( routes.helpLuggage )}/>
                    </View>
                    
                    <RadioRideStyle 
                        numColumnsType={2}
                        state={luggage}
                        setState={setLuggage}
                        list={configOptions.luggages}
                    />
                </View>

                <View style={styles.list}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start' }]}>
                        <Text style={styles.title}>
                            {lang({ id: 'do_you_smoke' })}
                        </Text>
                    </View>
                    
                    <RadioRideStyle 
                        state={smoke}
                        setState={setSmoke}
                        list={configOptions.smokes}
                    />
                </View>

                <View style={styles.list}>
                    <Text style={styles.title}>
                        {lang({ id: 'bringing_a_pet' })}
                    </Text>

                    <RadioRideStyle 
                        state={pet}
                        setState={setPet}
                        list={configOptions.pets}
                    />
                </View>

                <View style={styles.list}>
                    <Text style={styles.title}>
                        {lang({ id: 'carrying_skis_or_a_snowboard' })}
                    </Text>

                    <RadioRideStyle 
                        state={snowboard}
                        setState={setSnowboard}
                        list={configOptions.snowboards}
                    />
                </View>

                <View style={styles.list}>
                    <Text style={styles.title}>
                        {lang({ id: 'bringing_a_bicycle' })}
                    </Text>

                    <RadioRideStyle 
                        state={bicycle}
                        setState={setBicycle}
                        list={configOptions.bicycles}
                    />
                </View>
                
                <View style={styles.list}>
                    <Text style={styles.title}>
                        {lang({ id: 'tire_type' })}
                    </Text>

                    <RadioRideStyle 
                        state={tire}
                        setState={setTire}
                        list={configOptions.tires}
                    />
                </View>

            </ScrollView>

            <View style={styles.bottom} >
                <Button disabled={disabled} load={load} onPress={submitFunc} >{lang({ id: 'set_up_complete' })}</Button>
            </View>
            
        </View>
    );
}


const useStyle = () => {

	const insets = useSafeAreaInsets();
        
    const styles = StyleSheet.create({
        titleBox: {
            gap: 11,
            paddingHorizontal: rootStyle.side
        },
        main: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold,
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
        },

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
