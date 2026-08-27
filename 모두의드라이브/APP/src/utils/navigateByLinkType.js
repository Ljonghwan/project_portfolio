import { Linking } from 'react-native';

export function navigateByLinkType(router, linkType, linkTarget) {
    if (!linkType || linkType === 'none') return;
    if (linkType === 'event') {
        if (linkTarget) router.navigate({ pathname: '/news-detail', params: { idx: String(linkTarget) } });
        return;
    }
    if (linkType === 'notice') {
        if (linkTarget) router.navigate({ pathname: '/notice-detail', params: { idx: String(linkTarget) } });
        return;
    }
    if (linkType === 'invite') {
        router.navigate('/invite');
        return;
    }
    if (linkType === 'external') {
        if (linkTarget && /^https?:\/\//i.test(linkTarget)) {
            Linking.openURL(linkTarget).catch(() => {});
        }
    }
}
