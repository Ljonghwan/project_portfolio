const express = require('express');
const router = express.Router();

const dayjs = require('dayjs');

const models = require('../../models');
const { Op } = require("sequelize");

const { isLogin, checkUser, checkStore } = require('../../service/auth.js');
const { send, sendError, scd, randomNumberCreate } = require('../../service/utils.js');

router.use(checkUser);
router.use(checkStore);

/**
 * 매장 지출 관련해서 SELECT 할때 조건
 * 1. 날짜 범위안에 포함되거나 ( OR )
 * 2. 검색마지막날짜 이전에 등로된 반복 지출 이거나
 */



/**
 * @openapi
 * /v1/sales/list:
 *   post:
 *     summary: 매출 리스트 가져오기
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "String", "example": "2025-10-27", "description": "시작일(YYYY-MM-DD)" },
 *                "endDate": { "type": "String", "example": "2025-10-27", "description": "종료일(YYYY-MM-DD)" },
 *                "all": { "type": "boolean", "example": true, "description": "전체 매장 검색 유무" },
 *                "sort": { "type": "number", "example": 1, "description": "정렬 (1=최근순, 2=과거순, 3=금액순)" }
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
    };

    let { startDate, endDate, all = false, sort = 1, store, user, nowDt, ip } = req.body;

    if (!startDate || !endDate) {
        sendError(req, res, 'params');
        return;
    }

    const startDt = parseInt(startDate.replace(/-/g, ''));
    const endDt = parseInt(endDate.replace(/-/g, ''));
    const targetIdx = all ? user?.idx : store?.idx || 0;
    const scopeMethod = all ? 'myAll' : 'my';

    try {
        // 1. 병렬 쿼리 실행 + GROUP BY로 집계
        const [cardResult, cashResult] = await Promise.all([
            // 카드매출: 날짜별 집계
            models.STORE_CARD_SALES_TB.scope(['active', { method: [scopeMethod, targetIdx] }]).findAll({
                raw: true,
                attributes: [
                    'trDt',
                    [models.sequelize.fn('SUM', models.sequelize.col('amount')), 'total'],
                    [models.sequelize.fn('COUNT', models.sequelize.col('*')), 'count']
                ],
                where: {
                    trDt: { [Op.between]: [startDt, endDt] }
                },
                group: ['trDt']
            }),

            // 현금거래: 날짜별 집계
            models.STORE_CASH_TB.scope(['active', { method: [scopeMethod, targetIdx] }]).findAll({
                raw: true,
                attributes: [
                    ['date', 'trDt'],
                    [models.sequelize.literal('SUM(CASE WHEN type = 1 THEN amount ELSE -amount END)'), 'total'],
                    [models.sequelize.fn('COUNT', models.sequelize.col('*')), 'count']
                ],
                where: {
                    date: { [Op.between]: [startDt, endDt] }
                },
                group: ['date']
            })
        ]);

        // 2. 결과를 Map으로 변환 (O(1) 조회)
        const cardMap = new Map(cardResult.map(x => [String(x.trDt), x]));
        const cashMap = new Map(cashResult.map(x => [String(x.trDt), x]));

        // 3. 날짜 리스트 생성
        const startDay = dayjs(startDate);
        const diff = dayjs(endDate).diff(startDay, 'day') + 1;

        let list = Array.from({ length: diff }, (_, i) => {
            const dateStr = startDay.add(i, 'day').format('YYYYMMDD');
            const dateFormatted = startDay.add(i, 'day').format('YYYY-MM-DD');

            const card = cardMap.get(dateStr);
            const cash = cashMap.get(dateStr);

            const cardValue = Number(card?.total) || 0;
            const cashValue = Number(cash?.total) || 0;

            return {
                idx: i + 1,
                date: dateFormatted,
                total: cardValue + cashValue,
                list: [
                    { title: '카드매출', value: cardValue, count: Number(card?.count) || 0 },
                    { title: '현금거래', value: cashValue, count: Number(cash?.count) || 0 },
                ]
            };
        });

        // 4. 정렬
        if (sort === 1) {
            list.sort((a, b) => b.date.localeCompare(a.date));
        } else if (sort === 2) {
            list.sort((a, b) => a.date.localeCompare(b.date));
        } else if (sort === 3) {
            list.sort((a, b) => b.total - a.total);
        }

        rt.result = { list, prev: 0 };

        // 5. 전일 매출 (단일 날짜 조회 시에만)
        if (startDate === endDate) {
            const yesterDt = dayjs(startDate).subtract(1, 'day').format('YYYYMMDD');

            const [yesterCard, yesterCash] = await Promise.all([
                models.STORE_CARD_SALES_TB.scope(['active', { method: [scopeMethod, targetIdx] }]).sum('amount', {
                    where: { trDt: yesterDt }
                }),

                models.STORE_CASH_TB.scope(['active', { method: [scopeMethod, targetIdx] }]).findOne({
                    raw: true,
                    attributes: [
                        [models.sequelize.literal('SUM(CASE WHEN type = 1 THEN amount ELSE -amount END)'), 'amount']
                    ],
                    where: { date: yesterDt }
                })
            ]);

            rt.result.prev = (yesterCard || 0) + (Number(yesterCash?.amount) || 0);
        }

        send(req, res, rt);

    } catch (error) {
        console.error('list error:', error);
        sendError(req, res, 'server');
    }
});





/**
 * @openapi
 * /v1/sales/calendar:
 *   post:
 *     summary: 입금예정 캘린더 데이터 가져오기
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "String", "example": "2025-10-27", "description": "시작일(YYYY-MM-DD)" },
 *                "endDate": { "type": "String", "example": "2025-10-27", "description": "종료일(YYYY-MM-DD)" },
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
router.post('/calendar', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { startDate, endDate, all = false, store, user, nowDt, ip } = req.body;

    if (!startDate || !endDate) {
        sendError(req, res, 'params');
        return;
    }

    const result = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: [all ? 'myAll' : 'my', all ? user?.idx : store?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: ['payDt', ['payAmount', 'amount']],
        where: {
            payDt: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        }
    });

    const cashResult = await models.STORE_CASH_TB.scope([
        'active',
        { method: [all ? 'myAll' : 'my', all ? user?.idx : store?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: [['date', 'payDt'], 'type', 'amount'],
        where: {
            type: 1,
            date: {
                [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
            }
        }
    });


    const startDay = dayjs(startDate);
    const endDay = dayjs(endDate);
    const diff = endDay.diff(startDay, 'day') + 1; // +1을 해야 endDate 포함

    let list = Array.from({ length: diff }, (_, i) => {

        const dayList = result?.filter(x => x?.payDt == startDay.add(i, 'day').format('YYYYMMDD'));
        const cashDayList = cashResult?.filter(x => x?.payDt == startDay.add(i, 'day').format('YYYYMMDD'));

        const list = [
            { title: '카드매출', value: dayList?.reduce((acc, item) => acc + item?.amount, 0) || 0, count: dayList?.length || 0 },
            { title: '현금거래', value: cashDayList?.reduce((acc, item) => acc + item?.amount, 0) || 0, count: cashDayList?.length || 0 },
        ];
        const total = dayList.reduce((acc, item) => acc + item?.amount, 0);
        const total2 = cashDayList.reduce((acc, item) => acc + item?.amount, 0);

        return { idx: i + 1, date: startDay.add(i, 'day').format('YYYY-MM-DD'), total: total, total2: total2, list: list }
    });


    rt.result = {
        list: list,
        count: result?.length,
        cashCount: cashResult?.length,
    };

    send(req, res, rt);

});








/**
 * @openapi
 * /v1/sales/memo:
 *   post:
 *     summary: 일자별 메모 가져오기
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "date": { "type": "String", "example": "2025-10-27", "description": "일자(YYYY-MM-DD)" }
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
router.post('/memo', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { date, store, user, nowDt, ip } = req.body;

    let row = await models.STORE_CARD_SALES_MEMO_TB.scope(['active', { method: ['my', store?.idx] }]).findOne({
        where: {
            date: parseInt(date?.replace(/-/g, ''))
        }
    });

    rt.result = row || null;

    send(req, res, rt);
});


/**
 * @openapi
 * /v1/sales/memoUpdate:
 *   post:
 *     summary: 일자별 메모 등록/수정
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "date": { "type": "String", "example": "2025-10-27", "description": "일자(YYYY-MM-DD)" },
 *                "comment": { "type": "String", "example": "메모", "description": "메모" }
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
router.post('/memoUpdate', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { date, comment, store, user, nowDt, ip } = req.body;

    let row = await models.STORE_CARD_SALES_MEMO_TB.scope(['active', { method: ['my', store?.idx] }]).findOne({
        where: {
            date: parseInt(date?.replace(/-/g, ''))
        }
    });

    if (row) {
        await row.update({
            comment: comment
        });
    } else {
        await models.STORE_CARD_SALES_MEMO_TB.create({
            store_idx: store?.idx,
            user_idx: user?.idx,
            date: parseInt(date?.replace(/-/g, '')),
            comment: comment
        });
    }


    rt.result = true;

    send(req, res, rt);
});


/**
 * @openapi
 * /v1/sales/memoDelete:
 *   post:
 *     summary: 일자별 메모 삭제
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "memoIdx": { "type": "number", "example": 1, "description": "메모 고유번호" }
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
router.post('/memoDelete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { memoIdx = 0, store, user, nowDt, ip } = req.body;

    await models.STORE_CARD_SALES_MEMO_TB.scope(['active', { method: ['my', store?.idx] }]).destroy({
        where: {
            idx: memoIdx
        }
    });

    rt.result = true;

    send(req, res, rt);
});


module.exports = router;
