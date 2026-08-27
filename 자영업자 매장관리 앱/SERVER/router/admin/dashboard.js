const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { Op, fn, col, literal } = require('sequelize');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { send, sendError, scd, saveImages } = require('../../service/utils.js');

const dayjs = require('dayjs');

router.use(checkAdmin)

/**
 * @openapi
 * /admin/dashboard:
 *   post:
 *     summary: 대시보드
 *     tags: [Admin Dashboard]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all users (password excluded)
 */
router.post('/', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: {}
    }
    let { user, nowDt, ip } = req.body;

    const start = dayjs().tz('Asia/Seoul').startOf('day').utc().toDate();
    const end = dayjs().tz('Asia/Seoul').endOf('day').utc().toDate();

    const prevStart = dayjs().tz('Asia/Seoul').subtract(1, 'day').startOf('day').utc().toDate();
    const prevEnd = dayjs().tz('Asia/Seoul').subtract(1, 'day').endOf('day').utc().toDate();

    let userCount = await models.USER_TB.scope(['active']).count();
    let userTodayCount = await models.USER_TB.scope(['active']).count({
        where: {
            createdAt: {
                [Op.between]: [start, end]
            }
        }
    });
    let storeCount = await models.STORE_TB.scope(['active']).count();
    let storeCardSalesMemberCount = await models.STORE_TB.scope(['active']).count({
        where: {
            cardsales_id: {
                [Op.ne]: null
            },
            cardsales_pw: {
                [Op.ne]: null
            },
            cardsales_grp_id: {
                [Op.ne]: null
            }
        }
    });


    let boardCount = await models.BOARD_TB.scope(['active']).count({
        where: {
            createdAt: {
                [Op.between]: [start, end]
            }
        }
    });
    let replyCount = await models.REPLY_TB.scope(['active']).count({
        where: {
            createdAt: {
                [Op.between]: [start, end]
            }
        }
    });
    let boardPrevDayCount = await models.BOARD_TB.scope(['active']).count({
        where: {
            createdAt: {
                [Op.between]: [prevStart, prevEnd]
            }
        }
    });
    let replyPrevDayCount = await models.REPLY_TB.scope(['active']).count({
        where: {
            createdAt: {
                [Op.between]: [prevStart, prevEnd]
            }
        }
    });


    let ocrCount = await models.LOG_TB.count({
        where: {
            type: 'OCR',
            status: 1,
            createdAt: {
                [Op.between]: [start, end]
            }
        }
    });
    let ocrPrevDayCount = await models.LOG_TB.count({
        where: {
            type: 'OCR',
            status: 1,
            createdAt: {
                [Op.between]: [prevStart, prevEnd]
            }
        }
    });

    let reportCount = await models.REPORT_TB.count({
        where: {
            status: 1
        }
    });

    // 6시간 전 시간 계산
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);


    let trackings = await models.APP_TRACKING_TB.findAll({
        attributes: [
            [fn('date_trunc', 'minute', col('createdAt')), 'time'],
            [fn('COUNT', col('user_idx')), 'count']
        ],
        where: {
            createdAt: { [Op.gte]: sixHoursAgo }
        },
        group: [literal('time')],
        order: [[literal('time'), 'ASC']],
        raw: true
    });
    let boardTrackings = await models.BOARD_TB.findAll({
        attributes: [
            [fn('date_trunc', 'minute', col('createdAt')), 'time'],
            [fn('COUNT', col('idx')), 'count']
        ],
        where: {
            createdAt: { [Op.gte]: sixHoursAgo }
        },
        group: [literal('time')],
        order: [[literal('time'), 'ASC']],
        raw: true
    });
    let replyTrackings = await models.REPLY_TB.findAll({
        attributes: [
            [fn('date_trunc', 'minute', col('createdAt')), 'time'],
            [fn('COUNT', col('idx')), 'count']
        ],
        where: {
            createdAt: { [Op.gte]: sixHoursAgo }
        },
        group: [literal('time')],
        order: [[literal('time'), 'ASC']],
        raw: true
    });
    



    const tenMinutesAgo = dayjs().tz('Asia/Seoul').subtract(10, 'minute').utc().toDate();
    const oneDayAgo = dayjs(tenMinutesAgo).subtract(1, 'days').toDate();
    const oneDayMaxAgo = dayjs(tenMinutesAgo).add(10, 'minute').toDate();


    const [liveTrackingCount, prevLiveTrackingCount] = await Promise.all([
        // 오늘
        models.APP_TRACKING_TB.count({
            where: {
                createdAt: {
                    [Op.gte]: tenMinutesAgo,
                }
            },
            distinct: true,
            col: 'user_idx'
        }),
        // 어제 동시간대
        models.APP_TRACKING_TB.count({
            where: {
                createdAt: {
                    [Op.between]: [oneDayAgo, oneDayMaxAgo]
                }
            },
            distinct: true,
            col: 'user_idx'
        })
    ]);

    const [liveTrackingBoardCount, prevLiveTrackingBoardCount] = await Promise.all([
        // 오늘
        models.BOARD_TB.count({
            where: {
                createdAt: {
                    [Op.gte]: tenMinutesAgo,
                }
            },
            distinct: true,
            col: 'idx'
        }),
        // 어제 동시간대
        models.BOARD_TB.count({
            where: {
                createdAt: {
                    [Op.between]: [oneDayAgo, oneDayMaxAgo]
                }
            },
            distinct: true,
            col: 'idx'
        })
    ]);

    const [liveTrackingReplyCount, prevLiveTrackingReplyCount] = await Promise.all([
        // 오늘
        models.REPLY_TB.count({
            where: {
                createdAt: {
                    [Op.gte]: tenMinutesAgo,
                }
            },
            distinct: true,
            col: 'idx'
        }),
        // 어제 동시간대
        models.REPLY_TB.count({
            where: {
                createdAt: {
                    [Op.between]: [oneDayAgo, oneDayMaxAgo]
                }
            },
            distinct: true,
            col: 'idx'
        })
    ]);
    



    let eventCount = await models.EVENT_TB.count();
    let newsCount = await models.NEWS_TB.count();
    let noticeCount = await models.NOTICE_TB.count();

    const calcRate = (current, prev) => {
        if (prev === 0) {
            if (current === 0) return 0;
            return 100; // 또는 null, 또는 Infinity 의미로 처리
        }
        return Math.round(((current - prev) / prev) * 100);
    };

    rt.result = {
        userCount: userCount,
        userTodayCount: userTodayCount,
        storeCount: storeCount,
        storeCardSalesMemberCount: storeCardSalesMemberCount,

        boardCount: boardCount,
        replyCount: replyCount,

        boardPrevDayCount: boardPrevDayCount,
        replyPrevDayCount: replyPrevDayCount,

        ocrCount: ocrCount,
        ocrPrevDayCount: ocrPrevDayCount,

        reportCount: reportCount,

        trackings: trackings,
        boardTrackings: boardTrackings,
        replyTrackings: replyTrackings,

        liveTrackingCount: liveTrackingCount,
        prevLiveTrackingCount: prevLiveTrackingCount,

        liveTrackingBoardCount: liveTrackingBoardCount,
        prevLiveTrackingBoardCount: prevLiveTrackingBoardCount,
        liveTrackingReplyCount: liveTrackingReplyCount,
        prevLiveTrackingReplyCount: prevLiveTrackingReplyCount,

        eventCount: eventCount,
        newsCount: newsCount,
        noticeCount: noticeCount,
    };

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/dashboard/dau:
 *   post:
 *     summary: DAU 통계
 *     tags: [Admin Dashboard]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns DAU statistics
 */
router.post('/dau', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: []
    }
    let { type=1, user, nowDt, ip } = req.body;

    if(type === 1) {    
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await models.APP_TRACKING_TB.findAll({
            attributes: [
                [fn('DATE', col('createdAt')), 'date'],
                [fn('COUNT', fn('DISTINCT', col('user_idx'))), 'count']  // 유니크 유저
            ],
            where: {
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            group: [literal('date')],
            order: [[literal('date'), 'ASC']],
            raw: true
        });

        rt.result = result;
        
    } else if(type === 2) {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
        const result = await models.APP_TRACKING_TB.findAll({
            attributes: [
                [fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'month'],
                [fn('COUNT', fn('DISTINCT', col('user_idx'))), 'count']
            ],
            where: {
                createdAt: { [Op.gte]: twelveMonthsAgo }
            },
            group: [literal('month')],
            order: [[literal('month'), 'ASC']],
            raw: true
        });

        rt.result = result;
    } 

    send(req, res, rt);
});




module.exports = router;
