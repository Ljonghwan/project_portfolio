const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { Op } = require("sequelize");
const { send, sendError, scd, randomNumberCreate, numFormat, getWorkingStaffList, addBusinessDays } = require('../../service/utils.js');
const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { getCardSalesStore, getMonthSalesService, getTodaySales } = require('../../service/hyphen.js');
const { getExpenseList } = require('../../service/getData.js');

const dayjs = require('dayjs');

// dayjs.extend(dayjsBusinessDays);
const consts = require('../../service/consts.js');

/**
 * @openapi
 * /v1/main/home:
 *   post:
 *     summary: 앱 홈화면 정보들 가져오기
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/home', checkUser, checkStore, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, store, nowDt, ip } = req.body;

    if (!store) {

        let dummy = Array.from({ length: 3 }, (_, i) => {
            return {
                label: dayjs(nowDt).add(i, 'days').format('YYYY-MM-DD'),
            }
        });
        let dummyMonth = Array.from({ length: dayjs().daysInMonth() }, (_, i) => {
            return {
                label: dayjs(nowDt).startOf('month').add(i, 'days').format('YYYY-MM-DD'),
            }
        });
        let dummyPersonnel = [
            {
                label: `고정 직원 : ?명 (???원)`,
            },
            {
                label: `일용직(파출/알바): ?명 (???원)`, // 추출 근거 Text
            }
        ];

        rt.result = {
            yesterDay: 0,
            prevDay: 0,
            lastUpdated: dayjs(nowDt).format('YYYY-MM-DD HH:mm:ss'),
            deposit: dummy,
            expenditure: dummy,
            chart: dummyMonth,
            personnel: dummyPersonnel,
            maintenance: [],
            priceChanges: []
        };
        send(req, res, rt);
        return;
    }


    /** 어제 매출 내역 */
    const yesterDayAmount = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).sum('amount', {
        where: {
            trDt: dayjs(nowDt).subtract(1, 'day').format('YYYYMMDD')
        }
    });

    const yesterDayCashAmount = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        attributes: [
            [models.sequelize.literal('SUM(CASE WHEN type = 1 THEN amount WHEN type = 2 THEN -amount ELSE 0 END)'), 'amount']
        ],
        where: {
            date: dayjs(nowDt).subtract(1, 'day').format('YYYYMMDD')
        },
        raw: true
    });


    const prevDayAmount = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).sum('amount', {
        where: {
            trDt: dayjs(nowDt).subtract(2, 'day').format('YYYYMMDD')
        }
    });
  
    const prevDayCashAmount = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        attributes: [
            [models.sequelize.literal('SUM(CASE WHEN type = 1 THEN amount WHEN type = 2 THEN -amount ELSE 0 END)'), 'amount']
        ],
        where: {
            date: dayjs(nowDt).subtract(2, 'day').format('YYYYMMDD')
        },
        raw: true
    });

    /** 어제 매출 내역 끝 */


    /** 예상 입금 내역 */
    let startDate = dayjs(nowDt).format('YYYYMMDD');
    let depositStartDate = dayjs(nowDt).format('YYYYMMDD');

    if([0, 6].includes(dayjs(depositStartDate).day())) {
        depositStartDate = addBusinessDays(depositStartDate, 1).format('YYYYMMDD');
    }
    // let startDate = dayjs("2025-12-12").format('YYYYMMDD');

    const depositList = await models.STORE_CARD_SALES_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        where: {
            payDt: {
                [Op.gte]: dayjs(depositStartDate).startOf('month').format('YYYYMMDD')
            }
        }
    });

    const deposit = [...Array.from({ length: 2 }, (_, i) => {
        let date = addBusinessDays(depositStartDate, i).format('YYYYMMDD');
        let value = depositList?.filter((x, i) => x?.payDt == date)?.reduce((acc, item) => acc + item?.payAmount * 1, 0) || 0;
        return {
            label: dayjs(date).format('YYYY-MM-DD'),
            value: value,
            items: value > 0 ? ["카드 매출 입금"] : ["입금 예정 없음"] // 해당일 예상 입금 항목명들
        }
    }), {
        label: dayjs(depositStartDate).endOf('month').format('YYYY-MM-DD'),
        value: depositList?.reduce((acc, item) => acc + item?.payAmount * 1, 0) || 0,
        items: [`${dayjs(depositStartDate).format('MM월')} 입금 예정`]
    }];
    /** 예상 입금 내역 끝 */


    /** 예상 지출 내역 */
    let expenseList = await getExpenseList({ startDate, endDate: dayjs(startDate).add(2, 'days').format('YYYYMMDD'), store });
    const expenditure = Array.from({ length: 3 }, (_, i) => {
        let date = dayjs(startDate).add(i, 'days').format('YYYY-MM-DD');
        let value = expenseList?.filter((x, i) => x?.date == date)?.reduce((acc, item) => acc + item?.amount * 1, 0) || 0;
        return {
            label: date,
            value: value,
            items: value > 0 ? expenseList?.filter((x, i) => x?.date == date)?.map((x, i) => x?.title) || [] : ["지출 예정 없음"] // 해당일 예상 지출 항목명들
        }
    });
    /** 예상 지출 내역 끝 */



    /** 장부 데이터 조회 */
    const daysInMonth = dayjs().daysInMonth();
    const chartList = await models.STORE_CARD_SALES_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: ['trDt', 'amount'],
        where: {
            trDt: {
                [Op.between]: [parseInt(dayjs(nowDt).startOf('month').format('YYYYMMDD')), parseInt(dayjs(nowDt).endOf('month').format('YYYYMMDD'))]
            }
        }
    });
    const cashList = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        attributes: [
            ['date', 'trDt'], 'type', 'amount'
        ],
        where: {
            date: {
                [Op.between]: [parseInt(dayjs(nowDt).startOf('month').format('YYYYMMDD')), parseInt(dayjs(nowDt).endOf('month').format('YYYYMMDD'))]
            }
        }
    });


    const cardMap = new Map();
    for (const item of chartList || []) {
        const key = String(item?.trDt);
        cardMap.set(key, (cardMap.get(key) || 0) + (item?.amount || 0));
    }

    const cashMap = new Map();
    for (const item of cashList || []) {
        const key = String(item?.trDt);
        const value = item?.type === 1 ? item?.amount : -item?.amount;
        cashMap.set(key, (cashMap.get(key) || 0) + (value || 0));
    }

    // 차트 생성
    const chart = Array.from({ length: daysInMonth }, (_, i) => {
        const key = dayjs().startOf('month').add(i, 'days').format('YYYYMMDD');

        const cardValue = cardMap.get(key) || 0;
        const cashValue = cashMap.get(key) || 0;

        return {
            label: dayjs(key).format('YYYY-MM-DD'),
            value: cardValue + cashValue
        };
    });
    /** 장부 데이터 조회 끝 */

    

    /** 정기 관리비 내역 */
    let maintenanceList = await getExpenseList({ startDate: dayjs(nowDt).startOf('month').format('YYYYMMDD'), endDate: dayjs(nowDt).endOf('month').format('YYYYMMDD'), store });
    const maintenance = maintenanceList?.filter((x, i) => [1].includes(consts.expenseType.find((y, i) => y?.idx == x?.type)?.category))?.reduce((acc, item) => acc + item?.amount * 1, 0) || 0;
    /** 정기 관리비 내역 끝 */


    /** 원가 변동 내역 */
    const [priceChanges] = await models.sequelize.query(`
        SELECT DISTINCT ON (company, title)
            idx, user_idx, company, title, amount, prev_amount, date
        FROM "public"."ITEM_CHANGE_TB"
        WHERE user_idx = :userIdx
        AND store_idx = :storeIdx
        ORDER BY company, title, date DESC, idx ASC
        LIMIT 5
    `, {
        replacements: { userIdx: user?.idx || 0, storeIdx: store?.idx || 0 },
    });
    /** 원가 변동 내역 끝 */




    /** 인건비 계산 */
    let staffDaily = await models.STAFF_DAILY_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        where: {
            sdate: {
                [Op.between]: [dayjs(nowDt).format('YYYYMMDD'), dayjs(nowDt).format('YYYYMMDD')]
            }
        }
    });

    let staffList = await models.STAFF_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findAll();

    staffList = await getWorkingStaffList({ date: dayjs(nowDt).format('YYYYMMDD'), staffList: staffList });

    const personnel = [
        {
            label: `고정 직원 : ${staffList?.length}명 (${numFormat(staffList?.reduce((acc, item) => acc + item?.pay_calc, 0)) }원)`, // 추출 근거 Text
            value: staffList?.reduce((acc, item) => acc + item?.pay_calc, 0),
        },
        {
            label: `일용직(파출/알바): ${staffDaily?.length}명 (${numFormat(staffDaily?.reduce((acc, item) => acc + item?.pay_calc, 0)) }원)`, // 추출 근거 Text
            value: staffDaily?.reduce((acc, item) => acc + item?.pay_calc, 0),
        }
    ];
    /** 인건비 계산 끝 */



    rt.result = {
        yesterDay: yesterDayAmount + (yesterDayCashAmount?.amount*1 || 0), // 어제(현재 최신) 매출
        prevDay: prevDayAmount + (prevDayCashAmount?.amount*1 || 0), // 전일 매출
        lastUpdated: depositList?.[0]?.createdAt || dayjs(nowDt).format('YYYY-MM-DD HH:mm:ss'),
        deposit: deposit, // 오늘포함 향후 3일간 예상 입금 내역
        expenditure: expenditure, // 오늘포함 향후 3일간 예상 지출 내역
        chart: chart, // 장부 데이터(이번달 일별 매출)
        personnel: personnel, // 오늘 인건비 리스트
        maintenance: maintenance, // 정기 관리비(월) 총합
        priceChanges: priceChanges // 원가 변동 리스트
    };

    send(req, res, rt);
});




