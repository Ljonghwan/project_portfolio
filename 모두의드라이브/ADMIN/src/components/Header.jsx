import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import Zoom from 'react-medium-image-zoom';
import { Badge, Dropdown, List, Button, Typography, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { useUser, usePopup } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { getProfile, numFormat } from "@/libs/utils";

import API from "@/libs/api";

import LeftNav from "@/components/LeftNav";

const { Text } = Typography;

const menus = [
    {
        title: '회원관리',
        auth: 0,
        routes: [routes.home, routes.memberOwner, routes.memberGuest, routes.memberSuspended, routes.memberWithdrawn],
        leftNav: [
            { route: routes.home, title: '오너 회원', routes: [routes.home, routes.memberOwner] },
            { route: routes.memberGuest, title: '게스트 회원', routes: [routes.memberGuest] },
            { route: routes.memberSuspended, title: '이용정지 회원', routes: [routes.memberSuspended] },
            { route: routes.memberWithdrawn, title: '탈퇴회원', routes: [routes.memberWithdrawn] },
        ]
    },
    {
        title: '포인트/쿠폰',
        auth: 1,
        routes: [routes.pointCharge, routes.pointEarn, routes.pointSpend, routes.coupon],
        leftNav: [
            { route: routes.pointCharge, title: '충전내역', routes: [routes.pointCharge] },
            { route: routes.pointEarn, title: '획득내역', routes: [routes.pointEarn] },
            { route: routes.pointSpend, title: '사용내역', routes: [routes.pointSpend] },
            { route: routes.coupon, title: '쿠폰내역', routes: [routes.coupon] },
        ]
    },
    {
        title: '콘텐츠관리',
        auth: 2,
        routes: [routes.match, routes.inquiry, routes.report, routes.review],
        leftNav: [
            { route: routes.match, title: '게시글 관리', routes: [routes.match] },
            { route: routes.inquiry, title: '문의 관리', routes: [routes.inquiry] },
            { route: routes.report, title: '신고 관리', routes: [routes.report] },
            { route: routes.review, title: '드라이브후기 관리', routes: [routes.review] },
        ]
    },
    {
        title: '운영관리',
        auth: 3,
        routes: [routes.event, routes.notice, routes.push],
        leftNav: [
            { route: routes.event, title: '이벤트', routes: [routes.event] },
            { route: routes.notice, title: '공지사항', routes: [routes.notice] },
            { route: routes.push, title: '알림 발송', routes: [routes.push] },
        ]
    },
    {
        title: '설정',
        auth: 4,
        routes: [routes.faq, routes.faqCategory, routes.setting3, routes.setting4, routes.setting5, routes.setting6, routes.setting7],
        leftNav: [
            { route: routes.faq, title: 'FAQ', routes: [routes.faq] },
            { route: routes.faqCategory, title: 'FAQ분류관리', routes: [routes.faqCategory] },
            { route: routes.setting3, title: '관리자계정관리', routes: [routes.setting3] },
            { route: routes.setting4, title: '약관', routes: [routes.setting4] },
            { route: routes.setting5, title: '관리자비밀번호', routes: [routes.setting5] },
            { route: routes.setting6, title: 'DEV 로그인', routes: [routes.setting6] },
            { route: routes.setting7, title: '리뷰 500P 증정', routes: [routes.setting7] },
        ]
    },






]
export default function Component() {

    const { token, mbData, count, logout } = useUser();
    const { openPopup } = usePopup();

    const navigate = useNavigate();
    const location = useLocation();

    const [toggleBox, setToggleBox] = useState(false);

    const linkFunc = (link) => {
        // dispatch(reset());
        if(link) {
            navigate(link);
        }
    }

    const logoutFunc = () => {
        openPopup({
            message: '로그아웃 하시겠습니까?',
            buttonCencle: '취소',
            onPress: logout
        })
    }

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

    const notifDropdownRender = () => (
        <div style={{ width: 360, background: '#fff', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>알림</Text>
                <Button type="link" size="small" onClick={handleReadAll} disabled={unreadCount === 0}>모두 읽음</Button>
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
                                <div style={{ width: '100%' }}>
                                    <div style={{ fontWeight: item.isRead ? 400 : 600, marginBottom: 4 }}>{item.title}</div>
                                    {item.body && <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{item.body}</div>}
                                    <div style={{ fontSize: 11, color: '#999' }}>{item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : ''}</div>
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </div>
    );

    const handleNotifOpenChange = (open) => {
        setNotifOpen(open);
        if (open) {
            fetchNotifications();
            fetchUnreadCount();
        }
    };



	return (
        <>
            <div className='header'>

                <div className='header_logo_box'>
                    <img src={images.logo} alt={consts.imgAlt} />
                    {/* <p className='header_title'>채팅관리자</p> */}
                </div>
               
                <ul className='header_menu_box'>
                    {menus.map((x, i) => {
                        const active = x?.routes?.includes(location.pathname);
                        
                        return (
                            <li key={i} onClick={() => linkFunc(x?.routes?.[0])} className={active ? "active" : ""}>
                                {/* <img src={images[x.icon]} alt={consts.imgAlt}/> */}
                                {x.icon && <img src={images[x.icon + (!active ? "_off" : "")]} alt={consts.imgAlt}/> }
                                <p>{x.title}</p>
                                {(x.count === 'cavity' && count > 0) && <span>{numFormat(count)}</span>}
                            </li>
                        )
                    })}
                    
                </ul>
                

                <div className='header_auth_box' >
                    {/* <Zoom>
                        <img src={getProfile(mbData?.profile)} alt={consts.imgAlt} className='profile'/>
                    </Zoom> */}

                    {/* [C118-3] 관리자 알림 종 아이콘 */}
                    <Dropdown
                        open={notifOpen}
                        onOpenChange={handleNotifOpenChange}
                        trigger={['click']}
                        placement="bottomRight"
                        dropdownRender={notifDropdownRender}
                    >
                        <Badge count={unreadCount} size="small" offset={[-2, 4]} style={{ cursor: 'pointer' }}>
                            <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#333', marginRight: 12 }} />
                        </Badge>
                    </Dropdown>

                    <p>{mbData?.name}님 안녕하세요</p>
                    <img src={images.logout} alt={consts.imgAlt} onClick={logoutFunc}/>
                </div>
                
            </div>

            <LeftNav menu={menus?.find(x => x.routes.includes(location.pathname))?.leftNav}/>
        </>
	)
}