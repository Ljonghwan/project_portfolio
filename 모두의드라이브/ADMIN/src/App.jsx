import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Space, Breadcrumb, App as AntApp, Badge, Dropdown, List, Empty } from 'antd';
import dayjs from 'dayjs';
import {
	TeamOutlined, DollarOutlined, FileTextOutlined,
	SettingOutlined, BellOutlined, LogoutOutlined,
	UserOutlined, StopOutlined, UserDeleteOutlined,
	CreditCardOutlined, RiseOutlined, FallOutlined, GiftOutlined,
	MessageOutlined, WarningOutlined, StarOutlined, FileSearchOutlined,
	CalendarOutlined, NotificationOutlined, SoundOutlined,
	QuestionCircleOutlined, AppstoreOutlined, LockOutlined, AuditOutlined, ProfileOutlined,
	RollbackOutlined, ShopOutlined, SendOutlined, PictureOutlined,
	DeleteOutlined,
} from '@ant-design/icons';

import Login from '@/pages/Login';
import Reject from '@/pages/Reject';

import MemberList from '@/pages/member/MemberList';
import MemberWithdrawn from '@/pages/member/MemberWithdrawn';

import MatchList from '@/pages/match/MatchList';

import PointCharge from '@/pages/point/PointCharge';
import PointEarnList from '@/pages/point/PointEarnList';
import PointSpendList from '@/pages/point/PointSpendList';
import RefundList from '@/pages/point/RefundList';
import CouponList from '@/pages/point/CouponList';
import CouponIssueList from '@/pages/point/CouponIssueList';

import InquiryList from '@/pages/content/InquiryList';
import ReportList from '@/pages/content/ReportList';
import ReviewList from '@/pages/content/ReviewList';
import MannerEvalList from '@/pages/content/MannerEvalList';

import EventList from '@/pages/operate/EventList';
import PopupList from '@/pages/content/PopupList';
import BannerList from '@/pages/content/BannerList';
import NoticeList from '@/pages/content/NoticeList';
import PushSend from '@/pages/operate/PushSend';

import FaqList from '@/pages/content/FaqList';
import FaqCategoryList from '@/pages/setting/FaqCategoryList';
import Setting3 from '@/pages/setting/Setting3';
import Setting4 from '@/pages/setting/Setting4';
import Setting5 from '@/pages/setting/Setting5';
import Setting6 from '@/pages/setting/Setting6';
import Setting7 from '@/pages/setting/Setting7';
import ResetPage from '@/pages/setting/ResetPage';

import routes from "@/libs/routes";
import API from "@/libs/api";
import { setMessageApi } from "@/libs/messageApi";
import { useUser, useConfig } from '@/store';


const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuGroups = [
	{
		key: 'member', label: '회원관리', icon: <TeamOutlined />, authIdx: 0,
		children: [
			{ key: routes.memberOwner, label: '오너 회원', icon: <UserOutlined /> },
			{ key: routes.memberGuest, label: '게스트 회원', icon: <UserOutlined /> },
			{ key: routes.memberSuspended, label: '이용정지 회원', icon: <StopOutlined /> },
			{ key: routes.memberWithdrawn, label: '탈퇴회원', icon: <UserDeleteOutlined /> },
		]
	},
	{
		key: 'point', label: '포인트/쿠폰', icon: <DollarOutlined />, authIdx: 1,
		children: [
			{ key: routes.pointCharge, label: '충전내역', icon: <CreditCardOutlined /> },
			{ key: routes.pointEarn, label: '획득내역', icon: <RiseOutlined /> },
			{ key: routes.pointSpend, label: '사용내역', icon: <FallOutlined /> },
			{ key: routes.refund, label: '환불내역', icon: <RollbackOutlined /> },
			{ key: routes.coupon, label: '쿠폰관리', icon: <ShopOutlined /> },
			{ key: routes.couponIssue, label: '쿠폰발행내역', icon: <SendOutlined /> },
		]
	},
	{
		key: 'content', label: '콘텐츠관리', icon: <FileTextOutlined />, authIdx: 2,
		children: [
			{ key: routes.match, label: '게시글 관리', icon: <FileSearchOutlined /> },
			{ key: routes.inquiry, label: '문의 관리', icon: <MessageOutlined /> },
			{ key: routes.report, label: '신고 관리', icon: <WarningOutlined /> },
			{ key: routes.review, label: '드라이브후기 관리', icon: <StarOutlined /> },
			{ key: routes.mannerEval, label: '매너 평가 조회', icon: <StarOutlined /> },
		]
	},
	{
		key: 'operate', label: '운영관리', icon: <BellOutlined />, authIdx: 3,
		children: [
			{ key: routes.event, label: '이벤트', icon: <CalendarOutlined /> },
			{ key: routes.popup, label: '메인팝업', icon: <PictureOutlined /> },
			{ key: routes.banner, label: '배너 관리', icon: <PictureOutlined /> },
			{ key: routes.notice, label: '공지사항', icon: <NotificationOutlined /> },
			{ key: routes.push, label: '알림 발송', icon: <SoundOutlined /> },
		]
	},
	{
		key: 'setting', label: '설정', icon: <SettingOutlined />, authIdx: 4,
		children: [
			{ key: routes.faq, label: 'FAQ', icon: <QuestionCircleOutlined /> },
			{ key: routes.faqCategory, label: 'FAQ분류관리', icon: <AppstoreOutlined /> },
			{ key: routes.setting3, label: '관리자계정관리', icon: <AuditOutlined /> },
			{ key: routes.setting4, label: '약관', icon: <ProfileOutlined /> },
			{ key: routes.setting5, label: '관리자비밀번호', icon: <LockOutlined /> },
			{ key: routes.setting6, label: 'DEV 로그인', icon: <SettingOutlined /> },
			{ key: routes.setting7, label: '리뷰 500P 증정', icon: <SettingOutlined /> },
			{ key: routes.reset, label: '데이터 초기화', icon: <DeleteOutlined /> },
		]
	},
];

