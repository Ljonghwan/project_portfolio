import { router } from 'expo-router';

export const imageViewer = ({ index = 0, list = [] }) => {
    router.navigate({
        pathname: '/viewer',
        params: {
            index: String(index),
            list: list.join(','),
        },
    });
};
