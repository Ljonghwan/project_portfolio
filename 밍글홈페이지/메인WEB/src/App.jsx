import { useEffect, useState, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation, useMatch } from 'react-router-dom';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';

import { AnimatePresence } from 'framer-motion';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from '@/components/Header';
import Loading from "@/components/Loading";

import NotFound from '@/pages/NotFound';

import Home from '@/pages/Home';
import About from '@/pages/About';
import PortPolio from '@/pages/PortPolio';
import PortPolioView from '@/pages/PortPolioView';
import PortPolioViewMobile from '@/pages/PortPolioViewMobile';

import routes from "@/libs/routes";
import consts from "@/libs/consts";

import API from "@/libs/api";

import { useUser, usePopup, useConfig, useData, useSize } from '@/store';

import Popup from '@/store/components/Popup';
import PopupComponent from '@/store/components/PopupComponent';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, useGSAP);

function App() {

	const { token, mbData, mbdataReload, setUser, setCount, login, logout } = useUser();
	const { openPopup } = usePopup();
	const { setPortpolio } = useData();
	const { setConfigOptions } = useConfig();
	const { size, setSize } = useSize();

	const navigate = useNavigate();
	const location = useLocation();

	// useRouteHistory();
	// const previousPath = useRouteHistory();

	const match = useMatch(routes.portpolioView);


	const [initLoad, setInitLoad] = useState(true);
	// const [initLoad, setInitLoad] = useState(false);

	const [share, setShare] = useState({});


	useEffect(() => {
		const handleResize = () => {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		};

		window.addEventListener('resize', handleResize);

		// 초기값 설정
		handleResize();

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {

		dataFunc();
		getConfigData();

	}, [])

	// useEffect(() => {

	// 	console.log('previousPath', previousPath);
	// 	console.log('currentPath', location.pathname);

	// }, [previousPath, location.pathname])

	useEffect(() => {

		if (location.pathname === routes.portpolio || match) return;

		console.log("????????");
		const smoother = ScrollSmoother.get();
		if (smoother) {
			smoother.scrollTo(0, false); // true = 부드럽게
		} else {
			window.scrollTo({ top: 0 });
		}

	}, [location.pathname])

	useEffect(() => {
		if (!initLoad) {
            document.body.style.backgroundColor = '#282828';
        }
	}, [initLoad])


	const getConfigData = async (callback) => {
		// 앱 설정 데이터 가져오는 API
		const { data, error } = await API.post('/config');
		console.log('config', data);
		setConfigOptions(data);
	}

	const dataFunc = async () => {

		const { data, error } = await API.post('/v1/portpolio');
		console.log('portpolio', data);
		setPortpolio(data);
	}

	return (
		<>
			{initLoad ? (
				<Loading load={initLoad} setLoad={setInitLoad} />
			) : (
				<>
					<Header />

					<Routes key={location.pathname} >
						<Route path={routes.home} element={<Home />} />
						<Route path={routes.about} element={<About />} />

						<Route
							path={routes.portpolio}
							element={
								<PortPolio
									share={share?.portpolio}
									setShare={
										(v) => setShare((prev) => {
											return (
												{ ...prev, portpolio: v }
											)
										})
									}
								/>
							}
						/>

						
						<Route
							path={routes.portpolioView}
							element={
								size?.width > 1024 ? (
									<PortPolioView
										share={share?.portpolio}
										setShare={
											(v) => setShare((prev) => {
												return (
													{ ...prev, portpolio: v }
												)
											})
										}
									/>
								) : (
									<PortPolioViewMobile 
										share={share?.portpolio}
										setShare={
											(v) => setShare((prev) => {
												return (
													{ ...prev, portpolio: v }
												)
											})
										}
									/>
								)
							}
						/>

						{/* <Route path={routes.portpolioView} element={<PortPolioView />} /> */}

						<Route path="*" element={<NotFound />} />
					</Routes>
				</>
			)}


			<Popup />
			<PopupComponent />

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
