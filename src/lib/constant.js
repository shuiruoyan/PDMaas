// 组件状态相关
export const LOADING = 'loading';
export const NORMAL = 'normal';
export const DISABLE = 'disable';

// 配置相关
export const CONFIG = 'config';

// 项目操作相关
export const ACTION = {
    USER: {
        UPDATE_USER_SUCCESS: 'update_user_success',
        UPDATE_USER_FAIL: 'update_user_fail',
        GET_USER_SUCCESS: 'get_user_success',
        GET_USER_FAIL: 'get_user_fail',
    },
    CONFIG: {
        UPDATE_PROJECT_SAVE_STATUS: 'update_project_save_status',
        UPDATE_PROJECT_PATH: 'update_project_path',
        UPDATE_PROJECT_SAVE_COUNT: 'update_project_save_count',
        UPDATE_PROJECT_CMD_HISTORY: 'update_project_cmd_history',
        UPDATE_PROJECT_CHANGE: 'updateProjectChange',
        CLEAR: 'clear',
    },
    CORE: {
        GET_PROJECT_SUCCESS: 'get_project_success',
        UPDATE_PROFILE_USER_SUCCESS: 'update_profile_user_success',
        EXEC_COMMAND_SUCCESS: 'exec_command_success',
        UPDATE_PROJECT_STATUS_SUCCESS: 'update_project_status_success',
        UPDATE_PROJECT_PROFILE: 'update_project_profile',
        FIX_PROFILE: 'fix_profile',
        CLEAR: 'clear',
    },
    BRANCH: {
        BRANCH_UPDATE: 'branch_update',
    }
}


//ws相关
export const WS = {
    SEND_DATA: 'send_data',
    MESSAGE_STATUS_UPDATE: 'MESSAGE_STATUS_UPDATE',
    TAB_LOCAL_UPDATE: 'TAB_LOCAL_UPDATE',
    TAB_UPDATE: 'TAB_UPDATE',
    TAB_ACTIVE_CHANGE: 'TAB_ACTIVE_CHANGE',
    SEND_TYPE: {
        SEND_ONLY: 'SEND_ONLY',
        EXEC_ONLY: 'EXEC_ONLY',
        SEND_EXEC: 'SEND_EXEC'
    },
    USER: {
        UPDATE: 'UPDATE',
        SOP_CEP_ONLINE: 'SOP_CEP_ONLINE',
        SOP_CEP_OFFLINE: 'SOP_CEP_OFFLINE',
        SOP_ALL_CEP: 'SOP_ALL_CEP',
        SOP_INC_CMD: 'SOP_INC_CMD',
        START_MERGE: 'START_MERGE',
        MOP_BATCH_UPDATE_DATATYPE: 'MOP_BATCH_UPDATE_DATATYPE',
        END_MERGE: 'END_MERGE',
        SWITCH_DBDIALECT: 'SWITCH_DBDIALECT',
        CREATE_NEW_BRANCH: 'CREATE_NEW_BRANCH',
        ROP_REVISION_START: 'ROP_REVISION_START',
        ROP_REVISION_FINISH: 'ROP_REVISION_FINISH',
        GOP_BRANCH_LOCK: 'GOP_BRANCH_LOCK',
        GOP_BRANCH_UNLOCK: 'GOP_BRANCH_UNLOCK',
        ROP_REVIEW_START: 'ROP_REVIEW_START',
        ROP_REVIEW_FINISH: 'ROP_REVIEW_FINISH'
    },
    BATCH: {
        ENTITY_P_BASE_DATATYPE_UPDATE: 'ENTITY_P_BASE_DATATYPE_UPDATE',
        ENTITY_L_BASE_DATATYPE_UPDATE: 'ENTITY_L_BASE_DATATYPE_UPDATE',
        DOMAIN_BATCH_UPDATE: 'DOMAIN_BATCH_UPDATE'
    },
    STATUS: {
        C100: 'C100',
        C200: 'C200',
        C500: 'C500'
    },
    PROJECT: {
        RELOAD: 'RELOAD',
        MOP_PROJECT_SETTING: 'MOP_PROJECT_SETTING',
        MOP_PROJECT_HOME_COVER_DIAGRAM: 'MOP_PROJECT_HOME_COVER_DIAGRAM'
    },
    CATEGORY: {
        MOP_CATEGORY_CREATE: 'MOP_CATEGORY_CREATE',
        MOP_CATEGORY_DELETE: 'MOP_CATEGORY_DELETE',
        MOP_CATEGORY_UPDATE: 'MOP_CATEGORY_UPDATE',
        MOP_CATEGORY_DRAG: 'MOP_CATEGORY_DRAG',
    },
    ENTITY: {
        MOP_ENTITY_CREATE: 'MOP_ENTITY_CREATE',
        MOP_ENTITY_UPDATE: 'MOP_ENTITY_UPDATE',
        MOP_ENTITY_DELETE: 'MOP_ENTITY_DELETE',
        MOP_ENTITY_DRAG: 'MOP_ENTITY_DRAG',
        MOP_ENTITY_CATEGORY_CHANGE: 'MOP_ENTITY_CATEGORY_CHANGE',
        MOP_ENTITY_BATCH_ADJUST: 'MOP_ENTITY_BATCH_ADJUST',
        MOP_ENTITY_BATCH_REFERS: 'MOP_ENTITY_BATCH_REFERS'
    },
    DIAGRAM: {
        MOP_DIAGRAM_CREATE: 'MOP_DIAGRAM_CREATE',
        MOP_DIAGRAM_UPDATE: 'MOP_DIAGRAM_UPDATE',
        MOP_DIAGRAM_DELETE: 'MOP_DIAGRAM_DELETE',
        MOP_DIAGRAM_DRAG: 'MOP_DIAGRAM_DRAG',
        MOP_DIAGRAM_CATEGORY_CHANGE: 'MOP_DIAGRAM_CATEGORY_CHANGE',
        // MOP_DIAGRAM_CELLS_UPDATE: 'MOP_DIAGRAM_CELLS_UPDATE',
        MOP_DIAGRAM_ER_UPDATE: 'MOP_DIAGRAM_ER_UPDATE',
        MOP_DIAGRAM_MM_UPDATE: 'MOP_DIAGRAM_MM_UPDATE',
        MOP_DIAGRAM_MER_UPDATE: 'MOP_DIAGRAM_MER_UPDATE',
        MOP_DIAGRAM_SETTING: 'MOP_DIAGRAM_SETTING',
        MOP_DIAGRAM_MM_SETTING: 'MOP_DIAGRAM_MM_SETTING',
        MOP_DIAGRAM_FL_UPDATE: 'MOP_DIAGRAM_FL_UPDATE',
        MOP_DIAGRAM_BATCH_ADJUST: 'MOP_DIAGRAM_BATCH_ADJUST'
    },
    FIELD: {
        MOP_FIELD_UPDATE: 'MOP_FIELD_UPDATE',
        MOP_FIELD_CREATE: 'MOP_FIELD_CREATE',
        MOP_FIELD_DELETE: 'MOP_FIELD_DELETE',
        MOP_FIELD_DRAG: 'MOP_FIELD_DRAG',
        MOVE_UP: 'MOVE_UP',
        MOVE_DOWN: 'MOVE_DOWN',
        MOVE_TOP: 'MOVE_TOP',
        MOVE_BOTTOM: 'MOVE_BOTTOM'
    },
    INDEX: {
        MOP_INDEX_CREATE: 'MOP_INDEX_CREATE',
        MOP_INDEX_DELETE: 'MOP_INDEX_DELETE',
        MOP_INDEX_UPDATE: 'MOP_INDEX_UPDATE',
        MOP_INDEX_DRAG: 'MOP_INDEX_DRAG',
        MOVE_UP: 'MOVE_UP',
        MOVE_DOWN: 'MOVE_DOWN',
        MOVE_TOP: 'MOVE_TOP',
        MOVE_BOTTOM: 'MOVE_BOTTOM',
    }
}

