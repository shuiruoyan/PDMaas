import {ACTION} from '../../lib/constant';

const CONFIG = ACTION.CONFIG;

// 核心的项目更新
const config = (state = {saveCount: 0, isSaving: false, path: '', cmdHistory: [], isChange: false}, action) => {
    switch (action.type) {
        case CONFIG.UPDATE_PROJECT_SAVE_STATUS:
            return {
                ...state,
                isSaving: action.data,
            };
        case CONFIG.UPDATE_PROJECT_PATH:
            return {
                ...state,
                path: action.data,
            };
        case CONFIG.UPDATE_PROJECT_SAVE_COUNT:
            return {
                ...state,
                saveCount: action.data,
            };
        case CONFIG.UPDATE_PROJECT_CMD_HISTORY:
            return {
                ...state,
                cmdHistory: action.data,
            };
        case CONFIG.CLEAR:
            return {saveCount: 0, isSaving: false, path: '', cmdHistory: [], isChange: false};
        case CONFIG.UPDATE_PROJECT_CHANGE:
            return {
                ...state,
                isChange: action.data,
            };
        default:
            return state;
    }
};

export default config;
