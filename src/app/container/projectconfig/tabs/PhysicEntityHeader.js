import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
} from 'react';
import {Table, IconTitle, Select} from 'components';
import {moveArrayPositionByArray} from '../../../../lib/array';
import { getHeaderDefaultColumns } from './index';
import {getDefaultColumn} from '../../../../lib/component';
import {WS} from '../../../../lib/constant';


export default React.memo(({baseClass, dataList, ...restProps}) => {
    const Group = IconTitle.Group;
    const [selected, setSelected] = useState([]);
    // eslint-disable-next-line max-len
    const {setCommandObj, setTabs, currentTab, dataSource, fieldViewArray, defaultSetting, setting} = restProps;
    const [tableData, setTableData] = useState((dataList || []).map((it) => {
        const defaultColumnArray = getDefaultColumn(dataSource.profile);
        const columnItem = defaultColumnArray.find(p => it.defKey === p.key);
        return {
            ...it,
            title: columnItem ? columnItem.label
                : setting?.physicEntityFieldAttr[it.defKey]?.title,
        };
    }).filter(it => !!it.title));
    const tableDataRef = useRef(tableData);
    tableDataRef.current = tableData;
    const columns = [
        {
            key: 'defKey',
            label: '属性代码',
            component: (value) => {
                return <span
                  style={{
                      width: '100%',
                  }}
                >{value}</span>;
            },
            width: 200,
            fixed: 'L',
        },
        {
            key: 'title',
            label: '属性标题',
            component: (value) => {
                return <span
                  style={{
                        width: '100%',
                  }}
                >{value}</span>;
            },
            width: 200,
            fixed: 'L',
        },
        {key: 'enable', label: '启用', component: 'Checkbox', width: 80, fixed: 'L'},
        {key: 'columnWidth', label: '列宽', component: 'NumberInput', width: 200},
        {
            key: 'view',
            label: '效果预览',
            effectUpdate: (pre, next) => {
                return pre.row.columnWidth === next.row.columnWidth;
            },
            component: (value, id, name, row) => (row.enable ? <div style={{ width: '100%' }}><div style={{width: `${row.columnWidth}px`}}>{(() => {
                const headerColumns = getHeaderDefaultColumns(dataSource.profile);
                const array = [...headerColumns, ...fieldViewArray];
                const item = array.find(it => it.key === row.defKey);
                if (item) {
                    let Com = item.component;
                    const options = item.options;
                    return <Com options={options || []} fieldNames={{ defKey: 'value', defName: 'label' }}>{
                        Array.isArray(options) && options.map((it, _ind) => {
                            // eslint-disable-next-line max-len
                            return <Select.Option key={_ind} value={it.value}>{it.label}</Select.Option>;
                        })
                    }</Com>;
                }
                return null;
            })()}</div></div> : null),
            width: 300,
        },
    ];
    const handleTableSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);
    const onMove = (type) => {
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
    const _onChange = useCallback((value, column, row) => {
        setTableData((p) => {
            return p.map((r) => {
                if (r.id === row) {
                    return {
                        ...r,
                        [column]: value,
                    };
                }
                return r;
            });
        });
        setTabs(prevState => prevState.map((it) => {
            if (it.id === currentTab.id) {
                return {
                    ...it,
                    dataList: tableDataRef.current,
                };
            }
            return it;
        }));
    }, []);
    useEffect(() => {
        // setCommandObj(prevState => ({...prevState, [currentTab.id]: dataObj}));
        setCommandObj((pre) => {
            return  {
                ...pre,
                [currentTab.id]: tableDataRef.current.reduce((acc, obj, index) => {
                    acc[obj.defKey] = {
                        columnWidth: obj.columnWidth,
                        enable: obj.enable,
                        orderValue: index + 1,
                    };
                    return acc;
                }, {}),
            };
        });
    }, [tableData]);
    useEffect(() => {
        if (defaultSetting) {
            // eslint-disable-next-line max-len
            const settingArray = Object.keys(defaultSetting).map(p => ({ ...defaultSetting[p], defKey: p, id: Math.uuid() }));
            setTableData(settingArray.map((it) => {
                const defaultColumnArray = getDefaultColumn(dataSource.profile);
                const columnItem = defaultColumnArray.find(p => it.defKey === p.key);
                return { ...it, title: columnItem ? columnItem.label : it.defKey?.replace('attr', '属性') };
            }));
        }
    }, [defaultSetting]);
    return <div className={baseClass}>
      <div className={`${baseClass}-tips`}>统一配置本项目所有数据表字段的列顺序</div>
      <div className={`${baseClass}-table`}>
        <div className={`${baseClass}-table-opt`}>
          <Group>
            <IconTitle
              disable={selected.length === 0}
              icon='icon-to-top'
              title='顶'
              onClick={() => onMove(WS.FIELD.MOVE_TOP)}/>
            <IconTitle
              disable={selected.length === 0}
              icon='icon-arrow-up'
              title='上'
              onClick={() => onMove(WS.FIELD.MOVE_UP)}/>
            <IconTitle
              disable={selected.length === 0}
              icon='icon-arrow-down'
              title='下'
              onClick={() => onMove(WS.FIELD.MOVE_DOWN)}/>
            <IconTitle
              disable={selected.length === 0}
              icon='icon-to-bottom'
              title='底'
              onClick={() => onMove(WS.FIELD.MOVE_BOTTOM)}/>
          </Group>
        </div>
        <div style={{height: 'calc(100% - 40px)'}}>
          <Table
            columns={columns}
            data={tableData}
            onSelect={handleTableSelect}
            onChange={_onChange}
            rowEnableSelected/>
        </div>
      </div>
    </div>;
});
