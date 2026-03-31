// utils/dateUtils.js
const dayjs = require('dayjs');
const consts = require('./consts.js');

/**
 * 다음 발생일 계산
 * @param {dayjs.Dayjs} current - 현재 날짜
 * @param {number} loopType - 반복 타입 (1=매월, 2=매주, 3=분기)
 * @returns {dayjs.Dayjs}
 */
function getNextOccurrence(current, loopType) {

    const loopTypeData = consts.loopType.find(item => item.idx === loopType);
    if (!loopTypeData) return current;

    return current.add(loopTypeData?.add, loopTypeData?.addType);
}

/**
 * 반복 발생일 목록 생성
 * @param {Object} expense - 지출 항목
 * @param {string} startDate - 조회 시작일 (YYYY-MM-DD)
 * @param {string} endDate - 조회 종료일 (YYYY-MM-DD)
 * @returns {string[]} - 발생일 배열
 */
function generateOccurrences(expense, startDate, endDate) {
    const occurrences = [];

    // date가 INTEGER(YYYYMMDD) 형식이므로 변환
    const rawDate = expense.date;
    let current = dayjs(rawDate + '', 'YYYYMMDD');

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    // loop_end_date 처리
    const rawEndDate = expense.loop_end_date;
    const loopEnd = rawEndDate ? dayjs(rawEndDate + '', 'YYYYMMDD') : null;

    const loopType = expense.loop;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        // 반복 종료일 체크
        if (loopEnd && current.isAfter(loopEnd)) break;

        // 조회 기간 내에 있으면 추가
        if (
            (current.isAfter(start) || current.isSame(start, 'day')) &&
            (current.isBefore(end) || current.isSame(end, 'day'))
        ) {
            occurrences.push(current.format('YYYY-MM-DD'));
        }

        // 다음 발생일 계산
        current = getNextOccurrence(current, loopType);
    }

    return occurrences;
}


module.exports = {
    getNextOccurrence,
    generateOccurrences,
};