
const dayjs = require("dayjs");

const { Op } = require("sequelize");
const models = require('../models')

const { generateOccurrences } = require('./loopUtils.js');


/**
 * 매장 지출 리스트 조회
 * @param {{
* startDate:string
* endDate:string
* store:object
* }} options 
* @returns {array} - 매장 지출 리스트
*/
module.exports.getExpenseList = async ({
    startDate, endDate, store
}) => {
    
    if (!startDate || !endDate || !store) return [];

    let result = await models.STORE_EXPENSE_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        where: {
            loop: 0,
            date: { [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))] }
        }
    });

    const repeatExpenses = await models.STORE_EXPENSE_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        where: {
            loop: { [Op.ne]: 0 },
            date: { [Op.lte]: parseInt(endDate?.replace(/-/g, '')) }
        }
    });


    // 3. 반복 항목 전개
    const expandedExpenses = [];

    for (const expense of repeatExpenses) {
        const occurrences = generateOccurrences(expense, startDate, endDate);

        for (const occurrenceDate of occurrences) {
            expandedExpenses.push({
                ...expense,
                date: occurrenceDate
            });
        }
    }

    // 4. 합치기 및 정렬
    const allExpenses = [
        ...result,
        ...expandedExpenses
    ].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? a.date : dayjs(a.date + '').format('YYYY-MM-DD');
        const dateB = typeof b.date === 'string' ? b.date : dayjs(b.date + '').format('YYYY-MM-DD');
        return dateA.localeCompare(dateB);
    });

    return allExpenses;
}







