import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { ToastContainer, toast } from 'react-toastify';
import '@toast-ui/editor/dist/toastui-editor.css';

import Header from '@/components/Header';

import Test from '@/pages/Test';
import NotFound from '@/pages/NotFound';
import Reject from '@/pages/Reject';
import Default from '@/pages/Default';

import Login from '@/pages/Login';

import DashBoard from '@/pages/DashBoard';

import Users from '@/pages/users/Users';

import Stores from '@/pages/stores/Stores';


import Content1 from '@/pages/content/Content1';
import Content3 from '@/pages/content/Content3';

import News1 from '@/pages/news/News1';

import Event1 from '@/pages/event/Event1';

import Service1 from '@/pages/service/Service1';
import Service2 from '@/pages/service/Service2';
import Service3 from '@/pages/service/Service3';


import Cs1 from '@/pages/cs/Cs1';
import Cs2 from '@/pages/cs/Cs2';
import Cs3 from '@/pages/cs/Cs3';
import Cs4 from '@/pages/cs/Cs4';


import Popup from '@/store/components/Popup';
import PopupComponent from '@/store/components/PopupComponent';

import routes from "@/libs/routes";
import consts from "@/libs/consts";

import API from "@/libs/api";

import { useUser, usePopup, useConfig, useMenu } from '@/store';





function App() {

	const { token, mbData, mbdataReload, setUser, setCount, login, logout } = useUser();
	const { openPopup } = usePopup();
	const { setConfigOptions } = useConfig();
	const { resetMenu } = useMenu();

	const navigate = useNavigate();
	const location = useLocation();


	useEffect(() => {
		getConfigData();
		// resetMenu();
	}, []);

	useEffect(() => {

		if (token) {
			getUser();
		}

	}, [token, mbdataReload, location.pathname])

	useEffect(() => {
		if (mbdataReload) {
			// getUser();
		}
	}, [mbdataReload])


	const getUser = async () => {
		const { data, error } = await API.post('/admin/login/info');

		setUser(data);
	}



	const getConfigData = async (callback) => {
		// 앱 설정 데이터 가져오는 API
		const { data, error } = await API.post('/config');

		setConfigOptions(data?.config || {});
	}
	return (
		<>

			{/* {token ? ( */}
			{token ? (
				<>
					<Header />

					<div className='container'>
						<Routes>
							<Route path={routes.dashboad} element={<DashBoard />} />
							<Route path={routes.users} element={<Users />} />
							<Route path={routes.stores} element={<Stores />} />
							
							<Route path={routes.contents} element={
								mbData?.auth?.contents_1 > 0 ? <Content1 /> : <Reject />
							} />
							<Route path={routes.contents2} element={<NotFound />} />
							<Route path={routes.contents3} element={
								mbData?.auth?.contents_3 > 0 ? <Content3 /> : <Reject />
							} />


							<Route path={routes.news} element={
								mbData?.auth?.news > 0 ? <News1 /> : <Reject />
							} />

							<Route path={routes.event} element={
								mbData?.auth?.event > 0 ? <Event1 /> : <Reject />
							} />

							


							<Route path={routes.event} element={<NotFound />} />


							<Route path={routes.cs} element={
								mbData?.auth?.cs_1 > 0 ? <Cs1 /> : <Reject />
							} />
							<Route path={routes.cs2} element={
								mbData?.auth?.cs_2 > 0 ? <Cs2 /> : <Reject />
							} />
							<Route path={routes.cs3} element={
								mbData?.auth?.cs_3 > 0 ? <Cs3 /> : <Reject />
							} />
							<Route path={routes.cs4} element={
								mbData?.auth?.cs_4 > 0 ? <Cs4 /> : <Reject />
							} />
							

							<Route path={routes.service} element={
								mbData?.auth?.service_1 > 0 ? <Service1 /> : <Reject />
							} />
							<Route path={routes.service2} element={
								mbData?.auth?.service_2 > 0 ? <Service2 /> : <Reject />
							} />
							<Route path={routes.service3} element={
								mbData?.auth?.service_3 > 0 ? <Service3 /> : <Reject />
							} />

							<Route path={routes.test} element={<Test />} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</div>

				</>
			) : (
				<>
					<Routes>
						<Route path="*" element={<Login />} />
					</Routes>
				</>
			)}

			<PopupComponent />
			<Popup />

			<ToastContainer
				position="bottom-center"
				autoClose={2000}
				hideProgressBar={false}
				newestOnTop
				closeOnClick
				rtl={false}
				draggable
				theme="colored"
			/>
		</>
	)
}

export default App
