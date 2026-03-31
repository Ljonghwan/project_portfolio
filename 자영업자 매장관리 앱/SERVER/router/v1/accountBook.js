const express = require('express');
const router = express.Router();

const dayjs = require('dayjs');
const _ = require('lodash');

const models = require('../../models');
const { Op } = require("sequelize");

const { isLogin, checkUser, checkStore } = require('../../service/auth.js');
const { send, sendError, scd, randomNumberCreate, countSelectedDaysFast, getWorkingStaffList } = require('../../service/utils.js');
const { getExpenseList } = require('../../service/getData.js');

router.use(checkUser);
router.use(checkStore);




/**
 * @openapi
 * /v1/accountBook/list:
 *   post:
 *     summary: 장부 총합 가져오기
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "String", "example": "2025-10-27", "description": "시작일(YYYY-MM-DD)" },
 *                "endDate": { "type": "String", "example": "2025-10-27", "description": "종료일(YYYY-MM-DD)" },
 *                "all": { "type": "boolean", "example": true, "description": "전체 매장 검색 유무" }
 *              },
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
 *         description: Returns true
 */
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { startDate, endDate, all=false, sort=1, store, user, nowDt, ip } = req.body;

    if(!startDate || !endDate) {
        sendError(req, res, 'params');
        return;
    }

    const total = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: [all ? 'myAll' : 'my', all ? user?.idx : store?.idx || 0] },
    ]).sum('amount', {
        where: {
            trDt: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        }
    });

    const cashTotal = await models.STORE_CASH_TB.scope([
        'active',
        { method: [all ? 'myAll' : 'my', all ? user?.idx : store?.idx || 0] },
    ]).findOne({
        attributes: [
            [models.sequelize.literal('SUM(CASE WHEN type = 1 THEN amount WHEN type = 2 THEN -amount ELSE 0 END)'), 'amount']
        ],
        where: {
            date: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        },
        raw: true
    });
    

    let expenseList = await getExpenseList({ startDate, endDate: endDate, store });

    let staffDaily = await models.STAFF_DAILY_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        where: {
            sdate: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        }
    });

    let staffList = await models.STAFF_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findAll();

    staffList = await Promise.all(staffList?.map(async (x, i) => {
        x = x.get({ plain: true });
        return {
            ...x,
            work_day_count: countSelectedDaysFast({ 
                startDate: x?.sdate, 
                endDate: x?.edate, 
                selectedDays: x?.work_day,
                searchStart: startDate,
                searchEnd: endDate
            })
        }
    }));

    expenseTotal = 
        (expenseList?.reduce((acc, item) => acc + item?.amount * 1, 0) || 0) + 
        (staffDaily?.reduce((acc, item) => acc + item?.total, 0) || 0) +
        (staffList?.reduce((acc, item) => acc + (item?.pay_type === 1 ? item?.pay_calc * item?.work_day_count : item?.pay), 0) || 0);

    rt.result = {
        total: total + (cashTotal?.amount * 1 || 0),
        expenseTotal: expenseTotal,
        expenseList: expenseList,
        staffList: staffList,
        staffDaily: staffDaily
    };

    send(req, res, rt);

});






/**
 * @openapi
 * /v1/accountBook/chart:
 *   post:
 *     summary: 장부 차트 데이터 가져오기
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "year": { "type": "String", "example": "2025", "description": "검색 년도(YYYY)" },
 *                "all": { "type": "boolean", "example": true, "description": "전체 매장 검색 유무" }
 *              },
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
 *         description: Returns true
 */
router.post('/chart', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { year, all = false, user, store, nowDt, ip } = req.body;


    const startDate = dayjs(year).startOf('year').format('YYYYMMDD');
    const endDate = dayjs(year).endOf('year').format('YYYYMMDD');

    const result = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: [all ? 'myAll' : 'my', all ? user?.idx : store?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: ['trDt', 'amount'],
        where: {
            trDt: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        }
    });

    const cashResult = await models.STORE_CASH_TB.scope([
        'active',
        { method: [all ? 'myAll' : 'my', all ? user?.idx : store?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: [['date', 'trDt'], 'amount', 'type'],
        where: {
            date: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        }
    });

    const chart = Array.from({ length: 12 }, (_, i) => {
        let month = dayjs(startDate).add(i, 'months').format('YYYYMM');
        let value = result?.filter(x => dayjs(x?.trDt+"").format('YYYYMM') == month )?.reduce((acc, item) => acc + item?.amount, 0) || 0;
        let cashValue = cashResult?.filter(x => dayjs(x?.trDt+"").format('YYYYMM') == month )?.reduce((acc, item) => acc + (item?.type === 1 ? item?.amount : -item?.amount), 0) || 0;
        return {
            label: dayjs(month).format('YYYY-MM'),
            value: value + cashValue
        }
    });

    rt.result = chart

    send(req, res, rt);
});

module.exports = router;
