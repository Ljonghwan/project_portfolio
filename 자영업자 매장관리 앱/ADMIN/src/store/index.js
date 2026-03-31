import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import CryptoJS from "crypto-js";
import routes from "@/libs/routes";

const SECURE_LOCAL_STORAGE_HASH_KEY = "SASOHAN_MEETING__STORAGE__HASHKEY__2025";

const EncryptedStorage = {
    getItem(key) {
        const value = localStorage.getItem(key);

        if (value) {
            const decryptedBytes = CryptoJS.AES.decrypt(value, SECURE_LOCAL_STORAGE_HASH_KEY)
            const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
            return decryptedValue
        }

        return value
    },
    setItem(key, value) {
        const encrypted = CryptoJS.AES.encrypt(value, SECURE_LOCAL_STORAGE_HASH_KEY).toString()
        localStorage.setItem(key, encrypted);
    },
    removeItem(key) {
        localStorage.removeItem(key);
    }
}

export const useUser = create(
    persist(
        (set) => ({
            token: null,
            mbData: null,
            mbdataReload: false,
            count: 0,

            setUser: (data) => {
                set({
                    mbData: data
                });
            },
            setCount: (data) => {
                set({
                    count: data || 0
                });
            },
            login: async (data) => {

                localStorage.setItem('@token', data?.token);

                set({
                    token: data?.token,
                    mbdataReload: true,
                    reportsReload: true
                });

                setTimeout(() => {
                    set({
                        mbdataReload: false,
                        reportsReload: false
                    });
                }, 1000)

            },
            logout: async () => {

                localStorage.removeItem('@token');

                set({
                    token: null,
                    mbData: null,
                    reports: []
                });

            },
            reload: async () => {

                set({
                    mbdataReload: true
                });

                setTimeout(() => {
                    set({
                        mbdataReload: false,
                    });
                }, 1000)

            },
        }),
        {
            name: 'user', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => EncryptedStorage),
        }
    )
);

const defaultList = [
    {
        title: 'Dashboard',
        icon: 'menu_1',
        isOpen: false,
        routes: [routes.dashboad],
        leftNav: [
            {
                route: routes.dashboad, title: 'Dashboard', routes: [routes.dashboad]
            }
        ]
    },
    {
        title: '회원관리',
        icon: 'menu_2',
        isOpen: false,
        routes: [routes.users],
        leftNav: [
            {
                route: routes.users, title: '회원관리', routes: [routes.users]
            }
        ]
    },
    {
        title: '매장관리',
        icon: 'menu_3',
        isOpen: false,
        routes: [routes.stores],
        leftNav: [
            {
                route: routes.stores, title: '매장관리', routes: [routes.stores]
            }
        ]
    },
    {
        title: '콘텐츠관리',
        icon: 'menu_4',
        isOpen: false,
        routes: [routes.contents, routes.contents2, routes.contents3],
        leftNav: [
            {
                route: routes.contents, title: '커뮤니티관리', routes: [routes.contents]
            },
            {
                route: routes.contents2, title: '일지관리', routes: [routes.contents2]
            },
            {
                route: routes.contents3, title: '신고관리', routes: [routes.contents3]
            }
        ]
    },
    {
        title: '소식관리',
        icon: 'menu_5',
        isOpen: false,
        routes: [routes.news],
        leftNav: [
            {
                route: routes.news, title: '소식관리', routes: [routes.news] // 완
            }
        ]
    },
    {
        title: '이벤트 템플릿관리',
        icon: 'menu_6',
        isOpen: false,
        routes: [routes.event],
        leftNav: [
            {
                route: routes.event, title: '이벤트 템플릿관리', routes: [routes.event]
            }
        ]
    },
    {
        title: '고객지원',
        icon: 'menu_7',
        isOpen: false,
        routes: [routes.cs, routes.cs2, routes.cs3, routes.cs4],
        leftNav: [
            {
                route: routes.cs, title: '고객피드백관리', routes: [routes.cs]
            },
            {
                route: routes.cs2, title: '공지사항관리', routes: [routes.cs2]
            },
            {
                route: routes.cs3, title: '자주묻는질문관리', routes: [routes.cs3]
            },
            {
                route: routes.cs4, title: '약관 및 정책관리', routes: [routes.cs4] // 완
            }
        ]
    },
    {
        title: '서비스관리',
        icon: 'menu_8',
        isOpen: false,
        routes: [routes.service, routes.service2, routes.service3],
        leftNav: [
            {
                route: routes.service, title: '팝업관리', routes: [routes.service]
            },
            {
                route: routes.service2, title: '계정관리', routes: [routes.service2] // 완
            },
            {
                route: routes.service3, title: '권한관리', routes: [routes.service3] // 완
            }
        ]
    },
]

export const useMenu = create(
    persist(
        (set, get) => ({
            menuList: defaultList,
            resetMenu: () => {
                set({
                    menuList: defaultList
                })
            },
            menuOpen: (index, isOpen) => {
                set({
                    menuList: get().menuList.map((menu, i) => {
                        if (i === index) {
                            return { ...menu, isOpen: isOpen }
                        }
                        return menu
                    })
                });
            },
        }),
        {
            name: 'menu', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => EncryptedStorage),
        }
    )
);

export const usePopup = create(
    (set, get) => ({
        open: null,

        component: null,

        title: null,
        message: null,
        warning: null,
        button: null,
        buttonCencle: null,
        onCancelPress: null,
        onPress: null,

        openPopup: (state) => {
            set({
                open: true,

                title: state?.title || null,
                message: state?.message || null,
                warning: state?.warning || null,

                button: state?.button || "확인",
                buttonCencle: state?.buttonCencle || null,

                onCancelPress: state?.onCancelPress || null,
                onPress: state?.onPress || null,

                component: state?.component || null,
            });
        },

        closePopup: (state) => {
            set({
                open: null
            });
        },
    })
)

export const usePopupComponent = create(
    (set, get) => ({
        open: null,
        title: null,
        component: null,
        data: null,

        openPopupComponent: (state) => {
            set({
                open: true,
                title: state?.title || null,
                component: state?.component || null,
                data: state?.data || null,
            });
        },

        closePopupComponent: (state) => {
            set({
                open: null
            });
            setTimeout(() => {
                set({
                    component: null,
                    data: null,
                });
            }, 300)
        },
    })
)



export const useGallery = create(
    (set, get) => ({
        open: null,

        startIndex: 0,
        list: [],

        openGallery: (state) => {
            set({
                open: true,

                startIndex: state?.startIndex || 0,
                list: state?.list || [],
            });
        },

        closeGallery: (state) => {
            set({
                open: false
            });
        },
    })
)


export const useConfig = create(
    persist(
        (set) => ({
            configOptions: null,

            setConfigOptions: (data) => {
                set({
                    configOptions: data || null
                });
            },
        }),
        {
            name: 'config', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => EncryptedStorage),
        }
    )
)