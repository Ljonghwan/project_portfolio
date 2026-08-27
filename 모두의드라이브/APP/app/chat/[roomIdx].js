import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Platform, Modal,
    Alert, AppState, InteractionManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as ImagePicker from 'expo-image-picker';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import AsyncStorage from '@react-native-async-storage/async-storage';
import chatApi from '../../src/api/chat';
import useAuthStore from '../../src/store/authStore';
import useChatStore from '../../src/store/chatStore';
import usePopupStore from '../../src/store/popupStore';
import { imageViewer } from '../../src/utils/imageViewer';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL, API_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import { resizeForUpload } from '../../src/utils/image';
import { logChatStarted } from '../../src/utils/analytics';

dayjs.locale('ko');

const LIMIT = 30;

function formatMsgTime(dateStr) {
    if (!dateStr) return '';
    const d = dayjs(dateStr);
    const h = d.hour();
    const m = d.minute();
    const period = h < 12 ? '오전' : '오후';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${hour12}:${String(m).padStart(2, '0')}`;
}

function formatDividerDate(dateStr) {
    return dayjs(dateStr).format('YYYY년 M월 D일 dddd');
}

function addDateDividers(msgs) {
    const result = [];
    for (let i = 0; i < msgs.length; i++) {
        result.push(msgs[i]);
        const currentDate = dayjs(msgs[i].createdAt).format('YYYY-MM-DD');
        const nextDate = i + 1 < msgs.length
            ? dayjs(msgs[i + 1].createdAt).format('YYYY-MM-DD')
            : null;
        if (nextDate !== currentDate) {
            result.push({ __type: 'divider', date: currentDate, id: `divider-${currentDate}-${i}` });
        }
    }
    return result;
}

function parseImageUrls(content) {
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [content];
}

function getSystemMsgStyle(content) {
    if (!content) return {};
    if (content.includes('최종 확정')) return { backgroundColor: COLORS.primary };
    if (content.includes('매칭이 종료') || content.includes('노쇼')) return { backgroundColor: COLORS.danger };
    return {};
}
function getSystemMsgTextStyle(content) {
    if (!content) return {};
    if (content.includes('최종 확정') || content.includes('매칭이 종료') || content.includes('노쇼')) return { color: COLORS.white };
    return {};
}

function DateDivider({ date }) {
    return (
        <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText} allowFontScaling={false}>
                {formatDividerDate(date)}
            </Text>
            <View style={styles.dividerLine} />
        </View>
    );
}

function SystemMessage({ content }) {
    return (
        <View style={styles.systemWrap}>
            <Text
                style={[styles.systemText, getSystemMsgStyle(content), getSystemMsgTextStyle(content)]}
                allowFontScaling={false}
            >
                {content}
            </Text>
        </View>
    );
}

function ImageGrid({ urls, onPress }) {
    const count = Math.min(urls.length, 10);
    const visibleUrls = urls.slice(0, count);
    if (count === 1) {
        return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(0)} style={styles.imageBubble} testID="chatroom-image-bubble">
                <Image source={{ uri: STORAGE_URL + urls[0] }} style={styles.messageImage} contentFit="cover" />
            </TouchableOpacity>
        );
    }
    const cols = count <= 4 ? 2 : 3;
    const cellSize = count <= 4 ? 108 : 72;
    const gap = 2;
    const gridWidth = cols * cellSize + (cols - 1) * gap;
    const overflow = urls.length - count;
    return (
        <View style={[styles.imageGridWrap, { width: gridWidth }]}>
            {visibleUrls.map((url, i) => {
                const showOverflow = overflow > 0 && i === count - 1;
                return (
                    <TouchableOpacity
                        key={i}
                        activeOpacity={0.85}
                        onPress={() => onPress(i)}
                        style={{ width: cellSize, height: cellSize, borderRadius: 4, overflow: 'hidden' }}
                        testID={`chatroom-image-grid-${i}`}
                    >
                        <Image source={{ uri: STORAGE_URL + url }} style={{ width: cellSize, height: cellSize }} contentFit="cover" />
                        {showOverflow && (
                            <View style={styles.imageOverflowMask}>
                                <Text style={styles.imageOverflowText} allowFontScaling={false}>
                                    +{overflow}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function OpponentMessage({ item, showAvatar }) {
    const avatarUri = item.sender?.profileImage
        ? STORAGE_URL + item.sender.profileImage
        : null;
    const isImage = item.type === 'image';
    const imageUrls = isImage ? parseImageUrls(item.content) : [];

    const handleImagePress = useCallback((index) => {
        imageViewer({ index, list: imageUrls.map(u => STORAGE_URL + u) });
    }, [imageUrls]);

    return (
        <View style={styles.oppRow}>
            <View style={styles.oppAvatarWrap}>
                {showAvatar ? (
                    avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.oppAvatar} contentFit="cover" />
                    ) : (
                        <Image
                            source={require('../../assets/icons/profile-avatar.svg')}
                            style={styles.oppAvatar}
                            contentFit="cover"
                        />
                    )
                ) : (
                    <View style={styles.oppAvatarSpace} />
                )}
            </View>
            <View style={styles.oppContent}>
                {showAvatar && (
                    <Text style={styles.oppNickname} allowFontScaling={false}>
                        {item.sender?.nickname || ''}
                    </Text>
                )}
                <View style={styles.oppBubbleRow}>
                    {isImage ? (
                        <ImageGrid urls={imageUrls} onPress={handleImagePress} />
                    ) : (
                        <View style={styles.oppBubble}>
                            <Text style={styles.oppBubbleText} allowFontScaling={false}>
                                {item.content}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.msgTime} allowFontScaling={false}>
                        {formatMsgTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function MyMessage({ item }) {
    const isImage = item.type === 'image';
    const imageUrls = isImage ? parseImageUrls(item.content) : [];

    const handleImagePress = useCallback((index) => {
        imageViewer({ index, list: imageUrls.map(u => STORAGE_URL + u) });
    }, [imageUrls]);

    return (
        <View style={styles.myRow}>
            <Text style={styles.msgTime} allowFontScaling={false}>
                {formatMsgTime(item.createdAt)}
            </Text>
            {isImage ? (
                <ImageGrid urls={imageUrls} onPress={handleImagePress} />
            ) : (
                <View style={styles.myBubble}>
                    <Text style={styles.myBubbleText} allowFontScaling={false}>
                        {item.content}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default function ChatRoomScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { roomIdx, nickname: paramNickname, matchIdx, matchType: paramMatchType } = useLocalSearchParams();
    const token = useAuthStore((s) => s.token);
    const myUser = useAuthStore((s) => s.user);
    const setUnreadTotal = useChatStore((s) => s.setUnreadTotal);
    const pendingAction = useChatStore((s) => s.pendingAction);
    const setPendingAction = useChatStore((s) => s.setPendingAction);
    const setCurrentRoom = useChatStore((s) => s.setCurrentRoom);
    const clearCurrentRoom = useChatStore((s) => s.clearCurrentRoom);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [matchStatus, setMatchStatus] = useState(null);
    const [confirmType, setConfirmType] = useState(null);
    const [isActing, setIsActing] = useState(false);

    const socketRef = useRef(null);
    const listRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const isFocusedRef = useRef(true);
    // dedup: 이미 받은 메시지 idx 집합 (중복 방지)
    const seenIdsRef = useRef(new Set());
    // resync 기준: 현재까지 본 가장 최신 메시지 idx
    const maxIdxRef = useRef(0);

    const messagesWithDividers = useMemo(() => addDateDividers(messages), [messages]);

    const markRead = useCallback(async () => {
        try {
            await chatApi.read(Number(roomIdx));
            const res = await chatApi.getUnreadTotal();
            setUnreadTotal(res.data?.total || 0);
        } catch (_) {}
    }, [roomIdx, setUnreadTotal]);

    const loadMatchStatus = useCallback(async () => {
        try {
            const res = await chatApi.getMatchStatus(Number(roomIdx));
            setMatchStatus(res.data || null);
        } catch (_) {}
    }, [roomIdx]);

    const loadMessages = useCallback(async (lastIdx = null) => {
        try {
            const res = await chatApi.getMessages({ roomIdx: Number(roomIdx), lastIdx, limit: LIMIT });
            const fetched = res.data || [];
            // dedup: seenIdsRef 기준 신규만 통과
            const fresh = fetched.filter(m => m && m.idx != null && !seenIdsRef.current.has(m.idx));
            fresh.forEach(m => {
                seenIdsRef.current.add(m.idx);
                if (m.idx > maxIdxRef.current) maxIdxRef.current = m.idx;
            });
            const reversed = [...fresh].reverse();
            if (lastIdx) {
                setMessages(prev => [...prev, ...reversed]);
            } else {
                setMessages(reversed);
            }
            if (fetched.length < LIMIT) setHasMore(false);
        } catch (e) {
            console.error('loadMessages error:', e);
        }
    }, [roomIdx]);

    // resync: 마지막으로 본 idx 이후 누락분만 받아오기 (socket reconnect / 앱 포커스 복귀 시)
    const resyncSince = useCallback(async () => {
        if (!maxIdxRef.current) return;
        try {
            const res = await chatApi.getMessagesSince(Number(roomIdx), maxIdxRef.current);
            const fetched = res.data || [];
            const fresh = fetched.filter(m => m && m.idx != null && !seenIdsRef.current.has(m.idx));
            if (fresh.length === 0) return;
            fresh.forEach(m => {
                seenIdsRef.current.add(m.idx);
                if (m.idx > maxIdxRef.current) maxIdxRef.current = m.idx;
            });
            // 신규 메시지는 idx 오름차순(서버) → 화면은 inverted DESC라 reverse 후 prepend
            const desc = [...fresh].reverse();
            setMessages(prev => [...desc, ...prev]);
            if (isFocusedRef.current) markRead();
        } catch (_) {}
    }, [roomIdx, markRead]);

    useEffect(() => {
        let mounted = true;
        // 룸 변경/재마운트 시 dedup 상태 초기화
        seenIdsRef.current = new Set();
        maxIdxRef.current = 0;

        const init = async () => {
            // 1) 먼저 매칭 상태 조회 — 종료 후 1시간 경과(canEnter=false)면 즉시 뒤로
            let status = null;
            try {
                const res = await chatApi.getMatchStatus(Number(roomIdx));
                status = res.data || null;
                if (mounted) setMatchStatus(status);
            } catch (_) {}
            if (mounted && status && status.canEnter === false) {
                showToast('error', '종료된 채팅방입니다.');
                router.back();
                return;
            }
            await loadMessages();
            if (mounted) {
                setIsLoading(false);
                markRead();
            }
        };
        init();

        const socket = io(API_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
        });
        socketRef.current = socket;

        // 첫 연결 + 재연결 모두 여기로 들어옴.
        // 이미 한 번 메시지를 받은 적이 있다면(maxIdxRef>0) 끊긴 동안 누락분을 sinceIdx로 보충.
        socket.on('connect', () => {
            if (!mounted) return;
            socket.emit('joinRoom', { roomIdx: Number(roomIdx) });
            if (maxIdxRef.current > 0) resyncSince();
        });

        socket.on('newMessage', (msg) => {
            if (!mounted || !msg || msg.idx == null) return;
            // dedup: 같은 idx가 두 번 도착해도 1번만 반영
            if (seenIdsRef.current.has(msg.idx)) return;
            seenIdsRef.current.add(msg.idx);
            if (msg.idx > maxIdxRef.current) maxIdxRef.current = msg.idx;

            setMessages(prev => [msg, ...prev]);
            if (msg.type === 'system') {
                loadMatchStatus();
            }
            // 포커스 떠난 상태(이미지 뷰어 등)에서는 markRead/auto-scroll 보류 → 복귀 후 일괄 처리
            if (isFocusedRef.current) {
                markRead();
                if (isAtBottomRef.current) {
                    requestAnimationFrame(() => {
                        listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
                    });
                }
            }
        });

        // 앱 포커스 복귀 시 누락분 보충 (백그라운드 → 활성화)
        const appStateSub = AppState.addEventListener('change', (next) => {
            if (next === 'active') {
                // socket이 끊겼으면 자동 reconnect가 동작하나, 양쪽 모두 안전망으로 보충
                resyncSince();
            }
        });

        return () => {
            mounted = false;
            appStateSub.remove();
            if (socket.connected) {
                socket.emit('leaveRoom', { roomIdx: Number(roomIdx) });
            }
            socket.disconnect();
            socketRef.current = null;
            markRead();
        };
    }, [roomIdx, token]);

    // 이미지 뷰어 등에서 복귀 시: markRead 1회 + resync (스크롤 위치는 그대로 보존)
    // 더보기 페이지에서 매칭 확정/불참 버튼 누르고 돌아오면 pendingAction 처리
    useFocusEffect(
        useCallback(() => {
            isFocusedRef.current = true;
            setCurrentRoom(roomIdx);
            markRead();
            resyncSince();
            // 더보기 페이지에서 설정한 pendingAction 소비 → 확인 팝업 트리거
            if (pendingAction === 'confirm' || pendingAction === 'cancel') {
                const next = pendingAction;
                setPendingAction(null);
                // BottomSheet/Modal 마운트 안정성을 위해 다음 프레임에 트리거
                requestAnimationFrame(() => setConfirmType(next));
            }
            // 더보기에서 변경됐을 가능성 있는 매칭 상태 동기화
            loadMatchStatus();
            return () => {
                isFocusedRef.current = false;
                clearCurrentRoom();
            };
        }, [roomIdx, markRead, resyncSince, pendingAction, setPendingAction, loadMatchStatus, setCurrentRoom, clearCurrentRoom])
    );

    const handleLoadMore = useCallback(async () => {
        if (!hasMore || isLoadingMore || messages.length === 0) return;
        // messages는 inverted DESC: 끝에서부터 오름차순으로 거슬러 올라가며
        // divider/idx 없는 항목을 스킵하고 실제 메시지 idx를 찾아 lastIdx로 사용.
        let lastIdx = null;
        for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m && m.__type !== 'divider' && m.idx != null) {
                lastIdx = m.idx;
                break;
            }
        }
        if (lastIdx == null) return;
        setIsLoadingMore(true);
        await loadMessages(lastIdx);
        setIsLoadingMore(false);
    }, [hasMore, isLoadingMore, messages, loadMessages]);

    const handleSendText = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isSending) return;
        // 방 생성 시 시스템 메시지가 먼저 들어가므로 개수로는 판정할 수 없다 — 사람이 쓴 메시지가 있는지로 본다
        const wasEmpty = !messages.some(m => m?.idx != null && m.type !== 'system');
        setInputText('');
        setIsSending(true);
        isAtBottomRef.current = true;
        try {
            await chatApi.send({ roomIdx: Number(roomIdx), content: text, type: 'text' });
            if (wasEmpty) logChatStarted(Number(roomIdx), matchStatus?.matchIdx);
            requestAnimationFrame(() => {
                listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
            });
        } catch (e) {
            // 전송 실패 시 입력값 복구 + 사용자 알림
            setInputText(text);
            showToast('error', e?.response?.data?.message || '메시지 전송에 실패했습니다.');
        } finally {
            setIsSending(false);
        }
    }, [inputText, isSending, roomIdx, messages, matchStatus?.matchIdx]);

    const handleSendImage = useCallback(async () => {
        if (isSending) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1, // iOS 펜 마크업 적색 라인 손실 방지 (압축은 resizeForUpload 담당)
            base64: true,
            allowsEditing: false,
            allowsMultipleSelection: true,
            selectionLimit: 10,
        });
        if (result.canceled || !result.assets?.length) return;
        if (result.assets.length > 10) {
            showToast('info', '이미지는 최대 10장까지 전송할 수 있습니다.');
        }
        const picked = result.assets.slice(0, 10);
        const wasEmpty = !messages.some(m => m?.idx != null && m.type !== 'system');
        setIsSending(true);
        isAtBottomRef.current = true;
        try {
            const assets = await Promise.all(picked.map(resizeForUpload));
            if (assets.length === 1) {
                const asset = assets[0];
                const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
                const base = `data:image/${ext};base64,${asset.base64}`;
                await chatApi.upload({ roomIdx: Number(roomIdx), fileData: { base, ext } });
            } else {
                const files = assets.map(asset => {
                    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
                    const base = `data:image/${ext};base64,${asset.base64}`;
                    return { base, ext };
                });
                await chatApi.uploadMulti({ roomIdx: Number(roomIdx), files });
            }
            if (wasEmpty) logChatStarted(Number(roomIdx), matchStatus?.matchIdx);
            requestAnimationFrame(() => {
                listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
            });
        } catch (e) {
            showToast('error', e?.response?.data?.message || '이미지 전송에 실패했습니다.');
        } finally {
            setIsSending(false);
        }
    }, [isSending, roomIdx, messages, matchStatus?.matchIdx]);

    const handleConfirmMatch = useCallback(async () => {
        setIsActing(true);
        try {
            await chatApi.confirmMatch(Number(roomIdx));
            showToast('success', '매칭이 확정되었습니다.');
            setConfirmType(null);
            await loadMatchStatus();
        } catch (e) {
            showToast('error', e?.response?.data?.message || '처리 중 오류가 발생했습니다.');
            setConfirmType(null);
        } finally {
            setIsActing(false);
        }
    }, [roomIdx, loadMatchStatus]);

    const handleCancelMatch = useCallback(async () => {
        setIsActing(true);
        try {
            await chatApi.cancelMatch(Number(roomIdx));
            showToast('success', '매칭 불참 처리되었습니다.');
            setConfirmType(null);
            router.back();
        } catch (e) {
            showToast('error', e?.response?.data?.message || '처리 중 오류가 발생했습니다.');
            setConfirmType(null);
        } finally {
            setIsActing(false);
        }
    }, [roomIdx, router]);

    const getItemType = useCallback((item) => {
        if (item.__type === 'divider') return 'divider';
        if (item.type === 'system') return 'system';
        if (item.senderIdx === myUser?.idx) return 'my';
        return 'opponent';
    }, [myUser?.idx]);

    const renderItem = useCallback(({ item, index }) => {
        if (item.__type === 'divider') return <DateDivider date={item.date} />;
        if (item.type === 'system') return <SystemMessage content={item.content} />;
        const isMe = item.senderIdx === myUser?.idx;
        if (isMe) return <MyMessage item={item} />;
        const prevItem = messagesWithDividers[index + 1];
        const showAvatar = !prevItem
            || prevItem.__type === 'divider'
            || prevItem.senderIdx !== item.senderIdx
            || prevItem.type === 'system';
        return <OpponentMessage item={item} showAvatar={showAvatar} />;
    }, [myUser?.idx, messagesWithDividers]);

    const keyExtractor = useCallback((item) => {
        return item.__type === 'divider' ? item.id : String(item.idx);
    }, []);

    const handleScroll = useCallback((e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        isAtBottomRef.current = offsetY < 80;
    }, []);

    const isMatchCancelled = matchStatus?.matchStatus === 'cancelled';
    const myConfirmed = matchStatus?.myConfirmed === true;
    const confirmedCount = matchStatus?.confirmedCount ?? 0;
    const memberCount = matchStatus?.memberCount ?? 0;

    // [P-4][C117-2] 매칭 채팅방 최초 입장 시 노쇼 패널티 안내 팝업 1회 표시 (작성자 제외)
    useEffect(() => {
        if (!matchStatus) return;
        const effectiveType = matchStatus.matchType || paramMatchType;
        if (effectiveType !== 'group' && effectiveType !== 'one_to_one') return;
        if (matchStatus.canSend === false) return;
        let cancelled = false;
        (async () => {
            const key = `noShowNotice:${roomIdx}`;
            try {
                const shown = await AsyncStorage.getItem(key);
                console.log('shown', shown);
                if (shown || cancelled) return;
                // 작성자(오너)에게는 안내 미노출 — 키는 저장하여 향후에도 표시 안 함
                // if (matchStatus.isAuthor === true) {
                //     await AsyncStorage.setItem(key, '1');
                //     return;
                // }
                // [F3][C122] 안드로이드(갤럭시) 미표시 버그 수정:
                // 채팅방 진입 직후 네비게이션 transition 중 show() 호출 시 안드로이드에서 팝업 Provider 가
                // 준비되기 전이라 모달이 묻힘. transition 완료 후 다음 틱에 표시.
                // 키 저장도 실제 표시 시점으로 이동(표시 전 setItem 으로 인한 영구 미표시 회귀 방지).
                InteractionManager.runAfterInteractions(async () => {
                    if (cancelled) return;
                    try { await AsyncStorage.setItem(key, '1'); } catch (_) {}
                    usePopupStore.getState().show('confirm', {
                        title: '노쇼 패널티 안내',
                        message: '매칭 후 부득이하게 참석이 어렵다면 반드시 [매칭 불참] 버튼을 눌러주세요.\n사전 연락이나 취소 없이 약속 장소에 나타나지 않을 경우, 노쇼 패널티 10,000 포인트가 차감됩니다.',
                        confirmText: '확인',
                    });
                });
            } catch (_) {}
        })();
        return () => { cancelled = true; };
    }, [matchStatus?.matchType, matchStatus?.canSend, matchStatus?.isAuthor, paramMatchType, roomIdx]);

    // [P-5] 매칭 결정 카운트다운/BottomSheet 제거 — 매칭 신청 수락 시 자동 확정
    const canSend = matchStatus ? matchStatus.canSend !== false : true;
    const isReadonly = !canSend;
    const readonlyText = useMemo(() => {
        if (!matchStatus) return '';
        const s = matchStatus.matchStatus;
        if (s === 'completed') return '드라이브가 종료되어 메시지를 보낼 수 없습니다.';
        if (s === 'no_show') return '노쇼 처리된 매칭이라 메시지를 보낼 수 없습니다.';
        if (s === 'cancelled') return '취소된 매칭이라 메시지를 보낼 수 없습니다.';
        return '';
    }, [matchStatus]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* 헤더 (스테이터스바 영역까지 흰색) */}
            <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.headerIconBtn}
                    testID="chatroom-back-btn"
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.headerIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>

                <Text
                    style={[
                        styles.headerTitle,
                        (matchStatus?.matchType || paramMatchType) === 'group' && styles.headerTitleGroup,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    allowFontScaling={false}
                >
                    {(() => {
                        const myIdx = myUser?.idx;
                        const others = (matchStatus?.members || []).filter(m => m.userIdx !== myIdx);
                        const effectiveType = matchStatus?.matchType || paramMatchType;
                        if (effectiveType === 'group') {
                            const names = others.map(m => m.nickname).filter(Boolean);
                            if (names.length > 0) return names.join(', ');
                        } else if (effectiveType === 'one_to_one') {
                            const partner = others[0]?.nickname;
                            if (partner) return partner;
                        }
                        return '';
                    })()}
                </Text>

                <View style={styles.headerRight}>
                    {memberCount > 0 && (
                        <Text style={styles.headerConfirmText} allowFontScaling={false}>
                            매칭 확정 {confirmedCount}/{memberCount}
                        </Text>
                    )}
                    {!!matchIdx && (
                        <TouchableOpacity
                            onPress={() => router.navigate(`/match/${matchIdx}`)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.headerIconBtn}
                            testID="chatroom-match-btn"
                        >
                            <Image
                                source={require('../../assets/icons/mypage-document.svg')}
                                style={styles.headerIcon}
                                contentFit="contain"
                            />
                        </TouchableOpacity>
                    )}
                    {matchStatus?.canSend === true && (
                        <TouchableOpacity
                            onPress={() => router.navigate(`/chat/more/${roomIdx}`)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.headerIconBtn}
                            testID="chatroom-more-btn"
                        >
                            <Image
                                source={require('../../assets/icons/more-vertical.svg')}
                                style={styles.headerIcon}
                                contentFit="contain"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* [P-5] 매칭 결정하기 버튼 + 카운트다운 배너 제거 (수락 시 자동 매칭 확정) */}

            {/* 메시지 리스트 + 입력 바 */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior="translate-with-padding"
                keyboardVerticalOffset={-insets.bottom}
            >
                {isLoading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    </View>
                ) : (
                    <FlashList
                        ref={listRef}
                        data={messagesWithDividers}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        getItemType={getItemType}
                        estimatedItemSize={60}
                        inverted
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={
                            isLoadingMore ? (
                                <View style={styles.loadMoreWrap}>
                                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                                </View>
                            ) : null
                        }
                        contentContainerStyle={{
                            paddingHorizontal: SPACING.xl,
                            paddingTop: SPACING.lg,
                            paddingBottom: SPACING.lg,
                        }}
                        showsVerticalScrollIndicator={false}
                        testID="chatroom-msg-list"
                    />
                )}

                {/* 입력 바 (expo-blur) */}
                {isReadonly ? (
                    <View style={[styles.readonlyWrap, { paddingBottom: insets.bottom + SPACING.md }]}>
                        <Text style={styles.readonlyText} allowFontScaling={false} testID="chatroom-readonly-banner">
                            {readonlyText || '종료된 채팅방입니다.'}
                        </Text>
                    </View>
                ) : (
                    <BlurView
                        intensity={60}
                        tint="light"
                        style={[styles.inputBlurWrap, { paddingBottom: insets.bottom + SPACING.md }]}
                    >
                        <View style={styles.inputBar}>
                            <TouchableOpacity
                                onPress={handleSendImage}
                                disabled={isSending}
                                style={styles.inputIconBtn}
                                testID="chatroom-image-btn"
                            >
                                <Image
                                    source={require('../../assets/icons/add-fill2.svg')}
                                    style={styles.inputIcon}
                                    contentFit="contain"
                                />
                            </TouchableOpacity>

                            <View style={styles.inputWrap}>
                                <TextInput
                                    style={styles.input}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholder="메시지를 입력하세요"
                                    placeholderTextColor={COLORS.grayMedium}
                                    multiline
                                    maxLength={500}
                                    allowFontScaling={false}
                                    testID="chatroom-input"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSendText}
                                disabled={!inputText.trim() || isSending}
                                style={[
                                    styles.sendBtn,
                                    (!inputText.trim() || isSending) && styles.sendBtnDisabled,
                                ]}
                                testID="chatroom-send-btn"
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Image
                                        source={require('../../assets/icons/send-01.svg')}
                                        style={styles.sendIcon}
                                        contentFit="contain"
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                )}
            </KeyboardAvoidingView>

            {/* [P-5] 매칭 결정 BottomSheet 제거 (수락 시 자동 매칭 확정) */}

            {/* 확인 팝업 (매칭 확정 / 매칭 불참) */}
            <Modal
                visible={confirmType !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmType(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.popupCard}>
                        {confirmType === 'confirm' ? (
                            <>
                                <View style={styles.popupBody}>
                                    <Text style={styles.popupTitle} allowFontScaling={false}>
                                        매칭을 확정하시겠습니까?
                                    </Text>
                                    <Text style={styles.popupDesc} allowFontScaling={false}>
                                        {'매칭 확정후 노쇼가 발생할 경우\n'}
                                        <Text style={styles.popupDescBold}>1만 포인트가 차감</Text>
                                        {'됩니다.'}
                                    </Text>
                                </View>
                                <View style={styles.popupBtns}>
                                    <TouchableOpacity
                                        style={[styles.popupBtn, styles.popupBtnGrayBg]}
                                        onPress={() => setConfirmType(null)}
                                        disabled={isActing}
                                        testID="chatroom-confirm-popup-cancel"
                                    >
                                        <Text style={styles.popupBtnGrayText} allowFontScaling={false}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.popupBtn, styles.popupBtnPrimary]}
                                        onPress={handleConfirmMatch}
                                        disabled={isActing}
                                        testID="chatroom-confirm-popup-ok"
                                    >
                                        {isActing ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <Text style={styles.popupBtnWhiteText} allowFontScaling={false}>매칭 확정</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.popupBody}>
                                    <Text style={styles.popupTitle} allowFontScaling={false}>
                                        {'매칭 불참하시면\n채팅방이 종료됩니다.'}
                                    </Text>
                                    <Text style={styles.popupDesc} allowFontScaling={false}>
                                        매칭 불참시 사용된 포인트는 환불되지 않습니다.
                                    </Text>
                                </View>
                                <View style={styles.popupBtns}>
                                    <TouchableOpacity
                                        style={[styles.popupBtn, styles.popupBtnGrayBg]}
                                        onPress={() => setConfirmType(null)}
                                        disabled={isActing}
                                        testID="chatroom-cancel-popup-cancel"
                                    >
                                        <Text style={styles.popupBtnGrayText} allowFontScaling={false}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.popupBtn, styles.popupBtnDarkGray]}
                                        onPress={handleCancelMatch}
                                        disabled={isActing}
                                        testID="chatroom-cancel-popup-ok"
                                    >
                                        {isActing ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <Text style={styles.popupBtnWhiteText} allowFontScaling={false}>매칭 불참</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2EFF3',
    },
    flex: {
        flex: 1,
    },

    // 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        zIndex: 1000
    },
    headerIconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        flex: 1,
        marginLeft: SPACING.md,
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    headerTitleGroup: {
        fontSize: FONT_SIZE.md,
        lineHeight: 22,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerConfirmText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.xs,
        color: COLORS.grayMedium,
        marginRight: 2,
    },

    // [BUG-1] 카운트다운 배너
    countdownBannerWrap: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
    },
    countdownBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 12,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.md,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    countdownTimeText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    countdownBtn: {
        width: 120,
        height: 36,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: SPACING.md,
    },
    countdownBtnIcon: {
        width: 18,
        height: 18,
    },
    countdownBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.white,
    },

    // 로딩
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadMoreWrap: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },

    // 날짜 구분선
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#C5C5CD',
    },
    dividerText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.xs,
        color: '#C5C5CD',
        flexShrink: 0,
    },

    // 시스템 메시지
    systemWrap: {
        alignItems: 'center',
        marginVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
    },
    systemText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
        backgroundColor: '#F2F4F7',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 8,
        borderRadius: 16,
        overflow: 'hidden',
        textAlign: 'center',
    },

    // 상대방 메시지
    oppRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 4,
    },
    oppAvatarWrap: {
        width: 38,
        marginRight: 8,
        alignSelf: 'flex-start',
        paddingTop: 18,
    },
    oppAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: 'hidden',
        backgroundColor: COLORS.white
    },
    oppAvatarSpace: {
        width: 38,
    },
    oppContent: {
        flex: 1,
        alignItems: 'flex-start',
    },
    oppNickname: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMedium,
        marginBottom: 4,
    },
    oppBubbleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
    },
    oppBubble: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: 240,
    },
    oppBubbleText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },

    // 내 메시지
    myRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        marginBottom: 4,
        gap: 4,
    },
    myBubble: {
        backgroundColor: COLORS.black,
        borderRadius: 20,
        borderBottomRightRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: 240,
    },
    myBubbleText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.white,
    },

    // 시간 텍스트
    msgTime: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: COLORS.grayMedium,
        marginBottom: 2,
        flexShrink: 0,
    },

    // 이미지 버블
    imageBubble: {
        borderRadius: 8,
        overflow: 'hidden',
        width: 200,
        height: 200,
    },
    messageImage: {
        width: 200,
        height: 200,
    },
    imageGridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    imageOverflowMask: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageOverflowText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.lg,
        color: COLORS.white,
    },

    // 종료된 채팅 안내
    readonlyWrap: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        backgroundColor: COLORS.grayLight || '#F4F5F8',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
    },
    readonlyText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary || '#8C8C97',
        textAlign: 'center',
    },

    // 입력 바
    inputBlurWrap: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 25,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        gap: 8,
        minHeight: 50,
    },
    inputIconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        alignSelf: 'center',
    },
    inputIcon: {
        width: 32,
        height: 32,
    },
    inputWrap: {
        flex: 1,
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        // minHeight: 32,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        minHeight: 20, // 최소 높이
        maxHeight: 100, // 최대 높이 제한
        paddingVertical: Platform.OS === 'ios' ? 4 : 2,
        paddingHorizontal: Platform.OS === 'android' ? 0 : 0,
        textAlignVertical: 'center',
    },
    sendBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        alignSelf: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: COLORS.disabled,
    },
    sendIcon: {
        width: 18,
        height: 18,
        tintColor: COLORS.white,
    },

    // 팝업
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    popupCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.xxxl,
        width: '100%',
        gap: SPACING.xxxl,
    },
    popupBody: {
        gap: SPACING.sm,
    },
    popupTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    popupDesc: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    popupDescBold: {
        fontFamily: FONTS.extraBold,
        color: COLORS.danger,
    },
    popupBtns: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    popupBtn: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupBtnGrayBg: {
        backgroundColor: COLORS.grayEE,
    },
    popupBtnPrimary: {
        backgroundColor: COLORS.primary,
    },
    popupBtnDarkGray: {
        backgroundColor: COLORS.textMedium,
    },
    popupBtnGrayText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    popupBtnWhiteText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },

    // [BUG-2] 매칭 결정 BottomSheet
    decisionSheetBg: {
        backgroundColor: 'transparent',
    },
    decisionSheetWrap: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        gap: SPACING.md,
    },
    decisionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: SPACING.xxxl,
        gap: SPACING.xxxl,
    },
    decisionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    decisionCheckIcon: {
        width: 24,
        height: 24,
    },
    decisionTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    decisionDesc: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    decisionBtns: {
        gap: SPACING.sm,
    },
    decisionBtn: {
        height: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    decisionBtnPrimary: {
        backgroundColor: COLORS.primary,
    },
    decisionBtnDark: {
        backgroundColor: COLORS.textMedium,
    },
    decisionBtnDisabled: {
        opacity: 0.4,
    },
    decisionBtnPrimaryText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },
    decisionBtnDarkText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },
    decisionCloseBtn: {
        height: 52,
        borderRadius: 8,
        backgroundColor: '#CCCCCC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    decisionCloseText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textMedium,
    },
});
