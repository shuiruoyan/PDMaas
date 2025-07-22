import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import {Button, Checkbox, openModal, Table} from 'components';
import _ from 'lodash';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import SelectTree from './SelectTree';
import {removeInvalidPDManerCells} from '../../../../lib/utils';
import {addTreeNode, tree2array} from '../../../../lib/tree';
import {COMPONENT} from '../../../../lib/constant';
import {entityExistsKey} from '../menu/tool';


export default React.memo(forwardRef(({getCurrentDataSource, isLoad} ,ref) => {
    const currentPrefix = getPrefix('container-model-tools');
    const [tree, setTree] = useState(getCurrentDataSource().project.categories);
    const selectTreeRef = useRef();
    const fullDataRef = useRef([]);
    const treeMapRef = useRef({});
    const arrayTreeRef = useRef([]);
    const configRef = useRef({
        highLighted: true,
        isShowExists: false,
    });
    const tempTreeRef = useRef([...(getCurrentDataSource().project.categories || [])]);
    const defaultColumn = () => {
        return [
            {
                key: 'ctName',
                label: '分类目录',
                component: (v) => {
                    return <span
                      className={`${currentPrefix}-cellStyle`}
                    >{treeMapRef.current[v] || v}</span>;
                },
                align: 'left',
                width: 200,
                filter: true,
                sort: true,
            },
            {
                key: 'order',
                label: '顺序',
                component: (v) => {
                    return <span
                      style={{textAlign: 'right'}}
                      className={`${currentPrefix}-cellStyle`}
                    >{v}</span>;
                },
                width: 100,
                sort: true,
            },
            {
                key: 'nodeType',
                label: '对象类型',
                component: (v, id, k, rowData) => {
                    const flag = getCurrentDataSource().project[v]
                            .find(it => entityExistsKey(it) === entityExistsKey(rowData));
                    let nodeType;
                    switch (v) {
                        case 'entities':
                            nodeType = '实体';
                            break;
                            case 'diagrams':
                                nodeType = '关系图';
                                break;
                            case 'categories':
                                nodeType = '分类目录';
                                break;
                            default:
                                nodeType = '未知';
                    }
                    return <span
                      style={{textAlign: 'right'}}
                      className={classesMerge({
                          [`${currentPrefix}-selectTable-highlight`]: configRef.current.highLighted && flag,
                          [`${currentPrefix}-cellStyle`]: true,
                      })}
                    >{nodeType}</span>;
                },
                width: 100,
                sort: true,
            },
            {
                key: 'defKey',
                label: '对象代码',
                component: (v) => {
                    return <span
                      className={classesMerge({
                        [`${currentPrefix}-cellStyle`]: true,
                      })}
                    >{v}</span>;
                },
                width: 260,
                filter: true,
                sort: true,
                resize: true,
            },
            {
                key: 'defName',
                label: '对象名称',
                component: (v) => {
                    return <span
                      className={`${currentPrefix}-cellStyle`}
                    >{v}</span>;
                },
                width: 260,
                filter: true,
                sort: true,
                resize: true,
            },
            {
                key: 'intro',
                label: '对象备注',
                component: (v) => {
                    return <span
                      className={`${currentPrefix}-cellStyle`}
                    >{v}</span>;
                },
                width: 260,
                filter: true,
                sort: true,
            },
            {
                key: 'tempMark',
                label: '临时标记',
                component: 'Input',
                width: 200,
                widthFit: tree,
                filter: true,
                sort: true,
            },
        ];
    };

    const [tableData, setTableData] = React.useState({
        entities: {
            current: useRef(),
            data: [],
            selected: [],
            filterData: [],
            columns: defaultColumn(),
        },
    });
    const tableDataRef = useRef({});
    tableDataRef.current = tableData;

    const treeName = (node) => {
        const parents = [...(node.parents || [])];
        let displayName = node.defKey;
        while (parents.length) {
            const parent = parents.pop();
            displayName = `${parent.defKey}/${displayName}`;
        }
        return displayName;
    };
    const computeTree = () => {
        let tempTree = [...(getCurrentDataSource().project.categories || [])];
        const selectData = tableDataRef.current
            ?.entities.data.filter(d => tableDataRef.current
                ?.entities.selected.includes(d.id));
        const selectCategories = selectData.filter(s => s.nodeType === 'categories');
        selectCategories.forEach((category) => {
            let exists = false;
            if(category.parentId) {
                const arrayTree = tree2array(tempTree);
                exists = arrayTree.find(f => f.id === category.parentId);
            }
            tempTree =  addTreeNode(tempTree, {
                    defKey: category.defKey,
                    defName: category.defName,
                    id: category.id,
                    intro: null,
                    parentId: exists ? (category.parentId || null) : null,
                    peerOrder: null,
                    children: [],
                    entityRefs: [],
                    diagramRefs: [],
                },
                exists ? (category.parentId || null) : null,
                exists ? COMPONENT.TREE.SUB : COMPONENT.TREE.PEER,
                undefined);
        });
        return tempTree;
    };
    useImperativeHandle(ref, () => {
        return {
            setData: (d) => {
                d[0].forEach((category) => {
                    tempTreeRef.current =  addTreeNode(tempTreeRef.current, {
                        defKey: category.defKey,
                        defName: category.defName,
                        id: category.id,
                        intro: null,
                        parentId: category.parentId || null,
                        peerOrder: null,
                        children: [],
                        entityRefs: [],
                        diagramRefs: [],
                    },
                    category.parentId || null,
                    category.parentId === '' ? COMPONENT.TREE.PEER : COMPONENT.TREE.SUB,
                        undefined);
                });
                arrayTreeRef.current =  tree2array(tempTreeRef.current);
                fullDataRef.current = d[0].map((it, i) => {
                    if(it.parentId) {
                        arrayTreeRef.current.forEach((e) => {
                            if(e.id === it.parentId) {
                                treeMapRef.current[it.parentId] = treeName(e);
                            }
                        });
                    }
                    return {
                        ...it,
                        order: i + 1,
                        tempMark: '',
                        nodeType: 'categories',
                        ctName: it.parentId,
                    };
                }).concat(d[1].map((it, i) => {
                    if(it.categoryId) {
                        arrayTreeRef.current.forEach((e) => {
                            if(e.id === it.categoryId) {
                                treeMapRef.current[it.categoryId] = treeName(e);
                            }
                        });
                    }
                    return {
                        ...it,
                        order: d[0].length + i + 1,
                        tempMark: '',
                        nodeType: 'entities',
                        ctName: it.categoryId,
                    };
                })).concat(d[2].map((it, i) => {
                    if(it.categoryId) {
                        arrayTreeRef.current.forEach((e) => {
                            if(e.id === it.categoryId) {
                                treeMapRef.current[it.categoryId] = treeName(e);
                            }
                        });
                    }
                    return {
                        ...it,
                        order: d[0].length + d[1].length + i + 1,
                        tempMark: '',
                        nodeType: 'diagrams',
                        ctName: it.categoryId,
                    };
                }));
                setTableData((pre) => {
                    return {
                        entities: {
                            ...pre.entities,
                            data: [...fullDataRef.current],
                        },
                    };
                });
            },
            resetTree: () => {
                const tempTree = computeTree();
                setTree(tempTree);
                !selectTreeRef.current || selectTreeRef.current?.resetTree(tempTree);
            },
            getTree: () => {
                return treeMapRef.current;
            },
            getData: () => {
                const selectData = tableDataRef.current
                    ?.entities.data.filter(d => tableDataRef.current
                        ?.entities.selected.includes(d.id));
                const selectCategories = selectData.filter(s => s.nodeType === 'categories');
                const selectEntities = selectData.filter(s => s.nodeType === 'entities');
                const filterDiagrams = removeInvalidPDManerCells(
                    tableDataRef.current?.entities.data,
                    selectEntities.concat([...getCurrentDataSource().project.entities]),
                    selectData.filter(s => s.nodeType === 'diagrams'));
                return selectCategories.concat(selectEntities).concat(filterDiagrams);
            },
            isRushMode: () => {
                return false;
            },
        };
    });
    const _onFilter = (e, key) => {
        setTableData((pre) => {
            return {
                ...pre,
                [key]: {
                    ...pre[key],
                    filterData: e,
                },
            };
        });
    };
    const _onSelect = useCallback((e, key) => {
        setTableData((pre) => {
            return {
                ...pre,
                [key]: {
                    ...pre[key],
                    selected: e,
                },
            };
        });
    }, []);
    const _onChange = useCallback((value, column, rowId, key) => {
        setTableData((pre) => {
            return {
                ...pre,
                [key]: {
                    ...pre[key],
                    data: pre[key].data.map((it) => {
                        if(it.id === rowId) {
                            return {
                                ...it,
                                [column]: value,
                            };
                        }
                        return it;
                    }),
                },
            };
        });
    }, []);
    const checkBoxChange = useCallback((e, name) => {
        const {checked} = e.target;
        configRef.current[name] = checked;
        switch (name) {
            case 'highLighted':
                setTableData((pre) => {
                    return {
                        entities: {
                            ...pre.entities,
                            columns: defaultColumn(),
                        },
                    };
                });
                break;
            case 'isShowExists':
                if(checked) {
                    setTableData(pre => ({
                        entities: {
                            ...pre.entities,
                            data: pre.entities.data.filter((d) => {
                                return !(getCurrentDataSource().project[d.nodeType]
                                    .find(it => entityExistsKey(it) === entityExistsKey(d)));
                            }),
                        },
                    }));
                } else {
                    setTableData(pre => ({
                        entities: {
                            ...pre.entities,
                            data: [...fullDataRef.current],
                        },
                    }));
                }
                break;
            case 'isRushMode':
                break;
            default:
                break;
        }

    }, []);
    const changeDir = () => {

        let modal;
        const onCancel = () => {
            modal.close();
        };
        const onOK = () => {
            const tempData = selectTreeRef.current?.getSelectValue();
            if(tempData[0] === undefined) {
                modal.close();
                return;
            }
            treeMapRef.current[tempData[0]] = tempData[1];
            setTableData((pre) => {
                return {
                    entities: {
                        ...pre.entities,
                        data: pre.entities.data.map((d) => {
                            if(pre.entities.selected.includes(d.id)) {
                                return  {
                                    ...d,
                                    ctName: tempData[0],
                                    schemaName: tempData[2] || d.schemaName,
                                };
                            }
                            return d;
                        }),
                    },
                };
            });
            fullDataRef.current = fullDataRef.current.map((d) => {
                if(tableDataRef.current.entities.selected.includes(d.id)) {
                    return  {
                        ...d,
                        ctName: tempData[0],
                    };
                }
                return d;
            });
            modal.close();
        };
        modal = openModal(<SelectTree
          dataSource={getCurrentDataSource()}
          ref={selectTreeRef}
          defaultTreeData={computeTree()}
        />, {
            title: '选择分类目录',
            bodyStyle: {
                width: '50%',
                margin: '30px',
            },
            buttons: [
              <Button key='onCancel' onClick={onCancel}>取消</Button>,
              <Button key='onOk' type="primary" onClick={onOK} >确定</Button>,
            ],
        });
    };
    return <div className={`${currentPrefix}-selectTableAndDiagram`}>
      <div className={`${currentPrefix}-selectTable-header`}>
        <Button type="primary" onClick={changeDir}>批量设置分类目录</Button>
        <span style={{
                marginRight: '10px',
            }}/>
        <Checkbox
          defaultChecked={configRef.current.highLighted}
          onChange={e => checkBoxChange(e, 'highLighted')}/>
        <span style={{
                marginRight: '10px',
            }}>突出显示项目存在的表</span>
        <Checkbox
          defaultChecked={configRef.current.isShowExists}
          onChange={e => checkBoxChange(e, 'isShowExists')}/>
        <span>隐藏已经存在表</span>
        <span style={{
                float: 'right',
            }}>按住shift可选中多行，按住ctrl可多选</span>
      </div>
      <div className={`${currentPrefix}-selectTableAndDiagram-table`}>
        {
            Object.keys(tableData).map((key) => {
                return <div
                  className={`${currentPrefix}-selectTableAndDiagram-table-item`}
                >
                  <Table
                    onFilter={e => _onFilter(e, key)}
                    ref={tableData[key].current}
                    multiple
                    columns={tableData[key].columns}
                    data={tableData[key].data}
                    onSelect={e => _onSelect(e, key)}
                    onChange={(value, column, rowId) => _onChange(value, column, rowId, key)}
                    rowEnableSelected={(id, node) => {
                        return !([..._.map(getCurrentDataSource()
                                // eslint-disable-next-line max-len
                                .project[node.nodeType], it => entityExistsKey(it))].includes(entityExistsKey(node)));
                    }}/>
                  <div>
                    <span>您已选择了{tableData[key].selected.length}张对象</span>
                    {
                          isLoad ? <span className={`${currentPrefix}-selectTable-loading`}>
                          加载中<span/>
                          </span> : <span>{
                              tableData[key].filterData.length === 0 && !isLoad
                                  ? '加载完成' : `筛选到${tableData[key].filterData.length}条记录`
                          }</span>
                    }
                    <span>总共张{tableData[key].data.length}对象</span>
                  </div>
                </div>;
            })
        }
      </div>
      <div className={`${currentPrefix}-selectTableAndDiagram-bottom`}>
        <span>1.</span>{'针对项目中已存在的表您可以通过：“常用工具/物理表模型比较/与数据库比较"比较后，将差异同步至模型'}
      </div>
    </div>;
}));
