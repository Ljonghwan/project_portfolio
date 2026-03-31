import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import chatImages from '@/libs/chatImages';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    season = 1
}) {

    return (
        <Image source={chatImages[`chat_season_${season}`]} style={rootStyle.default16} transition={200}/>
    );
}

const styles = StyleSheet.create({
   
});
