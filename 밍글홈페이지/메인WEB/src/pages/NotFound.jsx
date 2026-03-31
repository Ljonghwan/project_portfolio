import { useState } from 'react'
import { useNavigate } from 'react-router-dom';

import routes from "@/libs/routes";
import images from "@/libs/images";

export default function Page() {

    const navigate = useNavigate();

	return (
		<div className='null_box' style={{ height: '100%', backgroundColor: '#fff' }}>
			{/* <img src={images.logo} /> */}
			
			<h1 onClick={() => navigate(routes.home)}>페이지를 찾을 수 없습니다.</h1>
			<div className='site_button' onClick={() => navigate(routes.home)} style={{ alignSelf: 'center' }}>
				<p>HOME</p>
				<img src={images.link2} />
			</div>
		</div>
	)
}