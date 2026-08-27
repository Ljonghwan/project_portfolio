import { useEffect, useState, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation, useMatch } from 'react-router-dom';

import { AnimatePresence } from 'framer-motion';
import axios from "axios";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Ssgoi } from "@ssgoi/react";
import { fade, film, blind } from "@ssgoi/react/view-transitions";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loading from "@/components/Loading";

import NotFound from '@/pages/NotFound';

import Home from '@/pages/Home';
import About from '@/pages/About';
import Counseling from '@/pages/Counseling';

import routes from "@/libs/routes";
import consts from "@/libs/consts";

import API from "@/libs/api";

import { useUser, usePopup, useConfig, useData, useSize } from '@/store';

import Popup from '@/store/components/Popup';
import PopupComponent from '@/store/components/PopupComponent';

const config = {
  defaultTransition: fade({
    inSpring: { //페이지에 들어갈 때 적용됩니다.
      stiffness: 150,  // 느린 트랜지션
      damping: 25      // 부드러운 감속
    },
    outSpring: { //페이지를 떠날 때 적용됩니다.
      stiffness: 150,  // 느린 트랜지션
      damping: 25      // 부드러운 감속
    }
  })
};

function App() {

	const { token, mbData, mbdataReload, setUser, setCount, login, logout } = useUser();
	const { openPopup } = usePopup();
	const { setPortpolio } = useData();
	const { setConfigOptions } = useConfig();
	const { size, setSize } = useSize();

	const navigate = useNavigate();
	const location = useLocation();

	const [initLoad, setInitLoad] = useState(false);

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

		getConfigData();
		testFunc();
	}, [])


	useEffect(() => {

		window.scrollTo({ top: 0 });

	}, [location.pathname])



	const getConfigData = async (callback) => {
		// 앱 설정 데이터 가져오는 API

		const sender = {
			site: 'sub'
		}

		const { data, error } = await API.post('/config', sender);
		console.log('config', data);
		setConfigOptions(data);
	}


	const testFunc = async () => {


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
						<Route path={routes.counseling} element={<Counseling />} />

						<Route path="*" element={<NotFound />} />
					</Routes>

					<Footer />
				</>
			)}

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
