import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import CryptoJS from "crypto-js";
import consts from "@/libs/consts";

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


export const useData = create(

    persist(
        (set) => ({
            portpolio: [],
            mainLogos: [],

            setPortpolio: (data) => {
                set({
                    portpolio: data?.list || [],
                    mainLogos: data?.listMain || [],
                });
            }
        }),
        {
            name: 'data', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => EncryptedStorage),
        }
    )
)


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

        openPopupComponent: (state) => {
            set({
                open: true,
                title: state?.title || null,
                component: state?.component || null,
            });
        },

        closePopupComponent: (state) => {
            set({
                open: null
            });
            setTimeout(() => {
                set({
                    component: null,
                });
            }, 300)
        },
    })
)



export const useEtc = create(
    (set, get) => ({
        theme: consts.pageThemeColors.default,

        setTheme: (data) => {
            set({
                theme: data
            });
        },
    })
)


export const useSize = create(
    (set, get) => ({
        size: {
            width: window.innerWidth,
            height: window.innerHeight
        },

        setSize: (data) => {
            set({
                size: data
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