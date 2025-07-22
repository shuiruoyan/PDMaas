import React, {
    useCallback,
    useMemo,
    useState,
    useRef,
    useImperativeHandle,
    forwardRef,
    useEffect,
    useContext,
} from 'react';
import {IconTitle, Table, openModal, Sheet, Button, Tooltip, Switch, Message, AutoCom} from 'components';
import _ from 'lodash';
import {getPrefix} from '../../../../../lib/classes';
import {moveArrayPositionByArray} from '../../../../../lib/array';
import {WS} from '../../../../../lib/constant';
import {getId} from '../../../../../lib/idpool';
import {antiShake, Copy, Paste} from '../../../../../lib/event';
import {
    filterRepeatKey,
    getEmptyField,
    pasteFilterKey,
} from '../../../../../lib/utils';
import {
    getDefaultColumn,
    getColumnComponent,
} from '../../../../../lib/component';
import {OperationTip} from './OperationTip';
import {
    baseLogicNsKey,
    basePhysicNsKey,
    checkPermission,
    fieldNsKey,
} from '../../../../../lib/permission';
import {getRecommend, setRecommend} from '../../../../../lib/cache';
import {ViewContent} from '../../../../../lib/context';
import {valueCompare} from '../../../../../lib/string';
import MarkChange from './MarkChange';



