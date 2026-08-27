const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const _ = require('lodash');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const codes = require('../../service/errorCode.js');

const { isLogin, checkUser, checkStore, logs, encryptePassword } = require('../../service/auth.js');
const { send, sendError, deleteFile, encodeBase64, decodeBase64, getItemCostGroupInfo } = require('../../service/utils.js');
const { encrypt, decrypt } = require('../../service/crypto.js');
const { generateStaffDailyContract } = require('../../pdf/service.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work03/list:
 *   post:
 *     summary: 일용노무대장 리스트
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "string", "example": "2025-01-01","description": "검색 시작날짜" },
 *                "endDate": { "type": "string", "example": "2025-02-02","description": "검색 종료날짜" },
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
 *         description: Return true
 */
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { startDate, endDate, store, user, nowDt, ip } = req.body;

    let where = {};

    if (startDate && endDate) {
        where.sdate = {
            [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
        }
    }

    let result = await models.STAFF_DAILY_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        where: where
    });


    rt.result = result;

    send(req, res, rt);


    // generateStaffDailyContract({});

});



/**
 * @openapi
 * /v1/work03/get:
 *   post:
 *     summary: 일용노무대장 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "일용노무대장 고유번호" },
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
 *         description: Return true
 */
router.post('/get', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, store, user, nowDt, ip } = req.body;


    let row = await models.STAFF_DAILY_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        where: { idx: idx }
    });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    // console.log('row.rrn_last_hidden', row.rrn_first, decrypt(row?.getDataValue('rrn_last')));

    rt.result = row;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work03/update:
 *   post:
 *     summary: 일용노무대장 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "일용노무대장 고유번호" },
 *                "name": { "type": "string", "example": "이름", "description": "이름" },
 *                "rrn_first": { "type": "string", "example": "123456", "description": "주민번호 앞자리" },
 *                "rrn_last": { "type": "string", "example": "1234567", "description": "주민번호 뒷자리" },
 *                "hp": { "type": "string", "example": "01012345678", "description": "휴대폰 번호" },
 *                "sdate": { "type": "string", "example": "2025-01-01", "description": "근무일" },
 *                "work_type": { "type": "string", "example": "주방 보조", "description": "근무 형태" },
 *                "work_stime": { "type": "string", "example": "09:00", "description": "근무 시작시간" },
 *                "work_etime": { "type": "string", "example": "18:00", "description": "근무 종료시간" },
 *                "pay": { "type": "number", "example": 10000, "description": "시급" },
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
 *         description: Return true
 */
router.post('/update', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, name, rrn_first, rrn_last, hp, sdate, work_type, work_stime, work_etime, pay, memo, favorite = false, store, user, nowDt, ip } = req.body;

    if (!name || !rrn_first || !rrn_last || !hp || !sdate || !work_type || !work_stime || !work_etime || !pay) {
        sendError(req, res, "params");
        return;
    }


    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            name: name,
            rrn_first: encrypt(rrn_first),
            rrn_last: encrypt(rrn_last),
            hp: hp,
            sdate: parseInt((sdate + "")?.replace(/-/g, '')),
            work_type: work_type,
            work_stime: work_stime,
            work_etime: work_etime,
            pay: pay,
            memo: memo,
            favorite: favorite,
        };

        if (idx) {
            let count = await models.STAFF_DAILY_TB.scope([
                'active',
                'desc',
                { method: ['my', store?.idx || 0] },
            ]).count({
                where: {
                    name: name,
                    hp: hp,
                    sdate: parseInt((sdate + "")?.replace(/-/g, '')),
                    idx: { [Op.ne]: idx }
                }
            });

            if (count > 0) throw new Error("work03_duple_data");

            const row = await models.STAFF_DAILY_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            if(row?.cert !== 1) throw new Error("already_signed_error");

            await row.update(ob)
        } else {

            let count = await models.STAFF_DAILY_TB.scope([
                'active',
                'desc',
                { method: ['my', store?.idx || 0] },
            ]).count({
                where: {
                    name: name,
                    hp: hp,
                    sdate: parseInt((sdate + "")?.replace(/-/g, ''))
                }
            });

            if (count > 0) throw new Error("work03_duple_data");

            let createData = await models.STAFF_DAILY_TB.create(ob)
            idx = createData?.idx;
        }

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }




    const transaction = await models.sequelize.transaction();

    try {
        const row = await models.STAFF_DAILY_TB.findOne({
            where: {
                idx: idx
            }
        });


        const result = await generateStaffDailyContract({ staff: row, store: store });
        if (!result) throw new Error("pdf_error");


        // 기존 계약서가 있으면 파일 삭제하고 디비 삭제
        if (row?.cert_idx) {
            let contractRow = await models.STAFF_CONTRACT_TB.findOne({
                where: {
                    idx: row?.cert_idx
                }
            });

            await deleteFile(contractRow?.file);

            if (contractRow) {
                await contractRow.destroy();
            }
        }

        let createData = await models.STAFF_CONTRACT_TB.create({
            user_idx: user?.idx,
            store_idx: store?.idx,
            file: result,
        }, { transaction })

        await row.update({ cert_idx: createData?.idx }, { transaction });

        // 모든 작업 성공 시 커밋
        await transaction.commit();

    } catch ({ message }) {
        await transaction.rollback();
        sendError(req, res, message || "req_invalid");
        return;
    }



    rt.result = idx;

    send(req, res, rt);

});



/**
 * @openapi
 * /v1/work03/delete:
 *   post:
 *     summary: 일용노무대장 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "일용노무대장 고유번호" },
 *                "signature": { "type": "object", "example": { $ref: "#/components/schema/file" }, "description": "서명이미지" },
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
 *         description: Return true
 */
router.post('/delete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, store, user, nowDt, ip } = req.body;

    try {
        let row = await models.STAFF_DAILY_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        // 기존 계약서가 있으면 파일 삭제하고 디비 삭제
        if (row?.cert_idx) {
            let contractRow = await models.STAFF_CONTRACT_TB.scope([
                'active',
                { method: ['my', store?.idx || 0] },
            ]).findOne({
                where: {
                    idx: row?.cert_idx
                }
            });

            await deleteFile(contractRow?.file);

            if (contractRow) {
                await contractRow.destroy();
            }
        }

        await row.destroy();

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});






module.exports = router;
