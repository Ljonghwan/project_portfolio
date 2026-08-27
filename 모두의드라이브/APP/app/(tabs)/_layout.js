import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE } from '../../src/constants/config';
import useNotificationStore from '../../src/store/notificationStore';
import useChatStore from '../../src/store/chatStore';

const TAB_ICON_SIZE = 24;

const TAB_ICONS = {
    home: {
        active: require('../../assets/icons/tab-home-active.svg'),
        inactive: require('../../assets/icons/tab-home-inactive.svg'),
    },
    find: {
        active: require('../../assets/icons/tab-find-active.svg'),
        inactive: require('../../assets/icons/tab-find-inactive.svg'),
    },
    bell: {
        active: require('../../assets/icons/tab-bell-active.svg'),
        inactive: require('../../assets/icons/tab-bell-inactive.svg'),
    },
    chat: {
        active: require('../../assets/icons/tab-chat-active.svg'),
        inactive: require('../../assets/icons/tab-chat-inactive.svg'),
    },
    mypage: {
        active: require('../../assets/icons/tab-mypage-active.svg'),
        inactive: require('../../assets/icons/tab-mypage-inactive.svg'),
    },
};

function TabIcon({ name, focused }) {
    const source = focused ? TAB_ICONS[name].active : TAB_ICONS[name].inactive;
    return (
        <Image
            source={source}
            style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
        />
    );
}

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const unreadCount = useNotificationStore((s) => s.unreadCount);
    const unreadTotal = useChatStore((s) => s.unreadTotal);

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: '#969698',
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: '#EEEEEE',
                    borderTopWidth: 1,
                    height: 64 + insets.bottom,
                    paddingTop: 4,
                    paddingBottom: insets.bottom,
                },
                tabBarLabelStyle: {
                    fontFamily: FONTS.semiBold,
                    fontSize: FONT_SIZE.sm,
                },
                // contentStyle: { backgroundColor: COLORS.white }
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: '홈',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="home" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="find"
                options={{
                    title: '친구찾기',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="find" focused={focused} />
                    )
                }}
            />
            <Tabs.Screen
                name="notification"
                options={{
                    title: '알림',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="bell" focused={focused} />
                    ),
                    tabBarBadge: unreadCount > 0 ? '' : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: COLORS.badge,
                        minWidth: 8,
                        maxWidth: 8,
                        height: 8,
                        borderRadius: 100,
                        position: 'absolute',
                        top: 2,
                        left: '60%',
                    },
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: '채팅',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="chat" focused={focused} />
                    ),
                    lazy: false,
                    tabBarBadge: unreadTotal > 0 ? '' : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: COLORS.badge,
                        minWidth: 8,
                        maxWidth: 8,
                        height: 8,
                        borderRadius: 100,
                        position: 'absolute',
                        top: 2,
                        left: '60%',
                    },
                }}
            />
            <Tabs.Screen
                name="mypage"
                options={{
                    title: '마이',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="mypage" focused={focused} />
                    ),
                    lazy: false,
                }}
            />
        </Tabs>
    );
}
