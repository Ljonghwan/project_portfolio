import { useEffect, useState } from 'react';
import TwilioVoice from '@/hooks/TwilioVoiceService';

export const useTwilioVoice = () => {
    const [state, setState] = useState(TwilioVoice.state);

    useEffect(() => {
        const unsubscribe = TwilioVoice.subscribe(setState);

        return unsubscribe;
    }, []);

    return {
        ...state,
        makeCall: TwilioVoice.makeCall.bind(TwilioVoice),
        acceptCall: TwilioVoice.acceptCall.bind(TwilioVoice),
        rejectCall: TwilioVoice.rejectCall.bind(TwilioVoice),
        hangup: TwilioVoice.hangup.bind(TwilioVoice),
        toggleMute: TwilioVoice.toggleMute.bind(TwilioVoice),
        unregister: TwilioVoice.unregister.bind(TwilioVoice),
        setAudioDevice: TwilioVoice.setAudioDevice.bind(TwilioVoice),
    };
};
