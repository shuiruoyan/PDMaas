import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback, useMemo} from 'react';
import {SearchInput, List, Tooltip, TreeSelect} from 'components';
import {postWorkerFuc} from '../../../../lib/event';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import './style/index.less';
import {subscribeEvent, unSubscribeEvent} from '../../../../lib/subscribe';
import {APP_EVENT, DIAGRAM, ENTITY} from '../../../../lib/constant';
import {isChild} from '../../../../lib/dom';
import {
    baseCategoryNsKey, baseConceptNsKey, baseFlowNsKey, baseLogicNsKey,
    baseMermaidNsKey, baseMindNsKey,
    basePhysicFieldNsKey, basePhysicIndexNsKey, basePhysicNsKey,
    checkPermission,
} from '../../../../lib/permission';
import {renderLabel} from '../menu/tool';
import schemaExpand from '../style/schema_expand.svg';
import schemaSelected from '../style/schema_selected.svg';
import schema from '../style/schema.svg';

export default React.memo(forwardRef(({project, dataSource, jump,
                                          fixed, offsetTop = 0}, ref) => {
    const currentPrefix = getPrefix('container-model-search');
    const searchRef  = useRef(null);
    const searchContainer = useRef(null);
    const projectRef = useRef(null);
    projectRef.current = {...project};
    const searchValue = useRef(null);
    const filterDataRef = useRef([]);
    const filterDataChangeRef = useRef(false);
    const [result, setResult] = useState([]);
    const filterWorkerRef = useRef(null);
    const searchWorkerRef = useRef(null);
    const currentCategoryRef = useRef(null);
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const selectedNodesRef = useRef([]);
    const getFilterData = () => {
        if(filterDataChangeRef.current) {
            if(filterWorkerRef.current) {
                // 清除上一次的worker 防止多次生成无效的worker
                filterWorkerRef.current.terminate();
                filterWorkerRef.current = null;
            }
            const categoryView = checkPermission(baseCategoryNsKey);
            const flowView = checkPermission(baseFlowNsKey) ;
            const mindView = checkPermission(baseMindNsKey) ;
            const mermaidView = checkPermission(baseMermaidNsKey) ;
            const physicView = checkPermission(basePhysicNsKey);
            const logicView = checkPermission(baseLogicNsKey);
            const conceptView = checkPermission(baseConceptNsKey);
            const fieldView = checkPermission(basePhysicFieldNsKey);
            const indexView = checkPermission(basePhysicIndexNsKey);
            projectRef.current = {
                ...projectRef.current,
                categories: categoryView ? projectRef.current.categories  : [],
                entities: projectRef.current.entities.filter((e) => {
                    switch (e.type) {
                        case ENTITY.TYPE.P:
                            return physicView;
                        case ENTITY.TYPE.L:
                            return logicView;
                        case ENTITY.TYPE.C:
                            return conceptView;
                        default:
                            return false;
                    }
                }).map((e) => {
                    if(e.type === ENTITY.TYPE.P) {
                        return {
                            ...e,
                            fields: fieldView ? e.fields : [],
                            indexes: indexView ? e.indexes : [],
                        };
                    }
                    return e;
                }),
                diagrams: projectRef.current.diagrams.filter((d) => {
                    switch (d.type) {
                        case DIAGRAM.TYPE.P:
                            return physicView;
                        case DIAGRAM.TYPE.L:
                            return logicView;
                        case DIAGRAM.TYPE.C:
                            return conceptView;
                        case DIAGRAM.TYPE.M:
                            return mindView;
                        case DIAGRAM.TYPE.F:
                            return flowView;
                        case DIAGRAM.TYPE.MER:
                            return mermaidView;
                        default:
                            return false;
                   }
                 }),
            };
            return new Promise((resolve, reject) => {
                postWorkerFuc('utils.transformProject2Filter', true, [
                    projectRef.current,
                    projectRef.current.categories,
                    currentCategoryRef.current,
                ], (worker) => {
                    filterWorkerRef.current = worker;
                }).then((data) => {
                    filterDataChangeRef.current = false;
                    filterDataRef.current = data;
                    resolve(data);
                }).catch(e => reject(e));
            });
        }
        return Promise.resolve(filterDataRef.current);
    };
    useEffect(() => {
        filterDataChangeRef.current = true;
    }, [project.entities]);
    const inputChange = (e) => {
        searchValue.current = e.target.value;
        if(!searchValue.current) {
            setResult([]);
            return Promise.resolve();
        }
      return new Promise((resolve) => {
          getFilterData().then((data) => {
              if(searchWorkerRef.current) {
                  // 清除上一次的worker 防止多次生成无效的worker
                  searchWorkerRef.current.terminate();
                  searchWorkerRef.current = null;
              }
              postWorkerFuc('utils.getProjectFilterData', true, [
                  searchValue.current,
                  data,
              ], (worker) => {
                  searchWorkerRef.current = worker;
              }).then((res) => {
                  setResult(res);
              }).catch((err) => {
                  console.log(err);
              }).finally(() => {
                  resolve();
              });
          });
      });
    };
    const resetSearch = () => {
        searchValue.current = '';
        searchRef.current.resetSearchValue();
        //searchRef.current.focus();
        setResult([]);
        if(fixed) {
            setShowCategoryFilter(false);
            searchContainer.current.style.display = 'none';
        }
    };
    const showFixedSearch = (selectedNodes) => {
        if(selectedNodes.length > 0) {
            selectedNodesRef.current = selectedNodes;
            currentCategoryRef.current = selectedNodes[0];
            setShowCategoryFilter(true);
        } else {
            setShowCategoryFilter(false);
        }
        searchContainer.current.style.display = 'block';
        searchRef.current.focus();
    };
    useImperativeHandle(ref, () => {
        return {
            show: (selectedNodes) => {
                showFixedSearch(selectedNodes);
            },
            hidden: () => {
                resetSearch();
            },
        };
    }, []);
    const _jump = (...args) => {
        resetSearch(...args);
        jump(...args);
    };
    useEffect(() => {
        searchRef.current.focus();
        const eventId = Math.uuid();
        subscribeEvent(APP_EVENT.CLICK, (e) => {
            const currentTarget = e.target;
            if(!(currentTarget === searchContainer.current ||
                isChild(searchContainer.current, currentTarget))) {
                resetSearch();
            }
        }, eventId);
        return () => {
            unSubscribeEvent(APP_EVENT.CLICK, eventId);
        };
    }, []);
    const filterTypeChange = (status) => {
        setShowCategoryFilter(status);
        filterDataChangeRef.current = true;
        if(!status && currentCategoryRef.current) {
            currentCategoryRef.current = '';
            searchRef.current.setLoading(true);
            setResult([]);
            inputChange({target: {value: searchValue.current}}).then(() => {
                searchRef.current.setLoading(false);
            });
        }
    };
    const onCategoryChange = (e) => {
        if(e.target.value !== currentCategoryRef.current) {
            filterDataChangeRef.current = true;
            currentCategoryRef.current = e.target.value;
            searchRef.current.setLoading(true);
            setResult([]);
            inputChange({target: {value: searchValue.current}}).then(() => {
                searchRef.current.setLoading(false);
            });
        }
    };
    const _labelRender = useCallback((node) => {
        const userProfile = dataSource.profile?.user;
        const modelingNavDisplay = userProfile.modelingNavDisplay;
        return renderLabel(node,
            modelingNavDisplay.conceptEntityNode.optionValue,
            modelingNavDisplay.conceptEntityNode.customValue);
    }, [dataSource]);
    const _valueRender = (selectNode) => {
        if(!selectNode) {
            return '';
        }
        const parents = [...(selectNode.parents || [])];
        let name = _labelRender(selectNode);
        while (parents.length) {
            const parent = parents.pop();
            name = `${_labelRender(parent)}/${name}`;
        }
        return name;
    };
    const countable = (node, children) => {
        return `(${children.reduce((p, n) => {
            return p + n.entityRefs.length + n.diagramRefs.length;
        }, node.entityRefs.length + node.diagramRefs.length)})`;
    };
    const options = useMemo(() => {
        const updateNode = (c) => {
            return {
                ...c,
                renderExpandIcon: c.bindSchema === 1 ?  (isOpen, isSelected) => {
                    if(isOpen) {
                        return <img
                          alt=''
                          src={schemaExpand}
                          style={{   width: 20,
                                height: 12,
                            }}/>;
                    } else if(isSelected) {
                        return <img
                          alt=''
                          src={schemaSelected}
                          style={{   width: 20,
                                height: 12,
                            }}/>;
                    }
                    return <img
                      alt=''
                      src={schema}
                      style={{   width: 20,
                            height: 12,
                        }}/>;
                } : null,
                children: (c.children || []).map(child => updateNode(child)),
            };
        };
        return project.categories.map(c => updateNode(c));
    }, [project.categories]);
    const onKeyDown = (e) => {
       if(e.keyCode === 27) {
           resetSearch();
       }
    };
    return <div
      ref={searchContainer}
      style={{
          zIndex: 998,
      }}
      className={classesMerge({
        [`${currentPrefix}-normal`]: !fixed,
        [`${currentPrefix}-fixed`]: fixed,
    })}>
      <div className={`${currentPrefix}-filter-input`}>
        <SearchInput
          onKeyDown={onKeyDown}
          comRef={searchRef}
          placeholder="请输入模型名/关系图名/字段名"
          onChange={inputChange}
          />
        <span className={`${currentPrefix}-filter-type`}>
          <span>范围:</span><span>
            <span
              className={classesMerge({
                [`${currentPrefix}-filter-type-active`]: !showCategoryFilter,
            })}
              onClick={() => filterTypeChange(false)}>全部</span>
            <span>|</span>
            <span
              className={classesMerge({
                  [`${currentPrefix}-filter-type-active`]: showCategoryFilter,
            })}
              onClick={() => filterTypeChange(true)}>指定位置</span>
          </span>
        </span>
      </div>
      {showCategoryFilter && <TreeSelect
        defaultValue={selectedNodesRef.current[0] || ''}
        placeholder='请选择位置'
        countable={countable}
        countParent
        options={options}
        onChange={onCategoryChange}
        labelRender={_labelRender}
        valueRender={_valueRender}
          />}
      {result.length > 0 && <span className={`${currentPrefix}-size`}>{`搜索到${result.length}条结果`}</span>}
      {/* eslint-disable-next-line no-nested-ternary */}
      {result.length > 0 ? <div
        style={{height: (result.length  + 1) * 30, maxHeight: `calc(80vh - (${50 + offsetTop}px)`}}
        className={`${currentPrefix}-list`}
        >
        <List
          data={result}
          itemRender={(item) => {
                    return <div className={`${currentPrefix}-item`}>
                      {/* eslint-disable-next-line react/no-danger */}
                      <Tooltip placement='top' title={<span dangerouslySetInnerHTML={{__html: item.html}} />}>
                        {/* eslint-disable-next-line react/no-danger */}
                        <div dangerouslySetInnerHTML={{__html: item.html}}/>
                      </Tooltip>
                      <div className={`${currentPrefix}-item-path`}>
                        位置:{item.data.path}
                      </div>
                      <div>
                        {item.data.type !== 'F'
                                && <span onClick={() => _jump(item.data)}>定位</span>}
                        {item.data.type !== 'SF' && item.data.type !== 'SD'
                              && <span onClick={() => _jump(item.data, true)}>详情</span>}
                      </div>
                    </div>;
                }}/>
      </div> : (searchValue.current ? <div className={`${currentPrefix}-empty`}>暂无数据</div> : null)}
    </div>;
}));