/* 
    앱 홈화면 사장님께 드리는 최신 소식 가져오기 API 
    매장이 등록 안된경우나 비회원의경우 이 API 호출
*/

/**
 * @openapi
 * /v1/main/homeNews:
 *   post:
 *     summary: 사장님께 드리는 최신 소식
 *     tags: [Main]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/homeNews', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { nowDt, ip } = req.body;

    const news = await models.NEWS_TB.scope(['active', 'desc']).findAll({
        limit: 5
    })

    rt.result = news;

    send(req, res, rt);
});





router.post('/reload', checkUser, checkStore, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { store, user, nowDt, ip } = req.body;


    send(req, res, rt);
    return;
    
    /** 매입내역 가져오기 */
    let maxBuyDt = await models.STORE_CARD_SALES_TB.max('buyDt', {
        where: {
            store_idx: store?.idx,
            type: 1
        }
    })
    console.log(maxBuyDt);

    let fromDate = maxBuyDt ? dayjs(maxBuyDt + "").add(1, 'day').format('YYYYMMDD') : dayjs().subtract(2, 'day').format('YYYYMMDD');
    let toDate = dayjs(fromDate).endOf('month').format('YYYYMMDD');

    await getMonthSalesService({ store, user, fromDate: dayjs().subtract(2, 'day').format('YYYYMMDD'), toDate: dayjs().format('YYYYMMDD') });

   /** 매입내역 가져오기 
   let maxBuyDt = await models.STORE_CARD_SALES_TB.max('buyDt', {
        where: {
            store_idx: store?.idx,
            type: 1
        }
    })
    console.log(maxBuyDt);

    let fromDate = maxBuyDt ? dayjs(maxBuyDt + "").add(1, 'day').format('YYYYMMDD') : dayjs().subtract(2, 'day').format('YYYYMMDD');
    let toDate = dayjs(fromDate).endOf('month').format('YYYYMMDD');

    console.log(fromDate, toDate);

    const { ok, msg, result, errorMsg } = await getMonthSales({ store, fromDate: fromDate, toDate: toDate });

    if (!ok) {
        sendError(req, res, msg);

        logs({
            type: '서비스연동',
            title: `여신금융협회 매입내역 조회에 실패했습니다 (${fromDate} ~ ${toDate})`,
            comment: (codes?.[msg]?.message || codes.default?.message) + (errorMsg ? ` : ${errorMsg}` : ''),
            status: 2,
            user_idx: user?.idx,
            store_idx: store?.idx
        })
        return;
    }


    let updateList = await Promise.all(
        result?.map((x, i) => {
            return {
                user_idx: user?.idx,
                store_idx: store?.idx,
                trDt: x?.trDt,
                buyDt: x?.buyDt,
                payDt: x?.payDt,
                card: x?.cardCorp1,
                amount: x?.buyAmt,
                payAmount: x?.payAmt
            }
        })
    );

    await models.STORE_CARD_SALES_TB.bulkCreate(updateList);

    logs({
        type: '서비스연동',
        title: `여신금융협회 매입내역 조회 성공 (${fromDate} ~ ${toDate})`,
        user_idx: user?.idx,
        store_idx: store?.idx
    })

    /** 매입내역 가져오기 끝 */




    /** 미매입내역 가져오기 
    let maxTrDt = await models.STORE_CARD_SALES_TB.max('trDt',{
        where: {
            store_idx: store?.idx,
            type: 1
        }
    })
    console.log(maxTrDt);
    let fromDate2 = maxTrDt ? dayjs(maxTrDt+"").add(1, 'day').format('YYYYMMDD') : dayjs().subtract(1, 'day').format('YYYYMMDD');
    let toDate2 = dayjs().format('YYYYMMDD');

    console.log(fromDate2, toDate2);

    const { ok, msg, result, errorMsg } = await getTodaySales({ store, fromDate: fromDate2, toDate: toDate2 });
    if (!ok) {
        sendError(req, res, msg);

        logs({
            type: '서비스연동',
            title: `여신금융협회 승인내역 조회에 실패했습니다 (${fromDate2} ~ ${toDate2})`,
            comment: (codes?.[msg]?.message || codes.default?.message) + (errorMsg ? ` : ${errorMsg}` : ''),
            status: 2,
            user_idx: user?.idx,
            store_idx: store?.idx
        })
        return;
    }

    await models.STORE_CARD_SALES_TB.destroy({
        where: {
            store_idx: store?.idx,
            type: 2
        }
    });

    let updateList = await Promise.all(
        result?.map((x, i) => {
            return {
                user_idx: user?.idx,
                store_idx: store?.idx,
                type: 2,
                trDt: x?.trDt,
                card: x?.cardCorp1,
                amount: x?.apprAmt
            }
        })
    );

    await models.STORE_CARD_SALES_TB.bulkCreate(updateList);

    logs({
        type: '서비스연동',
        title: `여신금융협회 승인내역 조회 성공 (${fromDate2} ~ ${toDate2})`,
        user_idx: user?.idx,
        store_idx: store?.idx
    })

    console.log(result);
    
    
    
    /** 미매입내역 가져오기 끝 */

    send(req, res, rt);
});











module.exports = router;
