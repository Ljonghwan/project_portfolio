const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { Op } = require('sequelize');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { send, sendError, scd, saveImages } = require('../../service/utils.js');

const dayjs = require('dayjs');

router.use(checkAdmin)

/**
 * @openapi
 * /admin/store/list:
 *   post:
 *     summary: 매장 리스트
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all term
 */
router.post('/list', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: {}
    }
    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.matching)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let result = await models.STORE_TB.scope(['active', 'desc', 'typeText', 'user', 'cash_count']).findAll();

    rt.result = result;

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/store/detail:
 *   post:
 *     summary: 매장 상세
 *     tags: [Admin Store]
*     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1, "description": "매장 고유번호" }
 *              }
 *            }
 *          }
 *        }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all users (password excluded)
 */
router.post('/detail', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: {}
    }
    let { idx, user, nowDt, ip } = req.body;

    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    if (!checkAuth(AuthLevel.READ, user?.auth?.matching)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let row = await models.STORE_TB.scope(['active', 'desc']).findOne({
        where: {
            idx: idx
        }
    }).catch(e => { })

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    let staffs = await models.STAFF_TB.scope([
        'active',
        'desc',
        { method: ['my', row?.idx || 0] },
    ]).findAll();

    let events = await models.EVENT_TB.scope([
        'active',
        'desc',
        'senders',
        { method: ['my', row?.idx || 0] },
    ]).findAll({
        limit: 10,
    });


    /** 장부 데이터 조회 */
    const daysInMonth = dayjs().daysInMonth();
    const prevDaysInMonth = dayjs().subtract(1, 'month').daysInMonth();
    const prevPrevDaysInMonth = dayjs().subtract(2, 'month').daysInMonth();

    console.time('chartList');
    const chartList = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: ['my', row?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: ['trDt', 'amount'],
        where: {
            trDt: {
                [Op.between]: [parseInt(dayjs(nowDt).subtract(2, 'month').startOf('month').format('YYYYMMDD')), parseInt(dayjs(nowDt).endOf('month').format('YYYYMMDD'))]
            }
        }
    });
    const cashList = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', row?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: [
            ['date', 'trDt'], 'type', 'amount'
        ],
        where: {
            date: {
                [Op.between]: [parseInt(dayjs(nowDt).subtract(2, 'month').startOf('month').format('YYYYMMDD')), parseInt(dayjs(nowDt).endOf('month').format('YYYYMMDD'))]
            }
        }
    });
    console.timeEnd('chartList');

    const cardMap = {};
    for (const item of chartList || []) {
        if (!item?.trDt) continue;
        cardMap[item.trDt] = (cardMap[item.trDt] || 0) + item.amount;
    }

    const cashMap = {};
    for (const item of cashList || []) {
        if (!item?.trDt) continue;
        const val = item.type === 1 ? item.amount : -item.amount;
        cashMap[item.trDt] = (cashMap[item.trDt] || 0) + val;
    }

    const makeChart = (monthOffset, daysInMonth) => {
        const base = dayjs().subtract(monthOffset, 'month').startOf('month');

        return Array.from({ length: daysInMonth }, (_, i) => {
            const dateKey = base.add(i, 'days').format('YYYYMMDD');
            return {
                label: base.add(i, 'days').format('YYYY-MM-DD'),
                value: (cardMap[dateKey] || 0) + (cashMap[dateKey] || 0),
            };
        });
    };

    // 이번달
    const chart = makeChart(0, daysInMonth);
    // 저번달
    const chart2 = makeChart(1, prevDaysInMonth);
    // 저저번달
    const chart3 = makeChart(2, prevPrevDaysInMonth);

    /** 장부 데이터 조회 끝 */


    /** 현금 비율 구하기 */
    const cardSum = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: ['my', row?.idx || 0] },
    ]).sum('amount');

    const cashSum = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', row?.idx || 0] },
    ]).findOne({
        attributes: [
            [models.sequelize.literal('SUM(CASE WHEN type = 1 THEN amount WHEN type = 2 THEN -amount ELSE 0 END)'), 'amount']
        ],
        raw: true
    });
    /** 현금 비율 구하기 끝 */


    const logs = await models.LOG_TB.scope(['desc']).findAll({
        where: {
            store_idx: row?.idx
        }
    })


    rt.result = {
        store: row,
        staffs: staffs,
        events: events,
        chart: chart,
        chart2: chart2,
        chart3: chart3,
        cardSum: (cardSum * 1) || 0,
        cashSum: (cashSum?.amount * 1) || 0,    
        logs: logs
    };

    send(req, res, rt);
});



module.exports = router;
