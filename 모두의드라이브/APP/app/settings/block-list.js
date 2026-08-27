import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '../../src/components/AppHeader';
import { authApi } from '../../src/api/auth';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';

export default function BlockListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingKeys, setUpdatingKeys] = useState(new Set());

    useEffect(() => {
        loadList();
    }, []);

    async function loadList() {
        try {
            const res = await authApi.getBlockList();
            setList(res.data?.list || []);
        } catch {
            showToast('error', '차단 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }

    const handleUnblock = useCallback(async (item) => {
        if (updatingKeys.has(item.blockedIdx)) return;
        setUpdatingKeys(prev => new Set(prev).add(item.blockedIdx));
        try {
            await authApi.unblockUser(item.blockedIdx);
            setList(prev => prev.filter(i => i.idx !== item.idx));
            showToast('success', '차단 해제되었습니다.');
        } catch (e) {
            const msg = e?.response?.data?.message || '차단 해제에 실패했습니다.';
            showToast('error', msg);
        } finally {
            setUpdatingKeys(prev => {
                const next = new Set(prev);
                next.delete(item.blockedIdx);
                return next;
            });
        }
    }, [updatingKeys]);

    const renderItem = useCallback(({ item }) => {
        const isUpdating = updatingKeys.has(item.blockedIdx);
        const avatarUri = item.profileImage ? STORAGE_URL + item.profileImage : null;
        return (
            <View style={styles.row} testID={`block-list-item-${item.blockedIdx}`}>
                <View style={styles.avatarWrap}>
                    {avatarUri ? (
                        <Image
                            source={{ uri: avatarUri }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <Image
                            source={require('../../assets/icons/profile-avatar.svg')}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    )}
                </View>
                <Text style={styles.nickname} allowFontScaling={false} numberOfLines={1}>
                    {item.nickname}
                </Text>
                <TouchableOpacity
                    style={[styles.unblockBtn, isUpdating && styles.unblockBtnDisabled]}
                    onPress={() => handleUnblock(item)}
                    disabled={isUpdating}
                    activeOpacity={0.75}
                    testID={`block-list-unblock-btn-${item.blockedIdx}`}
                >
                    {isUpdating ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Text style={styles.unblockBtnText} allowFontScaling={false}>해제</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    }, [updatingKeys, handleUnblock]);

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="차단 목록" onBack={() => router.back()} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={item => String(item.idx)}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: SPACING.xl + insets.bottom },
                    ]}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText} allowFontScaling={false}>
                                차단한 회원이 없습니다.
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
    },
    listContent: {
        paddingTop: SPACING.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayEE,
    },
    avatarWrap: {
        marginRight: SPACING.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    nickname: {
        flex: 1,
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.medium,
        color: COLORS.black,
    },
    unblockBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
        minWidth: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unblockBtnDisabled: {
        borderColor: COLORS.grayCC,
    },
    unblockBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
});
