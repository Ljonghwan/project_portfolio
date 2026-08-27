import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import CryptoJS from "crypto-js";

const SECURE_LOCAL_STORAGE_HASH_KEY = "DRIVE__STORAGE__HASHKEY__2026";

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

/**
 * config 상수를 antd Select options 형태({ value, label })로 변환하는 헬퍼
 * @param {string} key - configOptions의 키 (예: 'earnTypes', 'roles')
 * @param {boolean} withAll - 맨 앞에 { value: '', label: '전체' } 추가 여부
 */
export function useConfigSelect(key, withAll = false) {
    const { configOptions } = useConfig();
    const items = configOptions?.[key] || [];
    const options = items.map(item => ({ value: item.key, label: item.label }));
    if (withAll) return [{ value: '', label: '전체' }, ...options];
    return options;
}

/**
 * config 상수 배열을 { key: label } 맵으로 변환하는 헬퍼
 * @param {string} key - configOptions의 키
 */
export function useConfigLabelMap(key) {
    const { configOptions } = useConfig();
    const items = configOptions?.[key] || [];
    return Object.fromEntries(items.map(item => [item.key, item.label]));
}

/**
 * matchStatuses 등 color 정보가 있는 상수를 { key: color } 맵으로 변환
 * @param {string} key - configOptions의 키
 */
export function useConfigColorMap(key) {
    const { configOptions } = useConfig();
    const items = configOptions?.[key] || [];
    return Object.fromEntries(items.map(item => [item.key, item.color]));
}