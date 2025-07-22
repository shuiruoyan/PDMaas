import React from "react";
import {TreeSelect, Input, Checkbox, Select, NumberInput, Icon, Tooltip} from "components";
import _ from 'lodash';

export const getDefaultColumn = (profile) => {
    const dbDialect = profile?.project?.dbDialect || '';
    const tempData = profile.global.dataTypes || [];
    const typeOftenData = {
        common: [],
        general: [],
        low: [],
    };
    tempData.forEach((d) => {
        const defKey = d.dbDataType?.[dbDialect];
        if(!defKey) {
            return;
        }
        if(!d.often) {
            typeOftenData.low.push({
                defKey,
                defName: `${d.defName}-${defKey}`
            });
        } else if(d.often === '5') {
            typeOftenData.general.push({
                defKey,
                defName: `${d.defName}-${defKey}`
            });
        } else if(d.often === '9') {
            typeOftenData.common.push({
                defKey,
                defName: `${d.defName}-${defKey}`
            });
        } else {
            typeOftenData.low.push({
                defKey,
                defName: `${d.defName}-${defKey}`
            });
        }
    });
    const uniqueByDefKey = (array) => _.uniqBy(array, 'defKey');

    typeOftenData.common = uniqueByDefKey(typeOftenData.common);
    typeOftenData.general = uniqueByDefKey(typeOftenData.general);
    typeOftenData.low = uniqueByDefKey(typeOftenData.low);

    const removeDefKeys = (sourceArray, targetArray) => {
        const defKeys = sourceArray.map(item => item.defKey);
        return targetArray.filter(item => !defKeys.includes(item.defKey));
    };

    typeOftenData.general = removeDefKeys(typeOftenData.common, typeOftenData.general);
    typeOftenData.low = removeDefKeys(typeOftenData.common, typeOftenData.low);

    typeOftenData.low = removeDefKeys(typeOftenData.general, typeOftenData.low);
    // const dbTypes = (profile.global.dataTypes || []).map(d => {
    //     const defKey = d.dbDataType?.[dbDialect];
    //     return {
    //         defKey,
    //         defName: `${d.defName}-${defKey}`
    //     }
    // }).filter(d => d.defKey);
    const dbTypes = [
        ...typeOftenData.common,
        ...typeOftenData.general,
        ...typeOftenData.low
    ]
    return [
        {
            key: 'defKey',
            label: '代码',
            component: 'Input',
            resize: true,
            align: 'left',
            resetSelected: true
        },
        {
            key: 'defName',
            label: '名称',
            component: 'Input',
            resize: true,
            resetSelected: true
        },
        {
            key: 'primaryKey',
            label: '主键',
            component: 'Checkbox',
            resize: true,
        },
        {
            key: 'notNull',
            label: '不为空',
            component: 'Checkbox',
            resize: true,
        },
        {
            key: 'autoIncrement',
            label: '自增',
            component: 'Checkbox',
            resize: true,
        },
        {
            key: 'bizDomainType',
            label: '业务域类型',
            component: 'Select',
            options: profile.team.bizDomainTypes.map(d => {
                return {
                    value: d.defKey,
                    label: d.defName + '-' + d.defKey,
                }
            }),
            resize: true,
            props: {
                valueRender: (item) => {
                    return (item && item.children.slice(0, item.children.length - item.value.length - 1)) || ''
                }
            }
        },
        {
            key: 'baseDataType',
            label: '基本数据类型',
            component: 'Select',
            options: profile.global.dataTypes.map(d => {
                return {
                    value: d.defKey,
                    label: d.defName,
                }
            }),
            resize: true,
        },
        {
            key: 'dbDataType',
            label: '数据类型',
            component: 'Select',
            options: dbTypes.map(d => {
                return {
                    value: d.defKey,
                    label: d.defName,
                }
            }),
            resize: true,
            props: {
                valueRender: (item, v) => {
                    return (item && (item.value || item)) || v || ''
                }
            }
        },
        {
            key: 'dataLen',
            label: '长度',
            component: 'NumberInput',
            align: 'center',
            resize: true,
        },
        {
            key: 'numScale',
            label: '小数点',
            component: 'NumberInput',
            resize: true,
        },
        {
            key: 'defaultValue',
            label: '默认值',
            component: 'Input',
            resize: true,
        },
        {
            key: 'intro',
            label: '备注字段',
            component: 'TextareaInput',
            resize: true,
            props: {
                showDetails: true,
            }
        }
    ]
}

export const getColumnComponent = (attr) => {
    const parseOptionData = (optionsData) => {
        let options = [];
        try {
            options = JSON.parse(optionsData);
        } catch (e) {
            options = [];
        }
        return options;
    };
    switch (attr.editType) {
        case 'SingleText': return {
            component: 'Input',
        };
        case 'SingleDropdown': return {
            component: 'Select',
            options: parseOptionData(attr.optionsData),
        };
        case 'MultiDropdown': return {
            component: 'MultipleSelect',
            options: parseOptionData(attr.optionsData),
        };
        case 'MultiCheckbox': return {
            component: 'Checkbox',
            options: parseOptionData(attr.optionsData),
        };
        case 'SingleTreeSelect': return {
            component: 'TreeSelect',
            options: parseOptionData(attr.optionsData),
        };
        case 'IntegerInput': return {
            component: 'NumberInput',
        };
        case 'DecimalInput': return {
            component: 'NumberInput',
            props: {
                integer: false
            }
        };
        case 'MultiText': return {
            component: 'Textarea',
        };
        case 'MultiTreeSelect': return {
            component: 'MultiplTreeSelect',
            options: parseOptionData(attr.optionsData),
        };
        default: return {
            component: 'Input',
        };
    }
};

export const manualDictColumns = [{
    key: 'itemKey',
    label: '条目代码',
    width: 120,
    component: 'Input',
}, {
    key: 'itemName',
    label: '条目名称',
    width: 120,
    component: 'Input',
}, {
    key: 'parentKey',
    label: '父条目代码',
    width: 90,
    component: 'Input',
}, {
    key: 'intro',
    label: '备注说明',
    width: 120,
    component: 'Input',
}]
