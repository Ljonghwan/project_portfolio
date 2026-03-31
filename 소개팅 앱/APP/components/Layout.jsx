import { useEffect } from 'react';
import { StyleSheet, View, Pressable, Keyboard, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Header from '@/components/Header';
import Text from '@/components/Text';

import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';

export default function Layout({
	children,
	backgroundColor=colors.white,
	header=null,
	input=false,
	statusBar="dark"
}) {
    const { presentation, tabs } = useLocalSearchParams();
	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const marginTop = !header ? 0 : rootStyle.header.height + ( (presentation && Platform.OS === 'ios') ? 0 : insets?.top );
	// const paddingBottom = !tabs ? 0 : rootStyle.bottomTabs.height + insets?.bottom;

	return (
		<View style={[styles.root, ...[{ backgroundColor }]]}>

			{header ? 
				<Header header={header} bg={backgroundColor}/>  
				: 
				<></>
			}
			<Pressable 
				style={ [styles.container  ]} 
				onPress={() => {
					input ? Keyboard.dismiss() : {}
				}} 
				accessible={false}
				disabled={!input}
			>
				
				<View style={[styles.container, ...[{ marginTop }]]}>{children}</View>
			</Pressable>
			
		</View>
	);
}

const useStyle = () => {

	const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
		
		root: {
			flex: 1,
			position: "relative",
		},

		container: {
			flex: 1,
		},
	})

  	return { styles }
}