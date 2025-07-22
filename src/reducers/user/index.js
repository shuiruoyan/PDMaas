import {ACTION} from '../../lib/constant';

import reserveWord from '../../lib/reserveWord';

const USER = ACTION.USER;

// 用户本地数据以及全局数据的更新
const user = (state = {
    reserveWord,
}, action) => {
    switch (action.type) {
        case USER.UPDATE_USER_SUCCESS:
            return {
                ...state,
                ...action.data,
            };
        case USER.UPDATE_USER_FAIL:
            return state;
        case USER.GET_USER_SUCCESS:
            return {
                ...state,
                ...action.data,
            };
        case USER.GET_USER_FAIL:
            return state;
        default:
            return state;
    }
};

export default user;
