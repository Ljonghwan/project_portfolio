import React, {useRef, useState, useEffect} from 'react';
import {
    StyleSheet,
    View
} from 'react-native';

import Text from '@/components/Text';

import fonts from '@/libs/fonts';
import colors from '@/libs/colors';

export default function Component({ timeOut, label }) {

    const [min, setMin] = useState("03");
    const [sec, setSec] = useState("00");
    const time = useRef(180);
    const timerId = useRef(null);

    useEffect(() => {

        timerId.current = setInterval(() => {
            setMin(parseInt(time.current / 60) < 10 ? "0"+parseInt(time.current / 60) : parseInt(time.current / 60));
            setSec(time.current % 60 < 10 ? "0"+time.current % 60 : time.current % 60);
            time.current -= 1;
        }, 1000);

        return () => clearInterval(timerId.current);
    }, []);

    useEffect(() => {
        // 만약 타임 아웃이 발생했을 경우
        if (time.current <= 0) {
            setTimeout(() => {
                clearInterval(timerId.current);
                // dispatch event
                timeOut(false);
            }, 1000)
        }
    }, [sec]);

    return (
        <View style={[styles.root]}>
            <Text style={styles.title}>{min}:{sec}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        color: colors.textE41616,
    },
});
  