import React, {forwardRef, useCallback, useState, useImperativeHandle, useRef } from 'react';
import { Button, Table, Checkbox, openModal } from 'components';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import './style/index.less';
import SelectTree from './SelectTree';
import {entityExistsKey} from '../menu/tool';

export default React.memo(forwardRef(({isLoad, type,
                                          getCurrentDataSource, defaultTreeData}, ref) => {
    const currentPrefix = getPrefix('container-model-tools');
    const [data, setData] = useState([]);
    const tableRef = useRef();
    const [selected, setSelected] = useState([]);
    const [highLighted, setHighLighted] = useState(true);
    const [isRushMode, setIsRushMode] = useState(false);
    const [isShowExists, setIsShowExists] = useState(false);
    const [tree, setTree] = useState(defaultTreeData);
    const [filterData, setFilterData] = useState([]);
    const selectTreeRef = useRef();
    const tableDataRef = useRef([]);
    const selectedRef = useRef([]);
    const fullDataRef = useRef([]);
    const isRushModeRef = useRef(false);
    const treeMapRef = useRef({});
    isRushModeRef.current = isRushMode;
    selectedRef.current = selected;
    tableDataRef.current = [...(data || [])];
    const defaultColumn = [
        {
            key: 'ctName',
            label: '分类目录',
            component: (v) => {
                return <span
                  className={`${currentPrefix}-cellStyle`}
                >{treeMapRef.current[v] || v}</span>;
            },
            align: 'left',
            width: 260,
            filter: true,
            sort: true,
        },
        {
            key: 'order',
            label: '顺序',
            component: (v) => {
                return <span
                  style={{
                    textAlign: 'right',
                  }}
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 100,
            sort: true,
        },
        {
            key: 'schemaName',
            label: 'schema',
            component: (v) => {
                return <span
                  style={{ textAlign: 'center'}}
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 260,
            sort: true,
        },
        {
            key: 'defKey',
            label: '表代码',
            component: (v, ...args) => {
                const currentNode = args[2];
                return <span
                  className={classesMerge({
                    [`${currentPrefix}-selectTable-highlight`] : highLighted
                        // eslint-disable-next-line max-len
                        && getCurrentDataSource().project.entities.find(it => entityExistsKey(it) === entityExistsKey(currentNode)),
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
            label: '表名称',
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
            label: '表注释',
            component: (v) => {
                return <span
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 300,
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
    useImperativeHandle(ref, () => {
        return {
            resetTree: (t) => {
                setTree(t);
                !selectTreeRef.current || selectTreeRef.current?.resetTree(t);
            },
            setData,
            getData: () => {
                // eslint-disable-next-line max-len
                return tableDataRef.current?.filter(d => selectedRef.current.includes(d.id));
            },
            getTree: () => {
                return treeMapRef.current;
            },
            setFullData: (d) => {
                fullDataRef.current = d;
            },
            isRushMode: () => {
                return isRushModeRef.current;
            },
            scroll: (id) => {
                tableRef.current?.scroll(id, false);
            },
        };

    }, [tree]);
    const onSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);
    const checkBoxChange = useCallback((e, name) => {
        const {checked} = e.target;
        switch (name) {
            case 'highlighted':
                setHighLighted(checked);
                break;
            case 'isShowExists':
                if(checked) {
                    setData((pre) => {
                        const temp = [...pre];
                        return temp.filter((d) => {
                            // eslint-disable-next-line max-len
                            return !getCurrentDataSource().project.entities.find(it => entityExistsKey(it) === entityExistsKey(d));
                        });
                    });
                } else {
                    setData(fullDataRef.current);
                }
                setIsShowExists(checked);
                break;
            case 'isRushMode':
                setIsRushMode(checked);
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
            setData((p) => {
                return p.map((d) => {
                    if(selectedRef.current.includes(d.id)) {
                        // selectedRef.current.map((it) => {
                        //     if(it === d.id) {
                        //         return entityExistsKey({
                        //             defKey: d.defKey,
                        //             schemaName: tempData[2] || d.schemaName,
                        //         });
                        //     }
                        //     return d;
                        // });
                        return  {
                            ...d,
                            ctName: tempData[0],
                            schemaName: tempData[2] || d.schemaName,
                        };
                    }
                    return d;
                });
            });
            fullDataRef.current = fullDataRef.current.map((d) => {
                if(selectedRef.current.includes(d.id)) {
                    return  {
                        ...d,
                        ctName: tempData[0],
                    };
                }
                return d;
            });
            // setTimeout(() =>  {
            //     tableRef.current?.resetSelected(selectedRef.current);
            // }, 1000);
            modal.close();
        };
        modal = openModal(<SelectTree
          dataSource={getCurrentDataSource()}
          ref={selectTreeRef}
          defaultTreeData={defaultTreeData}
        />, {
            title: '选择分类目录',
            bodyStyle: {
                width: '50%',
            },
            buttons: [
              <Button key='onCancel' onClick={onCancel}>取消</Button>,
              <Button key='onOk' type="primary" onClick={onOK} >确定</Button>,
            ],
        });
    };
    const _onChange = useCallback((value, column, rowId) => {
        setData((p) => {
            return p.map((r) => {
                if(r.id === rowId) {
                    return {
                        ...r,
                        [column]: value,
                    };
                }
                return r;
            });
        });
        fullDataRef.current = fullDataRef.current.map((r) => {
            if(r.id === rowId) {
                return {
                    ...r,
                    [column]: value,
                };
            }
            return r;
        });
    }, []);
    const _onFilter = (t) => {
        setFilterData(t);
    };
    return <div className={`${currentPrefix}-selectTable`}>
      <div className={`${currentPrefix}-selectTable-header`}>
        <Button type="primary" onClick={changeDir} disable={isLoad || selected.length === 0}>批量设置分类目录</Button>
        <span style={{
              marginRight: '10px',
          }} />
        <Checkbox
          checked={highLighted}
          onChange={e => checkBoxChange(e, 'highlighted')}
          disable={isLoad}/>
        <span style={{
            marginRight: '10px',
        }}>突出显示项目存在的表</span>
        <Checkbox
          checked={isShowExists}
          onChange={e => checkBoxChange(e, 'isShowExists')}
          disable={isLoad}/>
        <span>隐藏已经存在表</span>
        <span style={{
            float: 'right',
        }}>按住shift可选中多行，按住ctrl可多选</span>
      </div>
      <div className={`${currentPrefix}-selectTable-table`}>
        <Table
          multiple
          onFilter={_onFilter}
          ref={tableRef}
          columns={defaultColumn}
          data={data}
          onSelect={onSelect}
          onChange={_onChange}
          rowEnableSelected={(id, node) => {
              // return !getCurrentDataSource().project.entities.includes(entityExistsKey(node));
              // eslint-disable-next-line max-len
              return !getCurrentDataSource().project.entities.find(it => entityExistsKey(it) === entityExistsKey(node));
          }}
        />
        <div>
          <span>您已选择了{selected.length}张表</span>
          {
            isLoad ? <span className={`${currentPrefix}-selectTable-loading`}>
              加载中<span/>
            </span> : <span>{
                filterData.length === 0 && !isLoad
                    ? '加载完成' : `筛选到${filterData.length}条记录`
            }</span>
          }
          <span>总共张{data.length}表</span>
        </div>
      </div>
      <div className={`${currentPrefix}-selectTable-bottom`}>
        <span>1.</span>{'针对项目中已存在的表您可以通过：“常用工具/物理表模型比较/与数据库比较"比较后，将差异同步至模型'}
      </div>
      {
        type === 'db' && <div className={`${currentPrefix}-selectTable-last`}>
          <Checkbox
            checked={isRushMode}
            onChange={e => checkBoxChange(e, 'isRushMode')}
            // disable={isLoad}
            disable
          />
          <span>极速模式（不记录操作历史，大量的数据库表结构需要初始化进项目时适用）</span>
        </div>
        }
    </div>;
}));
