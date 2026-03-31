const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { Op } = require("sequelize");
const { send, sendError, scd, randomNumberCreate, numFormat, getWorkingStaffList, calculateDailyWage } = require('../../service/utils.js');
const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { getCardSalesStore, getMonthSalesService, getTodaySales } = require('../../service/hyphen.js');
const { getExpenseList } = require('../../service/getData.js');

const dayjs = require('dayjs');

const consts = require('../../service/consts.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/personnel/list:
 *   post:
 *     summary: 인건비 리스트 가져오기
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "String", "example": "2025-10-27", "description": "근무일(YYYY-MM-DD)" },
 *                "all": { "type": "boolean", "example": true, "description": "전체 매장 검색 유무" },
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

    let { startDate, store, user, nowDt, ip } = req.body;

    if(!startDate) {
        sendError(req, res, 'params');
        return;
    }

    let staffDaily = await models.STAFF_DAILY_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        where: {
            sdate: parseInt(startDate?.replace(/-/g, ''))
        }
    });

    let staffList = await models.STAFF_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findAll();

    staffList = await getWorkingStaffList({ date: dayjs(startDate).format('YYYYMMDD'), staffList: staffList });

    rt.result = [...staffList, ...staffDaily];

    send(req, res, rt);
});



module.exports = router;
