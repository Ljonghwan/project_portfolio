const axios = require('axios');
const dayjs = require('dayjs');
const { Op } = require("sequelize");

const { DATA_GO_KR_KEY } = process.env;

const models = require('../models');
const { logs } = require('./auth');
const codes = require('./errorCode');
const { regPhone, addBusinessDays } = require('./utils');


const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 공공데이터 사업자번호 조회
module.exports.validateBusinessNumber = async ({
    b_no,
    start_dt,
    p_nm
}) => {

    let rt = {
        ok: true,
        msg: '',
        errorMsg: '',
        result: {}
    }

    try {

        let api_url = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${DATA_GO_KR_KEY}`;

        const sender = {
            businesses: [
                {
                    b_no: b_no,
                    start_dt: start_dt,
                    p_nm: p_nm
                }
            ]
        }

        console.log(sender);
        const { data } = await axios.post(api_url, sender, { timeout: 10000 });


        if(!data?.valid_cnt || data?.valid_cnt < 1 || data?.data?.[0]?.valid !== '01') {
            throw new Error('hyphen_error8'); 
        }

        console.log(data?.data?.[0]?.status);

        if(data?.data?.[0]?.status?.b_stt_cd !== '01') {
            throw new Error('hyphen_error7');
        }

        rt.result = data?.data?.[0]?.status;

    } catch (error) {
        let { message } = error;
        console.log(message);

        rt.ok = false;

        if(error.code === 'ECONNABORTED') {
            rt.errorMsg = "외부 API TIME OUT 발생";
            rt.msg = 'hyphen_error3';
        } else {
            rt.msg = message || 'hyphen_error8';
        }
    }

    return rt;
};

