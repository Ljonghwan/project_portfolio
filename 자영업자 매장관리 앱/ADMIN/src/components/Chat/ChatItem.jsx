import React, { useEffect, useState } from 'react';

import Zoom from 'react-medium-image-zoom';

import UserInfoBox from '@/components/Box/UserInfoBox';

import consts from "@/libs/consts";
import images from "@/libs/images";

import { getProfile, clickImg, hpHypen, numFormat } from "@/libs/utils";

import { useUser, usePopup, usePopupComponent } from '@/store';

import styles from './index.module.css';
import dayjs from 'dayjs';

const IntroProfile = ({ item, user, title }) => {

    const { openPopupComponent } = usePopupComponent();

    const profileFunc = () => {
        openPopupComponent({
            title: '프로필',
            component: <UserInfoBox selected={user} mode={'pop'} />
        })
    }

    return (
        <div className={styles.chat_intro_profile} style={{ borderColor: user?.gender === 1 ? '#4285F4' : '#F55376'}} onClick={profileFunc}>
            <div className='flex' style={{ justifyContent: 'space-between' }}>
                <p className={styles.title}>{title}</p>
                <p className={styles.chat_date}>{dayjs(item?.createAt).format('A hh:mm')}</p>
            </div>

            <div className='flex' style={{ justifyContent: 'space-between' }}>
                <div className={styles.chat_profile} style={{ alignItems: 'center' }}>
                    <img src={getProfile(user?.profile)} alt={consts.imgAlt} />
                    <div className='flex' style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                        <p className={styles.name}>{user?.name} ({user?.nickName})</p>
                    </div>
                </div>
                <img src={images.detail} alt={consts.imgAlt} />
            </div>
        </div>
        
    )
}

export default function Chat({ item, index, me, attach, user, vipUser }) {

    return (
        <div 
            className={`${styles.chat_one} ${me ? styles.chat_one_right : styles.chat_one_left}`} 
            style={{ paddingBottom: 12 }}
        >
            {item?.type === 'system' ? (
                item?.data?.type === 'userInfo' ? (
                    <div className={styles.chat_intro_container}>
                        <IntroProfile item={item} user={item?.data?.userIdx === user?.idx ? user : vipUser} title={item?.message}/>
                        {/* <IntroProfile item={item} user={vipUser} title={'탑비주얼 회원님의 프로필입니다.'}/> */}
                    </div>
                ) : item?.data?.type === 'endPhoto' ? (
                    <div className={styles.chat_text_container} style={{ maxWidth: '100%' }}>
                        <div className={styles.chat_image_box_system}>
                            {item?.data?.photoList?.map((x, i) => {
                                return (
                                    <Zoom key={i} >
                                        <img src={consts.s3Url + x} alt={consts.imgAlt} />
                                    </Zoom>
                                )
                            })}
                        </div>
                    </div>  
                ) : item?.data?.type === 'finalSelectFlirting' ? (
                    <div className={styles.chat_notice_container} style={{ flexDirection: 'column', gap: 20 }}>
                        <p>{item?.message}</p>
                        <p style={{ fontWeight: 700 }}>{item?.data?.text}</p>
                        <p style={{ fontWeight: 700 }}>TOP 플러팅 {numFormat(item?.data?.flirting)}개</p>
                    </div>
                ) : (
                    <div className={styles.chat_notice_container}>
                        <p>{item?.message}</p>
                    </div>
                )
                // {
                //     "text": "사랑해요사랑해요사랑해요사랑해요사랑해요사랑해요사랑해요사랑해요사랑해요사랑해요",
                //     "type": "finalSelectFlirting",
                //     "status": true,
                //     "userIdx": 100006,
                //     "flirting": 100
                // }
            ) : (

                <>
                    {!attach && !me && (
                        <div className={styles.chat_profile}>
                            <img src={getProfile(item?.sender?.profile)} alt={consts.imgAlt}/>
                            <p>{item?.sender?.nickName}</p>
                        </div>
                    )}

                    {item?.type === 'photo' ? (
                        <div className={styles.chat_text_container}>
                            <div className={styles.chat_image_box}>
                                {item?.data?.map((x, i) => {
                                    return (
                                        <Zoom key={i} >
                                            <img src={consts.s3Url + x} alt={consts.imgAlt} />
                                        </Zoom>
                                    )
                                })}
                            </div>
                            <p className={styles.chat_date}>{dayjs(item?.createAt).format('A hh:mm')}</p>
                        </div>   
                    ) : item?.type === 'voice' ? (
                        <div className={styles.chat_text_container}>
                            <div className={styles.chat_image_box}>
                                <audio src={consts.s3Url + item?.data?.file} controls>
                                    브라우저가 오디오를 지원하지 않습니다.
                                </audio>
                            </div>
                            <p className={styles.chat_date}>{dayjs(item?.createAt).format('A hh:mm')}</p>
                        </div>   
                    ) : (
                        <div className={styles.chat_text_container}>
                            <div className={styles.chat_text}>
                                <p>{item?.message}</p>
                                {item?.data?.subMessage && (
                                    <p>{item?.data?.subMessage}</p>
                                )}
                            </div>
                            <div className={styles.chat_date_box} style={{ alignItems: me ? 'flex-end' : 'flex-start' }}>
                                {(!item?.read && me) && <p className={styles.chat_date}>읽지않음</p> }
                                <p className={styles.chat_date}>{dayjs(item?.createAt).format('A hh:mm')}</p>
                            </div>
                        </div>
                    )}
                    
                </>
            )}
            
            
        </div>
    )    
}