// 项目结构相关

export const PROJECT = {
    UPDATE: 'project_update',
    ENTITY: 'entity',
    LOGIC_ENTITY: 'logic_entity',
    CONCEPT_ENTITY: 'concept_entity',
    ENTITY_SUB: 'entity_sub',
    LOGIC_ENTITY_SUB: 'logic_entity_sub',
    DIAGRAM: 'diagram',
    DIAGRAM_SUB: 'diagram_sub',
    CONCEPT_ENTITY_SUB: 'concept_entity_sub',
    CATEGORY: 'category',
    REFRESH: 'refresh'
}
export const ENTITY = {
    TYPE: {
        P: 'P', // 物理模型
        L: 'L', // 逻辑模型
        C: 'C', // 概念模型
        U: 'U', // 非模型
        A: 'A', // 所有
        DEFAULT: 'default'
    }
}
export const DIAGRAM = {
    TYPE: {
        D: 'D',
        P: 'P', // 物理模型
        L: 'L', // 逻辑模型
        C: 'C', // 概念模型
        F: 'F',
        M: 'M',
        MER: 'MER'
    }
}

export const CATEGORY = {
    CLASSIFY_TYPE: {
        AUTO: 'AUTO',
        MANUAL: 'MANUAL',
        NONE: 'NONE',
    },
    /**
     * MANUAL_CLASSIFY
     * C-概念模型
     * L-逻辑模型
     * P-物理模型
     * D-关系图
     * V-视图
     * F-函数
     * S-存储过程
     */
    MANUAL_CLASSIFY: {
        P: 'P',
        C: 'C',
        L: 'L',
        D: 'D',
        V: 'V',
        F: 'F',
        S: 'S',
    }
}

export const PROFILE = {
    UPDATE: 'profile_update',
    USER: {
        TREE: 'TREE',
        FLAT: 'FLAT',
        NON_EMPTY: 'NON_EMPTY',
        ALL: 'ALL',
        A: 'A',
        N: 'N',
        K: 'K',
        C: 'C',
        D: 'D',
        L: 'L'
    }
}

// 组件相关
export const COMPONENT = {
    TREE: {
        PEER: 'peer',
        SUB: 'sub',
        SCHEMA: 'schema',
        BEFORE: 'before',
        AFTER: 'after'
    }
}

// 其他
export const APP_EVENT = {
    CLICK: 'appClickEvent'
}

// 基础操作相关
export const OPT = {
    ADD: 'add',
    DELETE: 'delete',
    UPDATE: 'update'
}

// 数据库连接用途对象枚举常量
export const DBConnUsedFor = {
    ALL_IN_ONE: 'ALL_IN_ONE',
    READ_META_DATA: 'READ_META_DATA',
    EXEC_DDL: 'EXEC_DDL',
    EXEC_DML: 'EXEC_DML',
};
