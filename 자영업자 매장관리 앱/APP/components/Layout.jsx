import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Keyboard, Platform, Pressable, StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '@/components/Header';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

export default function Layout({
	children,
	backgroundColor=colors.white,
	header=null,
}) {
    const { presentation, tabs } = useLocalSearchParams();
	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const marginTop = !header ? 0 : rootStyle.header.height + ( (presentation && Platform.OS === 'ios') ? 0 : insets?.top );

	return (
		<View style={[styles.root, ...[{ backgroundColor }]]}>
			{header ? 
				<Header header={header} bg={backgroundColor}/>  
				: 
				<></>
			}
			<View 
				style={ [styles.container  ]} 
			>
				
				<View style={[styles.container, ...[{ marginTop }]]}>{children}</View>
			</View>
			
		</View>
	);
}

const useStyle = () => {

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