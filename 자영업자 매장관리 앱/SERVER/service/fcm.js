const _ = require('lodash');

const dayjs = require("dayjs");

const { initFirebase, getAdmin } = require('../config/firebase');
const models = require('../models');
const { Op } = require('sequelize');

// module.exports.sendPush = async ({token, title, body, data = {}}) => {
//     try {
//         await initFirebase();  // 초기화 확인
//         const admin = getAdmin();

//         const message = {
//             token,
//             notification: { title, body },
//             data,
//             android: {
//                 priority: 'high',
//                 notification: { sound: 'default', channelId: 'default' }
//             },
//             apns: {
//                 payload: { aps: { sound: 'default', badge: 1 } }
//             }
//         };

//         const response = await admin.messaging().send(message);
//         return { success: true, response };
//     } catch (err) {
//         console.error('푸시 전송 실패:', err);
//         return { success: false, error: err.message };
//     }
// }


module.exports.sendPush = async (alarms=[]) => {
    // alarms 형식: [{ user_idx, title, body, data }, ...]
    
    try {
        await initFirebase();
        const admin = getAdmin();

        const userIdxList = alarms.map(a => a?.user_idx);

        // 1. 유저 정보 + 안읽은 알람 수 한번에 조회
        const users = await models.USER_TB.scope(['active']).findAll({
            where: {
                idx: { [Op.in]: userIdxList }
            },
            attributes: ['idx', 'deviceToken'],
            raw: true
        });

        // 2. 안읽은 알람 수 집계 (한번에)
        const unreadCounts = await models.USER_ALARM_TB.findAll({
            where: {
                user_idx: { [Op.in]: userIdxList },
                status: 1
            },
            attributes: [
                'user_idx',
                [models.sequelize.fn('COUNT', models.sequelize.col('idx')), 'count']
            ],
            group: ['user_idx'],
            raw: true
        });

        // Map으로 변환 (빠른 조회용)
        const userMap = new Map(users.map(u => [u.idx, u.deviceToken]));
        const unreadMap = new Map(unreadCounts.map(u => [u.user_idx, parseInt(u.count)]));

        // 3. 알람 데이터 bulk insert
        const alarmRecords = alarms.map(alarm => ({
            user_idx: alarm?.user_idx,
            title: alarm?.title,
            comment: alarm?.body,
            data: alarm?.data || {}
        }));

        await models.USER_ALARM_TB.bulkCreate(alarmRecords);

        // 4. 푸시 메시지 생성 (토큰 있는 유저만)
        const formattedMessages = [];

        alarms.forEach(alarm => {
            const token = userMap.get(alarm?.user_idx);
            if (!token) return;

            // 기존 안읽은 수 + 방금 추가한 1개
            const badge = (unreadMap.get(alarm?.user_idx) || 0) + 1;

            formattedMessages.push({
                token,
                notification: {
                    title: alarm?.title,
                    body: alarm?.body
                },
                data: alarm?.data || {},
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge
                        }
                    }
                }
            });
        });

        // 5. 500개씩 나눠서 푸시 전송
        const chunkSize = 500;
        let totalSuccess = 0;
        let totalFailure = 0;

        for (let i = 0; i < formattedMessages.length; i += chunkSize) {
            const chunk = formattedMessages.slice(i, i + chunkSize);
            const response = await admin.messaging().sendEach(chunk);
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;
        }

        return {
            success: true,
            alarmSaved: alarms.length,
            pushSuccess: totalSuccess,
            pushFailure: totalFailure
        };
    } catch (err) {
        console.error('푸시 전송 실패:', err);
        return { success: false, error: err.message };
    }
}


module.exports.sendPushMultiple = async ({tokens, title, body, data = {}}) => {
    try {
        await initFirebase();
        const admin = getAdmin();

        const message = {
            tokens,
            notification: { title, body },
            data,
            android: {
                priority: 'high',
                notification: { sound: 'default', channelId: 'default' }
            },
            apns: {
                payload: { aps: { sound: 'default', badge: 1 } }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
