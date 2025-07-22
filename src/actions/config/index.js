import {ACTION} from "../../lib/constant";

const CONFIG = ACTION.CONFIG;

export const updateProjectSaveStatus = (isSaving) => {
    return {
        type: CONFIG.UPDATE_PROJECT_SAVE_STATUS,
        data: isSaving,
    };
};

export const updateProjectPath = (path) => {
    return {
        type: CONFIG.UPDATE_PROJECT_PATH,
        data: path,
    };
};

export const updateProjectSaveCount = (count) => {
    return {
        type: CONFIG.UPDATE_PROJECT_SAVE_COUNT,
        data: count
    };
};

export const updateProjectCmdHistory = (history) => {
    return {
        type: CONFIG.UPDATE_PROJECT_CMD_HISTORY,
        data: history
    };
};

export const clearConfig = () => {
    return {
        type: CONFIG.CLEAR,
    };
};

export const updateProjectChange = (isChange) => {
    return {
        type: CONFIG.UPDATE_PROJECT_CHANGE,
        data: isChange
    };
};