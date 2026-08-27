import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// 이 함수 안이 실제 랜더링 되는 부분
export default function Index() {

  const { styles } = useStyle();
  
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

	});

	return { styles }
}
