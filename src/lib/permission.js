import {getMemoryCache} from "./memory";

const base = 'r.clab.project.po'

const closePermission = true; // 权限开关

export const baseModelNsKey = `${base}.model`;

export const baseBranchNsKey = `${base}.verbranch`;

export const branch = `${baseBranchNsKey}.branch`;

export const baseSysDatatypeNsKey = `r.sys.datatype`

export const baseDataType = `${baseSysDatatypeNsKey}.baseDataType`;

export const baseDataTypeNsKey = {
    D: `${baseDataType}.delete`,
    U: `${baseDataType}.update`,
    V: `${baseDataType}.view`,
}

export const dbType = `${baseSysDatatypeNsKey}.dbType`

export const dbTypeNsKey = {
    D: `${dbType}.delete`,
    U: `${dbType}.update`,
    V: `${dbType}.view`,
    DEBUG: `${dbType}.debugSQL`,
}

export const codegen = `${baseSysDatatypeNsKey}.codegen`;

export const codegenNsKey = {
    D: `${codegen}.delete`,
    U: `${codegen}.update`,
    V: `${codegen}.view`,
}

export const commandTpl = `${baseSysDatatypeNsKey}.commandTpl`;

export const commandTplNsKey = {
    U: `${commandTpl}.update`,
    V: `${commandTpl}.view`,
}

export const baseBizDataType = `r.clab.bizdatatye`;

export const bizdatatyeNskey = {
    C: `${baseBizDataType}.create`,
    D: `${baseBizDataType}.delete`,
    R: `${baseBizDataType}.resort`,
    U: `${baseBizDataType}.update`,
    V: `${baseBizDataType}.view`,

};

export const dbenv = 'r.clab.dbenv';

export const importNsKey = `${baseModelNsKey}.import`;

export const projectSettingNsKey = `${baseModelNsKey}.setting`;

export const batchToolsNsKey = `${baseModelNsKey}.batchTools`;

export const getPermissionList = () => {
    return getMemoryCache('permission') || [];
}

// 判断操作权限
export const checkPermission = (nsKey, permissionData) => {
    if(closePermission) {
        return true
    }
    const permission = permissionData || getPermissionList() || [];
    return permission.some(permission => permission.nsKey === nsKey)
}

// 判断数据展示权限
export const checkDataPermission = (nsKey, permissionData) => {
    if(nsKey && !closePermission) {
        const permission = permissionData || getPermissionList();
        const dataPermission = permission.filter(p => p.nsKey.split('.').slice(0, -1).join('.') === nsKey);
        if(dataPermission.length > 0) {
            const permissionLevel = {
                delete: 4,
                update: 3,
                create: 2,
                sort: 1,
                view: 0,
            }
            // 取最大的权限
            return Math.max(...dataPermission.map(p => permissionLevel[p.nsKey.split('.').slice(-1).join('.')] || 0));
        }
        return -1; // 无权访问
    }
    return 4;
}

const getModelTypeNsKey = (type) => {
    return {
        C: `${baseModelNsKey}.${type}.create`,
        U: `${baseModelNsKey}.${type}.update`,
        D: `${baseModelNsKey}.${type}.delete`,
        V: `${baseModelNsKey}.${type}.view`,
        S: `${baseModelNsKey}.${type}.sync`,
    }
}


export const baseCategoryNsKey = `${baseModelNsKey}.category`

export const baseConceptNsKey = `${baseModelNsKey}.concept`

export const basePhysicNsKey = `${baseModelNsKey}.physic`

export const baseLogicNsKey = `${baseModelNsKey}.logic`

export const baseMindNsKey = `${baseModelNsKey}.mind`

export const baseMermaidNsKey = `${baseModelNsKey}.mermaid`

export const baseFlowNsKey = `${baseModelNsKey}.flow`


export const baseCompareNsKey = `${baseModelNsKey}.compare`

export const baseSettingNsKey = `${baseModelNsKey}.setting`

export const release = `${baseModelNsKey}.release`

export const conceptNsKey = getModelTypeNsKey('concept')

export const physicNsKey =  getModelTypeNsKey('physic')

export const logicNsKey =  getModelTypeNsKey('logic')

export const mindNsKey =  getModelTypeNsKey('mind')

export const mermaidNsKey =  getModelTypeNsKey('mermaid')

export const flowNsKey =  getModelTypeNsKey('flow')

export const categoryNsKey =  getModelTypeNsKey('category')

export const basePhysicFieldNsKey = `${basePhysicNsKey}.field`

export const fieldNsKey = {
    caseConversion: `${basePhysicFieldNsKey}.caseConversion`,
    createByFree: `${basePhysicFieldNsKey}.createByFree`,
    createByStandard: `${basePhysicFieldNsKey}.createByStandard`,
    nameStyleConversion: `${basePhysicFieldNsKey}.nameStyleConversion`,
    D: `${basePhysicFieldNsKey}.delete`,
    S: `${basePhysicFieldNsKey}.sort`,
    U: `${basePhysicFieldNsKey}.update`,
    V: `${basePhysicFieldNsKey}.view`,
}

export const basePhysicIndexNsKey = `${basePhysicNsKey}.index`

export const indexNsKey = {
    C: `${basePhysicIndexNsKey}.create`,
    D: `${basePhysicIndexNsKey}.delete`,
    S: `${basePhysicIndexNsKey}.sort`,
    U: `${basePhysicIndexNsKey}.update`,
    V: `${basePhysicIndexNsKey}.view`,
}



export const exportNsKey = {
    ddl: `${baseModelNsKey}.export.ddl`,
    excel: `${baseModelNsKey}.export.excel`,
    word: `${baseModelNsKey}.export.word`,
    html: `${baseModelNsKey}.export.html`,
}

export const projectOpenNsKey = `${base}.open`
