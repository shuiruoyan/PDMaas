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
import {
    IconTitle,
    Table,
    Message,
    Sheet,
    openModal,
    Button,
    Tooltip,
    Switch,
    AutoCom,
} from 'components';
import _ from 'lodash';
import {getPrefix} from '../../../../../lib/classes';
import {moveArrayPositionByArray} from '../../../../../lib/array';
import {WS} from '../../../../../lib/constant';
import {getId} from '../../../../../lib/idpool';
import {antiShake, Copy, Paste} from '../../../../../lib/event';
import {filterRepeatKey, getEmptyField, pasteFilterKey} from '../../../../../lib/utils';
import {OperationTip} from '../physicalentity/OperationTip';
import {
    baseLogicNsKey, basePhysicNsKey,
    checkPermission,
    fieldNsKey,
    logicNsKey,
} from '../../../../../lib/permission';
import {getRecommend, setRecommend} from '../../../../../lib/cache';
import {ViewContent} from '../../../../../lib/context';
import {valueCompare} from '../../../../../lib/string';
import MarkChange from '../physicalentity/MarkChange';

export default React.memo(forwardRef(({
                                          defaultData,
                                          getCurrentDataSource,
                                          onChange,
                                          onFieldsChange,
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
    const baseOptions = useMemo(() => {
        const tempDataTypes = profile.global.dataTypes || [];
        const typeOftenData = {
            common: [],
            general: [],
            low: [],
        };
        const optionStyle = {
            paddingLeft: 20,
        };
        tempDataTypes.forEach((d) => {
            const temp = {
                value: d.defKey,
                label: `${d.defName}-${d.defKey}`,
                style: optionStyle,
            };
            if(!d.often) {
                typeOftenData.low.push(temp);
            } else if(d.often === '5') {
                typeOftenData.general.push(temp);
            } else if(d.often === '9') {
                typeOftenData.common.push(temp);
            } else {
                typeOftenData.low.push(temp);
            }
        });
        let temp = [];
        if(typeOftenData.common.length !== 0) {
            temp = [
                ...temp,
                {
                    label: '常用',
                    disable: true,
                },
                ...typeOftenData.common,
            ];
        }
        if(typeOftenData.general.length !== 0) {
            temp = [
                ...temp,
                {
                    label: '一般',
                    disable: true,
                },
                ...typeOftenData.general,
            ];
        }
        if(typeOftenData.general.low !== 0) {
            temp = [
                ...temp,
                {
                    label: '低频',
                    disable: true,
                },
                ...typeOftenData.low,
            ];
        }
        return temp;
    }, [profile.global.dataTypes]);
    const defaultColumn = useMemo(() => {
        return [
            {
                key: 'defKey',
                label: '代码',
                component: 'Input',
                resize: true,
                align: 'left',
                width: 100,
            },
            {
                key: 'defName',
                label: '名称',
                component: 'Input',
                resize: true,
                width: 100,
            },
            {
                key: 'primaryKey',
                label: '主键',
                component: 'Checkbox',
                width: 100,
                resize: true,
            },
            {
                key: 'notNull',
                label: '不为空',
                component: 'Checkbox',
                width: 100,
                resize: true,
            },
            {
                key: 'baseDataType',
                label: '基本数据类型',
                component: 'Select',
                options: baseOptions,
                props: {
                    valueRender: (item, v) => {
                        return (item && item?.children?.slice(0, item.children?.length -  item?.value?.length - 1)) || v || '';
                    },
                },
                width: 200,
                resize: true,
            },
            {
                key: 'dataLen',
                label: '长度',
                component: 'NumberInput',
                align: 'center',
                width: 100,
                resize: true,
            },
            {
                key: 'numScale',
                label: '小数点',
                component: 'NumberInput',
                width: 100,
                resize: true,
            },
            {
                key: 'intro',
                label: '备注',
                component: 'Input',
                width: 100,
                resize: true,
            },
        ];
    }, [baseOptions]);
    const sheetRef = useRef(null);
    const optRef = useRef([]);
    const tableRef = useRef(null);
    const [optIndex, setOptIndex] = useState(0);
    const [columnSelected, setColumnSelected] = useState([]);
    const optStatusRef = useRef(false);
    const [selected, setSelected] = useState([]);
    const selectedRef = useRef([]);
    selectedRef.current = [...selected];
    const [fields, setFields] = useState(defaultData?.fields || []);
    const fieldsRef = useRef([]);
    const exchangeCaseColumn = useRef(['defKey', 'defName']);
    fieldsRef.current = [...fields];
    const currentPrefix = getPrefix('container-model-entity-logic-content');
    const Group = IconTitle.Group;
    const profileRef = useRef(null);
    profileRef.current = profile;
    const recommend = getRecommend(defaultDataSource.id);
    const similarRef = useRef(false);
    const [similar, setSimilar] = useState(!!recommend.similar);
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
    useEffect(() => {
        setRecommend(defaultDataSource.id, {
            similar,
        });
    }, [similar]);
    useEffect(() => {
        onChange && onChange();
    }, [fields]);
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
    const sendData = (value, column, rowId, preValue, columnData, rowData, opts) => {
        // 发送消息
        if(!valueCompare(value, preValue) || opts.length > 0) {
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
            // 自己的变更 拼接上关联的变更
            const sendOpts = [{
                id: rowId,
                defKey: rowData.defKey,
                defName: rowData.defName,
                updateKeys: hsaExist ? updateKeys : `${column},${updateKeys}`,
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
        if((column === 'defKey' || column === 'defName') && defaultData.id) {
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
        if(column === 'defKey') {
            let tempValue = value.replace(/[-—]/g, '_');
            if(/^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#\u4e00-\u9fff]*$/.test(tempValue)) {
                if(fieldsRef.current.find(f => f.defKey === tempValue && f.id !== rowId)) {
                    tempValue = filterRepeatKey(
                        [...(fieldsRef.current.filter(f => f.id !== rowId) || [])],
                        tempValue);
                }
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
                    sendData(tempValue, column, rowId, preValue, columnData, rowData, []);
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
            sendData(value, column, rowId, preValue, columnData, rowData, []);
        }
    };
    const validateDefKey = (defKey, rowId) => {
        let tempValue = defKey;
        if(fieldsRef.current.find(f => f.defKey?.toLocaleLowerCase?.()
            === tempValue?.toLocaleLowerCase?.() && f.id !== rowId)) {
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
        if((similarRef.current) && (column === 'defKey' || column === 'defName')) {
            // 校验字段重复
            if(other) {
                updateFieldByField();
            } else if(column === 'defKey') {
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
        }  else if(column === 'baseDataType') {
            const baseDataType = profileRef.current.global.dataTypes
                .find(d => d.defKey === value);
            // 不需要长度
            if(baseDataType?.requireLen === 0) {
                otherProps.dataLen = '';
                opts.push({
                    updateKey: 'dataLen',
                    pre: rowData.dataLen,
                    next: '',
                });
            }
            // 不需要精度
            if(baseDataType?.requireScale === 0) {
                otherProps.numScale = '';
                opts.push({
                    updateKey: 'numScale',
                    pre: rowData.numScale,
                    next: '',
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
    const _onChange = useCallback((value, column, row, preValue, columnData, rowData, other) => {
        onChange && onChange(value, column, row, preValue, columnData, rowData);
        if(columnData.component !== 'Input' && columnData.component !== 'NumberInput') {
            const { otherProps, opts } = calcFieldOthers(column, value, rowData,
                other, preValue, columnData);
            if(!otherProps) {
                return;
            }
            // 非失焦的组件 需要事实计算关联修改
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
            // setFields((p) => {
            //     return p.map((r) => {
            //         if(r.id === row) {
            //             return {
            //                 ...r,
            //                 [column]: value,
            //             };
            //         }
            //         return r;
            //     });
            // });
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
        const logicEntity = profile.user.freezeEntityHeader.logicEntity || {};
        const physicEntityHeader = profile.project.setting.physicEntityHeader;
        return  defaultColumn.map((temp) => {
            if(physicEntityHeader[temp.key]) {
                return {
                    ...temp,
                    width: logicEntity[temp.key]?.width ||
                        physicEntityHeader[temp.key]?.columnWidth || 200,
                    fixed: logicEntity[temp.key]?.fixed || '',
                };
            }
            if(logicEntity[temp.key]) {
                return {
                    ...temp,
                    width: logicEntity[temp.key]?.width || 200,
                    fixed: logicEntity[temp.key]?.fixed || '',
                };
            }
            return temp;
        }).map((d) => {
            const t = {...d};
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
                                    .find(dataType => dataType.defKey === row.baseDataType);
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
            } else if(d.component === 'Select' && d.width < 100) {
                return {
                    ...d,
                    width: 100,
                };
            } else if((similar) && (d.key === 'defKey' || d.key === 'defName')) {
                return {
                    ...d,
                    component: 'SearchInputTree',
                    props: {
                        validate: (v, p) => validateSearchValue(v, t.key, p),
                        scrollStyle: true,
                        readOnly: !checkPermission(fieldNsKey.createByFree)
                            && !checkPermission(fieldNsKey.createByStandard),
                        minHeight: 400,
                        getAllFields,
                        similarEnable: similar && checkPermission(fieldNsKey.createByFree),
                        similarName: t.key,
                    },
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
            onFieldsAdd && onFieldsAdd([{
                data: opt.data,
                step: opt.step,
            }]);
        } else if(opt.type === 'update') {
            setFields((p) => {
                return p.map((f) => {
                    const updateFields = opt.data.filter(o => o.id === f.id);
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
            resetOpt: () => {
                optStatusRef.current = false;
                setOptIndex(0);
                optRef.current = [];
            },
            filterFields: (filterValue) => {
                tableRef.current?.filterRow?.(filterValue);
            },
            setFields,
            getFields: () => {
                return fieldsRef.current;
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
            setFieldsParams: (params) => {
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
        if(!checkPermission(logicNsKey.U) || isView) {
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
        // 记录所有的变更
        updateOpt({
            type: 'update',
            data: sendOpts,
        });
    };
    const checkNamingConvention = () => {
        for(let i = 0; i < fieldsRef.current.length; i += 1) {
            if(/[A-Z0-9]/.test(fieldsRef.current[i].defKey)) {
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
        // 记录所有的变更
        updateOpt({
            type: 'update',
            data: sendOpts,
        });
    };
    const getTitleByNode = () => {
        const node = getCurrentDataSource().profile.user.modelingNavDisplay.logicEntityNode;
        switch (node.optionValue) {
            case 'A':
                return `${currentDataRef.current.defKey}[${currentDataRef.current.defName || ''}]`;
            case 'N':
                return currentDataRef.current.defName || '';
            case 'K':
                return currentDataRef.current.defKey;
            default:
                return node.customValue
                    .replace(/\{defKey\}/g, currentDataRef.current.defKey || '')
                    .replace(/\{defName\}/g, currentDataRef.current.defName || '');
        }
    };
    const openSheet = () => {
        let modal;
        const onCancel = () => {
            sheetRef.current.destroy();
            modal.close();
        };
        const onOk = () => {
            setFields(sheetRef.current.getSheetData());
            modal.close();
        };
        const addRows = (data) => {
            const addRowsData = data.map((d) => {
                return {
                    step: d.step,
                    data: d.rows.map(row => ({
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
        };
        const buttons = [
          <Button key='cancel' onClick={onCancel}>
                关闭
          </Button>];
        if(!currentDataRef) {
            buttons.unshift([
              <Button key='onOk' type='primary' onClick={onOk}>
                      确定
              </Button>,
            ]);
        }
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
        modal = openModal(<Sheet
          ref={sheetRef}
          cellUpdateBefore={cellUpdateBefore}
          addRows={addRows}
          removeRows={removeRows}
          updateRows={updateRows}
          profile={profileRef.current}
          emptyRow={getEmptyField()}
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
            title: getCurrentDataSource ? `${getTitleByNode()}-表格编辑` : '表格编辑',
            buttons: buttons,
        });
    };
    const quickOpt = () => {
        // if(!checkPermission(logicNsKey.U)) {
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
            disable={selected.length === 0}
            nsKey={logicNsKey.U}
            icon="icon-to-top"
            title="顶"
            onClick={() => onMove(WS.FIELD.MOVE_TOP)}/>
          <IconTitle
            disable={selected.length === 0}
            nsKey={logicNsKey.U}
            icon="icon-arrow-up"
            title="上"
            onClick={() => onMove(WS.FIELD.MOVE_UP)}/>
          <IconTitle
            disable={selected.length === 0}
            nsKey={logicNsKey.U}
            icon="icon-arrow-down"
            title="下"
            onClick={() => onMove(WS.FIELD.MOVE_DOWN)}/>
          <IconTitle
            disable={selected.length === 0}
            nsKey={logicNsKey.U}
            icon="icon-to-bottom"
            title="底"
            onClick={() => onMove(WS.FIELD.MOVE_BOTTOM)}/>
          <IconTitle
            dropClick={dropClick}
            onClick={() => dropClick({key: 1})}
            icon="icon-oper-plus"
            nsKey={logicNsKey.U}
            title="增"
            dropMenu={[{
                        key: 5,
                        name: '新增5条',
                    },
                        {
                            key: 10,
                            name: '新增10条',
                        },
                        {
                            key: 15,
                            name: '新增15条',
                        }]}
                />
          <IconTitle
            disable={selected.length === 0}
            onClick={onDelete}
            icon="icon-oper-delete"
            nsKey={logicNsKey.U}
            title="删"/>
        </Group>
        <Group>
          <MarkChange
            data={fields}
            setFields={setFields}
            selected={selected}
            onFieldsChange={onFieldsChange}/>
        </Group>
        <Group>
          <IconTitle onClick={onCopy} icon="icon-clipboard-copy" title="复制"/>
          <IconTitle onClick={onPaste} icon="icon-clipboard-paste" nsKey={logicNsKey.U} title="粘贴"/>
        </Group>
        <Group>
          <IconTitle onClick={undo} disable={optIndex === 0} icon="icon-undo-solid" title=""/>
          <IconTitle
            onClick={redo}
            disable={optIndex === optRef.current.length}
            icon="icon-redo-solid"
            title=""/>
        </Group>
        <Group>
          <Tooltip
            force
            trigger="hover"
            title={<OperationTip/>}>
            <span>
              <IconTitle icon="icon-warning-circle"/>
            </span>
          </Tooltip>
        </Group>
        <Group>
          <IconTitle onClick={openSheet} nsKey={logicNsKey.U} icon="icon-excel" title="批量表格"/>
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
              nsKey={logicNsKey.U}
              onClick={exchangeCase}
              disable={!((focusData.columnKey === 'defKey' || focusData.columnKey === 'defName') || columnSelected.length !== 0)}
              icon="icon-exchange"
              title="大小写"/>
            <IconTitle
              onClick={exchangeStyle}
              nsKey={logicNsKey.U}
              disable={!((focusData.columnKey === 'defKey' || focusData.columnKey === 'defName') || columnSelected.length !== 0)}
              icon="icon-exchange"
              title="命名风格"/>
          </Group>
        </div>
      </div>
      <div className={`${currentPrefix}-table`}>
        <Table
          nsKey={logicNsKey.U}
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
          onInputFocus={_onFocus}
          onChange={_onChange}
          data={fields}
          columns={columns}
            />
      </div>
    </div>;
}));
