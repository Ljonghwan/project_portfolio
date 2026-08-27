module.exports = {
    working_stay: { code: 9000, message: '작업중입니다.' },
    default: { code: 9999, message: '잠시후 다시 시도해주세요.' },
    unverified: { code: 9998, message: '로그인이 필요합니다.' },
    ban: { code: 9998, message: '이용정지된 회원입니다.' },
    leave: { code: 9998, message: '탈퇴 회원입니다.' },
    store_invalid: { code: 9997, message: '매장 등록이 필요합니다.' },
    cancel: { code: 9998, message: '요청이 취소되었습니다.' },

    auth_fail: { code: 500, message: '권한이 없습니다.' },
    params: { code: 900, message: '필수 입력항목이 없습니다.' },
    code_1000: { code: 1000, message: '해당 데이터를 찾지 못했습니다.' },

    login_fail: { code: 1001, message: '아이디 또는 비밀번호가 올바르지 않습니다' },
    no_account: { code: 1002, message: '해당 이메일로 가입된 정보가 없습니다.' },
    login_fail_count: { code: 1003, message: '비밀번호 오류가 5회 이상 발생했습니다. 잠시후 다시 시도해주세요.' },
    login_social_fail: { code: 1004, message: '소셜 계정이 없습니다.' },

    policy_type: { code: 1201, message: '약관 유형을 입력해주세요.' },
    policy_comment: { code: 1202, message: '약관 내용을 입력해주세요.' },

    admin_name: { code: 1401, message: '관리자명을 입력해주세요.' },
    admin_email: { code: 1402, message: '관리자 이메일을 입력해주세요.' },
    admin_pass: { code: 1403, message: '비밀번호를 입력해주세요.' },
    admin_pass2: { code: 1404, message: '비밀번호 확인이 올바르지않습니다.' },
    admin_auth: { code: 1405, message: '권한을 선택해주세요.' },
    admin_duple_email: { code: 1406, message: '기존계정과 이메일이 중복됩니다.' },

    auth_name: { code: 1501, message: '권한명을 입력해주세요.' },
    auth_desc: { code: 1502, message: '권한설명을 입력해주세요.' },
    auth_join: { code: 1503, message: '등록된 사용자가 있어 삭제할 수 없습니다.' },
    auth_duple_name: { code: 1504, message: '권한명이 중복되었습니다.' },

    password_same: { code: 1601, message: '기존 비밀번호와 동일합니다.' },







    req_invalid: { code: 10000, message: '올바른 값이 아닙니다.' },
    duple_account: { code: 10001, message: '아이디가 중복되었습니다.' },
    ban_login: { code: 10002, message: '이용정지된 회원입니다.' },
    leave_login: { code: 10003, message: '탈퇴 회원입니다.' },
    blocked: { code: 10004, message: '차단한 게시글입니다.' },
    already_report: { code: 10005, message: '이미 신고한 글입니다.' },
    leave_fail: { code: 10006, message: '회원탈퇴에 실패했습니다.' },
    use_nick: { code: 10007, message: '이미 사용 중인 닉네임입니다.' },
    before_not_nick: { code: 10008, message: '30일 이내 변경 이력이 있습니다.' },
    use_hp: { code: 10009, message: '이미 사용 중인 휴대폰번호입니다.' },
    use_account: { code: 10010, message: '이미 등록된 이메일입니다.' },
    use_social_id: { code: 10011, message: '이미 가입된 소셜 아이디입니다.' },
    auth_num_fail: { code: 10010, message: '인증번호 발송에 실패했습니다.' },
    auth_num_expired: { code: 10011, message: '인증시간이 만료 되었습니다.' },
    auth_num_wrong: { code: 10011, message: '인증번호가 다릅니다.' },
    work01_list_error: { code: 10012, message: '품목 리스트를 확인해주세요.' },
    work02_list_error: { code: 10013, message: '원재료 리스트를 확인해주세요.' },
    work09_list_error: { code: 10014, message: '제품 리스트를 확인해주세요.' },
    work05_duple_hp: { code: 10015, message: '이미 등록된 고객 정보입니다.' },
    work06_event_not_delete: { code: 10016, message: '이벤트 시작일 이후에는 삭제할 수 없습니다.' },
    work08_signed_error: { code: 10017, message: '이미 서명한 계약서입니다.' },
    store_cert_business_num: { code: 10018, message: '이미 등록된 사업자 번호입니다.' },

    ocr_error1: { code: 10019, message: '거래명세표 정보를 확인할 수 없습니다.' },

    work03_duple_data: { code: 10020, message: '이미 등록된 일용노무대장 정보입니다.' },
    
    work06_duple_template: { code: 10021, message: '해당 템플릿이 존재하지 않습니다.' },
    work06_customers_not_match: { code: 10022, message: '고객 목록이 일치하지 않습니다.' },

    hyphen_error1: { code: 10023, message: '아이디 또는 비밀번호가 없습니다.' },
    hyphen_error2: { code: 10024, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
    hyphen_error3: { code: 10025, message: '오류가 발생했습니다.\n잠시후 다시 시도해주세요.' },
    hyphen_error4: { code: 10026, message: '해당 사업자번호의 가맹점 정보가 없습니다.' },
    hyphen_error5: { code: 10027, message: '기간이 올바르지 않습니다.' },
    hyphen_error6: { code: 10028, message: '휴대폰번호가 올바르지 않습니다.' },
    hyphen_error7: { code: 10029, message: '현재 개업상태가 아닙니다.' },
    hyphen_error8: { code: 10030, message: '해당 사업자 정보가 없습니다.' },
    store_open_date_invalid: { code: 10031, message: '개업일자가 없습니다.' },

    pdf_error: { code: 10032, message: '근로계약서 생성에 실패했습니다.\n잠시후 다시 시도해주세요.' },
    already_signed_error: { code: 10033, message: '서명이 완료되어 수정할 수 없습니다.' },
    name_same: { code: 10034, message: '가입자 명의의 휴대폰이 아닙니다.' },
};