import React, {useEffect, useMemo, forwardRef, useImperativeHandle, useContext, useRef} from 'react';

import './style/index.less';
import {DropDown, Icon} from 'components';
import {getPrefix} from '../../lib/classes';
import {ConfigContent} from '../../lib/context';
import {getId, getRemoteIdAsyn} from '../../lib/idpool';


export default React.memo(forwardRef(({
                                          emptyRow,
                                          columns = [],
                                          fields = [],
                                          addRows,
                                          removeRows,
                                          updateRows,
                                          cellUpdateBefore,
                                          profile},
                                      ref) => {
    const { lang } = useContext(ConfigContent);
    const dataTypes = profile?.global.dataTypes || [];
    const bizDomainTypes = profile?.team?.bizDomainTypes || [];
    const dbDialect = profile?.project?.dbDialect || '';
    const dbTypes = dataTypes.map(d => d.dbDataType?.[dbDialect]).filter(d => !!d);
    const keysRef = useRef([]);
    // 将字段的数据域和基本数据类型转换成defKey[defName] 为了匹配下拉数据
    const def2Id = (data) => {
        // domain type
        const refactorName = (f, items, name) => {
            const item = items.find(d => d.defKey === f[name]);
            return item ? `${item.defKey}[${item.defName}]` : f[name];
        };
        return data.map((f) => {
            const temp = {...f};
            if(f.baseDataType) {
                temp.baseDataType = refactorName(f, dataTypes, 'baseDataType');
            }
            if(f.bizDomainType) {
                temp.bizDomainType = refactorName(f, bizDomainTypes, 'bizDomainType');
            }
            return temp;
        });
    };
    const id2DefSplit = '[';
    const id2Def = (data) => {
        const refactorName = (f, items, name) => {
            if(f[name].includes(id2DefSplit)) {
                const defKey = f[name].split(id2DefSplit)[0];
                const item = items.find(m => m.defKey === defKey);
                return item ? item.defKey : f[name];
            }
            return f[name];
        };
        return data.map((f) => {
            const temp = {...f};
            if(f.bizDomainType) {
                temp.bizDomainType = refactorName(f, bizDomainTypes, 'bizDomainType');
            }
            if(f.baseDataType) {
                temp.baseDataType = refactorName(f, dataTypes, 'baseDataType');
            }
            return temp;
        });
    };
    const dropDownSeparator = '%';
    const columnWidth = useMemo(() => {
        return columns.reduce((p, n, i) => {
            return {
                ...p,
                [i]: n.width || 200,
            };
        }, {});
    }, [columns]);
    const rows2Cells = (rows = []) => {
        return rows.reduce((p, n, i) => {
            return p.concat(columns.map((k, j) => {
                return {
                    r: i,
                    c: j,
                    v: {
                        v: n[columns[j].key],
                        customKey: { id: n.id },
                        baseDataType: n.baseDataType ? n.baseDataType.split(id2DefSplit)[0] : '',
                        bizDomainType: n.bizDomainType ? n.bizDomainType.split(id2DefSplit)[0] : '',
                    },
                    key: columns[j].key,
                };
            }));
        }, []);
    };
    const cellData = useMemo(() => {
        return rows2Cells(def2Id((fields || [])));
    }, [columns, fields]);
    const currentPrefix = getPrefix('components-sheet');
    const container = useMemo(() => `com-${Math.uuid()}`, []);
    const getEmptyCells = (length) => {
        const rows = [];
        for (let i = 0; i < length; i += 1){
            rows.push({...emptyRow});
        }
        return rows2Cells(rows);
    };
    const getDataVerification = (data) => {
        const mapOption = (options) => {
            return options.map(d => `${d.defKey}[${d.defName}]`).join(dropDownSeparator);
        };
        const dataTypesOptions = mapOption(dataTypes);
        const bizDomainTypesOptions = mapOption(bizDomainTypes);
        const yesOrNo = { type: 'checkbox', value1: 1, value2: 0 };
        const verificationMap = {
            dbDataType: {
                type: 'dropdown',
                value1: dbTypes.join(dropDownSeparator),
            },
            baseDataType: {
                type: 'dropdown',
                value1: dataTypesOptions,
            },
            bizDomainType: {
                type: 'dropdown',
                value1: bizDomainTypesOptions,
            },
            notNull: yesOrNo,
            primaryKey: yesOrNo,
            autoIncrement: yesOrNo,
            numScale: {
                type: 'number_integer',
                type2: 'gt',
                value1: '0',
            },
            dataLen: {
                type: 'number_integer',
                type2: 'gt',
                value1: '0',
            },
        };
        return data.reduce((p, n) => {
            const v = verificationMap[n.key];
            const tempV = {};
            if(v && v.type === 'checkbox') {
                tempV.checked = !!(n.v?.v);
            }
            // eslint-disable-next-line no-param-reassign
            p[`${n.r}_${n.c}`] = {
                ...v,
                ...tempV,
            };
            return p;
        }, {});
    };
    const validateCellData = (name, value) => {
        // number
        const numberNames = ['notNull', 'primaryKey', 'autoIncrement', 'numScale', 'dataLen'];
        if(numberNames.includes(name)) {
            if(typeof value !== 'number') {
                const numberValue = parseInt(value, 10);
                // eslint-disable-next-line no-restricted-globals
                if(isNaN(numberValue)) {
                    return '';
                }
                return numberValue;
            }
            return value;
        }
        return value;
    };
    const getDefaultValue = (cell, refKey) => {
        if(cell && cell.v !== undefined) {
            return cell.v;
        }
        if(emptyRow[refKey] === undefined) {
            return '';
        }
        return emptyRow[refKey];
    };
    const organizeUpdate = (rows) => {
        // 去除无效的updateKey
        const getEmptyValue = (v) => {
            if(v === null || v === undefined) {
                return '';
            }
            return v;
        };
        const compareNull = (pValue, nValue) => {
            if(pValue !== nValue) {
                return getEmptyValue(pValue) !== getEmptyValue(nValue);
            }
            return false;
        };
        return rows.map((r) => {
            const updateKeys = [...new Set(r.updateKeys.split(','))];
            return {
                ...r,
                pre: {},
                next: {},
                updateKeys: '',
                ...updateKeys.reduce((p, n) => {
                    if(compareNull(r.pre[n], r.next[n])) {
                        return {
                            ...p,
                            pre: {
                                ...p.pre,
                                [n]: r.pre[n],
                            },
                            next: {
                                ...p.next,
                                [n]: r.next[n],
                            },
                            updateKeys: p.updateKeys ? `${p.updateKeys},${n}` : n,
                        };
                    }
                    return p;
                }, {}),
            };
        }).filter(r => !!r.updateKeys);
    };
    const getRowData = (rows, useDefaultValue = true) => {
        return id2Def(rows.map((r) => {
            return columns.reduce((p, n, i) => {
                return {
                    ...p,
                    id: p.id || r[i]?.customKey?.id,
                    [n.key]: validateCellData(n.key, useDefaultValue
                        ? getDefaultValue(r[i], n.key) : r[i]?.v),
                };
            }, {
                baseDataType: r[0].baseDataType,
                bizDomainType: r[0].bizDomainType,
            });
        }));
    };
    const updateRowVerification = (file, rows) => {
        const cellVerification = getDataVerification(rows.reduce((p, n) => {
            // eslint-disable-next-line max-len
            const rowIndex = file.data.findIndex(d => d[0]?.customKey?.id === n.id);
            return p.concat(columns.map((c, columnIndex) => {
                return {
                    r: rowIndex,
                    c: columnIndex,
                    key: c.key,
                    v: { v: n[c.key] },
                };
            }));
        }, []));
        Object.keys(cellVerification).forEach((v) => {
            // eslint-disable-next-line no-param-reassign
            file.dataVerification[v] = cellVerification[v];
        });
        // eslint-disable-next-line max-len
        luckysheet.luckysheetrefreshsimple(file.data, file.dataVerification);
    };
    useImperativeHandle(ref, () => {
        return {
            getSheetData: () => {
                return getRowData(luckysheet.getSheetData());
            },
            setCellData: (id, key, value) => {
                const file = luckysheet.getAllSheets()[0];
                if(file.data.length > 0 && columns.length > 0) {
                    const rowIndex = file.data.findIndex(d => d[0]?.customKey?.id === id);
                    const columnIndex = columns.findIndex(c => c.key === key);
                    const [row] = def2Id([{[key]: value}]);
                    const finalValue = row[key];
                    // 刷新表格
                    file.data[rowIndex][columnIndex] = {
                        ...file.data[rowIndex][columnIndex],
                        v: finalValue,
                        m: finalValue,
                    };
                    const cellVerification = getDataVerification([{
                        r: rowIndex,
                        c: columnIndex,
                        key,
                        v: { v: finalValue },
                    }]);
                    Object.keys(cellVerification).forEach((v) => {
                        file.dataVerification[v] = cellVerification[v];
                    });
                    luckysheet.luckysheetrefreshsimple(file.data, file.dataVerification);
                }
            },
            deleteRow: (data) => {
                const file = luckysheet.getAllSheets()[0];
                data.forEach((d) => {
                    const rowIndex = file.data.findIndex(s => s[0]?.customKey?.id === d.id);
                    file.data.splice(rowIndex, 1);
                });
                luckysheet.luckysheetrefreshsimple(file.data);
            },
            addRow: ({data, step}) => {
                const file = luckysheet.getAllSheets()[0];
                const tempData = def2Id(data);
                file.data.splice(step, 0, ...tempData.map((d) => {
                    return columns.map((c) => {
                        return {
                            v: d[c.key],
                            customKey: { id: d.id },
                        };
                    });
                }));
                updateRowVerification(file, tempData);
            },
            destroy: () => {
                luckysheet.destroy();
            },
        };
    }, []);
    const verifyCheckboxData = (data) => {
        if (data === undefined || data === null) {
            return 0;
        } else if (typeof data !== 'number' || (data !== 0 && data !== 1)) {
            return 0;
        }
        return data;
    };
    const matchBaseDataType = (dbDataType) => {
        const dataType = dataTypes
            .find(d => d.dbDataType?.[dbDialect] === dbDataType);
        if(dataType) {
            return dataType;
        } else {
            return dataTypes
                .find(d => Object.keys(d.dbDataType)
                    .some(db => d.dbDataType[db] === dbDataType)) || {};
        }
    };
    const cellUpdated = (row, column, file, type, preRow) => {
        const changes = [];
        const updateName = ['baseDataType', 'dbDataType', 'dataLen', 'numScale', 'primaryKey', 'notNull', 'autoIncrement'];
        if(updateName.includes(columns[column]?.key)) {
            const columnIndex = columns.findIndex(h => h.key === 'bizDomainType');
            if(columnIndex > -1) {
                // eslint-disable-next-line no-param-reassign
                file.data[row][columnIndex] = {
                    ...file.data[row][columnIndex],
                    v: '',
                    m: '',
                };
                changes.push({
                    key: 'bizDomainType',
                    pre: file.data[row][columnIndex].v,
                    next: '',
                });
            }
            if(columns[column]?.key === 'dbDataType') {
                const dataType = matchBaseDataType(file.data[row][column].v);
                if(type !== 'undo') {
                    // 修改基本数据类型
                    changes.push({
                        key: 'baseDataType',
                        pre: preRow[0]?.baseDataType || '',
                        next: dataType?.defKey || '',
                    });
                    // eslint-disable-next-line no-param-reassign
                    preRow[0] = {
                        ...preRow[0],
                        baseDataType: dataType?.defKey || '',
                    };
                } else {
                    changes.push({
                        key: 'baseDataType',
                        next: preRow.baseDataType,
                        pre: dataType?.defKey || '',
                    });
                }
            }
            if(type !== 'undo') {
                changes.push({
                    key: 'bizDomainType',
                    pre: preRow[0]?.bizDomainType || '',
                    next: '',
                });
                // eslint-disable-next-line no-param-reassign
                preRow[0] = {
                    ...preRow[0],
                    bizDomainType: '',
                };
            } else {
                changes.push({
                    key: 'bizDomainType',
                    next: preRow.bizDomainType,
                    pre: '',
                });
                if(columnIndex > -1) {
                    const refactorName = (v) => {
                        const item = bizDomainTypes.find(d => d.defKey === v);
                        return item ? `${item.defKey}[${item.defName}]` : v;
                    };
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][columnIndex] = {
                        bizDomainType: preRow.bizDomainType,
                        ...file.data[row][columnIndex],
                        v: refactorName(preRow.bizDomainType),
                        m: refactorName(preRow.bizDomainType),
                    };
                }
            }
        } else if(columns[column]?.key === 'bizDomainType') {
            const defKey = file.data[row][column]?.v?.split(id2DefSplit)[0];
            const domainData = bizDomainTypes
                .find(d => d.defKey === defKey);
            const typeIndex = columns.findIndex(h => h.key === 'baseDataType');
            const scaleIndex = columns.findIndex(h => h.key === 'numScale');
            const lenIndex = columns.findIndex(h => h.key === 'dataLen');
            const primaryKeyIndex = columns.findIndex(h => h.key === 'primaryKey');
            const notNullIndex = columns.findIndex(h => h.key === 'notNull');
            const autoIncrementIndex = columns.findIndex(h => h.key === 'autoIncrement');
            const dbDataTypeIndex = columns.findIndex(h => h.key === 'dbDataType');
            if(type === 'undo') {
                changes.push(...updateName.map((n) => {
                    const index = columns.findIndex(h => h.key === n);
                    if(n === 'baseDataType' && index < 0) {
                        return  {
                            key: n,
                            next: preRow.baseDataType,
                            pre: file.data[row][0].baseDataType,
                        };
                    }
                    return {
                        key: n,
                        next: file.data[row][index].v,
                        pre: preRow[n],
                    };
                }));
            } else if(domainData) {
                const currentBaseDataType = dataTypes
                    .find(t => t.defKey === domainData.baseDataType);
                if(scaleIndex > -1) {
                    changes.push({
                        key: 'numScale',
                        pre: file.data[row][scaleIndex].v,
                        next: domainData.numScale || '',
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][scaleIndex] = {
                        ...file.data[row][scaleIndex],
                        v: domainData.numScale || '',
                        m: domainData.numScale || '',
                    };
                }
                if(lenIndex > -1) {
                    changes.push({
                        key: 'dataLen',
                        pre: file.data[row][lenIndex].v,
                        next: domainData.dataLen || '',
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][lenIndex] = {
                        ...file.data[row][lenIndex],
                        v: domainData.dataLen || '',
                        m: domainData.dataLen || '',
                    };
                }
                if(typeIndex > -1) {
                    const typeValue = currentBaseDataType ? `${currentBaseDataType.defKey}[${currentBaseDataType.defName}]` : '';
                    changes.push({
                        key: 'baseDataType',
                        pre: file.data[row][typeIndex].v,
                        next: typeValue,
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][typeIndex] = {
                        ...file.data[row][typeIndex],
                        v: typeValue,
                        m: typeValue,
                    };
                } else {
                    const typeValue = currentBaseDataType ? currentBaseDataType.defKey : '';
                    changes.push({
                        key: 'baseDataType',
                        pre: file.data[row][0].baseDataType,
                        next: typeValue,
                    });
                    // eslint-disable-next-line no-param-reassign
                    preRow[0] = {
                        ...preRow[0],
                        baseDataType: typeValue,
                    };
                }
                if(primaryKeyIndex > -1) {
                    const primaryKeyValue = verifyCheckboxData(domainData.primaryKey);
                    changes.push({
                        key: 'primaryKey',
                        pre: file.data[row][primaryKeyIndex].v,
                        next: primaryKeyValue,
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][primaryKeyIndex] = {
                        ...file.data[row][primaryKeyIndex],
                        v: primaryKeyValue,
                        m: primaryKeyValue,
                    };
                }
                if(notNullIndex > -1) {
                    const notNullValue = verifyCheckboxData(domainData.notNull);
                    changes.push({
                        key: 'notNull',
                        pre: file.data[row][notNullIndex].v,
                        next: notNullValue,
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][notNullIndex] = {
                        ...file.data[row][notNullIndex],
                        v: notNullValue,
                        m: notNullValue,
                    };
                }
                if(autoIncrementIndex > -1) {
                    const autoIncrementValue = verifyCheckboxData(domainData.autoIncrement);
                    changes.push({
                        key: 'autoIncrement',
                        pre: file.data[row][autoIncrementIndex].v,
                        next: autoIncrementValue,
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][autoIncrementIndex] = {
                        ...file.data[row][autoIncrementIndex],
                        v: autoIncrementValue,
                        m: autoIncrementValue,
                    };
                }
                if(dbDataTypeIndex > -1) {
                    const dbDataTypeValue = currentBaseDataType?.dbDataType?.[dbDialect] || '';
                    changes.push({
                        key: 'dbDataType',
                        pre: file.data[row][dbDataTypeIndex].v,
                        next: dbDataTypeValue,
                    });
                    // eslint-disable-next-line no-param-reassign
                    file.data[row][dbDataTypeIndex] = {
                        ...file.data[row][dbDataTypeIndex],
                        v: dbDataTypeValue,
                        m: dbDataTypeValue,
                    };
                }
            }
            if(type !== 'undo') {
                // 正常操作时记录下数据 后续撤销从这里获取
                changes.forEach((c) => {
                    const index = columns.findIndex(h => h.key === c.key);
                    // eslint-disable-next-line no-param-reassign
                    preRow[index] = {
                        ...preRow[index],
                        v: c.next,
                        m: c.next,
                    };
                });
            }
            // eslint-disable-next-line no-param-reassign
            preRow[0] = {
                ...preRow[0],
                bizDomainType: defKey,
            };
        }
        return changes.reduce((pre, next) => {
            const key = next.key;
            if(next.pre !== next.next) {
                return {
                    ...pre,
                    updateKeys: `${pre.updateKeys ? `${pre.updateKeys},${key}` : key}`,
                    pre: {
                        ...pre.pre,
                        [key]: next.pre,
                    },
                    next: {
                        ...pre.next,
                        [key]: next.next,
                    },
                };
            }
            return pre;
        }, {
            updateKeys: '',
            pre: {},
            next: {},
        });
    };
    const getNewDefKey = (rows, defKeyIndex, defKey, count = 0) => {
        if(rows.concat(keysRef.current.map((k) => {
            const array = [];
            array[defKeyIndex] = {v: k};
            return array;
        })).some(row => (count !== 0 ? (row[defKeyIndex].v === `${defKey}_${count}`)
            : (row[defKeyIndex].v === defKey)))){
            return getNewDefKey(rows, defKeyIndex, defKey, count + 1);
        }
        return count;
    };
    const updateRowsDefKey = (defKey, data) => {
        const file = luckysheet.getAllSheets()[0];
        const defKeyIndex = columns.findIndex(c => c.key === 'defKey');
        const currentData = [...file.data];
        const tempDefKey = defKey || 'column';
        const count = getNewDefKey(data || currentData, defKeyIndex, tempDefKey);
        const newDefKey = count === 0 ? tempDefKey : `${tempDefKey}_${count}`;
        const currentRow = [];
        currentRow[defKeyIndex] = {
            v: newDefKey,
        };
        currentData.push(currentRow);
        return newDefKey;
    };
    const rowTemplate = () => {
        const [id] = getId(1);
        const defKey = updateRowsDefKey('column');
        keysRef.current.push(defKey);
        const [row] = def2Id([{...emptyRow, defKey}]);
        return columns.map((c) => {
            return {
                v: row[c.key],
                customKey: { id },
            };
        });
    };
    const updateCellValue = (file, row, opt, column, value) => {
        // eslint-disable-next-line no-param-reassign
        opt.curdata[row][column] = {
            ...opt.curdata[row][column],
            v: value,
            m: value,
        };
        // eslint-disable-next-line no-param-reassign
        file.data[row][column] = {
            ...file.data[row][column],
            v: value,
            m: value,
        };
    };
    const updateRowId = (file, r, opt, id) => {
        const [genId] = getId(1);
        const newId = id || genId;
        const typeIndex = columns.findIndex(h => h.key === 'baseDataType');
        const bizIndex =  columns.findIndex(h => h.key === 'bizDomainType');
        opt.curdata[r].forEach((c, i) => {
            // eslint-disable-next-line no-param-reassign
            opt.curdata[r][i] = {
                ...opt.curdata[r][i],
                customKey: { id: newId },
                baseDataType: typeIndex > -1 ? opt.curdata[r][typeIndex].v : emptyRow.baseDataType,
                bizDomainType: bizIndex > -1 ? opt.curdata[r][bizIndex].v : emptyRow.bizDomainType,
            };
            // eslint-disable-next-line no-param-reassign
            file.data[r][i] = {
                ...file.data[r][i],
                customKey: { id: newId },
                baseDataType:  typeIndex > -1 ? file.data[r][typeIndex].v : emptyRow.baseDataType,
                bizDomainType: bizIndex > -1 ? file.data[r][bizIndex].v : emptyRow.bizDomainType,
            };
        });
    };
    const checkDefKeyRepeat = (defKey, rI) => {
        const file = luckysheet.getAllSheets()[0];
        const defKeyIndex = columns.findIndex(c => c.key === 'defKey');
        if(defKeyIndex > -1) {
            return file.data.some((d, i) => d[defKeyIndex].v === defKey && rI !== i);
        }
        return false;
    };
    useEffect(() => {
        getRemoteIdAsyn(1000).then(() => {
            const currentCellData = cellData.length === 0 ? getEmptyCells(1) : cellData;
            const options = {
                container,
                lang,
                dropDownSeparator,
                showtoolbar: false,
                showinfobar: false,
                showsheetbar: false,
                sheetFormulaBar: false,
                showstatisticBarConfig: {
                    count: false, // 计数栏
                    view: false, // 打印视图
                    zoom: true, // 缩放
                },
                column: columns.length,
                row: (fields || []).length === 0 ? 1 : fields.length,
                lockColumns: true,
                enableAddBackTop: false,
                enableAddRow: false,
                rowTemplate,
                hook:{
                    cellUpdateBefore: (row, column, value) => {
                        if(cellUpdateBefore) {
                            return cellUpdateBefore(columns[column], value);
                        }
                        return true;
                    },
                    updated: (opt) => {
                        // 重置keys
                        keysRef.current = [];
                        const update = [];
                        const add = [];
                        const deleteData = [];
                        const file = luckysheet.getAllSheets()[0];
                        const insertRow = (step, r) => {
                            const defKeyIndex = columns.findIndex(c => c.key === 'defKey');
                            // eslint-disable-next-line max-len
                            const newDefKey = updateRowsDefKey(opt.curdata[r][defKeyIndex].v, opt.data);
                            if(newDefKey !== opt.curdata[r][defKeyIndex].v) {
                                updateCellValue(file, r, opt, defKeyIndex,newDefKey);
                            }
                            // 判断是否存在基本数据类型
                            const dbDataType = columns.findIndex(h => h.key === 'dbDataType');
                            if(dbDataType > -1) {
                                const tempValue = opt.curdata[r][dbDataType]?.v;
                                if(tempValue && !tempValue.startsWith('?')) {
                                    const dataType = matchBaseDataType(tempValue);
                                    updateCellValue(file, r, opt, dbDataType, dataType?.dbDataType?.[dbDialect] || `?${tempValue}`);
                                }
                            }
                            const rowData = getRowData([opt.curdata[r]]);
                            const sameStep = add.find(row => row.step === step);
                            if(sameStep) {
                                sameStep.rows.push(...rowData);
                            } else {
                                add.push({
                                    step,
                                    rows: rowData,
                                });
                            }
                        };
                        const fillNumberArray = (array) => {
                            const min = array[0];
                            const max = array[array.length - 1];
                            if(min === max) {
                                return [min];
                            }
                            const tempArray = [];
                            for (let i = 1 ; i < (max - min); i += 1) {
                                tempArray.push(min + i);
                            }
                            return [min, ...tempArray, max];
                        };
                        switch (opt.type) {
                            case 'addRC':
                                // eslint-disable-next-line no-case-declarations
                                const index = opt.ctrlValue.direction === 'lefttop' ? 0 : 1;
                                if(opt.optType === 'undo') {
                                    removeRows && removeRows(opt.curData
                                        .slice(opt.ctrlValue.index + index,
                                            opt.ctrlValue.index + opt.ctrlValue.len + index)
                                        .map(o => o[0].customKey.id));
                                } else {
                                    const rows = getRowData(opt.curData
                                        .slice(opt.ctrlValue.index + index,
                                            opt.ctrlValue.index + opt.ctrlValue.len + index));
                                    addRows && addRows([{
                                        step: opt.ctrlValue.direction === 'lefttop' ? opt.ctrlValue.index : opt.ctrlValue.index + 1,
                                        rows,
                                    }]);
                                    updateRowVerification(file, rows);
                                }
                                break;
                            case 'delRC':
                                if(opt.optType === 'undo') {
                                    addRows && addRows([{
                                        step: opt.ctrlValue.index,
                                        rows: getRowData(opt.curdata.slice(opt.ctrlValue.index,
                                            opt.ctrlValue.index + opt.ctrlValue.len)),
                                    }]);
                                } else {
                                    // eslint-disable-next-line no-case-declarations
                                    const rows = opt.data
                                        .slice(opt.ctrlValue.index,
                                            opt.ctrlValue.index + opt.ctrlValue.len)
                                        .map(r => r[0].customKey.id).filter(r => !!r);
                                    rows.length > 0 && removeRows && removeRows(rows);
                                }
                                break;
                            case 'datachange':
                                if(opt.optType === 'undo') {
                                    fillNumberArray(opt.range[0].row).forEach((r) => {
                                        if(opt.curdata[r]) {
                                            if(opt.curdata[r][0].customKey.id) {
                                                // 1.修改单元格
                                                const [curRow, preRow] =
                                                    // eslint-disable-next-line max-len
                                                    getRowData([opt.curdata[r], opt.data[r]], false);
                                                update.push(fillNumberArray(opt.range[0].column)
                                                    .reduce((pre, next) => {
                                                        const key = columns[next].key;
                                                        const changes = cellUpdated(r, next,
                                                            file, opt.optType, preRow);
                                                        const keys = changes.updateKeys ? `${changes.updateKeys},${key}` : key;
                                                        return {
                                                            ...pre,
                                                            updateKeys: `${pre.updateKeys ? `${pre.updateKeys},${keys}` : keys}`,
                                                            pre: {
                                                                ...pre.pre,
                                                                ...changes.pre,
                                                                [key]: preRow[key],
                                                            },
                                                            next: {
                                                                ...pre.next,
                                                                ...changes.next,
                                                                [key]: curRow[key],
                                                            },
                                                        };
                                                    }, {
                                                        ...curRow,
                                                        updateKeys: '',
                                                        pre: {},
                                                        next: {},
                                                    }));
                                            } else {
                                                deleteData.push(opt.data[r][0].customKey.id);
                                            }
                                        } else {
                                            deleteData.push(opt.data[r][0].customKey.id);
                                        }
                                    });
                                    updateRows && updateRows(organizeUpdate(update).map((u) => {
                                        return {
                                            ...u,
                                            pre: id2Def([u.pre])[0],
                                            next: id2Def([u.next])[0],
                                        };
                                    }));
                                    deleteData.length > 0 && removeRows && removeRows(deleteData);
                                    luckysheet.luckysheetrefreshsimple(file.data);
                                } else {
                                    // 此处会有新增
                                    // eslint-disable-next-line no-case-declarations
                                    fillNumberArray(opt.range[0].row).forEach((r) => {
                                        if(opt.data[r]) {
                                            if(opt.data[r][0].customKey.id) {
                                                // 1.修改单元格
                                                // eslint-disable-next-line max-len
                                                updateRowId(file, r, opt, opt.data[r][0].customKey.id);
                                                const [curRow, preRow] =
                                                    // eslint-disable-next-line max-len
                                                    getRowData([opt.curdata[r], opt.data[r]], false);
                                                // eslint-disable-next-line max-len
                                                const updateKeys = fillNumberArray(opt.range[0].column)
                                                    .reduce((pre, next) => {
                                                        const key = columns[next].key;
                                                        if(opt.curdata[r][next].v
                                                            === opt.data[r][next].v) {
                                                            return pre;
                                                        }
                                                        let tempValue = curRow[key] === undefined ? '' : curRow[key];
                                                        if(key === 'defKey') {
                                                            if(!tempValue) {
                                                                updateCellValue(file, r, opt,
                                                                    next, preRow[key]);
                                                                return pre;
                                                                // eslint-disable-next-line max-len
                                                            } else if(checkDefKeyRepeat(curRow[key], r)) {
                                                                // 判断defKey重复
                                                                // eslint-disable-next-line max-len
                                                                tempValue = updateRowsDefKey(tempValue);
                                                                updateCellValue(file, r, opt,
                                                                    next, tempValue);
                                                                if(tempValue === preRow[key]) {
                                                                    return pre;
                                                                }
                                                            }
                                                        } else if(['primaryKey', 'notNull', 'autoIncrement'].includes(key)) {
                                                            // eslint-disable-next-line max-len
                                                            tempValue = verifyCheckboxData(tempValue);
                                                            updateCellValue(file, r, opt,
                                                                next, tempValue);
                                                        } else if(key === 'dbDataType' && !tempValue.startsWith('?')) {
                                                            // eslint-disable-next-line max-len
                                                            const dataType = matchBaseDataType(tempValue);
                                                            tempValue = dataType?.dbDataType?.[dbDialect] || `?${tempValue}`;
                                                            // eslint-disable-next-line max-len
                                                            updateCellValue(file, r, opt, next, tempValue);
                                                        }
                                                        const changes = cellUpdated(r, next, file,
                                                            opt.optType, opt.curdata[r]);
                                                        const keys = changes.updateKeys ? `${changes.updateKeys},${key}` : key;
                                                        return {
                                                            ...pre,
                                                            updateKeys: `${pre.updateKeys ? `${pre.updateKeys},${keys}` : keys}`,
                                                            pre: {
                                                                ...pre.pre,
                                                                ...changes.pre,
                                                                [key]: preRow[key],
                                                            },
                                                            next: {
                                                                ...pre.next,
                                                                ...changes.next,
                                                                [key]: tempValue,
                                                            },
                                                        };
                                                    }, {
                                                        ...curRow,
                                                        updateKeys: '',
                                                        pre: {},
                                                        next: {},
                                                    });
                                                if(updateKeys.updateKeys) {
                                                    update.push(updateKeys);
                                                }
                                            } else {
                                                updateRowId(file, r, opt);
                                                insertRow(r, r);
                                            }
                                        } else {
                                            // 2.新增单元格 表格最后插入
                                            const step =  opt.data.length;
                                            updateRowId(file, r, opt);
                                            insertRow(step, r);
                                        }
                                    });
                                    console.log(organizeUpdate(update));
                                    updateRows && updateRows(organizeUpdate(update).map((u) => {
                                        return {
                                            ...u,
                                            pre: id2Def([u.pre])[0],
                                            next: id2Def([u.next])[0],
                                        };
                                    }));
                                    add.length > 0 && addRows && addRows(add.map((a) => {
                                        return {
                                            ...a,
                                            rows: id2Def(a.rows),
                                        };
                                    }));
                                    updateRowVerification(file,
                                        add.reduce((p, n) => p.concat(n.rows), update));
                                }
                                break;
                            case 'updateDataVerificationOfCheckbox':
                                // eslint-disable-next-line no-case-declarations
                                const rowIndex = opt.range.row[0];
                                // eslint-disable-next-line no-case-declarations
                                const columnIndex = opt.range.column[0];
                                if(opt.optType === 'undo') {
                                    updateRows && updateRows([{
                                        ...getRowData([opt.curdata[rowIndex]], false)[0],
                                        updateKeys: columns[columnIndex].key,
                                        pre: {
                                            // eslint-disable-next-line max-len
                                            [columns[columnIndex].key]: opt.data[rowIndex][columnIndex].v,
                                        },
                                        next: {
                                            // eslint-disable-next-line max-len
                                            [columns[columnIndex].key]: opt.curdata[rowIndex][columnIndex].v,
                                        }}]);
                                } else {
                                    updateRows && updateRows([{
                                        ...getRowData([opt.curData[rowIndex]], false)[0],
                                        updateKeys: columns[columnIndex].key,
                                        pre: {
                                            // eslint-disable-next-line max-len
                                            [columns[columnIndex].key]: opt.data[rowIndex][columnIndex].v,
                                        },
                                        next: {
                                            // eslint-disable-next-line max-len
                                            [columns[columnIndex].key]: opt.curData[rowIndex][columnIndex].v,
                                        },
                                    }]);
                                }
                                break;
                            default: break;
                        }
                    },
                    columnTitleCellRender:  (columnAbc) => {
                        return columns[columnAbc].label;
                    },
                },
                data: [{
                    name: 'Cell',
                    defaultRowHeight: 27,
                    config: {
                        columnlen: columnWidth,
                    },
                    celldata: currentCellData,
                    dataVerification: getDataVerification(currentCellData),
                }],
                cellRightClickConfig: {
                    copy: true, // 复制
                    copyAs: false, // 复制为
                    paste: true, // 粘贴
                    insertRow: true, // 插入行
                    insertColumn: false, // 插入列
                    deleteRow: true, // 删除选中行
                    deleteColumn: false, // 删除选中列
                    deleteCell: false, // 删除单元格
                    hideRow: false, // 隐藏选中行和显示选中行
                    hideColumn: false, // 隐藏选中列和显示选中列
                    rowHeight: true, // 行高
                    columnWidth: true, // 列宽
                    clear: true, // 清除内容
                    matrix: false, // 矩阵操作选区
                    sort: false, // 排序选区
                    filter: false, // 筛选选区
                    chart: false, // 图表生成
                    image: false, // 插入图片
                    link: false, // 插入链接
                    data: false, // 数据验证
                    cellFormat: false, // 设置单元格格式
                    customs: [{
                        title: '冻结首行',
                        onClick:  () => {
                            luckysheet.setHorizontalFrozen(false);
                        },
                    },{
                        title: '冻结行至选区',
                        onClick:  (clickEvent, event, params) => {
                            luckysheet.setHorizontalFrozen(true, {
                                range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                            });
                        },
                    },{
                        title: '冻结首列',
                        onClick:  () => {
                            luckysheet.setVerticalFrozen(false);
                        },
                    },{
                        title: '冻结列至选区',
                        onClick:  (clickEvent, event, params) => {
                            luckysheet.setVerticalFrozen(true, {
                                range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                            });
                        },
                    },
                        {
                            title: '冻结首行首列',
                            onClick:  () => {
                                luckysheet.setBothFrozen(false);
                            },
                        },
                        {
                            title: '冻结行列至选区',
                            onClick:  (clickEvent, event, params) => {
                                luckysheet.setBothFrozen(true, {
                                    // eslint-disable-next-line max-len
                                    range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                                });
                            },
                        },
                        {
                            title: '取消冻结',
                            onClick:  () => {
                                luckysheet.cancelFrozen();
                            },
                        }],
                },
            };
            luckysheet.create(options);
        });
        return () => {
            luckysheet.destroy();
        };
    }, []);
    const addRow = (rows) => {
        luckysheet.insertRow(luckysheet.flowdata().length - 1,
            {number: rows, direction: 'rightbottom'});
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-opt`}>
        <span>
          <span
            onClick={() => addRow(1)}
          >
            追加
          </span>
          <DropDown
            menuClick={m => addRow(m.key)}
            trigger='click'
            menus={[
                  {key: 5, name: '5条'},
                  {key: 10, name: '10条'},
              ]}
            position='top'>
            <Icon type='icon-down-more-copy'/>
          </DropDown>
        </span>
      </div>
      <div className={`${currentPrefix}-content`} id={`${container}`}/>
    </div>;
}));
