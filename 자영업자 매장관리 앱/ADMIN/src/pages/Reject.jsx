import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';

export default function Page() {

	return (
		<div className='null_box' style={{ flexDirection: 'column', height: '100%' }}>
			<h1>접근 권한이 없습니다.</h1>
			<h1>관리자에게 문의해주세요.</h1>
		</div>
	)
}