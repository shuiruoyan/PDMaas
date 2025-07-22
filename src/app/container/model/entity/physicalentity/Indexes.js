import React, {useCallback, useMemo, useState, useRef, useImperativeHandle, forwardRef, useEffect} from 'react';
import {IconTitle, Table, Icon, Tooltip, Message} from 'components';
import _ from 'lodash';
import {getPrefix} from '../../../../../lib/classes';
import {moveArrayPositionByArray} from '../../../../../lib/array';
import {getId} from '../../../../../lib/idpool';
import {antiShake} from '../../../../../lib/event';
import {filterRepeatKey, getEmptyIndex} from '../../../../../lib/utils';
import AddIndexField from './AddIndexField';
import {checkPermission, indexNsKey} from '../../../../../lib/permission';
import {WS} from '../../../../../lib/constant';

export default React.memo(forwardRef(({
                                          entityData,
                                          defaultData,
                                          onIndexesChange,
                                          onIndexesAdd,
                                          onIndexesDelete,
                                          onIndexesMove,
                                          user,
                                      }, ref) => {
    const reserveWord = user.reserveWord || [];
    const tableRef = useRef(null);
    const [selected, setSelected] = useState([]);
    const entityDataRef = useRef(null);
    entityDataRef.current = entityData;
    const [indexes, setIndexes] = useState(defaultData.indexes || []);
    const indexesRef = useRef([]);
    indexesRef.current = [...indexes];
    const currentPrefix = getPrefix('container-model-entity-physical-content-indexes');
    const Group = IconTitle.Group;
    const itemSizeRef = useRef({});
    useEffect(() => {
        setIndexes(entityData.indexes || []);
    }, [entityData]);
    useEffect(() => {
        indexes.map((i) => {
            const len = i.fields.length;
            itemSizeRef.current[i.id] = len > 4 ? 35 * 4 : len * 35;
            if (itemSizeRef.current[i.id] === 0) {
                itemSizeRef.current[i.id] = 35;
            }
            return i;
        });
        console.log('itemSizeRef.current');
        console.log(itemSizeRef.current);
    }, []);

    const validateDefKey = (defKey, rowId) => {
        let tempValue = defKey;
        if(indexesRef.current.find(f => f.defKey === tempValue && f.id !== rowId)) {
            tempValue = filterRepeatKey(
                [...(indexesRef.current.filter(f => f.id !== rowId) || [])],
                tempValue);
        }
        return tempValue;
    };
    const _onInputBlur = (value, column, rowId, preValue, columnData, rowData) => {
        // 发送消息
        if(value !== preValue) {
            if(column === 'defKey') {
                const keyWord = reserveWord
                    .find(r => r.keyWord?.toLocaleLowerCase() === value?.toLocaleLowerCase());
                if(keyWord) {
                    Message.error({title: `代码[${value}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
                    setIndexes((p) => {
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
                    return;
                }
            }
            if(column === 'defKey') {
                let tempValue = value.replace(/[-—]/g, '_');
                if(/^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#\u4e00-\u9fff]*$/.test(tempValue)) {
                    tempValue = validateDefKey(tempValue, rowId);
                    if(tempValue !== preValue) {
                        setIndexes((p) => {
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
                        onIndexesChange && onIndexesChange([{
                            id: rowId,
                            defKey: rowData.defKey,
                            defName: rowData.defName,
                            updateKeys: column,
                            pre: {
                                [column]: preValue,
                            },
                            next: {
                                [column]: tempValue,
                            },
                        }]);
                    } else {
                        Message.error({title: `索引代码为${value}已经存在！`});
                        setIndexes((p) => {
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
                    }

                } else {
                    setIndexes((p) => {
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
                onIndexesChange && onIndexesChange([{
                    id: rowId,
                    defKey: rowData.defKey,
                    defName: rowData.defName,
                    updateKeys: column,
                    pre: {
                        [column]: preValue,
                    },
                    next: {
                        [column]: value,
                    },
                }]);
            }
            // 发送消息

        }
    };
    const _onChange = useCallback((value, column, row, preValue, columnData, rowData) => {
        if(column === 'type') {
            if(value !== preValue) {
                // 发送消息
                onIndexesChange && onIndexesChange([{
                    id: row,
                    defKey: rowData.defKey,
                    defName: rowData.defName,
                    updateKeys: column,
                    pre: {
                        [column]: preValue,
                    },
                    next: {
                        [column]: value,
                    },
                }]);
            }
        }
        setIndexes((p) => {
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
    }, []);

    const columns = useMemo(() => {
        return[
            {
                key: 'type',
                label: '索引类型',
                component: 'Select',
                width: 200,
                enable: true,
                options: [
                    {value: 'UNIQUE', label: '唯一索引'},
                    {value: 'NORMAL', label: '一般索引'},
                ],

            },
            {
                key: 'defKey',
                label: '索引代码',
                component: 'Input',
                width: 300,
                enable: true,
            },
            {
                key: 'fields',
                label: '字段',
                component: (value,rowId,column,rowData, onChange, resize) => {
                    return <div className={`${currentPrefix}-field`}>
                      <div>
                        {
                          value?.slice(0,3).map((v) => {
                              return <span
                                key={v.id}>
                                <span>{v.fieldDefKey}</span>
                                <span>{v.sortType}</span>
                              </span>;
                          })
                        }
                        {
                          value?.length <= 3 ||
                            <span>...</span>
                        }
                      </div>
                      <Tooltip
                        force
                        trigger='click'
                        title={<AddIndexField
                          indexesField={value}
                          fields={entityDataRef.current.fields}
                          setIndexes={setIndexes}
                          onIndexesChange={onIndexesChange}
                          onChange={onChange}
                          resize={resize}
                          value={value}
                          rowId={rowId}
                          column={column}
                          disable={checkPermission(indexNsKey.U)}
                          rowData={rowData}
                        />}
                        >
                        <Icon
                          type="icon-down-more-copy"
                          className={`${currentPrefix}-field-move`}
                            />
                      </Tooltip>
                    </div>;
                },
                effectUpdate: (pre, next) => {
                    return pre.row?.defKey === next.row?.defKey;
                },
                width: 300,
                enable: true,
            },
            {
                key: 'defName',
                label: '索引名称',
                component: 'Input',
                width: 200,
                enable: true,
            },
            {
                key: 'intro',
                label: '备注',
                component: 'Input',
                width: 100,
                enable: true,
            },
        ];
    }, []);
    const tempAddRef = useRef([]);
    const getMaxSelectedStep = () => {
        return selected.length > 0 ? Math.max(...selected.map((s) => {
            return indexes.findIndex(f => f.id === s);
        })) + 1 : indexes.length;
    };
    const addShake = useCallback(antiShake((step) => {
        console.log(tempAddRef.current);
        onIndexesAdd && onIndexesAdd(step, [...tempAddRef.current]);
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
                    ...getEmptyIndex(),
                    defKey: filterRepeatKey([...indexesRef.current,
                        ...tempData], `index_${maxStep + i}`),
                    id: ids[i],
                });
            }
            setIndexes((p) => {
                const temp = [...p];
                temp.splice(maxStep, 0, ...tempData);
                return temp;
            });
            tempAddRef.current.push(...tempData);
            addShake(maxStep);
        }
    };
    const onDelete = () => {
        const deleteFields = indexes.filter(f => selected.findIndex(s => s === f.id) > -1);
        setIndexes((p) => {
            return p.filter(d => !selected.includes(d.id));
        });
        setSelected([]);
        onIndexesDelete && onIndexesDelete(deleteFields);
    };
    const onSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);
    const onMove = (type) => {
        let step = 0;
        const selectedIndex = selected.map((s) => {
            return indexes.findIndex(f => f.id === s);
        });
        const selectedData = selectedIndex
            .map(i => _.pick(indexes[i], ['id', 'defKey', 'defName']));
        const maxIndex = Math.max(...selectedIndex);
        const minIndex = Math.min(...selectedIndex);
        switch (type) {
            case WS.FIELD.MOVE_UP:
                step = minIndex === 0 ? 0 : -1;
                break;
            case WS.FIELD.MOVE_DOWN:
                step = (maxIndex === indexes.length - 1) ? 0 : 1;
                break;
            case WS.FIELD.MOVE_TOP:
                step = minIndex === 0 ? 0 : -minIndex;
                break;
            case WS.FIELD.MOVE_BOTTOM:
                step = indexes.length - 1 - maxIndex;
                break;
            default: break;
        }
        if(step !== 0) {
            const tempFields = moveArrayPositionByArray(indexes,
                selected,
                step, 'id');
            onIndexesMove && onIndexesMove(step, selectedData);
            setIndexes(tempFields);
        }
    };
    useImperativeHandle(ref, () => {
        return {
            filterFields: (filterValue) => {
                tableRef.current?.filterRow?.(filterValue);
            },
            setIndexes,
        };
    }, [indexes]);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-opt`}>
        <Group>
          <IconTitle disable={selected.length === 0} icon='icon-to-top' title='顶' nsKey={indexNsKey.S} onClick={() => onMove(WS.FIELD.MOVE_TOP)}/>
          <IconTitle disable={selected.length === 0} icon='icon-arrow-up' title='上' nsKey={indexNsKey.S} onClick={() => onMove(WS.FIELD.MOVE_UP)}/>
          <IconTitle disable={selected.length === 0} icon='icon-arrow-down' title='下' nsKey={indexNsKey.S} onClick={() => onMove(WS.FIELD.MOVE_DOWN)}/>
          <IconTitle disable={selected.length === 0} icon='icon-to-bottom' title='底' nsKey={indexNsKey.S} onClick={() => onMove(WS.FIELD.MOVE_BOTTOM)}/>
          <IconTitle
            nsKey={indexNsKey.C}
            dropClick={dropClick}
            onClick={() => dropClick({key: 1})}
            icon='icon-oper-plus'
            title='增'
            dropMenu={[{key: 5, name: '新增5条'},
                        {key: 10, name: '新增10条'},
                        {key: 15, name: '新增15条'}]}
                />
          <IconTitle
            nsKey={indexNsKey.D}
            disable={selected.length === 0}
            onClick={onDelete}
            icon='icon-oper-delete'
            title='删'/>
        </Group>
      </div>
      <div className={`${currentPrefix}-table`}>
        <Table
          nsKey={indexNsKey.U}
          ref={tableRef}
          onInputBlur={_onInputBlur}
          onSelect={onSelect}
          onChange={_onChange}
          data={indexes}
          columns={columns}
          itemSize={itemSizeRef.current}
        />
      </div>
    </div>;
}));
