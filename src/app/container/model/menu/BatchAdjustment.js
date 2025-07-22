import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Table, IconTitle } from 'components';
import _ from 'lodash';
import {getPrefix} from '../../../../lib/classes';
import {getDefaultColumn} from '../../../../lib/component';
import {fieldNsKey} from '../../../../lib/permission';
import {PROJECT, WS} from '../../../../lib/constant';
import {moveArrayPositionByArray} from '../../../../lib/array';
import {tree2array} from '../../../../lib/tree';

import {computeSchemaTree, countable, myArray2tree, renderValue} from './tool';


export default React.memo(forwardRef(({ defaultData, getCurrentDataSource, parentId,
                                          nodeType}, ref) => {
    const currentPrefix = getPrefix('container-model-left-batchAdjustment');
    const Group = IconTitle.Group;

    const tableDataRef = useRef([]);
    const selectedRef = useRef([]);
    const tableRef = useRef();
    const cacheTableDataRef = useRef(null);

    const [tableData, setTableData] = useState([...(defaultData || [])]);
    const [selected, setSelected] = useState([]);
    const [columnSelected, setColumnSelected] = useState([]);
    const exchangeCaseColumn = useRef(['defKey', 'defName']);
    const [focusData, setFocusData] = useState({
        columnKey: '',
        rowId: '',
    });

    tableDataRef.current = [...(tableData || [])];
    selectedRef.current = [...selected];

    const columns = useMemo(() => {
        const defaultColumn = getDefaultColumn(getCurrentDataSource()?.profile);
        return [{
            key: 'defKey',
            label: '代码',
            component: [...(defaultColumn || {})].find(it => it?.key === 'defKey')?.component || 'Input',
            width: 200,
            filter: true,
            sort: true,
        },{
            key: 'defName',
            component: [...(defaultColumn || {})].find(it => it?.key === 'defName')?.component || 'Input',
            label: '显示名称',
            width: 200,
            filter: true,
            sort: true,
        },{
            key: 'intro',
            component: [...(defaultColumn || {})].find(it => it?.key === 'defName')?.component || 'Input',
            label: '备注说明',
            width: 200,
        },{
            key: 'parentId',
            component: 'TreeSelect',
            options: nodeType !== PROJECT.ENTITY_SUB ?
                myArray2tree(tree2array(getCurrentDataSource().project.categories)
                    .filter(d => !d.bindSchema)) || [] :
                computeSchemaTree([...(getCurrentDataSource().project.categories || [])]),
            fieldNames: { defKey: 'id', defName: 'defKey' },
            props: {
                valueRender: renderValue,
                countable: countable,
            },
            label: '归属分类',
            width: 200,
        }];
    }, []);

    const onSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);

    const onMove = (type) => {
        if(cacheTableDataRef.current !== null) {
            cacheTableDataRef.current = null;
            tableRef.current?.clearSortStatus();
        }
        let step = 0;
        const selectedIndex = selected.map((s) => {
            return tableData.findIndex(f => f.id === s);
        });
        const maxIndex = Math.max(...selectedIndex);
        const minIndex = Math.min(...selectedIndex);
        switch (type) {
            case WS.FIELD.MOVE_UP:
                step = minIndex === 0 ? 0 : -1;
                break;
            case WS.FIELD.MOVE_DOWN:
                step = (maxIndex === tableData.length - 1) ? 0 : 1;
                break;
            case WS.FIELD.MOVE_TOP:
                step = minIndex === 0 ? 0 : -minIndex;
                break;
            case WS.FIELD.MOVE_BOTTOM:
                step = tableData.length - 1 - maxIndex;
                break;
            default: break;
        }
        if(step !== 0) {
            const tempFields = moveArrayPositionByArray(tableData,
                selected,
                step, 'id');
            setTableData(tempFields);
        }
    };

    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return tableDataRef.current;
            },
        };
    }, []);

    const _onChange = useCallback((value, column, row) => {
        setTableData((p) => {
            return p.map((r) => {
                if(column === 'parentId' &&
                    selectedRef.current.includes(r.id)) {
                    return {
                        ...r,
                        [column]: value,
                    };
                }
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
    const isDisable = useMemo(() => {
        return (parentId || '').startsWith('_UNCATE');
    }, []);

    const onColumnSelected = (column) => {
        setColumnSelected(column);
    };

    const _onFocus = (cellName, rowKey) => {
        setFocusData({
            columnKey: cellName,
            rowId: rowKey,
        });
    };

    const checkNamingConvention = () => {
        for(let i = 0; i < tableDataRef.current.length; i += 1) {
            if(/[A-Z0-9_]/.test(tableDataRef.current[i].defKey)) {
                if(/_/.test(tableDataRef.current[i].defKey)) {
                    return 'snakeCase';
                } else {
                    return 'camelCase';
                }
            }
        }
        return 'no';
    };

    const exchangeStyle = () => {
        if(columnSelected.length !== 0) {
            const key = columnSelected[0].key;
            const style = checkNamingConvention();
            if(style === 'no') {
                return;
            }

            setTableData((p) => {
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
            setTableData((p) => {
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
    };

    const exchangeCase = () => {
        if(columnSelected.length !== 0) {
            const key = columnSelected[0].key;
            const tempKey = (tableDataRef.current[0][key] || '');
            const status = tempKey.toLocaleUpperCase() === tempKey ?
                'lower' : 'upper';
            setTableData((p) => {
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
            setTableData((p) => {
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
    };

    const _onSort = useCallback((sortData) => {
        if(cacheTableDataRef.current === null) {
            cacheTableDataRef.current = [...(tableDataRef.current || [])];
        }
        setTableData(() => {
            if(!sortData) {
                const temp = [...(cacheTableDataRef.current || [])];
                cacheTableDataRef.current = null;
                return temp;
            }
            const currentColumn = sortData.column;
            const direction = sortData.direction;
            return tableDataRef.current.sort((a, b) => {
                if(typeof currentColumn.sort === 'function') {
                    return currentColumn.sort(a, b, direction);
                } if(direction === 'down') {
                    return a[currentColumn.key].localeCompare(b[currentColumn.key]);
                } else {
                    return b[currentColumn.key].localeCompare(a[currentColumn.key]);
                }
            });
        });
        // setTableData();


    }, []);

    return (
      <div className={currentPrefix}>
        <div className={`${currentPrefix}-opt`}>
          <Group>
            <IconTitle
              nsKey={fieldNsKey.S}
              disable={selected.length === 0 || isDisable}
              icon='icon-to-top'
              title='顶'
              onClick={() => onMove(WS.FIELD.MOVE_TOP)}/>
            <IconTitle
              nsKey={fieldNsKey.S}
              disable={selected.length === 0 || isDisable}
              icon='icon-arrow-up'
              title='上'
              onClick={() => onMove(WS.FIELD.MOVE_UP)}/>
            <IconTitle
              nsKey={fieldNsKey.S}
              disable={selected.length === 0 || isDisable}
              icon='icon-arrow-down'
              title='下'
              onClick={() => onMove(WS.FIELD.MOVE_DOWN)}/>
            <IconTitle
              nsKey={fieldNsKey.S}
              disable={selected.length === 0 || isDisable}
              icon='icon-to-bottom'
              title='底'
              onClick={() => onMove(WS.FIELD.MOVE_BOTTOM)}/>
          </Group>
          <div>
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
            columnEnableSelected={exchangeCaseColumn.current}
            onColumnSelected={onColumnSelected}
            data={tableData}
            onSelect={onSelect}
            onInputFocus={_onFocus}
            ref={tableRef}
            columns={columns}
            onChange={_onChange}
            customSorting
            onSort={_onSort}
                />
        </div>
        <div className={`${currentPrefix}-bottom`} >
          <div>您已经选择了{selected.length}个</div>
          <div>总共{tableData.length}个</div>
        </div>
      </div>
    );
}));