function AuthRoute({ authIdx, children }) {
	const { mbData } = useUser();
	if (!mbData?.auth?.[authIdx]) return <Reject />;
	return children;
}

function MessageBootstrap() {
	const { message } = AntApp.useApp();
	setMessageApi(message);
	return null;
}

function AdminLayout() {
	const { modal } = AntApp.useApp();
	const { token, mbData, mbdataReload, setUser, login, logout } = useUser();
	const { setConfigOptions } = useConfig();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		getConfigData();
	}, []);

	useEffect(() => {
		if (token) getUser();
	}, [token]);

	useEffect(() => {
		if (mbdataReload) getUser();
	}, [mbdataReload]);

	const getUser = async () => {
		const { data, error } = await API.post('/admin/login/info');
		if (data) {
			setUser({ ...data, auth: Array.from({ length: 5 }, (_, i) => !!((data?.auth || 0) & (1 << i))) });
		}
	};

	const getConfigData = async () => {
		const { data } = await API.post('/config');
		setConfigOptions(data);
	};

	const handleLogout = () => {
		modal.confirm({
			title: '로그아웃',
			content: '로그아웃 하시겠습니까?',
			okText: '확인',
			cancelText: '취소',
			onOk: async () => {
				await API.post('/admin/login/logout');
				logout();
				navigate('/');
			}
		});
	};

	// [C118-3] 관리자 알림 종 아이콘
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [notifOpen, setNotifOpen] = useState(false);

	const fetchUnreadCount = useCallback(async () => {
		if (!token) return;
		const res = await API.post('/admin/notification/unread-count', {}, { silent: true });
		if (res?.data && typeof res.data.count === 'number') {
			setUnreadCount(res.data.count);
		}
	}, [token]);

	const fetchNotifications = useCallback(async () => {
		if (!token) return;
		const res = await API.post('/admin/notification/list', {}, { silent: true });
		if (Array.isArray(res?.data)) {
			setNotifications(res.data);
		}
	}, [token]);

	useEffect(() => {
		if (!token) return;
		fetchUnreadCount();
		const id = setInterval(fetchUnreadCount, 60 * 1000);
		return () => clearInterval(id);
	}, [token, fetchUnreadCount]);

	// [C120-1] 라우트 변경 시 unread 뱃지 즉시 갱신 (백그라운드 polling 외 추가)
	useEffect(() => {
		if (!token) return;
		fetchUnreadCount();
	}, [location.pathname, token, fetchUnreadCount]);

	const handleNotifClick = async (item) => {
		await API.post('/admin/notification/read', { notificationIdx: item.idx }, { silent: true });
		setNotifications(prev => prev.map(n => n.idx === item.idx ? { ...n, isRead: true } : n));
		setUnreadCount(c => Math.max(0, c - (item.isRead ? 0 : 1)));
		setNotifOpen(false);
		if (item.linkUrl) navigate(item.linkUrl);
	};

	const handleReadAll = async () => {
		await API.post('/admin/notification/read-all', {}, { silent: true });
		setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
		setUnreadCount(0);
	};

	// [C120-2] 단건 삭제
	const handleDeleteNotif = async (e, item) => {
		e.stopPropagation();
		const { data, error } = await API.post('/admin/notification/delete', { notificationIdx: item.idx }, { silent: true });
		if (error) return;
		setNotifications(prev => prev.filter(n => n.idx !== item.idx));
		if (!item.isRead) setUnreadCount(c => Math.max(0, c - 1));
	};

	// [C120-2] 전체 삭제
	const handleDeleteAll = () => {
		if (notifications.length === 0) return;
		modal.confirm({
			title: '전체 삭제',
			content: '본인 알림을 모두 삭제하시겠습니까?',
			okText: '삭제',
			okButtonProps: { danger: true },
			cancelText: '취소',
			onOk: async () => {
				const { error } = await API.post('/admin/notification/delete-all', {}, { silent: true });
				if (error) return;
				setNotifications([]);
				setUnreadCount(0);
			}
		});
	};

	const handleNotifOpenChange = (open) => {
		setNotifOpen(open);
		if (open) {
			fetchNotifications();
			fetchUnreadCount();
		}
	};

	const notifDropdownRender = () => (
		<div style={{ width: 360, background: '#fff', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}>
			<div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Text strong>알림</Text>
				<Space size={4}>
					<Button type="link" size="small" onClick={handleReadAll} disabled={unreadCount === 0}>모두 읽음</Button>
					<Button type="link" size="small" danger onClick={handleDeleteAll} disabled={notifications.length === 0}>전체 삭제</Button>
				</Space>
			</div>
			<div style={{ maxHeight: 420, overflowY: 'auto' }}>
				{notifications.length === 0 ? (
					<div style={{ padding: 24 }}><Empty description="알림이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
				) : (
					<List
						dataSource={notifications.slice(0, 10)}
						renderItem={(item) => (
							<List.Item
								onClick={() => handleNotifClick(item)}
								style={{
									padding: '10px 16px',
									cursor: 'pointer',
									background: item.isRead ? '#fff' : '#e6f4ff',
								}}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontWeight: item.isRead ? 400 : 600, marginBottom: 4 }}>{item.title}</div>
									{item.body && <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{item.body}</div>}
									<div style={{ fontSize: 11, color: '#999' }}>{item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : ''}</div>
								</div>
								<DeleteOutlined
									onClick={(e) => handleDeleteNotif(e, item)}
									style={{ color: '#999', fontSize: 14, marginLeft: 12, padding: 4, cursor: 'pointer' }}
								/>
							</List.Item>
						)}
					/>
				)}
			</div>
		</div>
	);

	const visibleMenus = menuGroups
		.filter(g => mbData?.auth?.[g.authIdx])
		.map(g => ({
			key: g.key,
			icon: g.icon,
			label: g.label,
			children: g.children,
		}));

	const resolvedPath = location.pathname === '/' ? routes.memberOwner : location.pathname;
	const selectedKeys = [resolvedPath];
	const openKeys = menuGroups
		.filter(g => g.children.some(c => selectedKeys.includes(c.key)))
		.map(g => g.key);

	const handleMenuClick = ({ key }) => {
		navigate(key);
	};

	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Sider
				width={220}
				theme="dark"
				style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'auto' }}
			>
				<div style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
					<div style={{ fontSize: 24, color: '#6c00fe', fontWeight: 900 }}>DRIVE</div>
					<div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 4 }}>모두의 드라이브</div>
					<div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>관리자</div>
				</div>
				<Menu
					theme="dark"
					mode="inline"
					selectedKeys={selectedKeys}
					defaultOpenKeys={openKeys}
					items={visibleMenus}
					onClick={handleMenuClick}
				/>
			</Sider>
			<Layout style={{ marginLeft: 220 }}>
				<Header style={{
					background: '#fff', padding: '0 24px', display: 'flex',
					alignItems: 'center', justifyContent: 'space-between',
					boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 99,
				}}>
					<Breadcrumb items={(() => {
						for (const group of menuGroups) {
							const child = group.children.find(c => resolvedPath === c.key || resolvedPath.startsWith(c.key + "/"));
							if (child) {
								return [
									{ title: group.label },
									{ title: child.label },
								];
							}
						}
						return [];
					})()} />
					<Space size="middle">
						{/* [C118-3] 관리자 알림 종 아이콘 */}
						<Dropdown
							open={notifOpen}
							onOpenChange={handleNotifOpenChange}
							trigger={['click']}
							placement="bottomRight"
							dropdownRender={notifDropdownRender}
						>
							<Badge count={unreadCount} size="small" offset={[-2, 4]} style={{ cursor: 'pointer' }}>
								<BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#333' }} />
							</Badge>
						</Dropdown>
						<Text>{mbData?.name || '관리자'}님 안녕하세요</Text>
						<Button icon={<LogoutOutlined />} onClick={handleLogout}>로그아웃</Button>
					</Space>
				</Header>
				<Content style={{ margin: 24, minHeight: 360 }}>
					<Routes>
						{/* 회원관리 */}
						<Route path={routes.home} element={<AuthRoute authIdx={0}><MemberList defaultRole="owner" /></AuthRoute>} />
						<Route path={routes.memberOwner} element={<AuthRoute authIdx={0}><MemberList defaultRole="owner" /></AuthRoute>} />
						<Route path={routes.memberGuest} element={<AuthRoute authIdx={0}><MemberList defaultRole="guest" /></AuthRoute>} />
						<Route path={routes.memberSuspended} element={<AuthRoute authIdx={0}><MemberList defaultStatus="suspended" /></AuthRoute>} />
						<Route path={routes.memberWithdrawn} element={<AuthRoute authIdx={0}><MemberWithdrawn /></AuthRoute>} />

						{/* 포인트/쿠폰 */}
						<Route path={routes.pointCharge} element={<AuthRoute authIdx={1}><PointCharge /></AuthRoute>} />
						<Route path={routes.pointEarn} element={<AuthRoute authIdx={1}><PointEarnList /></AuthRoute>} />
						<Route path={routes.pointSpend} element={<AuthRoute authIdx={1}><PointSpendList /></AuthRoute>} />
						<Route path={routes.refund} element={<AuthRoute authIdx={1}><RefundList /></AuthRoute>} />
						<Route path={routes.coupon} element={<AuthRoute authIdx={1}><CouponList /></AuthRoute>} />
						<Route path={routes.couponIssue} element={<AuthRoute authIdx={1}><CouponIssueList /></AuthRoute>} />

						{/* 콘텐츠관리 */}
						<Route path={routes.match} element={<AuthRoute authIdx={2}><MatchList /></AuthRoute>} />
						<Route path={routes.inquiry} element={<AuthRoute authIdx={2}><InquiryList /></AuthRoute>} />
						<Route path={routes.report} element={<AuthRoute authIdx={2}><ReportList /></AuthRoute>} />
						<Route path={routes.review} element={<AuthRoute authIdx={2}><ReviewList /></AuthRoute>} />
						<Route path={routes.mannerEval} element={<AuthRoute authIdx={2}><MannerEvalList /></AuthRoute>} />

						{/* 운영관리 */}
						<Route path={routes.event} element={<AuthRoute authIdx={3}><EventList /></AuthRoute>} />
						<Route path={routes.popup} element={<AuthRoute authIdx={3}><PopupList /></AuthRoute>} />
						<Route path={routes.banner} element={<AuthRoute authIdx={3}><BannerList /></AuthRoute>} />
						<Route path={routes.notice} element={<AuthRoute authIdx={3}><NoticeList /></AuthRoute>} />
						<Route path={routes.push} element={<AuthRoute authIdx={3}><PushSend /></AuthRoute>} />

						{/* 설정 */}
						<Route path={routes.faq} element={<AuthRoute authIdx={4}><FaqList /></AuthRoute>} />
						<Route path={routes.faqCategory} element={<AuthRoute authIdx={4}><FaqCategoryList /></AuthRoute>} />
						<Route path={routes.setting3} element={<AuthRoute authIdx={4}><Setting3 /></AuthRoute>} />
						<Route path={routes.setting4} element={<AuthRoute authIdx={4}><Setting4 /></AuthRoute>} />
						<Route path={routes.setting5} element={<AuthRoute authIdx={4}><Setting5 /></AuthRoute>} />
						<Route path={routes.setting6} element={<AuthRoute authIdx={4}><Setting6 /></AuthRoute>} />
						<Route path={routes.setting7} element={<AuthRoute authIdx={4}><Setting7 /></AuthRoute>} />
						<Route path={routes.reset} element={<AuthRoute authIdx={4}><ResetPage /></AuthRoute>} />

						<Route path="*" element={<Reject />} />
					</Routes>
				</Content>
			</Layout>
		</Layout>
	);
}

function App() {
	const { token } = useUser();

	return (
		<AntApp>
			<MessageBootstrap />
			{token ? <AdminLayout /> : (
				<Routes>
					<Route path="*" element={<Login />} />
				</Routes>
			)}
		</AntApp>
	);
}

export default App
