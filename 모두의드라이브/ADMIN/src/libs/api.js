import axios from "axios";

import consts from "@/libs/consts";
import { messageApi as message } from "@/libs/messageApi";

import { useUser } from '@/store';

axios.defaults.timeout = 20000; // 타임아웃
axios.defaults.transitional.clarifyTimeoutError = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.headers.common["scd"] = import.meta.env.VITE_SCD;
axios.defaults.maxContentLength = Infinity;
axios.defaults.maxBodyLength = Infinity;

export const post = async (url, sender = {}, options = {}) => {

	const headers = {
		"Content-Type": "application/json",
		"authorization": localStorage.getItem('@token'),
		...options?.headers
	}

	// axios.defaults.headers.common["Content-Type"] = "application/json";
	// axios.defaults.headers.common["authorization"] = await AsyncStorage.getItem('@token');
	console.log('url', url);

	return new Promise((resolve) => {
		let resultData = {
			data:null,
			error:null
		}
		axios.post(url, sender, { headers }).then(({ data }) => {
			resultData.data = data;
			resolve(resultData);
		}).catch((e) => {
			console.log('response error', e?.response?.status, e?.code, e?.response?.data);

			const response = e?.response;

			resultData.error = response?.data;

			if(e?.code === 'ETIMEDOUT') {
				resultData.error = { message: '네트워크 오류가 발생했습니다.'};
			} else if(e?.code === 'ERR_NETWORK') {
				resultData.error = { message: '통신상태를 확인해 주세요.'};
			} else if(e?.code === 'ERR_BAD_REQUEST') {
				resultData.error = { message: '요청이 올바르지 않습니다.'};
			}

			resolve(resultData);

			if (!options?.silent) {
				message.error(response?.data?.message || '잘못된 접근입니다.');
			}

			if (response?.data?.code === 1001) {
				// 로그인 필요
				const logout = useUser.getState().logout;
				logout();
			}
		});
	});
};

export const download = async (sender = {}, options = {}) => {

	const headers = {
		"Content-Type": "application/json",
		"authorization": localStorage.getItem('@token'),
		...options?.headers
	}

	axios.post(import.meta.env.VITE_DOWNLOAD_URL, sender, { headers, responseType: 'blob' })
	.then(res => {
		const blob = new Blob([res.data]);
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = sender?.name || sender?.file; // 저장될 파일명 지정
		document.body.appendChild(a);
		a.click();
		a.remove();
		window.URL.revokeObjectURL(url);
	})
	.catch((e) => {
		console.log('e', e);
		message.error('다운로드에 실패했습니다.');
	});
};

export default {
	post,
	download
}