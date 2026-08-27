const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { Op } = require("sequelize");
const { send, sendError, deleteFile, getPresignedUrl } = require('../../service/utils.js');
const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { generateStaffDailyContract, generateStaffContract } = require('../../pdf/service.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work08/list:
 *   post:
 *     summary: 계약서 리스트 가져오기
 *     tags: [Front]
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

    let { store, user, nowDt, ip } = req.body;

    let result = await models.STAFF_CONTRACT_TB.scope([
        'active',
        'staff',
        { method: ['my', store?.idx || 0] },
    ]).findAll();

    result = result.map(contract => {
        const data = contract.toJSON();

        if (data.type === 1) {
            data.staff = data.staffDaily || null;
        }
        delete data.staffDaily;

        return data;
    });

    result = result.sort((a, b) => {
        return new Date(b.staff?.sdate) - new Date(a.staff?.sdate);
    });

    rt.result = result;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work08/get:
 *   post:
 *     summary: 계약서 상세 가져오기
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/get', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx=0, store, user, nowDt, ip } = req.body;

    let row = await models.STAFF_CONTRACT_TB.scope([
        'active',
        'staff',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        where: { idx: idx }
    });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    row = row.toJSON();

    if (row.type === 1) {
        row.staff = row.staffDaily || null;
    }
    delete row.staffDaily;

    row.file = await getPresignedUrl(row.file);
    rt.result = row;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work08/sign:
 *   post:
 *     summary: 계약서 서명하기
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "계약서 고유번호" },
 *                "signature": { "type": "string", "example":"", "description": "서명" },
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
router.post('/sign', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx=0, signature, store, user, nowDt, ip } = req.body;

    if(!idx || !signature) {
        sendError(req, res, "params");
        return;
    }

    const transaction = await models.sequelize.transaction();

    try {

        let contractRow = await models.STAFF_CONTRACT_TB.scope([
            'active',
            { method: ['my', store?.idx || 0] },
        ]).findOne({
            where: {
                idx: idx,
            }
        });

        if (!contractRow) throw new Error("auth_fail");

        let row = await models?.[ contractRow?.type === 1 ? 'STAFF_DAILY_TB' : 'STAFF_TB' ].scope([
            { method: ['my', store?.idx || 0] },
        ]).findOne({
            where: {
                cert_idx: contractRow?.idx
            }
        });

        if (!row) throw new Error("auth_fail");
        if(row?.cert !== 1) throw new Error("work08_signed_error");

        let result = null;

        if(contractRow?.type === 1) {
            result = await generateStaffDailyContract({ staff: row, store: store, signature });
        } else {
            result = await generateStaffContract({ staff: row, store: store, signature });
        }

        if(!result) throw new Error("pdf_error");

        // 기존 계약서가 있으면 파일 삭제
        if(contractRow?.file) {
            await deleteFile(contractRow?.file);
        }

        await contractRow.update({ file: result }, { transaction });
        await row.update({ cert: 2 }, { transaction });

        await transaction.commit();

    } catch ({ message }) {

        await transaction.rollback();
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});




/**
 * @openapi
 * /v1/work08/send:
 *   post:
 *     summary: 계약서 발송 요청
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "계약서 고유번호" },
 *              },
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/send', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, store, user, nowDt, ip } = req.body;

    let row = await models.STAFF_CONTRACT_TB.scope([
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

    // 테스트용으로 서명완료상태로 변경
    await row.update({ cert: 2 });

    console.log('row', row);
    rt.result = true;

    send(req, res, rt);
});





module.exports = router;
