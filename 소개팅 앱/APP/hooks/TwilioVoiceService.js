import { Platform } from "react-native";
import { Voice, Call, AudioDevice, IncomingCallMessage, OutgoingCallMessage } from "voice-react-native-sdk";

class TwilioVoiceSingleton {
    static instance;

    voice = null;
    accessToken = null;

    inviteListeners = new Map();
    callListeners = new Map();

    listeners = new Set();

    state = {
        isInitialized: false,
        isRegistered: false,
        currentCall: null,
        callInvite: null,
        audioDevices: [],
        selectedDevice: null,

        deviceToken: null,
        error: null,
        customParams: null,
    };

    static getInstance() {
        if (!this.instance) this.instance = new TwilioVoiceSingleton();
        return this.instance;
    }

    /* ---------------- 상태 구독 ---------------- */

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach((l) => l(this.state));
    }

    update(partial) {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    /* ---------------- 초기화 ---------------- */

    async init(accessToken) {
        if (this.state.isInitialized) return;

        try {
            this.voice = new Voice();
            this.bindVoiceEvents();

            await this.voice.setIncomingCallContactHandleTemplate("${callerName}");

            if (Platform.OS === "ios") {
                await this.voice.initializePushRegistry();
            }
            const [devices, deviceToken] = await Promise.all([
                this.voice.getAudioDevices(),
                this.voice.getDeviceToken(),
            ]);

            this.update({ audioDevices: devices?.audioDevices, selectedDevice: devices?.selectedDevice, isInitialized: true, isRegistered: true, error: null, deviceToken });

            

            // ✅ 앱 재시작 후 기존 통화/초대 복구
            await this.restorePendingCallsAndInvites();
            await this.register(accessToken);

        } catch (e) {
            this.update({ error: e?.message || e });
        }
    }

    async register(accessToken) {
        this.accessToken = accessToken;
        await this.voice.register(this.accessToken);
    }

    /* ---------------- 앱 재시작 시 복구 ---------------- */

    async restorePendingCallsAndInvites() {
        try {
            const [callInvites, calls] = await Promise.all([
                this.voice.getCallInvites(),
                this.voice.getCalls()
            ]);

            console.log(Platform.OS, '=== 복구 시작 ===');
            console.log(Platform.OS, 'Pending CallInvites:', callInvites?.size || 0);
            console.log(Platform.OS, 'Active Calls:', calls?.size || 0);

            // ✅ 마지막 수신 전화만 복구
            if (callInvites && callInvites.size > 0) {
                const inviteArray = Array.from(callInvites.values());
                const lastInvite = inviteArray[inviteArray.length - 1];

                console.log(Platform.OS, '복구된 CallInvite:', {
                    callSid: lastInvite.getCallSid(),
                    from: lastInvite.getFrom(),
                    to: lastInvite.getTo(),
                });

                this.bindInvite(lastInvite);
                this.update({ callInvite: lastInvite });
            }

            // ✅ 마지막 진행 중인 통화만 복구
            if (calls && calls.size > 0) {
                const callArray = Array.from(calls.values());
                const lastCall = callArray[callArray.length - 1];

                console.log(Platform.OS, '복구된 Call:', {
                    callSid: lastCall.getSid(),
                    state: lastCall.getState(),
                });

                this.bindCall(lastCall);
                this.update({ currentCall: lastCall });
            }

            console.log(Platform.OS, '=== 복구 완료 ===');

        } catch (e) {
            console.log(Platform.OS, '복구 실패:', e);
        }
    }

    /* ---------------- Voice Events ---------------- */

    bindVoiceEvents() {
        this.voice.on("callInvite", (invite) => {
            this.update({ callInvite: invite });
            this.bindInvite(invite);
        });

        this.voice.on("registered", () => {
            this.update({ isRegistered: true });
        });

        this.voice.on("unregistered", () => {
            this.update({ isRegistered: false });
        });

        this.voice.on("audioDevicesUpdated", async () => {
            if(Platform.OS === 'android') {
                const devices = await this.voice.getAudioDevices();
                console.green('audioDevicesUpdated!!!!!', devices?.selectedDevice);
                this.update({ audioDevices: devices?.audioDevices, selectedDevice: devices?.selectedDevice })
            }
        });
        this.voice.on("error", (error) => {
            console.green(Platform.OS + ' error', error );
            this.update({ error });
        });

    }

    /* ---------------- Invite ---------------- */

    async bindInvite(invite) {
        const accepted = async (call) => {
            const currentCall = this.state.currentCall;
            if (currentCall) {
                await this.hangup();
            }

            this.clearInvite(invite);
            this.bindCall(call);
            this.update({ currentCall: call, callInvite: null });

        };

        const cancelled = () => this.clearInvite(invite);
        const rejected = () => this.clearInvite(invite);

        invite.on("accepted", accepted);
        invite.on("cancelled", cancelled);
        invite.on("rejected", rejected);

        this.inviteListeners.set(invite, { accepted, cancelled, rejected });
    }

    clearInvite(invite) {
        const l = this.inviteListeners.get(invite);
        if (!l) return;

        invite.off("accepted", l.accepted);
        invite.off("cancelled", l.cancelled);
        invite.off("rejected", l.rejected);

        this.inviteListeners.delete(invite);
        this.update({ callInvite: null });
    }

    /* ---------------- Call ---------------- */

    async bindCall(call) {

        const disconnected = () => this.clearCall(call);
        const connectFailure = (error) => {
            console.green(Platform.OS + ' connectFailure', error );
            this.clearCall(call);
        };
        const connected = async () => {
            console.log(Platform.OS, 'connected 2222222222');
        };
        const ringing = () => {
            console.log(Platform.OS, 'ringing 11111111111');
        };


        call.on("disconnected", disconnected);
        call.on("connectFailure", connectFailure);
        call.on("connected", connected);
        call.on("ringing", ringing);

        this.callListeners.set(call, { disconnected, connectFailure, connected, ringing });
    }

    clearCall(call) {
        const l = this.callListeners.get(call);
        if (!l) return;

        call.off("disconnected", l.disconnected);
        call.off("connectFailure", l.connectFailure);
        call.off("connected", l.connected);
        call.off("ringing", l.ringing);

        this.callListeners.delete(call);
        this.update({ currentCall: null });
    }

    /* ---------------- Call API ---------------- */

    async makeCall(accessToken, params = {}) {

        await this.register(accessToken);
        const call = await this.voice.connect(this.accessToken, params);
        call._customParameters = params?.params;
        this.bindCall(call);
        this.update({ currentCall: call });

        return call;
    }

    async acceptCall() {
        const currentCall = this.state.currentCall;
        if (currentCall) {
            this.hangup();
        }

        const invite = this.state.callInvite;
        if (!invite) return;

        const call = await invite.accept();

        this.bindCall(call);
        this.update({ currentCall: call });
        this.clearInvite(invite);

        return call;
    }

    async rejectCall() {
        const invite = this.state.callInvite;
        if (!invite) return;
        await invite.reject();
        this.clearInvite(invite);
    }

    async hangup() {
        const call = this.state.currentCall;
        if (!call) return;
        await call.disconnect();
        this.clearCall(call);
    }

    async toggleMute() {
        const call = this.state.currentCall;
        if (!call) return;
        const muted = await call.isMuted();
        await call.mute(!muted);
        return !muted;
    }

    async setAudioDevice(device) {
        if (Platform.OS === 'ios') {
            console.log('setAudioDevice !!!!');
            try {
                await this.voice.showAvRoutePickerView();
            } catch (error) {
                console.log('error', error);
            }

        } else {
            console.log('setAudioDevice !!!!', device);
            await device.select();

            // const devices = await this.voice.getAudioDevices();
            // this.update({ audioDevices: devices?.audioDevices, selectedDevice: devices?.selectedDevice })
        }
    }

    async unregister(accessToken) {
        await this.register(accessToken);

        // 진행 중인 통화 종료
        if (this.state.currentCall) {
            await this.hangup();
        }

        // 대기 중인 초대 거절
        if (this.state.callInvite) {
            await this.rejectCall();
        }

        // Twilio 등록 해제
        if (this.voice && this.accessToken) {
            await this.voice.unregister(this.accessToken);
        }

        // 모든 이벤트 정리
        this.cleanup();

        // ✅ 상태 완전 초기화 (cleanup 이후에 한번만)
        this.state = {
            isInitialized: false,
            isRegistered: false,
            currentCall: null,
            callInvite: null,
            audioDevices: [],
            selectedDevice: null,
            deviceToken: null,
            error: null,
            customParams: null,
        };

        this.notify();
    }

    /* ---------------- 전체 정리 ---------------- */

    cleanup() {
        // Voice 이벤트 제거
        if (this.voice) {
            this.voice.off("callInvite");
            this.voice.off("registered");
            this.voice.off("unregistered");
            this.voice.off("error");
            this.voice.off("audioDevicesUpdated");
        }

        // 모든 Invite 리스너 제거 (update 호출 안하게 직접 제거)
        for (const [invite, l] of this.inviteListeners.entries()) {
            invite.off("accepted", l.accepted);
            invite.off("cancelled", l.cancelled);
            invite.off("rejected", l.rejected);
        }
        this.inviteListeners.clear();

        // 모든 Call 리스너 제거 (update 호출 안하게 직접 제거)
        for (const [call, l] of this.callListeners.entries()) {
            call.off("disconnected", l.disconnected);
            call.off("connectFailure", l.connectFailure);
            call.off("connected", l.connected);
            call.off("ringing", l.ringing);
        }
        this.callListeners.clear();

        // 참조 초기화
        this.voice = null;
        this.accessToken = null;
    }
}

export default TwilioVoiceSingleton.getInstance();
