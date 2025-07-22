import React, {useCallback, useMemo, useRef, useState, useImperativeHandle, forwardRef} from 'react';
import {AutoCom, Checkbox, IconTitle, Input, Select, Table} from 'components';
import {getPrefix} from '../../../../lib/classes';

export default React.memo(forwardRef(({edges, nodeIdsMap, type, entities, defKey}, ref) => {
    const Group = IconTitle.Group;
    const currentPrefix = getPrefix('container-model-left-BatchGenEr');
    const tableRef = useRef(null);
    const [selected, setSelected] = useState([]);
    const configRef = useRef({layout: 'dagre', defKey});
    const [entityRelationRank, setEntityRelationRank] = useState(type !== 'C');
    const [tableData, setTableData] = useState(() => {
        const getEntityId = (cellId) => {
            return Object.keys(nodeIdsMap).find(id => nodeIdsMap[id] === cellId);
        };
        return edges.map((e) => {
            return {
                parentId: getEntityId(e.source.cell),
                parentFieldId: e.source.port.split('_')[0],
                childFieldId: e.target.port.split('_')[0],
                childId: getEntityId(e.target.cell),
                id: Math.uuid(),
            };
        });
    });
    const getLabel = (e) => {
        if(e.defName && (e.defKey !== e.defName)) {
            return `${e.defKey}[${e.defName}]`;
        }
        return e.defKey;
    };
    const getFieldOptions = (entityId) => {
        if(entityId) {
            return (entities.find(e => e.id === entityId)?.fields || []).map((f) => {
                return {
                    value: f.id,
                    label: getLabel(f),
                };
            });
        }
        return [];
    };
    const entityOptions = useMemo(() => {
        return entities.map((e) => {
            return {
                value: e.id,
                label: getLabel(e),
            };
        });
    }, []);
    const columns = useMemo(() => {
        return [
            {
                key: 'parentId',
                label: '主表',
                component: 'Select',
                resize: true,
                width: 200,
                options: entityOptions,
                sort: true,
            },
            {
                key: 'parentFieldId',
                label: '主表字段',
                width: 200,
                options: [],
                effectUpdate: (pre, next) => {
                    return pre.row?.parentId === next.row?.parentId;
                },
                component: (value, rowKey, cellName, row, change) => {
                    return <AutoCom
                      options={getFieldOptions(row?.parentId)}
                      component='Select'
                      value={value}
                      onChange={v => change(v, cellName, rowKey)}
                    />;
                },
                sort: true,
                resize: true,
            },
            {
                key: 'childId',
                label: '从表',
                width: 200,
                component: 'Select',
                resize: true,
                sort: true,
                options: entityOptions,
            },
            {
                key: 'childFieldId',
                width: 200,
                label: '从表字段',
                sort: true,
                component: (value, rowKey, cellName, row, change) => {
                    return <AutoCom
                      options={getFieldOptions(row?.childId)}
                      component='Select'
                      value={value}
                      onChange={v => change(v, cellName, rowKey)}
                    />;
                },
                effectUpdate: (pre, next) => {
                    return pre.row?.childId === next.row?.childId;
                },
                options: [],
                resize: true,
            }].filter((e) => {
            if(type === 'C' || !entityRelationRank) {
                return e.key !== 'parentFieldId' && e.key !== 'childFieldId';
            }
            return true;
        });
    }, [entityRelationRank]);
    const onChange = useCallback((value, column, rowId) => {
        setTableData((p) => {
            return p.map((r) => {
                if(r.id === rowId) {
                    if(!value && (column === 'childId' || column === 'parentId')) {
                        const updateId = column === 'childId' ? 'childFieldId' : 'parentFieldId';
                        return {
                            ...r,
                            [column]: value,
                            [updateId]: '',
                        };
                    }
                    return {
                        ...r,
                        [column]: value,
                    };
                }
                return r;
            });
        });
    }, []);
    const getMaxSelectedStep = () => {
        return selected.length > 0 ? Math.max(...selected.map((s) => {
            return tableData.findIndex(f => f.id === s);
        })) + 1 : tableData.length;
    };
    const dropClick = (m) => {
        const maxStep = getMaxSelectedStep();
        const tempData = [];
        for (let i = 0; i < m.key; i += 1) {
            tempData.push({
                parentId: '',
                parentFieldId: '',
                childFieldId: '',
                childId: '',
                id: Math.uuid(),
            });
        }
        setTableData((p) => {
            const temp = [...p];
            temp.splice(maxStep, 0, ...tempData);
            return temp;
        });
    };
    const onDelete = () => {
        setTableData((p) => {
            return p.filter(d => !selected.includes(d.id));
        });
        tableRef.current.resetSelected();
        setSelected([]);
    };
    const onSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);
    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return tableData;
            },
            getConfig: () => {
                return {
                    layout: configRef.current.layout,
                    entityRelationRank: entityRelationRank ? 'F' : 'E',
                    defKey: configRef.current.defKey,
                };
            },
        };
    }, [tableData, entityRelationRank]);
    const configChange = (name, value) => {
        configRef.current[name] = value;
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-config`}>
        <div>
          <span>ER图名</span>
          <span><Input
            defaultValue={defKey}
            onChange={v => configChange('defKey', v.target.value)}
          /></span>
        </div>
        <div>
          <span>布局</span>
          <span><Select
            defaultValue='dagre'
            onChange={v => configChange('layout', v)}
                >{
                    [{value: 'grid', label: '网格布局'},
                        {value: 'circular', label: '环形布局'},
                        {value: 'dagre', label: '星型布局'},
                    ].map((o) => {
                        return <Select.Option
                          key={o.value}
                          value={o.value}
                        >
                          {o.label}
                        </Select.Option>;
                    })
                }
          </Select></span>
        </div>
        <div>
          <span>
            <Checkbox
              disable={type === 'C'}
              checked={entityRelationRank}
              onChange={e => setEntityRelationRank(e.target.checked)}/>
          </span>
          <span>关系连线至字段</span>
        </div>
      </div>
      <div className={`${currentPrefix}-opt`}>
        <Group>
          <IconTitle
            dropClick={dropClick}
            onClick={() => dropClick({key: 1})}
            icon='icon-oper-plus'
            title='增'
            dropMenu={[{key: 5, name: '新增5条'},
                        {key: 10, name: '新增10条'},
                        {key: 15, name: '新增15条'}]}
                />
          <IconTitle
            disable={selected.length === 0}
            onClick={onDelete}
            icon='icon-oper-delete'
            title='删'/>
        </Group>
      </div>
      <div className={`${currentPrefix}-table`}>
        <Table
          ref={tableRef}
          columnEnableSelected={false}
          data={tableData}
          onChange={onChange}
          onSelect={onSelect}
          columns={columns}/>
      </div>
    </div>;
}));
