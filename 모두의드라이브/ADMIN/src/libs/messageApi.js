// antd v6 message context-aware instance.
// Components inside <App> wrapper bootstrap this via setMessageApi(),
// non-component modules (api.js 등) use messageApi.* to avoid static-context warning.

let _api = null;

export const setMessageApi = (api) => {
	_api = api;
};

export const messageApi = {
	success: (...args) => _api?.success(...args),
	error: (...args) => _api?.error(...args),
	warning: (...args) => _api?.warning(...args),
	info: (...args) => _api?.info(...args),
	loading: (...args) => _api?.loading(...args),
	open: (...args) => _api?.open(...args),
};
