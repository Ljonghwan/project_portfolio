import React, { useEffect, useState, useRef } from 'react';

import _ from "lodash";
import dayjs from "dayjs";
import { GroupedVirtuoso } from 'react-virtuoso';

import ChatItem from "@/components/Chat/ChatItem";
import UserInfoBox from '@/components/Box/UserInfoBox';

import TopVisual from "@/components/Badge/TopVisual";

import { useUser, usePopup, usePopupComponent } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen } from "@/libs/utils";

import styles from './index.module.css';

export default function Chat({ item, admin=false }) {

    const { token, mbData, logout } = useUser();
    const { openPopupComponent } = usePopupComponent();

    const fileInput = useRef(null);
    const textAreaRef = useRef(null);

    const [chatMsg, setchatMsg] = useState("");

    useEffect(() => {

    }, []);

    const profileFunc = () => {
        if(admin) return;
        
        openPopupComponent({
            title: '프로필',
            component: <UserInfoBox selected={item} mode={'pop'} />
        })
    }

    return (
        <div className={'chat_user_info'}>
             <div className='user_info_profile' onClick={profileFunc}>
                <div className='user_info_profile_left'>
                    <img src={getProfile(item?.profile)} alt={consts.imgAlt}/>
                    <div className='user_info_profile_left_box'>
                        <div className='flex' style={{ gap: 8 }}>
                            {!admin && <span className={`gender ${item?.gender === 1 ? 'man' : 'woman'}`} />}
                            <p className='title'>{item?.name} ({item?.nickName})</p>
                            {item?.level === 2 && (
                                <TopVisual />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )    
}