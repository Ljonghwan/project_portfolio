import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Keyboard, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '@/components/Header';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

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
	// const marginBottom = insets?.bottom;
	// const paddingBottom = !tabs ? 0 : rootStyle.bottomTabs.height + insets?.bottom;

	return (
		<View style={[styles.root, ...[{ backgroundColor }]]}>
			<StatusBar style={statusBar} />

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