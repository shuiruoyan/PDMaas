import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {Icon, Tab} from 'components';
import _ from 'lodash';
import PhysicalEntity from '../entity/physicalentity';
import LogicEntity from '../entity/logicentity';
import Relation from '../relation';
import Shortcut from '../shortcut';
import Mind from '../mind';
import FlowChart from '../flowchart';
import Mermaid from '../mermaid';
import {DIAGRAM, PROFILE, PROJECT, WS} from '../../../../lib/constant';
import {notify, subscribeEvent, unSubscribeEvent} from '../../../../lib/subscribe';
import ConceptualEntity from '../entity/conceptualentity';
import { ViewContent } from '../../../../lib/context';
import {renderLabel} from '../menu/tool';

export default React.memo(forwardRef(({dataSource, expandHome, updateUserProfile,
                                          getCurrentMenu, setLeftOpen,
                                          updateUser, config, user,
                                          openProjectSetting}, ref) => {
    const TabItem = Tab.TabItem;
    const [tabs, setTabs] = useState([]);
    const tabInstanceRef = useRef({});
    const [tabActiveStack, setTabActiveStack] = useState([]);
    const tabActiveStackRef = useRef([]);
    tabActiveStackRef.current = [...tabActiveStack];
    const dataSourceRef = useRef(null);
    dataSourceRef.current = dataSource;
    const tabsRef = useRef([]);
    tabsRef.current = tabs;
    const updateActive = (id) => {
        setTabActiveStack((p) => {
            const temp = [...p];
            const activeIndex = temp.findIndex(t => t === id);
            if(activeIndex > -1) {
                temp.splice(activeIndex, 1);
            }
            return [id].concat(temp);
        });
    };
    const onTabClickActive = (key) => {
        getCurrentMenu()?.setMenuSelected?.(key);
    };
    const onTabClose = (id) => {
        setTabs(p => p.filter(t => t.data.id !== id));
        setTabActiveStack(p => p.filter(t => t !== id));
    };
    const getCom = (data) => {
        console.log(data);
        switch (data.nodeType) {
            case PROJECT.ENTITY: return PhysicalEntity;
            case PROJECT.LOGIC_ENTITY: return LogicEntity;
            case PROJECT.DIAGRAM:
                if(DIAGRAM.TYPE.M === data.type) {
                    return Mind;
                } else if(DIAGRAM.TYPE.F === data.type) {
                    return FlowChart;
                } else if(DIAGRAM.TYPE.MER === data.type) {
                    return Mermaid;
                }
                return Relation;
            case PROJECT.CONCEPT_ENTITY: return ConceptualEntity;
            default: return ConceptualEntity;
        }
    };
    const getCurrentDataSource = () => {
        return dataSourceRef.current;
    };
    const updateRef = (instance, tabId) => {
        tabInstanceRef.current[tabId] = instance;
    };
    const formDataRef = useRef(null);
    const categoriesRef = useRef([]);
    categoriesRef.current = dataSource.project.categories;
    useEffect(() => {
        !formDataRef.current?.resetTree || formDataRef.current.resetTree(categoriesRef.current);
    }, [categoriesRef.current]);
    const open = (data, params, active = true) => {
        console.log(data);
        if(data.nodeType === PROJECT.ENTITY ||
            data.nodeType === PROJECT.DIAGRAM ||
            data.nodeType === PROJECT.LOGIC_ENTITY ||
            data.nodeType === PROJECT.CONCEPT_ENTITY) {
            const maxTag = 15;
            // 获取当前队列最后一个标签
            const lastTab = tabActiveStackRef.current.slice(-1)[0];
            active && onTabClickActive(data.id);
            setTabActiveStack((p) => {
                const temp = [...p];
                const activeIndex = temp.findIndex(t => t === data.id);
                if(activeIndex > -1) {
                    temp.splice(activeIndex, 1);
                } else if(temp.length === maxTag) {
                    temp.splice(maxTag - 1, 1);
                }
                return [data.id].concat(temp);
            });
            // 加上标签数量限制 最多缓存15个标签
            setTabs((p) => {
                if(p.find(d => d.data.id === data.id)) {
                    return p;
                } else if(p.length === maxTag) {
                    // 移除队列中的最后一个
                    return p.filter(t => t.data.id !== lastTab).concat({
                        data: data,
                        Com: getCom(data),
                        params,
                    });
                } else {
                    return p.concat({
                        data: data,
                        Com: getCom(data),
                        params,
                    });
                }
            });
        }
    };
    const jump = useCallback((item, isDetail) => {
        const menu = getCurrentMenu();
        const data = item.type === 'F' ? item.entity : item;
        setLeftOpen(true);
        setTimeout(() => {
            menu.setMenuSelected(data.id);
            if(isDetail) {
                const project = dataSourceRef.current.project;
                const originData = (project.entities || [])
                    .concat(project.diagrams || []).find(e => e.id === data.id);
                const namesMap = {
                    P: PROJECT.ENTITY,
                    L: PROJECT.LOGIC_ENTITY,
                    C: PROJECT.CONCEPT_ENTITY,
                };
                let params = null;
                if(item.type === 'F') {
                    params = { jumpField: item.id };
                }
                if(tabInstanceRef.current[originData.id]) {
                    if(tabActiveStackRef.current[0] !== originData.id) {
                        updateActive(originData.id);
                    }
                    setTimeout(() => {
                        tabInstanceRef.current[originData.id].setFieldsParams(params);
                    });
                } else {
                    open({
                        ...originData,
                        nodeType: originData?.cellsData ? PROJECT.DIAGRAM
                            : namesMap[originData.type],
                    }, params);
                }
            }
        }, 100);
    }, []);
    useImperativeHandle(ref,() => {
        return {
            open,
            get: (tabId = tabActiveStackRef.current[0]) => {
                return tabInstanceRef.current[tabId];
            },
            getActive: () => {
                return tabActiveStackRef.current[0];
            },
            jump,
        };
    }, []);
    useEffect(() => {
        notify(WS.TAB_ACTIVE_CHANGE, tabActiveStack[0]);
    }, [tabActiveStack[0]]);
    useEffect(() => {
        // 通知标签页全局配置数据变化了
        notify(PROFILE.UPDATE, dataSource.profile);
    }, [dataSource.profile]);
    useEffect(() => {
        // 由于标签页都做了缓存优化，项目数据变化时不会让标签页渲染 如需获取最新数据 需要监听此处的通知实现
        // 通知标签页项目数据变化了（某些场景下需要获取最新的项目数据可在此处监听）
        // 1.关系图中 与数据表相关的
        // 2.数据表中 需要用到数据表相关数据的
        notify(PROJECT.UPDATE, dataSource.project);
    }, [dataSource.project]);
    useEffect(() => {
        const id = Math.uuid();
        subscribeEvent(WS.MESSAGE_STATUS_UPDATE, (msg) => {
            console.log(msg);
            if(msg.event === WS.ENTITY.MOP_ENTITY_DELETE ||
                msg.event === WS.DIAGRAM.MOP_DIAGRAM_DELETE) {
                msg.payload.forEach((d) => {
                    setTabs(p => p.filter(t => t.data.id !== d.data.id));
                    setTabActiveStack(p => p.filter(t => t !== d.data.id));
                });
            } else if(msg.event === WS.ENTITY.MOP_ENTITY_UPDATE ||
                msg.event === WS.DIAGRAM.MOP_DIAGRAM_UPDATE
            ) {
                const payload = msg.payload || [];
                setTabs((t) => {
                    return (t || []).map((it) => {
                        const cur = payload.find(p => p.next.id === it.data.id);
                        const updateKeys = (cur?.updateKeys || '').split(',') || [];
                        if(cur) {
                            return  {
                                ...it,
                                data: {
                                    ...it.data,
                                    ..._.pick(cur.next.data, ['defKey', 'defName'].filter(k => updateKeys.includes(k))),
                                },
                            };
                        }
                        return it;
                    });
                });
            } else if(msg.event === WS.ENTITY.MOP_ENTITY_BATCH_ADJUST ||
                msg.event === WS.DIAGRAM.MOP_DIAGRAM_BATCH_ADJUST
            ) {
                const next = msg?.payload[0]?.next || [];
                setTabs((t) => {
                    return (t || []).map((it) => {
                        const cur = next.find(p => p.id === it.data.id);
                        if(cur) {
                            return  {
                                ...it,
                                data: {
                                    ...it.data,
                                    ..._.pick(cur, ['defKey', 'defName']),
                                },
                            };
                        }
                        return it;
                    });
                });
            }
        }, id);
        return () => {
            unSubscribeEvent(WS.MESSAGE_STATUS_UPDATE, id);
        };
    }, []);
    const computeSchemaRender = useCallback((node, value) => {
        return node?.schemaName ? `${node.schemaName}.${value}` : value;
    }, []);

    const getTitleByNode = useCallback((node, data) => {
        return computeSchemaRender(data, renderLabel(data, node.optionValue, node.customValue));
    }, []);
    const getTitle = useCallback((data) => {
        const modelingNavDisplay = dataSource.profile.user.modelingNavDisplay;
        const iconStyle = {
            position: 'absolute',
            left: '5px',
        };
        const titleStyle = {
            marginLeft : '21px',
            marginRight: '16px',
            whiteSpace: 'nowrap',
        };
        switch (data.nodeType) {
            case PROJECT.DIAGRAM:
                return <><Icon style={iconStyle} type='icon-diagram-relation' />
                  <span style={titleStyle}>
                    {getTitleByNode(modelingNavDisplay.diagramNode, data)}
                  </span></>;
            case PROJECT.ENTITY:
                return <><Icon style={iconStyle} type='icon-model-physic' />
                  <span style={titleStyle}>
                    {getTitleByNode(modelingNavDisplay.physicEntityNode, data)}
                  </span></>;
            case PROJECT.LOGIC_ENTITY:
                return <><Icon style={iconStyle} type='icon-model-logic' />
                  <span style={titleStyle}>
                    {getTitleByNode(modelingNavDisplay.logicEntityNode, data)}
                  </span></>;
            case PROJECT.CONCEPT_ENTITY:
                return <><Icon style={iconStyle} type='icon-model-concept' />
                  <span style={titleStyle}>
                    {getTitleByNode(modelingNavDisplay.conceptEntityNode, data)}
                  </span></>;
            default: return <></>;
        }
    }, [dataSource.profile.user.modelingNavDisplay]);
    const onOperationClick = (key) => {
        const currentIndex = tabs.findIndex(t => t.data.id === tabActiveStack[0]);
        switch (key) {
            case '^closeCurrent':
                onTabClose(tabActiveStack[0]);
                break;
            case '^closeOther':
                setTabs(p => p.filter(t => t.data.id === tabActiveStack[0]));
                setTabActiveStack(p => p.filter(t => t === tabActiveStack[0]));
                break;
            case '^closeLeft':
                setTabs(prevState => prevState.slice(currentIndex, tabs.length));
                setTabActiveStack(p => p.filter(t =>
                    tabs.slice(currentIndex, tabs.length).find(e => e.data.id === t)),
                );
                break;
            case '^closeRight':
                setTabs(prevState => prevState.slice(0, currentIndex + 1));
                setTabActiveStack(p => p.filter(t =>
                    tabs.slice(0, currentIndex + 1).find(e => e.data.id === t)),
                );
                break;
            case '^closeAll':
                setTabs([]);
                setTabActiveStack([]);
                break;
            default:
                break;
        }
    };
    const operation = [
        {
            key: '^closeCurrent',
            props: {
                title: <span style={{
                    whiteSpace: 'nowrap',
                }}>关闭当前</span>,
            },
        },
        {
            key: '^closeOther',
            props: {
                title: <span>关闭其他</span>,
            },
        },
        {
            key: '^closeLeft',
            props: {
                title: <span>关闭左边</span>,
            },
        },
        {
            key: '^closeRight',
            props: {
                title: <span>关闭右边</span>,
            },
        },
        {
            key: '^closeAll',
            props: {
                title: <span>关闭所有</span>,
            },
        },
    ];
    console.log(tabs, tabActiveStack);
    if(tabs.length > 0) {
        return <ViewContent.Provider value={dataSource.project.readonly}>
          <Tab
            onClose={onTabClose}
            active={tabActiveStack[0]}
            onChange={updateActive}
            onTabClickActive={onTabClickActive}
            onOperationClick={onOperationClick}
            operation={operation}
            >
            {tabs.map((t) => {
                    const {data, Com, params} = t;
                    return <TabItem
                      key={data.id}
                      title={getTitle(data)}
                    >
                      <Com
                        openProjectSetting={openProjectSetting}
                        config={config}
                        defaultParams={params}
                        updateUser={updateUser}
                        open={open}
                        updateUserProfile={updateUserProfile}
                        ref={instance => updateRef(instance, data.id)}
                        expandHome={expandHome}
                        user={user}
                        defaultDataSource={dataSource}
                        defaultData={data}
                        getCurrentDataSource={getCurrentDataSource}
                        />
                    </TabItem>;
                })}
          </Tab>
        </ViewContent.Provider>;
    }
    return <Shortcut
      jump={jump}
      dataSource={dataSource}
      project={dataSource.project}/>;
}));
