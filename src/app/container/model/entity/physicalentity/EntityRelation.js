import React, {useEffect, useRef, useState} from 'react';
import {Button, closeLoading, Icon, Modal} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {LOADING, NORMAL, PROJECT, WS} from '../../../../../lib/constant';
import RelationMap from './RelationMap';
import {postWorkerFuc} from '../../../../../lib/event';
import {sendWsRequest} from '../../menu/tool';

export default React.memo(({getCurrentDataSource, defaultData, activeState, open}) => {
    const entitiesRef = useRef(null);
    const _jumpEntity = (data) => {
        open && open({
            nodeType: PROJECT.ENTITY,
            ...data,
        });
    };
    const getCurrentRefs = (entities, refers) => {
        // 返回当前表的的主表以及当前表的从表
        const parents = [];
        const children = [];
        refers.forEach((ref) => {
            if(ref.refEntityKey === defaultData.defKey
                && ref.refSchemaName === defaultData.schemaName) {
                // 从表
                const child = entities.find(e => e.id === ref.id);
                if(child) {
                    const field = (child.fields || []).find(f => f.defKey === ref.myFieldKey);
                    if(field) {
                        children.push({
                            id: child.id,
                            data: child,
                            entityName: child.defName,
                            entityKey: child.defKey,
                            fieldKey: ref.myFieldKey,
                            fieldName: field.defName,
                        });
                    }
                }
            }
            if(ref.id === defaultData.id) {
                // 主表
                const parent = entities.find(e => ref.refEntityKey === e.defKey
                    && ref.refSchemaName === e.schemaName);
                if(parent) {
                    const field = (parent.fields || []).find(f => f.defKey === ref.refFieldKey);
                    if(field) {
                        parents.push({
                            id: parent.id,
                            data: parent,
                            entityName: parent.defName,
                            entityKey: ref.refEntityKey,
                            fieldKey: ref.refFieldKey,
                            fieldName: field.defName,
                        });
                    }
                }
            }
        });
        return {
            parents,
            children,
        };

    };
    const [refers, setRefers] = useState({parents: [], children: []});
    const onScan = (e, bth) => {
        bth.updateStatus(LOADING);
        setRefers({
            parents: [],
            children: [],
        });
        const dataSource = getCurrentDataSource();
        postWorkerFuc('utils.updateEntityRefersBatch', true, [dataSource])
            .then((result) => {
                setRefers(() => {
                    return getCurrentRefs(dataSource.project?.entities || [],
                        result.reduce((p, n) => {
                        if((n.refers || []).length > 0) {
                            return p.concat((n.refers || []).map(r => ({...r, id: n.id})));
                        }
                        return p;
                    }, []));
                });
                const cmd = {
                    event: WS.ENTITY.MOP_ENTITY_BATCH_REFERS,
                    payload: result,
                };
                sendWsRequest(cmd).then(() => {
                    closeLoading();
                }).catch((err) => {
                    Modal.error({
                        title: '错误',
                        message: JSON.stringify(err?.message || err),
                    });
                });
            }).finally(() => {
            bth.updateStatus(NORMAL);
        });
    };
    const [showType, updateShowType] = useState('1');
    const ButtonGroup = Button.ButtonGroup;
    const currentPrefix = getPrefix('container-model-entity-physical-content-relation');
    const renderRelation = () => {
        const { parents, children} = refers;
        if(showType === '1') {
            const getLabel = (d, name) => {
                if(d[`${name}Name`] && (d[`${name}Key`] !== d[`${name}Name`])) {
                    return `${d[`${name}Key`]}[${d[`${name}Name`]}]`;
                }
                return d[`${name}Key`];
            };
            // 展示表格
            return <div className={`${currentPrefix}-content-table`}>
              {parents.length > 0 && <div className={`${currentPrefix}-content-table-parents`}>
                <div>上级表:</div>
                <div>
                  <div>
                    <div />
                    <div>主表</div>
                    <div>主表字段</div>
                  </div>
                  {parents.map((p, i) => {
                        return <div key={p.data.id}>
                          <div>{i + 1}</div>
                          <div onClick={() => _jumpEntity(p.data)} className={`${currentPrefix}-content-table-entity`}>{getLabel(p, 'entity')}</div>
                          <div>{getLabel(p, 'field')}</div>
                        </div>;
                    })}
                </div>
                </div>}
              <div className={`${currentPrefix}-content-table-current`}>当前表:<span>{getLabel(defaultData, 'def')}</span></div>
              {children.length > 0 && <div className={`${currentPrefix}-content-table-children`}>
                <div>下级表:</div>
                <div>
                  <div>
                    <div/>
                    <div>从表</div>
                    <div>从表字段</div>
                  </div>
                  {children.map((p, i) => {
                            return <div key={p.data.id}>
                              <div>{i + 1}</div>
                              <div onClick={() => _jumpEntity(p.data)} className={`${currentPrefix}-content-table-entity`}>{getLabel(p, 'entity')}</div>
                              <div>{getLabel(p, 'field')}</div>
                            </div>;
                        })}
                </div>
                </div>
                }
            </div>;
        }
        // 展示图
        return <RelationMap open={open} defaultData={defaultData} refers={refers}/>;
    };
    useEffect(() => {
        const dataSources = getCurrentDataSource();
        const entities = dataSources.project.entities || [];
        if (activeState === '5' && entitiesRef.current !== entities) {
            entitiesRef.current = entities;
            setRefers(() => {
                return getCurrentRefs(entities, entities.reduce((p, n) => {
                    if (n.type === 'P' && (n.refers || []).length > 0) {
                        return p.concat((n.refers || []).map(r => ({...r, id: n.id})));
                    }
                    return p;
                }, []));
            });
        }
    }, [activeState]);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-header`}>
        <span>
          <Button onClick={onScan} type='primary'>
            <span className={`${currentPrefix}-header-scan`}>
              <Icon type='icon-radar'/>
              <span>刷新表关系</span>
            </span>
          </Button>
        </span>
        <span>
          <span>展示方式</span>
          <span>
            <ButtonGroup
              onClick={(e, key) => updateShowType(key)}
              defaultActive="1"
            >
              <Button key="1">列表展示</Button>
              <Button key='2'>图展示</Button>
            </ButtonGroup>
          </span>
        </span>
      </div>
      <div className={`${currentPrefix}-content`}>
        {refers.parents.length === 0 && refers.children.length === 0
            ? <span className={`${currentPrefix}-content-empty`}>当前表暂无关联关系，点击【扫描表关系】按钮获取最新关联关系</span> : renderRelation()}
      </div>
    </div>;
});
