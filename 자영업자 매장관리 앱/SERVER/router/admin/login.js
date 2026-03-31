const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const bcrypt = require("bcrypt");

const { sendTempPasswordMail } = require('../../service/mailform.js')
const { encryptePassword, checkAdmin } = require('../../service/auth.js');
const jwtUtil = require('../../service/jwt.js');
const models = require('../../models');

const { send, sendError, scd, randomNumberCreate, randomString } = require('../../service/utils.js');

const dayjs = require('dayjs');

// login
router.post('/', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { id, pw, nowDt, ip } = req.body;

    const findAdmin = await models.ADMIN_TB.findOne({
        where: {
            email: id
        }
    })

    if (!findAdmin) {
        sendError(req, res, "login_fail");
        return
    }

    if (!bcrypt.compareSync(pw, findAdmin.password)) {
        sendError(req, res, "login_fail");
        return
    }

    const token = jwtUtil.adminSign({ idx: findAdmin.idx });
    rt.result = token;

    send(req, res, rt);
});

// 비밀번호 찾기
router.post('/findPass', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { email, nowDt, ip } = req.body;

    if (!email) {
        sendError(req, res, "req_invalid");
        return
    }

    const findAdmin = await models.ADMIN_TB.findOne({
        where: {
            email: email
        }
    })

    if (!findAdmin) {
        sendError(req, res, "no_account");
        return;
    }

    let randPass = randomString(12);
    console.log("randPass:", randPass);
    await models.ADMIN_TB.update({
        password: encryptePassword(randPass)
    }, {
        where: { idx: findAdmin.idx }
    });

    if (findAdmin) {
        sendTempPasswordMail(findAdmin.email, randPass);
    }

    send(req, res, rt);
});

router.post('/logout', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { nowDt, ip } = req.body;

    send(req, res, rt);
});

router.use(checkAdmin)

router.post('/info', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    rt.result = user;

    send(req, res, rt);
});

router.post('/changePass', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let {
        pass,
        pass2,
        user,
        nowDt, 
        ip
    } = req.body;

    const findAdmin = await models.ADMIN_TB.findOne({
        where: {
            idx: user.idx
        }
    })

    if (!findAdmin) {
        sendError(req, res, "login_fail");
        return
    }

    if (pass != pass2) {
        sendError(req, res, "admin_pass2");
        return
    }

    await models.ADMIN_TB.update({
        password: encryptePassword(pass)
    }, {
        where: { idx: findAdmin.idx }
    });


    send(req, res, rt);
});

module.exports = router;