export default React.memo(forwardRef(({
                                          defaultData,
                                          getCurrentDataSource,
                                          onChange,
                                          onFieldsChange,
                                          onIndexesChange,
                                          entityData,
                                          onFieldsAdd,
                                          onFieldsDelete,
                                          onFieldsMove,
                                          profile,
                                          onColumnsChange,
                                          currentDataRef,
                                          defaultDataSource,
                                          user,
                                      }, ref) => {
    const [focusData, setFocusData] = useState({
        columnKey: '',
        rowId: '',
    });
    const reserveWord = user.reserveWord || [];
    const isView = useContext(ViewContent);
    const entityDataRef = useRef(null);
    entityDataRef.current = entityData;
    const sheetRef = useRef(null);
    const optRef = useRef([]);
    const tableRef = useRef(null);
    const [optIndex, setOptIndex] = useState(0);
    const optStatusRef = useRef(false);
    const [selected, setSelected] = useState([]);
    const selectedRef = useRef([]);
    selectedRef.current = [...selected];
    const [columnSelected, setColumnSelected] = useState([]);
    const [fields, setFields] = useState(defaultData.fields);
    const currentPrefix = getPrefix('container-model-entity-physical-content-fields');
    const fieldsRef = useRef([]);
    const exchangeCaseColumn = useRef(['defKey', 'defName']);
    fieldsRef.current = [...fields];
    const Group = IconTitle.Group;
    const profileRef = useRef(null);
    profileRef.current = profile;
    const createByFreeNsKeyRef = useRef(checkPermission(fieldNsKey.createByFree));
    const recommend = getRecommend(defaultDataSource.id);
    const [similar, setSimilar] = useState(!!recommend.similar);
    const similarRef = useRef(false);
    similarRef.current = similar;
    const allFieldsRef = useRef([]);
    const entitiesRef = useRef([]);
    const getAllFields = () => {
        const entities = getCurrentDataSource().project.entities;
        if(entitiesRef.current !== entities) {
            allFieldsRef.current = getCurrentDataSource().project.entities.filter((e) => {
                if(e.type === 'P') {
                    return checkPermission(basePhysicNsKey);
                } else if(e.type === 'L') {
                    return checkPermission(baseLogicNsKey);
                }
                return false;
            }).reduce((a, b) => {
                return a.concat(b.fields.map(f => ({
                    entityDefKey: b.defKey, entityDefName: b.defName, field: f,
                })));
            }, []);
        }
        return allFieldsRef.current;
    };
    const updateOpt = (opt) => {
        if(optStatusRef.current) {
            // 撤销过程中加入其他操作 删除上次撤销数据
            optRef.current.splice(optIndex);
        }
        // 推入执行队列
        optRef.current.push(opt);
        // 重置撤销状态
        optStatusRef.current = false;
        // 判断长度是否超过一千 最多保留一千条操作记录
        optRef.current = optRef.current.slice(-1000);
        // 重置索引
        setOptIndex(optRef.current.length);
    };
    useEffect(() => {
        onChange && onChange();
    }, [fields]);
    useEffect(() => {
        setRecommend(defaultDataSource.id, {
            similar,
        });
    }, [similar]);
    const onDefKeyChange = (opt) => {
        const temp = [...opt];
        const updateDefKeys = temp
            .filter(f => f.updateKeys.split(',').includes('defKey'))
            .map(f => ({
                id: f.id,
                defKey: f.next.defKey,
            }));
        if(updateDefKeys.length === 0) {
            return;
        }
        const updateIds = updateDefKeys.map(f => f.id);
        const currentIndexes = entityDataRef.current?.indexes || [];
        const filterIndexes = currentIndexes.filter((i) => {
            return i.fields.find(f => updateIds.includes(f.fieldId));
        });
        if(filterIndexes.length === 0) {
            return;
        }
        onIndexesChange && onIndexesChange([...(filterIndexes || [])].map((i) => {
            return {
                id: i.id,
                defKey: i.defKey,
                defName: i.defName,
                updateKeys: 'fields',
                pre: {
                    fields: i.fields,
                    defKey: i.defKey,
                },
                next: {
                    defKey: i.defKey,
                    fields: i.fields.map((f) => {
                        const find = updateDefKeys.find(u => u.id === f.fieldId);
                        if(find) {
                            return {
                                ...f,
                                fieldDefKey: find.defKey,
                            };
                        }
                        return f;
                    }),
                },
            };
        }));
    };
    const onDefKeyDel = (opt) => {
        const temp = [...opt];
        const delIds = temp.map(f => f.id);
        if(delIds.length === 0) {
            return;
        }
        const currentIndexes = entityDataRef.current.indexes;
        const filterIndexes = currentIndexes.filter((i) => {
            return i.fields.find(f => delIds.includes(f.fieldId));
        });
        if(filterIndexes.length === 0) {
            return;
        }
        onIndexesChange && onIndexesChange([...(filterIndexes || [])].map((i) => {
            return {
                id: i.id,
                defKey: i.defKey,
                defName: i.defName,
                updateKeys: 'fields',
                pre: {
                    fields: i.fields,
                    defKey: i.defKey,
                },
                next: {
                    defKey: i.defKey,
                    fields: i.fields.filter(f => !delIds.includes(f.fieldId)),
                },
            };
        }));
    };
    const validateDefKey = (defKey, rowId) => {
        let tempValue = defKey;
        if(fieldsRef.current.find(f => f.defKey?.toLocaleLowerCase?.() ===
            tempValue?.toLocaleLowerCase?.() && f.id !== rowId)) {
            tempValue = filterRepeatKey(
                [...(fieldsRef.current.filter(f => f.id !== rowId) || [])],
                tempValue);
        }
        return tempValue;
    };
    const calcFieldOthers = (column, value, rowData, other) => {
        let otherProps = {};
        const opts = [];
        const updateFieldByField = () => {
            const defKey = validateDefKey(other.field.defKey, rowData.id);
            const newField = {...other.field, defKey};
            delete newField.id;
            delete newField.origin;
            delete newField.updatedUserId;
            otherProps = {
                ...rowData,
                ...newField,
            };
            opts.push(...Object.keys(newField).map((f) => {
                return {
                    updateKey: f,
                    pre: rowData[f],
                    next: newField[f],
                };
            }));
        };
        // 如果是数据域发生了变化 需要更新 基本数据类型/数据库类型/长度/精度
        if(column === 'bizDomainType' && value) {
            const domain = profileRef.current.team.bizDomainTypes
                .find(d => d.defKey === value);
            const dbDialect = profileRef.current.project.dbDialect;
            const baseDataType = profileRef.current.global.dataTypes
                .find(d => d.defKey === domain?.baseDataType);
            otherProps = {
                baseDataType: domain?.baseDataType,
                dbDataType: baseDataType?.dbDataType?.[dbDialect] || '',
                dataLen: domain?.dataLen || '',
                numScale: domain?.numScale || '',
                primaryKey: domain?.primaryKey || 0,
                notNull: domain?.notNull || 0,
                autoIncrement: domain?.autoIncrement || 0,
            };
            opts.push({
                updateKey: 'baseDataType',
                pre: rowData.baseDataType,
                next: domain?.baseDataType,
            }, {
                updateKey: 'dbDataType',
                pre: rowData.dbDataType,
                next: baseDataType?.dbDataType?.[dbDialect] || '',
            }, {
                updateKey: 'dataLen',
                pre: rowData.dataLen,
                next: domain?.dataLen || '',
            }, {
                updateKey: 'numScale',
                pre: rowData.numScale,
                next: domain?.numScale || '',
            },{
                updateKey: 'primaryKey',
                pre: rowData.primaryKey,
                next: domain?.primaryKey || 0,
            },{
                updateKey: 'notNull',
                pre: rowData.notNull,
                next: domain?.notNull || 0,
            },{
                updateKey: 'autoIncrement',
                pre: rowData.autoIncrement,
                next: domain?.autoIncrement || 0,
            });
        } else if(['dbDataType', 'dataLen', 'numScale', 'primaryKey', 'notNull', 'autoIncrement'].includes(column)) {
            // 如果是数据库类型/长度/精度发生了变化 需要清空数据域
            otherProps.bizDomainType = '';
            opts.push({
                updateKey: 'bizDomainType',
                pre: rowData.bizDomainType,
                next: '',
            });
            if(column === 'dbDataType') {
                const dbDialect = profileRef.current.project.dbDialect;
                const baseDataType = profileRef.current.global.dataTypes
                    .find(d => d.dbDataType?.[dbDialect] === value);
                // 如果是数据库类型 需要修改基本数据类型
                otherProps.baseDataType = baseDataType?.defKey || '';
                opts.push({
                    updateKey: 'baseDataType',
                    pre: rowData.baseDataType,
                    next: baseDataType?.defKey || '',
                });
                // 如果当前的数据类型没有长度和小数 则需要清除字段的长度和小数
                // requireLen:1 requireScale:0 dataLen numScale
                if(baseDataType) {
                    // 不需要长度
                    if(baseDataType.requireLen === 0) {
                        otherProps.dataLen = '';
                        opts.push({
                            updateKey: 'dataLen',
                            pre: rowData.dataLen,
                            next: '',
                        });
                    }
                    // 不需要精度
                    if(baseDataType.requireScale === 0) {
                        otherProps.numScale = '';
                        opts.push({
                            updateKey: 'numScale',
                            pre: rowData.numScale,
                            next: '',
                        });
                    }
                }
            }
            if(column === 'primaryKey') {
                otherProps.notNull = 1;
                opts.push({
                    updateKey: 'notNull',
                    pre: rowData.notNull,
                    next: 1,
                });
            }
        } else if((similarRef.current) && (column === 'defKey' || column === 'defName')) {
            // 校验字段重复
            if(other) {
                updateFieldByField();
            } else if(column === 'defKey'){
                const defKey = validateDefKey(value, rowData.id);
                otherProps = {
                    defKey,
                };
                opts.push({
                    updateKey: 'defKey',
                    pre: rowData.defKey,
                    next: defKey,
                });
            }
        }
        return {
            otherProps,
            opts: opts.filter(o => !valueCompare(o.pre, o.next)).map((o) => {
                return {
                    id: rowData.id,
                    defKey: rowData.defKey,
                    defName: rowData.defName,
                    ...o,
                };
            }) };
    };
    const sendData = (value, column, rowId, preValue, columnData, rowData, opts) => {
        // 发送消息
        if(!valueCompare(value, preValue) || opts.length > 0) {
            // 自己的变更 拼接上关联的变更
            let updateKeys = '';
            let pre = {};
            let next = {};
            let hsaExist = false;
            if(opts.length > 0) {
                updateKeys = _.map(opts, 'updateKey').join(',');
                pre = _.fromPairs(_.map(opts, item => [item.updateKey, item.pre]));
                next = _.fromPairs(_.map(opts, item => [item.updateKey, item.next]));
                if(updateKeys.includes(column)) {
                    hsaExist = true;
                }
            }
            const sendOpts = [{
                id: rowId,
                defKey: rowData.defKey,
                defName: rowData.defName,
                // eslint-disable-next-line no-nested-ternary
                updateKeys: hsaExist ? updateKeys : (updateKeys ? `${column},${updateKeys}` : column),
                pre: {
                    [column]: preValue,
                    ...pre,
                },
                next: {
                    [column]: value,
                    ...next,
                },
            }];
            let selectFields = [];
            if(selectedRef.current.includes(rowId)) {
                selectFields = fieldsRef.current.filter(f => selectedRef.current.includes(f.id));
            }
            if(columnData.component === 'Select' && selectFields.length > 0) {
                selectFields.map((f) => {
                    if(f.id !== rowId && value !== f[columnData.key]) {
                        sendOpts.push({
                            id: f.id,
                            defKey: f.defKey,
                            defName: f.defName,
                            updateKeys: `${column},${updateKeys}`,
                            pre: {
                                [column]: f.value,
                                ..._.pick(f, `${column},${updateKeys}`.split(',')),
                            },
                            next: {
                                [column]: value,
                                ...next,
                            },
                        });
                    }
                    return f;
                });
            }

            // 发送消息
            onFieldsChange && onFieldsChange(sendOpts);
            onDefKeyChange(sendOpts);
            // 记录所有的变更
            updateOpt({
                type: 'update',
                data: sendOpts,
            });
        }
    };
    const _onInputBlur = (value, column, rowId, preValue, columnData, rowData) => {
        if(preValue === value) {
            return;
        }
        if(column === 'defKey' || column === 'defName') {
            const keyWord = reserveWord
                .find(r => r.keyWord?.toLocaleLowerCase() === value?.toLocaleLowerCase());
            if(keyWord) {
                Message.error({title: `${column === 'defName' ? '名称' : '代码'}[${value}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
                setFields((p) => {
                    return p.map((r) => {
                        if(r.id === rowData.id) {
                            return {
                                ...r,
                                [column]: preValue,
                            };
                        }
                        return r;
                    });
                });
                return;
            }
        }
        const { otherProps, opts } = calcFieldOthers(column, value, rowData, preValue, columnData);
        if(opts.length > 0) {
            setFields((p) => {
                return p.map((r) => {
                    if(r.id === rowId) {
                        return {
                            ...r,
                            ...otherProps,
                        };
                    }
                    return r;
                });
            });
        }
        if(column === 'defKey') {
            let tempValue = value.replace(/[-—]/g, '_');
            if(/^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#\u4e00-\u9fff]*$/.test(tempValue)) {
                tempValue = validateDefKey(tempValue, rowId);
                if(fieldsRef.current.find(it => it.defKey.toLocaleLowerCase()
                    === tempValue.toLocaleLowerCase() && rowId !== it.id)) {
                    setFields((p) => {
                        return p.map((r) => {
                            if(r.id === rowId) {
                                return {
                                    ...r,
                                    [column]: preValue,
                                };
                            }
                            return r;
                        });
                    });
                    Message.error({title: '字段代码重复！'});
                } else {
                    setFields((p) => {
                        return p.map((r) => {
                            if(r.id === rowId) {
                                return {
                                    ...r,
                                    [column]: tempValue,
                                };
                            }
                            return r;
                        });
                    });
                    sendData(tempValue, column, rowId, preValue, columnData, rowData, opts);
                }
            } else {
                setFields((p) => {
                    return p.map((r) => {
                        if(r.id === rowId) {
                            return {
                                ...r,
                                [column]: preValue,
                            };
                        }
                        return r;
                    });
                });
                if(value.trim() !== '') {
                    Message.error({title: '必须以字母，下划线，$,#，中文开头，可包含数字、字母，下划线，$,#，中文'});
                }
            }
        } else {
            setFields((p) => {
                return p.map((r) => {
                    if(r.id === rowData.id) {
                        return {
                            ...r,
                            [column]: value,
                        };
                    }
                    return r;
                });
            });
            sendData(value, column, rowId, preValue, columnData, rowData, opts);
        }
    };
    const _onChange = useCallback((value, column, row, preValue, columnData, rowData, other) => {
        onChange && onChange(value, column, row, preValue, columnData, rowData);
        if(columnData.component !== 'Input' && columnData.component !== 'NumberInput') {
            // 非失焦的组件 需要事实计算关联修改
            const { otherProps, opts } = calcFieldOthers(column, value, rowData, other,
                preValue, columnData);
            if(!otherProps) {
                return;
            }
           if(selectedRef.current.includes(row) && preValue !== value) {
                setFields((p) => {
                    return p.map((r) => {
                        if(r.id === row || (columnData.component === 'Select' && selectedRef.current.includes(r.id))) {
                            return {
                                ...r,
                                ...otherProps,
                                [column]: value,
                            };
                        }
                        return r;
                    });
                });
            } else {
                setFields((p) => {
                    return p.map((r) => {
                        if(r.id === row) {
                            return {
                                ...r,
                                [column]: value,
                                ...otherProps,
                            };
                        }
                        return r;
                    });
                });
            }
            sendData(value, column, row, preValue, columnData, rowData, opts);
        } else {
            // 失焦组件 change时不计算 失焦时才计算
            setFields((p) => {
                return p.map((r) => {
                    if(r.id === row) {
                        return {
                            ...r,
                            [column]: value,
                        };
                    }
                    return r;
                });
            });
        }
    }, []);
    const validateKeyWordValue = (name, value) => {
        const keyWord = reserveWord
            .find(r => r.keyWord?.toLocaleLowerCase() === value?.toLocaleLowerCase());
        if(keyWord) {
            Message.error({title: `${name === 'defName' ? '名称' : '代码'}[${value}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
            return false;
        }
        return true;
    };
    const validateKeyValue = (value, p) => {
        let tempValue = value;
        if(fieldsRef.current.find(f => f.defKey?.toLocaleLowerCase?.() ===
            tempValue?.toLocaleLowerCase?.() && f.defKey !== p)) {
            tempValue = filterRepeatKey(
                [...(fieldsRef.current.filter(f => f.defKey !== p) || [])],
                tempValue);
        }
        return tempValue !== p;
    };
    const validateSearchValue = (value, name, p) => {
        // 不能是关键字 不能重复
        if(name === 'defKey') {
            return validateKeyValue(value, p) && validateKeyWordValue(name, value);
        }
        return validateKeyWordValue(name, value);
    };
    const columns = useMemo(() => {
        const defaultColumn = getDefaultColumn(profile);
        const physicEntityHeader = _.fromPairs(_.sortBy(
            Object.entries(profile.project.setting.physicEntityHeader),
            ([, value]) => value.orderValue));
        const physicEntityFieldAttr = profile.project.setting.physicEntityFieldAttr;
        const physicEntity = profile.user.freezeEntityHeader.physicEntity;
        const physicEntityKeys = _.keys(physicEntity);

        return Object.keys(physicEntityHeader || {}).map((c) => {
            const column = defaultColumn.find(col => col.key === c);
            if(column) {
                return {
                    ...column,
                    width: physicEntityHeader[c].columnWidth,
                    enable: physicEntityHeader[c].enable === 1,
                };
            }
            const attr = physicEntityFieldAttr?.[c];
            if(attr) {
                return {
                    key: c,
                    label: attr.title || c,
                    ...getColumnComponent(attr),
                    resize: true,
                    width: physicEntityHeader[c].columnWidth,
                    enable: physicEntityHeader[c].enable === 1,
                    props: {
                        valueFormat: {
                            checked: '1',
                            unchecked: '0',
                        },
                    },
                };
            }
            return null;
        }).filter(c => c && c.enable).map((temp) => {
            const t = {...temp};
            physicEntityKeys.map((p) => {
                if(p === temp.key) {
                    t.width = physicEntity[p].width;
                    t.fixed = physicEntity[p].fixed;
                }
                return p;
            });
            // numScale dataLen
            if(t.key === 'numScale' || t.key === 'dataLen') {
                return {
                    ...t,
                    effectUpdate: (pre, next) => {
                        return pre.row?.baseDataType === next.row?.baseDataType;
                    },
                    component: (value, rowKey, cellName, row, change, resize, readOnly, tempProps, {
                        onBlur, onFocus,
                    }) => {
                        const checkClearValue = (key) => {
                            if(row.baseDataType) {
                                const baseDataType = profileRef.current.global.dataTypes
                                    .find(d => d.defKey === row.baseDataType);
                                if(baseDataType) {
                                    return key === 'numScale' ? baseDataType.requireScale === 0 : baseDataType.requireLen === 0;
                                }
                                return false;
                            }
                            return false;
                        };
                        const clearValue = checkClearValue();
                        return <AutoCom
                          props={{maxLength: clearValue ? 0 : 14}}
                          readOnly={readOnly}
                          component='NumberInput'
                          value={value}
                          onFocus={() => onFocus(cellName, rowKey, t)}
                          onBlur={(next, pre) => onBlur(next, cellName, rowKey, pre, t)}
                        />;
                    },
                };
            } else if(t.key === 'baseDataType') {
                // 基本数据类型只读
                return {
                    ...t,
                    readOnly: true,
                };
            } else if(similar && (t.key === 'defKey' || t.key === 'defName')) {
                return {
                    ...t,
                    component: 'SearchInputTree',
                    fieldNames: { defKey: 'subjectId', defName: 'subjectName' },
                    props: {
                        validate: (v, p) => validateSearchValue(v, t.key, p),
                        readOnly: !checkPermission(fieldNsKey.createByFree)
                            && !checkPermission(fieldNsKey.createByStandard),
                        scrollStyle: true,
                        minHeight: 400,
                        getAllFields,
                        similarEnable: similar && checkPermission(fieldNsKey.createByFree),
                        similarName: t.key,
                    },
                };
            }
            return t;
        })
        .map((d) => {
            if((d.component === 'Select' && d.width < 100) ||
                (d.component === 'MultipleSelect' && d.width < 100) ||
                (d.component === 'TreeSelect' && d.width < 100)) {
                return {
                    ...d,
                    width: 100,
                };
            }
            return d;
        })
        .map((d) => {
            if (d.key === 'defKey' || d.key === 'defName') {
                return {
                    ...d,
                    props: {
                        ...d.props,
                        readOnly: !createByFreeNsKeyRef.current,
                    },
                };
            } else if (d.key !== 'baseDataType') {
                return {
                    ...d,
                   readOnly: !createByFreeNsKeyRef.current,
                };
            }
            return d;
        });

    }, [profile, similar]);
    const tempAddRef = useRef([]);
    const getMaxSelectedStep = () => {
        return selected.length > 0 ? Math.max(...selected.map((s) => {
            return fields.findIndex(f => f.id === s);
        })) + 1 : fields.length;
    };

    const addShake = useCallback(antiShake((step) => {
        updateOpt({
            type: 'add',
            step,
            data: [...tempAddRef.current],
        });
        onFieldsAdd && onFieldsAdd([{
            step,
            data: [...tempAddRef.current],
        }]);
        tempAddRef.current = [];
    }), []);
    const getFieldDefault = () => {
        const domain = profileRef.current.team.bizDomainTypes[0];
        let opts = {};
        if(domain) {
            const dbDialect = profileRef.current.project.dbDialect;
            const baseDataType = profileRef.current.global.dataTypes
                .find(d => d.defKey === domain?.baseDataType);
            opts = {
                bizDomainType: domain.defKey,
                baseDataType: domain?.baseDataType,
                dbDataType: baseDataType?.dbDataType?.[dbDialect] || '',
                dataLen: domain?.dataLen || '',
                numScale: domain?.numScale || '',
                primaryKey: domain?.primaryKey || 0,
                notNull: domain?.notNull || 0,
                autoIncrement: domain?.autoIncrement || 0,

            };
        }
        return opts;
    };
    const dropClick = (m) => {
        const ids = getId(m.key);
        if(ids.length === 0) {
            Message.warring({title: '操作太快了'});
        } else {
            const maxStep = getMaxSelectedStep();
            const tempData = [];
            for (let i = 0; i < m.key; i += 1) {
                tempData.push({
                    ...getEmptyField(),
                    defKey: filterRepeatKey([...fieldsRef.current,
                        ...tempData], `column_${maxStep + i}`),
                    ...getFieldDefault(),
                    id: ids[i],
                });
            }
            setFields((p) => {
                const temp = [...p];
                temp.splice(maxStep, 0, ...tempData);
                return temp;
            });
            if(selected.length > 0) {
                tempAddRef.current = tempData.concat(tempAddRef.current);
            } else {
                tempAddRef.current.push(...tempData);
            }
            addShake(maxStep);
        }
    };
    const onDelete = () => {
        const deleteFields = fields.filter(f => selected.findIndex(s => s === f.id) > -1);
        const temp = _.sortBy(selected.map((id) => {
            const index = _.findIndex(fieldsRef.current, { id });
            return {
                step: index,
                data: fields[index],
            };
        }), 'step');
        updateOpt({
            type: 'delete',
            data: _.map(temp, 'data'),
            step: _.map(temp, 'step'),
        });
        setFields((p) => {
            return p.filter(d => !selected.includes(d.id));
        });
        tableRef.current.resetSelected();
        setSelected([]);
        onFieldsDelete && onFieldsDelete(deleteFields);
        onDefKeyDel(deleteFields);
    };
    const onSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);
    const undo = (e) => {
        // 获取焦点 让其他组件先失焦
        e.currentTarget.focus();
        // 进入撤销状态
        optStatusRef.current = true;
        // 执行撤销命令
        const currentIndex = optIndex - 1;
        const opt = optRef.current[currentIndex];
        if(opt.type === 'delete') {
            setFields((p) => {
                const temp = [...p];
                opt.data.map((d,i) => {
                    temp.splice(opt.step[i], 0, d);
                    return d;
                });
                // temp.splice(opt.step, 0, ...opt.data);
                return temp;
            });
            setSelected(opt.data.map(d => d.id));
            onFieldsAdd && onFieldsAdd(opt.data.map((d,i) => {
                return {
                    step: opt.step[i],
                    data: [d],
                };
            }));
        } else if(opt.type === 'update') {
            setFields((p) => {
                return p.map((f) => {
                    const updateFields = opt.data.filter(o => o.id === f.id);
                    if(updateFields.length > 0) {
                        // return updateFields.reduce((pre, next) => {
                        //     return {
                        //         ...pre,
                        //         [next.updateKey]: next.pre,
                        //     };
                        // }, f);
                        let t = {...f};
                        updateFields.map((o) => {
                            t = {
                                ...t,
                                ...o.pre,
                            };
                            return o;
                        });
                        return t;
                    }
                    return f;
                });
            });
            onFieldsChange && onFieldsChange(opt.data.map((o) => {
                return {
                    ...o,
                    pre: o.next,
                    next: o.pre,
                };
            }));
            onDefKeyChange(opt.data.map((o) => {
                return {
                    ...o,
                    pre: o.next,
                    next: o.pre,
                };
            }));
        } else if(opt.type === 'move') {
            const tempFields = moveArrayPositionByArray(fields,
                opt.data.map(d => d.id),
                -opt.step, 'id');
            setFields(tempFields);
            onFieldsMove && onFieldsMove(-opt.step, opt.data);
        } else {
            setFields((p) => {
                return p.filter(d => opt.data.findIndex(o => o.id === d.id) < 0);
            });
            onFieldsDelete && onFieldsDelete(opt.data);
            onDefKeyDel(opt.data);
        }
        // 撤销结束后指向下一个命令
        setOptIndex(currentIndex);
        //console.log(optIndex, optRef.current);
    };
    const redo = () => {
        // 进入重做状态
        optStatusRef.current = true;
        // 执行重做命令
        const currentIndex = optIndex;
        const opt = optRef.current[currentIndex];
        if(opt.type === 'add') {
            setFields((p) => {
                const temp = [...p];
                temp.splice(opt.step, 0, ...opt.data);
                return temp;
            });
            setSelected(opt.data.map(d => d.id));
            // onFieldsAdd && onFieldsAdd(opt.step, opt.data);
            onFieldsAdd && onFieldsAdd([{
                data: opt.data,
                step: opt.step,
            }]);
        } else if(opt.type === 'update') {
            setFields((p) => {
                return p.map((f) => {
                    const updateFields = opt.data.filter(o => o.id === f.id);
                    // if(updateFields.length > 0) {
                    //     return updateFields.reduce((pre, next) => {
                    //         return {
                    //             ...pre,
                    //             [next.updateKey]: next.next,
                    //         };
                    //     }, f);
                    // }
                    if(updateFields.length > 0) {
                        let t = {...f};
                        updateFields.map((o) => {
                            t = {
                                ...t,
                                ...o.next,
                            };
                            return o;
                        });
                        return t;
                    }
                    return f;
                });
            });
            onFieldsChange && onFieldsChange(opt.data);
            onDefKeyChange(opt.data);
        } else if(opt.type === 'move') {
            const tempFields = moveArrayPositionByArray(fields,
                opt.data.map(d => d.id),
                opt.step, 'id');
            setFields(tempFields);
            onFieldsMove && onFieldsMove(opt.step, opt.data);
        } else {
            setFields((p) => {
                return p.filter(d => opt.data.findIndex(o => o.id === d.id) < 0);
            });
            onFieldsDelete && onFieldsDelete(opt.data);
            onDefKeyDel(opt.data);
        }
        // 撤销结束后指向下一个命令
        setOptIndex(currentIndex + 1);
        console.log('redo');
    };
    const onMove = (type) => {
        let step = 0;
        const selectedIndex = selected.map((s) => {
            return fields.findIndex(f => f.id === s);
        });
        const selectedData = selectedIndex
            .map(i => _.pick(fields[i], ['id', 'defKey', 'defName']));
        const maxIndex = Math.max(...selectedIndex);
        const minIndex = Math.min(...selectedIndex);
        switch (type) {
            case WS.FIELD.MOVE_UP:
                step = minIndex === 0 ? 0 : -1;
                break;
            case WS.FIELD.MOVE_DOWN:
                step = (maxIndex === fields.length - 1) ? 0 : 1;
                break;
            case WS.FIELD.MOVE_TOP:
                step = minIndex === 0 ? 0 : -minIndex;
                break;
            case WS.FIELD.MOVE_BOTTOM:
                step = fields.length - 1 - maxIndex;
                break;
            default: break;
        }
        if(step !== 0) {
            const tempFields = moveArrayPositionByArray(fields,
                selected,
                step, 'id');
            updateOpt({
                type: 'move',
                step,
                data: selectedData,
            });
            onFieldsMove && onFieldsMove(step, selectedData);
            setFields(tempFields);
        }
    };
    useImperativeHandle(ref, () => {
        return {
            filterFields: (filterValue) => {
                tableRef.current?.filterRow?.(filterValue);
            },
            setSheetData: (updateFields) => {
                if(sheetRef.current) {
                    updateFields.forEach((f) => {
                        const updateKeys = f.updateKeys.split(',');
                        updateKeys.forEach((key) => {
                            sheetRef.current.setCellData(f.id, key, f.next[key]);
                        });
                    });
                }
            },
            addSheetData: (payload) => {
                if(sheetRef.current) {
                    sheetRef.current.addRow(payload);
                }
            },
            deleteSheetData: (updateFields) => {
                if(sheetRef.current) {
                    sheetRef.current.deleteRow(updateFields);
                }
            },
            setFields,
            getFields: () => {
                return fieldsRef.current;
            },
            setParams: (params) => {
                if(params?.jumpField) {
                    tableRef.current.scroll(params?.jumpField);
                }
            },
        };
    }, [fields]);
    const onCopy = () => {
        Copy(fields.filter(f => selected.includes(f.id)), '复制成功');
    };
    const onPaste = () => {
        if(!checkPermission(fieldNsKey.createByFree) || isView) {
            return;
        }
        Paste((text) => {
            try {
                const textJson = JSON.parse(text);
                const ids = getId(textJson.length);
                if(ids.length === 0) {
                    Message.warring({title: '操作太快了'});
                    return;
                }
                const maxStep = getMaxSelectedStep();
                const tempTextJsonArray = [];
                const tempData = textJson.map((t, i) => {
                    const tempArray = [...fieldsRef.current].concat([...tempTextJsonArray]);
                    const temp = pasteFilterKey(tempArray, t, ids[i]);
                    tempTextJsonArray.push(temp);
                    return {
                        ...temp,
                        dataLen: temp.dataLen === 0 ? '' : temp.dataLen,
                        numScale: temp.numScale === 0 ? '' : temp.numScale,
                    };

                });
                setFields((p) => {
                    const temp = [...p];
                    temp.splice(maxStep, 0, ...tempData);
                    return temp;
                });
                updateOpt({
                    type: 'add',
                    step: maxStep,
                    data: tempData,
                });
                // onFieldsAdd && onFieldsAdd(maxStep, tempData);
                onFieldsAdd && onFieldsAdd([{
                    step: maxStep,
                    data: tempData,
                }]);
            } catch (e) {
                Message.error({title: '格式错误'});
            }
        });
    };
    const getTitleByNode = () => {
        const node = getCurrentDataSource().profile.user.modelingNavDisplay.physicEntityNode;
        switch (node.optionValue) {
            case 'A':
                return `${currentDataRef.current.defKey}[${currentDataRef.current.defName || ''}]`;
            case 'N':
                return currentDataRef.current.defName || '';
            case 'K':
                return currentDataRef.current.defKey;
            default:
                return node.customValue
                    .replace(/\{defKey\}/g, currentDataRef.current.defKey)
                    .replace(/\{defName\}/g, currentDataRef.current.defName || '');
        }
    };
    const openSheet = () => {
        let modal;
        const onCancel = () => {
            sheetRef.current.destroy();
            modal.close();
        };
        const addRows = (data) => {
            const checkBaseDataType = (row) => {
                // 如果表格编辑没有基本数据类型 需要在此处补充
                const dbDialect = profileRef.current.project.dbDialect;
                const dbDataType = row.dbDataType || profileRef.current.global.dataTypes[0]?.dbDataType?.[dbDialect] || '';
                const baseDataType = profileRef.current.global.dataTypes
                    .find(d => d.dbDataType?.[dbDialect] === dbDataType)?.defKey || '';
                if(!row.baseDataType) {
                    return {
                        ...row,
                        dbDataType,
                        baseDataType: baseDataType,
                    };
                }
                return row;
            };
            const addRowsData = data.map((d) => {
                return {
                    step: d.step,
                    data: d.rows.map(row => checkBaseDataType({
                        ...getEmptyField(),
                        ...row,
                    })),
                };
            });
            setFields((pre) => {
                const temp = [...pre];
                addRowsData.map((d) => {
                    temp.splice(d.step, 0, ...d.data);
                    return d;
                });
                return temp;
            });
            onFieldsAdd && onFieldsAdd(addRowsData);

        };
        const removeRows = (data) => {
            onFieldsDelete && onFieldsDelete(fieldsRef.current
                .filter(f => data.find(id => id ===  f.id)));
            onDefKeyDel(fieldsRef.current
                .filter(f => data.find(id => id ===  f.id)));
            setFields((pre) => {
                return pre.filter(f => !data.find(id => id ===  f.id));
            });
        };
        const updateRows = (data) => {
            console.log(data);
            if(data.length === 0) {
                return;
            }
            setFields((pre) => {
                return pre.map((f) => {
                    const currentField = data.find(u => u.id === f.id);
                    if(currentField) {
                        return {
                            ...f,
                            ...currentField.next,
                        };
                    }
                    return f;
                });
            });
            onFieldsChange && onFieldsChange(data.map(d => ({
                ..._.pick(d, ['id', 'defKey', 'defName', 'updateKeys', 'pre', 'next']),
            })));
            onDefKeyChange(data.map(d => ({
                ..._.pick(d, ['id', 'defKey', 'defName', 'updateKeys', 'pre', 'next']),
            })));
        };
        const cellUpdateBefore = (column, value) => {
            if(column.key === 'defKey') {
                if(/^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#\u4e00-\u9fff]*$/.test(value)) {
                    return validateKeyWordValue(column, value);
                }
                Message.error({title: '必须以字母，下划线，$,#，中文开头，可包含数字、字母，下划线，$,#，中文'});
                return false;
            } else if(column.key === 'defName') {
                return validateKeyWordValue(column, value);
            }
            return true;
        };
        const domain = profileRef.current.team.bizDomainTypes[0];
        modal = openModal(<Sheet
          ref={sheetRef}
          cellUpdateBefore={cellUpdateBefore}
          addRows={addRows}
          removeRows={removeRows}
          updateRows={updateRows}
          profile={profileRef.current}
          emptyRow={{
              ...getEmptyField(),
              ...getFieldDefault(),
              bizDomainType: domain ? `${domain.defKey}[${domain.defName}]` : '',
          }}
          columns={columns}
          fields={fieldsRef.current.map((f) => {
              return {
                  ...f,
                  dataLen: f.dataLen || '',
                  numScale: f.numScale || '',
              };
          })}
        />, {
            bodyStyle: {
                width: '90%',
            },
            contentStyle: {
                height: '90vh',
            },
            title: (getCurrentDataSource && currentDataRef) ? `${getTitleByNode()}-表格编辑` : '表格编辑',
            buttons: [
              // <Button type='primary' key='ok' onClick={onOk}>
              //   确定
              // </Button>,
              <Button key='cancel' onClick={onCancel}>
                    关闭
              </Button>],
        });
    };
    const onColumnSelected = (column) => {
        setColumnSelected(column);
    };
    const exchangeCase = () => {
        if(fieldsRef.current.length === 0) {
            return;
        }
        const sendOpts = [];
        if(columnSelected.length !== 0) {
            const key = columnSelected[0].key;
            const tempKey = (fieldsRef.current[0][key] || '');
            const status = tempKey.toLocaleUpperCase() === tempKey ?
                'lower' : 'upper';
            fieldsRef.current.map((r) => {
                const preValue = r[key] || '';
                const nextValue = status === 'lower' ?
                    preValue.toLocaleLowerCase() : preValue.toLocaleUpperCase();
                if(preValue !== nextValue) {
                    sendOpts.push({
                        id: r.id,
                        defKey: r.defKey,
                        defName: r.defName,
                        updateKeys: key,
                        pre: {
                            [key]: r[key],
                        },
                        next: {
                            [key]: nextValue,
                        },
                    });
                }
                return r;
            });
            setFields((p) => {
                return p.map((r) => {
                    const preValue = r[key] || '';
                    const nextValue =  status === 'lower' ?
                        preValue.toLocaleLowerCase() : preValue.toLocaleUpperCase();
                    return {
                        ...r,
                        [key]: nextValue,
                    };
                });
            });
        } else {
            const key = focusData.columnKey;
            fieldsRef.current.map((r) => {
                if(r.id === focusData.rowId) {
                    const preValue = r[key] || '';
                    const nextValue = preValue.toLocaleUpperCase() === preValue ?
                        preValue.toLocaleLowerCase() : preValue.toLocaleUpperCase();
                    if(preValue !== nextValue) {
                        sendOpts.push({
                            id: r.id,
                            defKey: r.defKey,
                            defName: r.defName,
                            updateKeys: key,
                            pre: {
                                [key]: r[key],
                            },
                            next: {
                                [key]: nextValue,
                            },
                        });
                    }
                }
                return r;
            });
            setFields((p) => {
                return p.map((r) => {
                    if(r.id === focusData.rowId) {
                        const preValue = r[key] || '';
                        const nextValue = preValue.toLocaleUpperCase() === preValue ?
                            preValue.toLocaleLowerCase() : preValue.toLocaleUpperCase();
                        return {
                            ...r,
                            [key]: nextValue,
                        };
                    }
                    return r;
                });
            });
        }
        if(sendOpts.length === 0) {
            return;
        }
        // 发送消息
        onFieldsChange && onFieldsChange(sendOpts);
        onDefKeyChange(sendOpts);
        // 记录所有的变更
        updateOpt({
            type: 'update',
            data: sendOpts,
        });
    };
    const checkNamingConvention = () => {
        for(let i = 0; i < fieldsRef.current.length; i += 1) {
            if(/[A-Z0-9_]/.test(fieldsRef.current[i].defKey)) {
                if(/_/.test(fieldsRef.current[i].defKey)) {
                    return 'snakeCase';
                } else {
                    return 'camelCase';
                }
            }
        }
        return 'no';
    };
    const exchangeStyle = () => {
        const sendOpts = [];
        if(fieldsRef.current.length === 0) {
            return;
        }
        if(columnSelected.length !== 0) {
            const key = columnSelected[0].key;
            if(fieldsRef.current.length === 0) {
                return;
            }
            const style = checkNamingConvention();
            if(style === 'no') {
                return;
            }
            fieldsRef.current.map((r) => {
                const preValue = r[key] || '';
                const nextValue = style === 'camelCase' ?
                    _.snakeCase(preValue) : _.camelCase(preValue);
                if(preValue !== nextValue) {
                    sendOpts.push({
                        id: r.id,
                        defKey: r.defKey,
                        defName: r.defName,
                        updateKeys: key,
                        pre: {
                            [key]: r[key],
                        },
                        next: {
                            [key]: nextValue,
                        },
                    });
                }
                return r;
            });
            setFields((p) => {
                return p.map((r) => {
                    const preValue = r[key] || '';
                    const nextValue = style === 'camelCase' ?
                        _.snakeCase(preValue) : _.camelCase(preValue);
                    return {
                        ...r,
                        [key]: nextValue,
                    };
                });
            });
        } else {
            const key = focusData.columnKey;
            fieldsRef.current.map((r) => {
                if(r.id === focusData.rowId) {
                    const preValue = r[key] || '';
                    const nextValue = _.camelCase(preValue) === preValue ?
                        _.snakeCase(preValue) : _.camelCase(preValue);
                    if(preValue !== nextValue) {
                        sendOpts.push({
                            id: r.id,
                            defKey: r.defKey,
                            defName: r.defName,
                            updateKeys: key,
                            pre: {
                                [key]: r[key],
                            },
                            next: {
                                [key]: nextValue,
                            },
                        });
                    }
                }
                return r;
            });
            setFields((p) => {
                return p.map((r) => {
                    if(r.id === focusData.rowId) {
                        const preValue = r[key] || '';
                        const nextValue = _.camelCase(preValue) === preValue ?
                            _.snakeCase(preValue) : _.camelCase(preValue);
                        return {
                            ...r,
                            [key]: nextValue,
                        };
                    }
                    return r;
                });
            });
        }
        if(sendOpts.length === 0) {
            return;
        }
        // 发送消息
        onFieldsChange && onFieldsChange(sendOpts);
        onDefKeyChange(sendOpts);
        // 记录所有的变更
        updateOpt({
            type: 'update',
            data: sendOpts,
        });
    };
    const quickOpt = () => {
        // if(!checkPermission(fieldNsKey.createByFree)) {
        //     return;
        // }
        // if(code === 73) {
        //     dropClick({key: 1});
        // } else if(code === 68) {
        //     onDelete();
        // }
    };
    const _onFocus = (cellName, rowKey) => {
        setFocusData({
            columnKey: cellName,
            rowId: rowKey,
        });
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-opt`}>
        <Group>
          <IconTitle
            nsKey={fieldNsKey.S}
            disable={selected.length === 0}
            icon='icon-to-top'
            title='顶'
            onClick={() => onMove(WS.FIELD.MOVE_TOP)}/>
          <IconTitle
            nsKey={fieldNsKey.S}
            disable={selected.length === 0}
            icon='icon-arrow-up'
            title='上'
            onClick={() => onMove(WS.FIELD.MOVE_UP)}/>
          <IconTitle
            nsKey={fieldNsKey.S}
            disable={selected.length === 0}
            icon='icon-arrow-down'
            title='下'
            onClick={() => onMove(WS.FIELD.MOVE_DOWN)}/>
          <IconTitle
            nsKey={fieldNsKey.S}
            disable={selected.length === 0}
            icon='icon-to-bottom'
            title='底'
            onClick={() => onMove(WS.FIELD.MOVE_BOTTOM)}/>
          <IconTitle
            nsKey={fieldNsKey.createByFree}
            dropClick={dropClick}
            onClick={() => dropClick({key: 1})}
            icon='icon-oper-plus'
            title='增'
            dropMenu={[{key: 5, name: '新增5条'},
                        {key: 10, name: '新增10条'},
                        {key: 15, name: '新增15条'}]}
                />
          <IconTitle
            nsKey={fieldNsKey.D}
            disable={selected.length === 0}
            onClick={onDelete}
            icon='icon-oper-delete'
            title='删'/>
        </Group>
        <Group>
          <MarkChange
            data={fields}
            setFields={setFields}
            selected={selected}
            onFieldsChange={onFieldsChange}/>
        </Group>
        <Group>
          <IconTitle onClick={onCopy} icon='icon-clipboard-copy' title='复制'/>
          <IconTitle onClick={onPaste} nsKey={fieldNsKey.createByFree} icon='icon-clipboard-paste' title='粘贴'/>
        </Group>
        <Group>
          <IconTitle onClick={undo} disable={optIndex === 0} icon='icon-undo-solid' title=''/>
          <IconTitle onClick={redo} disable={optIndex === optRef.current.length} icon='icon-redo-solid' title=''/>
        </Group>
        <Group>
          <IconTitle onClick={openSheet} icon='icon-excel' title='批量表格' nsKey={fieldNsKey.createByFree}/>
        </Group>
        <Group>
          <Tooltip
            force
            trigger='hover'
            title={<OperationTip/>}>
            <span>
              <IconTitle icon='icon-warning-circle'/>
            </span>
          </Tooltip>
        </Group>
        <Group>
          <Tooltip
            force
            placement='top'
            trigger='hover'
            title={<div className={`${currentPrefix}-association`}>
              <div>
                <Switch
                  disable={!checkPermission(fieldNsKey.createByFree)}
                  checked={similar && checkPermission(fieldNsKey.createByFree)}
                  onChange={checked => setSimilar(checked)}
                    />
                <span>相似推荐</span>
              </div>
            </div>}>
            <span>
              {(checkPermission(fieldNsKey.createByFree)
                      || checkPermission(fieldNsKey.createByStandard)) &&
                      <IconTitle title="推荐" icon='icon-batch'/>}
            </span>
          </Tooltip>
        </Group>
        <div>
          <span>列操作</span>
          <Group>
            <IconTitle
              nsKey={fieldNsKey.caseConversion}
              onClick={exchangeCase}
              disable={!((focusData.columnKey === 'defKey' || focusData.columnKey === 'defName') || columnSelected.length !== 0)}
              icon="icon-exchange"
              title="大小写"/>
            <IconTitle
              nsKey={fieldNsKey.nameStyleConversion}
              onClick={exchangeStyle}
              disable={!((focusData.columnKey === 'defKey' || focusData.columnKey === 'defName') || columnSelected.length !== 0)}
              icon="icon-exchange"
              title="命名风格"/>
          </Group>
        </div>

      </div>
      <div className={`${currentPrefix}-table`}>
        <Table
          nsKey={fieldNsKey.U}
          onCopy={onCopy}
          onPaste={onPaste}
          quickOpt={quickOpt}
          columnEnableSelected={exchangeCaseColumn.current}
          onColumnSelected={onColumnSelected}
          onColumnsChange={onColumnsChange}
          ref={tableRef}
          fixed
          onInputBlur={_onInputBlur}
          onSelect={onSelect}
          onChange={_onChange}
          data={fields}
          onInputFocus={_onFocus}
          columns={columns}
          rowEnableSelected
        />
      </div>
    </div>;
}));
