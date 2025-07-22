import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';
import {Icon, DropDown, Tree, Tooltip, ContentMenu, Message, closeLoading, openLoading} from 'components';
import _ from 'lodash';
import { getPrefix} from '../../../../lib/classes';
import {
    COMPONENT,
    DIAGRAM,
    ENTITY,
    PROFILE,
    PROJECT,
    WS,
    DISABLE,
    NORMAL,
    APP_EVENT, CATEGORY,
} from '../../../../lib/constant';
import MenuSort from './MenuSort';
import {checkFrom, sendData} from '../../../../lib/utils';
import {dropClick, delClick, updateClick, renderLabel, entityExistsKey, sendWsRequest} from './tool';
import {getCache, setCache} from '../../../../lib/cache';
import { hardwareDropClick } from '../tools';
import {
    rightDelClick,
    rightPasteClick,
    changeDir,
    itemCheckAll,
    modelTransformation, rightDelModClick, unCateData, filterCategoriesCheckFrom,
    diagramsTransformation, batchAdjustment, createShallowCopy, model2Diagram, changeMark,
} from './rightMenu';
import { Copy } from '../../../../lib/event';
import {notify, subscribeEvent, unSubscribeEvent} from '../../../../lib/subscribe';
import {tree2array} from '../../../../lib/tree';
import schema from '../style/schema.svg';
import schemaSelected from '../style/schema_selected.svg';
import schemaExpand from '../style/schema_expand.svg';
import {
    baseCategoryNsKey, baseConceptNsKey,
    baseFlowNsKey, baseLogicNsKey, baseMermaidNsKey, baseMindNsKey, basePhysicNsKey,
    categoryNsKey, checkDataPermission, checkPermission,
    conceptNsKey,
    exportNsKey,
    flowNsKey, importNsKey,
    logicNsKey, mermaidNsKey,
    mindNsKey,
    physicNsKey,
} from '../../../../lib/permission';


export default React.memo(forwardRef(({dataSource, onDoubleClick,
                               updateUserProfile, onMenuDragStart,
                               onSelectedLenChange, onRefresh, getCurrentTab,
                               showSearch, user}, ref) => {
    const homeCoverDiagramRef = useRef(null);
    homeCoverDiagramRef.current = dataSource.project.homeCoverDiagram;
    const isView = dataSource.project.readonly;
    const userProfile = dataSource.profile?.user;
    const readonly = dataSource.project.readonly;
    const modelingNavDisplayRef = useRef({});
    modelingNavDisplayRef.current = userProfile.modelingNavDisplay;
    const currentPrefix = getPrefix('container-model-left-menu');
    const treeRef = useRef(null);
    const [sortable, setSortable] = useState(false);
    const dataSourceRef = useRef(null);
    const selectLenRef = useRef(0);
    dataSourceRef.current = dataSource;
    const entities = dataSource.project.entities;
    const diagrams = dataSource.project.diagrams;
    const flatTreeDataRef = useRef([]);
    const selectedData = useRef(null);
    const selectedNodesRef = useRef(null);
    const formData = useRef({});
    const markChangeRef = useRef();
    const hardwareRef = useRef();
    const angleMenu = [
        {key: ENTITY.TYPE.A, name: '全部'},
        {key: ENTITY.TYPE.C, name: '概念'},
        {key: ENTITY.TYPE.L, name: '逻辑'},
        {key: ENTITY.TYPE.P, name: '物理'},
        {key: ENTITY.TYPE.U, name: '非模型'},
    ];
    const [angleType, setAngelType] = useState('A');
    const [cursorStyle, setCursorStyle] = useState({
        newCursor: NORMAL,
        editCursor: DISABLE,
        delCursor: DISABLE,
    });

    const filterAngel = (data) => {
        if(angleType === ENTITY.TYPE.A) {
            return data;
        } else if(angleType === ENTITY.TYPE.C) {
            return data.filter(d => d.nodeType === PROJECT.CONCEPT_ENTITY_SUB
                || d.nodeType === PROJECT.CATEGORY
                || d.type === ENTITY.TYPE.C
                || d.nodeType === PROJECT.DIAGRAM_SUB).map((d) => {
                if(d.nodeType === PROJECT.DIAGRAM_SUB) {
                    return {
                        ...d,
                        children: d.children.filter(c => c.type === DIAGRAM.TYPE.C),
                    };
                }
                return d;
            });
        } else if(angleType === ENTITY.TYPE.L) {
            return data.filter(d => d.nodeType === PROJECT.LOGIC_ENTITY_SUB
                || d.nodeType === PROJECT.CATEGORY
                || d.type === ENTITY.TYPE.L
                || d.nodeType === PROJECT.DIAGRAM_SUB).map((d) => {
                if(d.nodeType === PROJECT.DIAGRAM_SUB) {
                    return {
                        ...d,
                        children: d.children.filter(c => c.type === DIAGRAM.TYPE.L),
                    };
                }
                return d;
            });
        } else if(angleType === ENTITY.TYPE.P) {
            return data.filter(d => d.nodeType === PROJECT.ENTITY_SUB
                || d.nodeType === PROJECT.CATEGORY
                || d.type === ENTITY.TYPE.P
                || d.nodeType === PROJECT.DIAGRAM_SUB).map((d) => {
                if(d.nodeType === PROJECT.DIAGRAM_SUB) {
                    return {
                        ...d,
                        children: d.children.filter(c => c.type === DIAGRAM.TYPE.P),
                    };
                }
                return d;
            });
        } else {
            return data.filter(d => d.nodeType === PROJECT.DIAGRAM_SUB
                || [DIAGRAM.TYPE.F, DIAGRAM.TYPE.MER, DIAGRAM.TYPE.M].includes(d.type)
                || d.nodeType === PROJECT.CATEGORY).map((d) => {
                if(d.nodeType === PROJECT.DIAGRAM_SUB) {
                    return {
                        ...d,
                        children: d.children.filter(c => c.type === DIAGRAM.TYPE.F
                            || c.type === DIAGRAM.TYPE.M || c.type === DIAGRAM.TYPE.MER),
                    };
                }
                return d;
            });
        }
    };
    const filterEmpty = (data) => {
        if(userProfile?.modelingNavDisplay?.nodeType === PROFILE.USER.NON_EMPTY) {
            return data.filter(b => b.children.length > 0);
        }
        return data;
    };
    const getCategoryRefData = (d, t, nodeType) => {
        return (d[t ? 'entityRefs' : 'diagramRefs'] || []).filter((e) => {
            if(!t) {
                const typeMap = {
                    C: baseConceptNsKey,
                    L: baseLogicNsKey,
                    P: basePhysicNsKey,
                    M: baseMindNsKey,
                    MER: baseMermaidNsKey,
                    F: baseFlowNsKey,
                };
                // 关系图模式下 子类权限筛选
                return checkDataPermission(typeMap[e.refObjectType]) > -1;
            }
            return true;
        }).map((e) => {
            const currentData = (t ? entities : diagrams)
                .find(c => (!t || (t && c.type === t)) && (c.id === e.refObjectId));
            if(currentData) {
                const diagramIcon = {
                    C: 'icon-diagram-er-concept',
                    L: 'icon-diagram-er-logic',
                    P: 'icon-diagram-er-table',
                    M: 'icon-diagram-mind',
                    MER: 'icon-mermaid',
                    F: 'icon-diagram-flow',
                };
                if(d.id === '_UNCATE') {
                    return {
                        ...currentData,
                        parentId: d.id,
                        nodeType,
                        draggable: !!t,
                        type: t || currentData.type,
                        sortable: false,
                        icon: t ? '' : diagramIcon[currentData.type],
                    };
                }
                return {
                    ...currentData,
                    parentId: d.id,
                    nodeType,
                    draggable: !!t,
                    type: t || currentData.type,
                    icon: t ? '' : diagramIcon[currentData.type],
                };
            }
            return null;
        }).filter(c => !!c);
    };
    const transformTreeData = (data, parent) => {
        return filterEmpty(data.map((d) => {
            return {
                ...d,
                parentId: parent?.id,
                renderExpandIcon: d.bindSchema === 1 ?  (isOpen, isSelected) => {
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
                nodeType: PROJECT.CATEGORY,
                children: filterAngel(d.classifyType === CATEGORY.CLASSIFY_TYPE.NONE ?
                    // eslint-disable-next-line no-use-before-define
                    [...getBaseChildren(d)] : filterEmpty([
                        // eslint-disable-next-line no-use-before-define
                        ...getBaseChildren(d),
                    ])),
            };
        }));
    };

    const filterClassifyType = (d) => {
        const all = [
            {
                id: `${d.id}_${ENTITY.TYPE.P}`,
                defKey: `${d.id}_${ENTITY.TYPE.P}`,
                defName: '物理模型',
                children: getCategoryRefData(d, ENTITY.TYPE.P, PROJECT.ENTITY),
                sortable: false,
                searchable: false,
                type: 'default',
                icon: 'icon-model-physic',
                nodeType: PROJECT.ENTITY_SUB,
                parentId: d.id,
                nsKey: basePhysicNsKey,
                value: 'physicEntityNode',
            },
            {
                id: `${d.id}_${ENTITY.TYPE.L}`,
                defKey: `${d.id}_${ENTITY.TYPE.P}`,
                defName: '逻辑模型',
                children: getCategoryRefData(d, ENTITY.TYPE.L, PROJECT.LOGIC_ENTITY),
                sortable: false,
                searchable: false,
                type: 'default',
                icon: 'icon-model-logic',
                parentId: d.id,
                nodeType: PROJECT.LOGIC_ENTITY_SUB,
                nsKey: baseLogicNsKey,
                value: 'logicEntityNode',
            },
            {
                id: `${d.id}_${ENTITY.TYPE.C}`,
                defKey: `${d.id}_${ENTITY.TYPE.P}`,
                defName: '概念模型',
                children: getCategoryRefData(d, ENTITY.TYPE.C, PROJECT.CONCEPT_ENTITY),
                sortable: false,
                searchable: false,
                type: 'default',
                icon: 'icon-model-concept',
                parentId: d.id,
                nodeType: PROJECT.CONCEPT_ENTITY_SUB,
                nsKey: baseConceptNsKey,
                value: 'conceptEntityNode',
            },
            {
                id: `${d.id}_${DIAGRAM.TYPE.D}`,
                defKey: `${d.id}_${ENTITY.TYPE.P}`,
                defName: '关系图',
                children: getCategoryRefData(d, null, PROJECT.DIAGRAM),
                sortable: false,
                searchable: false,
                type: 'default',
                icon: 'icon-diagram-relation',
                nodeType: PROJECT.DIAGRAM_SUB,
                parentId: d.id,
                value: 'diagramNode',
            },
        ];

        if(d.classifyType === CATEGORY.CLASSIFY_TYPE.NONE) {
            const sortValue = [{
                value: 'physicEntityNode',
                t: ENTITY.TYPE.P,
                nodeType: PROJECT.ENTITY,
            }, {
                value: 'logicEntityNode',
                t: ENTITY.TYPE.L,
                nodeType: PROJECT.LOGIC_ENTITY,
            }, {
                value: 'conceptEntityNode',
                t: ENTITY.TYPE.C,
                nodeType: PROJECT.CONCEPT_ENTITY,
            }, {
                value: 'diagramNode',
                t: null,
                nodeType: PROJECT.DIAGRAM,
            }];
            return sortValue.sort((a, b) => {
                return userProfile?.modelingNavDisplay?.[a.value]?.orderValue
                    - userProfile?.modelingNavDisplay?.[b.value]?.orderValue;
            }).reduce((acc, cur) => {
                return [
                    ...acc,
                    ...getCategoryRefData(d, cur.t, cur.nodeType),
                ];
            }, []);
        }

        if(d.classifyType === CATEGORY.CLASSIFY_TYPE.MANUAL) {
            const nodeMap = {
                P: PROJECT.ENTITY_SUB,
                C: PROJECT.CONCEPT_ENTITY_SUB,
                L: PROJECT.LOGIC_ENTITY_SUB,
                D: PROJECT.DIAGRAM_SUB,
            };
            // eslint-disable-next-line max-len
            let curManualClassify;
            try {
                curManualClassify = (JSON.parse(d.manualClassify) || []).map(item => nodeMap[item]);
            } catch (e) {
                curManualClassify = [];
            }
            return all.filter(item => curManualClassify.includes(item.nodeType));
        }
        return  all;
    };

    const getBaseChildren = (d) => {
        return (
            d.classifyType === CATEGORY.CLASSIFY_TYPE.NONE ? [
                ...filterClassifyType(d),
                ...filterEmpty(transformTreeData((d.children || []), d)),
            ] : [
                ...filterEmpty([
                    ...filterClassifyType(d),
                    ...transformTreeData((d.children || []), d),
                ]),
            ]
        ).filter((m) => {
            return checkDataPermission(m.nsKey) > -1 && (d.bindSchema === 1 ? m.value === 'physicEntityNode' : true);
        }).sort((a, b) => {
            return userProfile?.modelingNavDisplay?.[a.value]?.orderValue
                - userProfile?.modelingNavDisplay?.[b.value]?.orderValue;
        });
    };
    const transformSimpleTreeData = (data) => {
        return filterAngel(getBaseChildren({
            ...data,
            id: 'base_flat',
        }));
    };
    const getNoCategoryData = (project) => {
        const categories = tree2array(project.categories);
        const allCategoryEntities = [];
        const allCategoryDiagrams = [];
        categories.forEach((category) => {
            allCategoryEntities.push(...category.entityRefs.map(e => e.refObjectId));
            allCategoryDiagrams.push(...category.diagramRefs.map(d => d.refObjectId));
        });
        return {
            id: '_UNCATE',
            defKey: '$NCO',
            defName: '未分类对象',
            parentId: '',
            entityRefs: project.entities
                .filter(e => !allCategoryEntities.includes(e.id)).map(e => ({
                refObjectId: e.id, refObjectType: e.type,
            })),
            diagramRefs: project.diagrams
                .filter(d => !allCategoryDiagrams.includes(d.id)).map(d => ({
                    refObjectId: d.id, refObjectType: d.type,
                })),
            children: [],
            sortable: false,
            renderExpandIcon: (isOpen) => {
                if(isOpen) {
                    return 'icon-folder-doubt-open';
                }
                return 'icon-folder-doubt-close';
            },
        };
        // 获取未分类对象
    };
    const treeData = useMemo(() => {
        flatTreeDataRef.current = transformSimpleTreeData(dataSource.project.flat);
        if(userProfile?.modelingNavDisplay?.hierarchyType === PROFILE.USER.TREE) {
            const noCategoryData = getNoCategoryData(dataSource.project);
            return transformTreeData((checkDataPermission(baseCategoryNsKey) > -1
                ? dataSource.project.categories : [])
                .concat((noCategoryData.entityRefs.length > 0
                    || noCategoryData.diagramRefs.length > 0) ? noCategoryData : []));
        }
        return flatTreeDataRef.current;
    }, [
        angleType,
        dataSource.project.categories,
        dataSource.project.entities,
        dataSource.project.diagrams,
        userProfile?.modelingNavDisplay,
    ]);
    const treeDataRef = useRef([]);
    treeDataRef.current = [...(treeData || [])];
    const categoriesRef = useRef([]);
    const selectTreeRef = useRef();
    const changeDirRef = useRef();
    categoriesRef.current = dataSource.project.categories;


    let flag;
    const delCheck = (obj, selectedNode) => {
        if(flag || selectedNode.current.type) {
            return true;
        }
        obj?.forEach((c) => {
            if(c.id === selectedNode?.current.id)  {
                if((!c.entityRefs || c.entityRefs.length === 0) &&
                    (!c.children || c.children.length === 0) &&
                    (!c.diagramRefs || c.diagramRefs.length === 0)) {
                    flag = true;
                }
            }
            delCheck(c.children, selectedNode);
        });
        return flag;
    };
    const setStyle = useCallback(() => {
        const nodeType = !selectedData.current || selectedData.current.current.nodeType;
        if(selectedData.current === null) {
            setCursorStyle(() => {
                return {
                    // newCursor: 'pointer',
                    editCursor: DISABLE,
                    delCursor: DISABLE,
                };
            });
        } else if(nodeType === PROJECT.ENTITY_SUB ||
            nodeType === PROJECT.LOGIC_ENTITY_SUB ||
            nodeType === PROJECT.CONCEPT_ENTITY_SUB ||
            nodeType === PROJECT.DIAGRAM_SUB ||
            selectedData.current?.current.id === '_UNCATE') {
            setCursorStyle(() => {
                return {
                    editCursor: DISABLE,
                    delCursor: DISABLE,
                };
            });
        } else if(delCheck(categoriesRef.current, selectedData.current)) {
            flag = false;
            if(nodeType === PROJECT.ENTITY) {
                setCursorStyle({
                    newCursor: NORMAL,
                    editCursor: checkPermission(physicNsKey.U) ? NORMAL : DISABLE,
                    delCursor: checkPermission(physicNsKey.D) ? NORMAL : DISABLE,
                });
            } else if(nodeType === PROJECT.LOGIC_ENTITY) {
                setCursorStyle({
                    newCursor: NORMAL,
                    editCursor: checkPermission(logicNsKey.U) ? NORMAL : DISABLE,
                    delCursor: checkPermission(logicNsKey.D) ? NORMAL : DISABLE,
                });
            } else if(nodeType === PROJECT.CONCEPT_ENTITY) {
                setCursorStyle({
                    newCursor: NORMAL,
                    editCursor: checkPermission(conceptNsKey.U) ? NORMAL : DISABLE,
                    delCursor: checkPermission(conceptNsKey.D) ? NORMAL : DISABLE,
                });
            } else if(nodeType === PROJECT.CATEGORY) {
                setCursorStyle({
                    newCursor: NORMAL,
                    editCursor: checkPermission(categoryNsKey.U) ? NORMAL : DISABLE,
                    delCursor: checkPermission(categoryNsKey.D) ? NORMAL : DISABLE,
                });
            } else if(nodeType === PROJECT.DIAGRAM) {
                console.log(selectedData.current);
                switch (selectedData.current.current.type) {
                    case DIAGRAM.TYPE.P:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: checkPermission(physicNsKey.U) ? NORMAL : DISABLE,
                            delCursor: checkPermission(physicNsKey.D) ? NORMAL : DISABLE,
                        });
                        break;
                    case DIAGRAM.TYPE.L:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: checkPermission(logicNsKey.U) ? NORMAL : DISABLE,
                            delCursor: checkPermission(logicNsKey.D) ? NORMAL : DISABLE,
                        });
                        break;
                    case DIAGRAM.TYPE.C:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: checkPermission(conceptNsKey.U) ? NORMAL : DISABLE,
                            delCursor: checkPermission(conceptNsKey.D) ? NORMAL : DISABLE,
                        });
                        break;
                    case DIAGRAM.TYPE.M:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: checkPermission(mindNsKey.U) ? NORMAL : DISABLE,
                            delCursor: checkPermission(mindNsKey.D) ? NORMAL : DISABLE,
                        });
                        break;
                    case DIAGRAM.TYPE.MER:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: checkPermission(mermaidNsKey.U) ? NORMAL : DISABLE,
                            delCursor: checkPermission(mermaidNsKey.D) ? NORMAL : DISABLE,
                        });
                        break;
                    case DIAGRAM.TYPE.F:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: checkPermission(flowNsKey.U) ? NORMAL : DISABLE,
                            delCursor: checkPermission(flowNsKey.D) ? NORMAL : DISABLE,
                        });
                        break;
                    default:
                        setCursorStyle({
                            newCursor: NORMAL,
                            editCursor: DISABLE,
                            delCursor: DISABLE,
                        });
                }
            }
        } else {
            setCursorStyle({
                delCursor: DISABLE,
            });
        }
    }, []);
    useEffect(() => {
        if(selectedData.current === null) {
            setStyle();
        }

    }, [treeData, dataSource.project.categories]);
    const _onSelected = useCallback((selected) => {
        if(selected.length === 0) {
            selectedData.current = null;
            setStyle();
        }
        selectedNodesRef.current = selected;
        selectLenRef.current = selected.length;
        onSelectedLenChange && onSelectedLenChange(selectLenRef.current);
    }, []);

    const getCurrentDataSource = useCallback(() => {
        return dataSourceRef.current;
    }, []);

    const getNodeType = (type) => {
        switch (type) {
            case ENTITY.TYPE.P:
                return PROJECT.ENTITY;
            case ENTITY.TYPE.C:
                return PROJECT.CONCEPT_ENTITY;
            case ENTITY.TYPE.L:
                return PROJECT.LOGIC_ENTITY;
            default:
                return PROJECT.ENTITY;
        }
    };

    const _dropClick = useCallback((m) => {
        dropClick(m, selectedData.current, dataSource, categoriesRef.current,
            formData, modelingNavDisplayRef.current, (id, data) => {
                if(id) {
                    treeRef.current?.setNodeSelected([id]);
                    selectedData.current = filterCategoriesCheckFrom(tree2array(treeData)
                        .find(d => d.id === id), categoriesRef.current);
                    setStyle();
                } else if(data && (m.key.startsWith('entity-') || m.key.startsWith('diagram-'))){
                    onDoubleClick({
                        ...data,
                        nodeType: m.key.startsWith('entity-') ? getNodeType(data.type) : PROJECT.DIAGRAM,
                    });
                }
            }, getCurrentDataSource, treeDataRef.current, user);
    }, [
        dataSource.project.categories,
        dataSource.profile?.project?.setting,
    ]);

    useEffect(() => {
        !formData.current?.resetTree || formData.current?.resetTree(categoriesRef.current);
        !hardwareRef.current?.resetTree || hardwareRef.current?.resetTree(categoriesRef.current);
        !selectTreeRef.current?.resetTree ||
            selectTreeRef.current?.resetTree(categoriesRef.current);
        !changeDirRef.current?.resetTree || changeDirRef.current?.resetTree(categoriesRef.current);
    }, [dataSource.project.categories]);
    useEffect(() => {
        const menuExpends = (getCache('menuExpends', true) || {});
        treeRef.current?.setExpand(menuExpends[dataSource.id] || []);
    }, []);
    useEffect(() => {
        const keyDown = () => {
            // if(!_.isEmpty(Drawer.instance())) {
            //     return;
            // }
            // if ((e.ctrlKey || e.metaKey) && getSelectedType() === 'model'){
            //     switch (e.keyCode) {
            //         case 78:
            //             console.log('N');
            //             _dropClick({key: 'entity-C', name: '概念模型'});
            //             e.preventDefault();
            //             break;
            //         case 76:
            //             console.log('L');
            //             _dropClick({key: 'entity-L', name: '逻辑模型'});
            //             e.preventDefault();
            //             break;
            //         case 80:
            //             console.log('P');
            //             _dropClick({key: 'entity-P', name: '物理模型'});
            //             e.preventDefault();
            //             break;
            //         default: break;
            //     }
            // }
        };
        document.body.addEventListener('keydown', keyDown);
        return () => {
            document.body.removeEventListener('keydown', keyDown);
        };
    }, []);
    useEffect(() => {
        if(homeCoverDiagramRef.current) {
            const data = (dataSource.project.diagrams || [])
                .find(d => d.id === homeCoverDiagramRef.current);
            if(data) {
                treeRef.current.setNodeSelected([homeCoverDiagramRef.current]);
                treeRef.current.scrollToItem(homeCoverDiagramRef.current);
                onDoubleClick({
                    ...data,
                    nodeType: PROJECT.DIAGRAM,
                });
            }
        }
    }, []);
    const addDropMenu = useMemo(() => {
        const menu = [
            {
                key: 'entity',
                name: '模型',
                children: [
                    {
                        key: 'entity-P',
                        nsKey: physicNsKey.C,
                        name: '物理模型',
                    },
                    {
                        key: 'entity-L',
                        nsKey: logicNsKey.C,
                        name: '逻辑模型',
                    },
                    {
                        key: 'entity-C',
                        nsKey: conceptNsKey.C,
                        name: '概念模型',
                    },
                ],
            },
            {
                key: 'diagram',
                name: '关系图',
                children: [
                    {
                        key: 'diagram-P',
                        nsKey: physicNsKey.C,
                        name: '物理模型图',
                    },
                    {
                        key: 'diagram-L',
                        nsKey: logicNsKey.C,
                        name: '逻辑模型图',
                    },
                    {
                        key: 'diagram-C',
                        nsKey: conceptNsKey.C,
                        name: '概念模型图',
                    },
                    {
                        key: 'diagram-S',
                        name: '流程图',
                        nsKey: flowNsKey.C,
                    },
                    {
                        key: 'diagram-M',
                        nsKey: mindNsKey.C,
                        name: '思维导图',
                    },
                    {
                        key: 'diagram-MER',
                        nsKey: mermaidNsKey.C,
                        name: 'Mermaid图',
                    },
                ],
            }];
        modelingNavDisplayRef.current.hierarchyType === PROFILE.USER.FLAT ||
        menu.unshift({
            key: 'category',
            name: '分类',
            children: [
                {
                    nsKey: categoryNsKey.C,
                    key: 'category-P',
                    name: '同级分类',
                },
                {
                    nsKey: categoryNsKey.C,
                    key: 'category-C',
                    name: '子分类',
                },
                {
                    nsKey: categoryNsKey.C,
                    key: 'category-S',
                    name: 'schema',
                },
            ],
        });
        return menu;
    }, [modelingNavDisplayRef.current.hierarchyType]);


    const hardwareMenu = useMemo(() => {
        return [
            {
                key: 'import',
                name: '导入',
                // icon: 'icon-inout-import',
                children: [
                    {
                        nsKey: importNsKey,
                        key: 'fromEZDML',
                        name: '从EZDML文件',
                    },
                    {
                        nsKey: importNsKey,
                        key: 'fromPDManer',
                        name: '从PDManer及老版本文件',
                    },
                    {
                        nsKey: importNsKey,
                        key: 'fromPDManerEE',
                        name: '从项目文件导入',
                    },
                ],
            },
            {
                key: 'export',
                name: '导出',
                children: [
                    {
                        key: 'exportProject',
                        name: '导出项目',
                    },
                    {
                        nsKey: exportNsKey.ddl,
                        key: 'exportDDL',
                        name: '导出DDL',
                    },
                    {
                        nsKey: exportNsKey.word,
                        key: 'exportWORD',
                        name: '导出WORD文档',
                    },
                    {
                        nsKey: exportNsKey.html,
                        key: 'exportHtml',
                        name: '导出HTML文档',
                    },
                    {
                        nsKey: exportNsKey.html,
                        key: 'exportMarkDown',
                        name: '导出MarkDown文档',
                    },
                ],
            },
        ].filter(m => (readonly ? m.key !== 'import' : true));
    }, [readonly]);
    const computeSchemaName = useCallback((dragData) => {
        const arrayTree = tree2array([...(treeDataRef.current || [])]);
        if(dragData.type === COMPONENT.TREE.SUB) {
            const currentCategory = arrayTree.find(it => it.id === dragData.to);
            return currentCategory.bindSchema ? currentCategory.defKey : null;
        }
        const tempEntity = arrayTree.find(it => it.id === dragData.to);
        const currentCategory = arrayTree.find(it => it.id === tempEntity?.parentId?.split('_')[0]);
        return currentCategory.bindSchema ? currentCategory.defKey : null;
    } , []);
    const onDragSuccess = useCallback((dragData, dragStart) => {
        console.log(dragStart);
        let event, nodeType = dragStart.current.nodeType;
        if(nodeType === PROJECT.ENTITY ||
            nodeType === PROJECT.LOGIC_ENTITY ||
            nodeType === PROJECT.CONCEPT_ENTITY) {
           event = WS.ENTITY.MOP_ENTITY_DRAG;
        } else if(nodeType === PROJECT.DIAGRAM) {
           event = WS.DIAGRAM.MOP_DIAGRAM_DRAG;
        } else {
            event = WS.CATEGORY.MOP_CATEGORY_DRAG;
        }
        if(dragData.from !== dragData.to) {
            let schemaName = {};
            if(event === WS.ENTITY.MOP_ENTITY_DRAG &&
                modelingNavDisplayRef.current.hierarchyType  === PROFILE.USER.TREE) {
                schemaName = {
                    schemaName: computeSchemaName(dragData) || null,
                };
            }
            if(event === WS.ENTITY.MOP_ENTITY_DRAG &&
                modelingNavDisplayRef.current.hierarchyType === PROFILE.USER.TREE &&
                (dragStart?.current?.schemaName || '') !== (schemaName?.schemaName || '')) {
                const schemaNameKey = entityExistsKey({
                    ...dragStart.current,
                    ...schemaName,
                });
                const entityNameSet = [...(getCurrentDataSource().project.entities || [])]
                    .map(it => entityExistsKey(it));
                if(entityNameSet.find(it => it === schemaNameKey)) {
                    Message.error({title: `实体代码重复:${schemaNameKey}！`});
                    return;
                }
            }
            sendData({
                event,
                payload: [{
                    pre: checkFrom(dragStart),
                    next: {
                        ...dragData,
                        to: dragData.to === '_UNCATE' ? categoriesRef.current[categoriesRef.current.length - 1].id : dragData.to,
                        position: dragData.to === '_UNCATE' ? COMPONENT.TREE.AFTER : dragData.position,
                        data: {
                            ..._.omit(dragStart.current, ['children', 'diagramRefs', 'entityRefs']),
                            ...schemaName,
                        },
                    },
                    hierarchyType: modelingNavDisplayRef.current.hierarchyType,
                }],
            });

        }
    }, []);

    const computeSchemaRender = useCallback((node, value) => {
        if(modelingNavDisplayRef.current.hierarchyType === PROFILE.USER.FLAT) {
            return node?.schemaName ? `${node.schemaName}.${value}` : value;
        }
        return value;
    }, [dataSource.project.flat]);
    const labelRender = useCallback((node) => {
        const modelingNavDisplay = modelingNavDisplayRef.current;
        const type = node.type || '';
        if(node.type === ENTITY.TYPE.DEFAULT) {
            return computeSchemaRender(node, node.defName);
        } else if(node.nodeType === PROJECT.ENTITY ||
            node.nodeType === PROJECT.LOGIC_ENTITY ||
            node.nodeType === PROJECT.CONCEPT_ENTITY) {
            switch (type) {
                case ENTITY.TYPE.P: return computeSchemaRender(node, renderLabel(node,
                    modelingNavDisplay.physicEntityNode.optionValue,
                    modelingNavDisplay.physicEntityNode.customValue));
                case ENTITY.TYPE.L: return computeSchemaRender(node, renderLabel(node,
                    modelingNavDisplay.logicEntityNode.optionValue,
                    modelingNavDisplay.logicEntityNode.customValue));
                case ENTITY.TYPE.C: return computeSchemaRender(node, renderLabel(node,
                    modelingNavDisplay.conceptEntityNode.optionValue,
                    modelingNavDisplay.conceptEntityNode.customValue));
                default: return computeSchemaRender(node, node.defName);
            }
        } else if(node.nodeType === PROJECT.DIAGRAM) {
            return computeSchemaRender(node, renderLabel(node,
                modelingNavDisplay.diagramNode.optionValue,
                modelingNavDisplay.diagramNode.customValue,
            ));
        } else {
            return computeSchemaRender(node, renderLabel(node,
                modelingNavDisplay.categoryNode.optionValue,
                modelingNavDisplay.categoryNode.customValue));
        }
    }, [dataSource.project.flat]);

    const _hardwareDropClick = (m) => {
        hardwareDropClick(m, hardwareRef, getCurrentDataSource, categoriesRef.current,
            onRefresh, treeData);
    };
    const _delClick = useCallback(() => {
        delClick(selectedData.current, modelingNavDisplayRef.current, () => {
            selectedData.current = null;
        });
    }, []);
    const _updateClick = useCallback(() => {
        if(selectedData.current.current.parentId === '_UNCATE') {
            updateClick(unCateData(flatTreeDataRef.current,
                    selectedData.current.current), categoriesRef.current, formData,
                {
                    ...modelingNavDisplayRef,
                    hierarchyType: PROFILE.USER.FLAT,
                }, getCurrentDataSource, () => {
                    const tempFormData = formData.current.getData();
                    selectedData.current.current.defKey = tempFormData.defKey;
                    selectedData.current.current.defName = tempFormData.defName;
                    selectedData.current.current.intro = tempFormData.intro;
                }, treeDataRef.current, user);
            return;
        }
        updateClick(selectedData.current, categoriesRef.current, formData,
            modelingNavDisplayRef.current, getCurrentDataSource, () => {
            const tempFormData = formData.current.getData();
            selectedData.current.current.defKey = tempFormData.defKey;
            selectedData.current.current.defName = tempFormData.defName;
            selectedData.current.current.intro = tempFormData.intro;
        }, treeDataRef.current, user);
    }, [dataSource.project.categories]);

    const sortableRef = useRef(sortable);
    const onNodeClick = useCallback((node, before, after) => {
        if(node === null || node === undefined) {
            return;
        }
        selectedData.current = {
            current: node,
            before,
            after,
        };
        if(!sortableRef.current) {
            setStyle();
        }
    }, []);
    const checkSortable = useCallback((dragData, array, node, type, position) => {
        // 1.不能跨目录类型拖拽
        const from = dragData?.from || {};
        if(node?.parentId === '_UNCATE' ||
            (node.bindSchema === 1 && type === COMPONENT.TREE.SUB &&
                !(from.nodeType === PROJECT.ENTITY && from.type === ENTITY.TYPE.P)) ||
            (node.id === '_UNCATE' && type === COMPONENT.TREE.SUB) ||
            (type === COMPONENT.TREE.PEER &&
              [...(array || [])]
                  .filter(t => t.parentId === node.parentId && t.id !== node.id)
                  .find(t => t.defKey === node.defKey && t.bindSchema === 1)) ||
            (type === COMPONENT.TREE.SUB &&
                [...(node.children || [])]
                    .find(t => t.defKey === node.defKey && t.bindSchema === 1)) ||
            (node.id === '_UNCATE' && position === COMPONENT.TREE.AFTER)) {
            return false;
        }
        if(dragData.from.nodeType === node.nodeType) {
            // 1.不能跨目录类型拖拽
            // 2.数据表下不可以增加子节点
            // if(node.nodeType === PROJECT.ENTITY) {
                return !((
                    node.nodeType === PROJECT.ENTITY ||
                    node.nodeType === PROJECT.LOGIC_ENTITY ||
                    node.nodeType === PROJECT.CONCEPT_ENTITY ||
                    node.nodeType === PROJECT.DIAGRAM
                )
                && type === COMPONENT.TREE.SUB);
            // }
        } else if(dragData.from.nodeType !== node.nodeType) {
            if(dragData.from.nodeType === PROJECT.ENTITY && type === COMPONENT.TREE.SUB) {
                // 3.数据表可以跨类型拖动
                return node.nodeType === PROJECT.CATEGORY || node.nodeType === PROJECT.ENTITY_SUB;
            }
            if(dragData.from.nodeType === PROJECT.LOGIC_ENTITY && type === COMPONENT.TREE.SUB) {
                return node.nodeType === PROJECT.CATEGORY ||
                    node.nodeType === PROJECT.LOGIC_ENTITY_SUB;
            }
            if(dragData.from.nodeType === PROJECT.CONCEPT_ENTITY && type === COMPONENT.TREE.SUB) {
                return node.nodeType === PROJECT.CATEGORY ||
                    node.nodeType === PROJECT.CONCEPT_ENTITY_SUB;
            }
            if(dragData.from.nodeType === PROJECT.DIAGRAM && type === COMPONENT.TREE.SUB) {
                return node.nodeType === PROJECT.CATEGORY ||
                    node.nodeType === PROJECT.DIAGRAM_SUB;
            }

            return false;
        }
        return false;
    }, []);
    const onNodeDragStart = useCallback((e, node) => {
        onMenuDragStart && onMenuDragStart(e, node, selectedNodesRef.current);
    }, []);
    const onDropMenuClick = (menu) => {
        setAngelType(menu.key);
    };
    const onExpend = useCallback((expend) => {
        setCache('menuExpends', {
            ...(getCache('menuExpends', true) || {}),
            [dataSource.id] : expend,
        });
    }, []);
    const modelTransformationRef = useRef();
    const batchAdjustmentRef = useRef();
    const updateHomeCoverDiagram = (node, nodeId) => {
        const id = Math.uuid();
        openLoading('正在设置首页封面...', id); // MOP_PROJECT_HOME_COVER_DIAGRAM
        sendWsRequest({
            event: WS.PROJECT.MOP_PROJECT_HOME_COVER_DIAGRAM,
            payload: {
                homeCoverDiagramId: nodeId,
            },
        }).then(() => {
            if(nodeId) {
                Message.success({title: `${labelRender(node)}已成功设置为首页封面`});
            } else {
                Message.success({title: `${labelRender(node)}已成功取消为首页封面`});
            }
        }).catch((error) => {
            Message.error({title: `首页封面设置失败:${typeof error === 'string' ?  error : JSON.stringify(error)}`});
        }).finally(() => {
            closeLoading(id);
        });
    };
    const contentMenuClick = (m, e) => {
        const targetValue = e.target.value;
        const targetValueArray = e.target.valueArray;
        const targetEntities = entities.filter((entity) => {
            return targetValueArray.includes(entity.id);
        }).sort((a,b) => targetValueArray.indexOf(a.id) - targetValueArray.indexOf(b.id));
        const targetDiagrams = diagrams.filter((diagram) => {
            return targetValueArray.includes(diagram.id);
        });
        switch (m.key) {
            case 'newCategory':
                _dropClick({key: 'category-C', name: '物理模型'});
                break;
            case 'newSchema':
                _dropClick({key: 'category-S', name: '物理模型'});
                break;
            case 'setHomeCoverDiagram': updateHomeCoverDiagram(targetValue, targetValue.id); break;
            case 'cancelHomeCoverDiagram': updateHomeCoverDiagram(targetValue, null); break;
            case 'editCategory':
            case 'editDiagram':
            case 'editModel':
                _updateClick();
                break;
            case 'newModel':
                if(PROJECT.ENTITY === targetValue.nodeType ||
                    PROJECT.ENTITY_SUB === targetValue.nodeType) {
                    _dropClick({key: 'entity-P', name: '物理模型'});
                } else if(PROJECT.CONCEPT_ENTITY === targetValue.nodeType ||
                    PROJECT.CONCEPT_ENTITY_SUB === targetValue.nodeType) {
                    _dropClick({key: 'entity-C', name: '概念模型'});
                } else if(PROJECT.LOGIC_ENTITY === targetValue.nodeType ||
                    PROJECT.LOGIC_ENTITY_SUB === targetValue.nodeType) {
                    _dropClick({key: 'entity-L', name: '逻辑模型'});
                }
                break;
            case 'newDiagramC':
                _dropClick({key: 'diagram-C', name: '概念模型图'});
                break;
            case 'newDiagramL':
                _dropClick({key: 'diagram-L', name: '逻辑模型图'});
                break;
            case 'newDiagram':
            case 'newDiagramP':
                _dropClick({key: 'diagram-P', name: '物理模型图'});
                break;
            case 'newDiagramS':
                _dropClick({key: 'diagram-S', name: '流程图'});
                break;
            case 'newDiagramM':
                _dropClick({key: 'diagram-M', name: '思维导图'});
                break;
            case 'newDiagramMER':
                _dropClick({key: 'diagram-MER', name: 'Mermaid图'});
                break;
            case 'itemCheckAll':
                itemCheckAll(targetValue, treeRef);
                break;
            case 'copyModel':
            case 'copyDiagram':
                Copy([...targetEntities, ...targetDiagrams],
                    `成功复制了${[...targetEntities, ...targetDiagrams].length}个对象！`);
                break;
            case 'pasteModel':
                rightPasteClick(targetValue, entities,
                    modelingNavDisplayRef.current.hierarchyType,
                    WS.ENTITY.MOP_ENTITY_CREATE,getCurrentDataSource);
                break;
            case 'pasteDiagram':
                rightPasteClick(targetValue, diagrams,
                    modelingNavDisplayRef.current.hierarchyType,
                    WS.DIAGRAM.MOP_DIAGRAM_CREATE, getCurrentDataSource);
                break;
            case 'delModel':
                rightDelClick(targetValueArray, treeData, WS.ENTITY.MOP_ENTITY_DELETE,
                    () => {
                    onSelectedLenChange && onSelectedLenChange(0);
                    selectedData.current = null;
                });
                break;
            case 'delDiagram':
                rightDelClick(targetValueArray, treeData, WS.DIAGRAM.MOP_DIAGRAM_DELETE,
                    () => {
                    onSelectedLenChange && onSelectedLenChange(0);
                    selectedData.current = null;
                });
                break;
            case 'delCategory':
                rightDelModClick(targetValueArray,
                    treeData, categoriesRef.current,
                    selectedData.current,
                    modelingNavDisplayRef.current, () => {
                        selectedData.current = null;
                        onSelectedLenChange && onSelectedLenChange(0);
                    });
                break;
            case 'changeModel':
                changeDir(categoriesRef.current, changeDirRef, targetValueArray,
                    modelingNavDisplayRef.current, treeData, selectedData.current,
                    flatTreeDataRef.current, getCurrentDataSource);
                break;
            case 'genLogicModel':
            case 'genPhysicalModel':
            case 'genConceptModel':
                if(targetValue.nodeType === PROJECT.DIAGRAM) {
                    diagramsTransformation(targetValue, targetDiagrams, m.key,
                        modelTransformationRef, modelingNavDisplayRef.current,
                        getCurrentDataSource);
                } else {
                    modelTransformation(targetValue, targetEntities, m.key,
                        modelTransformationRef, modelingNavDisplayRef.current,
                        getCurrentDataSource);
                }
                break;
            case 'genLogicDiagram':
            case 'genPhysicalDiagram':
            case 'genConceptDiagram':
                model2Diagram(targetValue, targetEntities, getCurrentDataSource,
                    modelingNavDisplayRef.current.hierarchyType, (data) => {
                        onDoubleClick({
                            ...data,
                            nodeType: PROJECT.DIAGRAM,
                        });
                    });
                break;
            case 'mark':
                changeMark(targetValueArray, targetEntities, markChangeRef);
                // console.log('mark');
                break;
            case 'batchAdjustment':
                batchAdjustment({...targetValue},
                    getCurrentDataSource, batchAdjustmentRef,
                    modelingNavDisplayRef.current.hierarchyType);
                break;
            case 'createShallowCopy':
                createShallowCopy([...targetEntities, ...targetDiagrams],
                    getCurrentDataSource,modelingNavDisplayRef.current.hierarchyType,
                    treeData)
                    .then(() => closeLoading());
                break;
            default:
                break;
        }
    };
    const [pasteCheckData] = useState(false);
    const pasteCheck = () => {
        // Paste((text) => {
        //     try {
        //         setPasteCheckData((JSON.parse(text) || []).length === 0);
        //     } catch (err) {
        //         setPasteCheckData(true);
        //     }
        // });
    };
    const filterMenus = (m, v) => {
        if(sortableRef.current) {
            setSortable(false);
            sortableRef.current = false;
            setStyle();
        }
        if(!v) {
            return false;
        }
        const nodeType = v.nodeType;
        if((v.id === '_UNCATE' || v.parentId === '_UNCATE')
            && (nodeType === PROJECT.CATEGORY)) {
            return false;
        }

        switch (m.key) {
            case 'genLine':
                return [PROJECT.ENTITY, PROJECT.CONCEPT_ENTITY,
                    PROJECT.LOGIC_ENTITY,PROJECT.DIAGRAM].includes(nodeType);
            case 'delLine':
                return [PROJECT.ENTITY, PROJECT.CONCEPT_ENTITY,
                    PROJECT.LOGIC_ENTITY, PROJECT.CATEGORY,
                    PROJECT.DIAGRAM].includes(nodeType);
            case 'newCategory':
            case 'newSchema':
                return [PROJECT.CATEGORY].includes(nodeType) && !v?.bindSchema;
            case 'editCategory':
            case 'delCategory':
                return [PROJECT.CATEGORY].includes(nodeType);
            case 'newModel':
                return [PROJECT.ENTITY_SUB, PROJECT.CONCEPT_ENTITY_SUB,
                    PROJECT.LOGIC_ENTITY_SUB,PROJECT.ENTITY,
                    PROJECT.LOGIC_ENTITY, PROJECT.CONCEPT_ENTITY].includes(nodeType);
            case 'itemCheckAll':
            case 'batchAdjustment':
                return [PROJECT.ENTITY_SUB, PROJECT.CONCEPT_ENTITY_SUB,
                    PROJECT.LOGIC_ENTITY_SUB,PROJECT.DIAGRAM_SUB].includes(nodeType);
            case 'pasteModel':
                pasteCheck();
                return [PROJECT.ENTITY_SUB, PROJECT.CONCEPT_ENTITY_SUB,
                    PROJECT.LOGIC_ENTITY_SUB,PROJECT.ENTITY,
                    PROJECT.LOGIC_ENTITY, PROJECT.CONCEPT_ENTITY].includes(nodeType);
            case 'copyModel':
            case 'delModel':
            case 'editModel':
                return [PROJECT.ENTITY, PROJECT.CONCEPT_ENTITY,
                    PROJECT.LOGIC_ENTITY].includes(nodeType);
            case 'changeModel':
                return [PROJECT.ENTITY, PROJECT.CONCEPT_ENTITY,
                    PROJECT.LOGIC_ENTITY, PROJECT.DIAGRAM].includes(nodeType);
            case 'newDiagram':
            case 'newDiagramC':
            case 'newDiagramL':
            case 'newDiagramP':
            case 'newDiagramS':
            case 'newDiagramM':
            case 'newDiagramMER':
                return [PROJECT.DIAGRAM, PROJECT.DIAGRAM_SUB].includes(nodeType);
            case 'pasteDiagram':
                return [PROJECT.DIAGRAM, PROJECT.DIAGRAM_SUB].includes(nodeType);
            case 'createShallowCopy':
                return [PROJECT.ENTITY, PROJECT.CONCEPT_ENTITY,
                    PROJECT.LOGIC_ENTITY, PROJECT.DIAGRAM].includes(nodeType);
            case 'copyDiagram':
            case 'delDiagram':
            case 'editDiagram':
                return [PROJECT.DIAGRAM].includes(nodeType);
            case 'setHomeCoverDiagram': return [PROJECT.DIAGRAM].includes(nodeType) && homeCoverDiagramRef.current !== v.id;
            case 'cancelHomeCoverDiagram': return [PROJECT.DIAGRAM].includes(nodeType) && homeCoverDiagramRef.current === v.id;
            case 'genConceptDiagram': return [PROJECT.CONCEPT_ENTITY].includes(nodeType);
            case 'genLogicDiagram': return [PROJECT.LOGIC_ENTITY].includes(nodeType);
            case 'genPhysicalDiagram': return [PROJECT.ENTITY].includes(nodeType);
            case 'mark': return [PROJECT.CONCEPT_ENTITY, PROJECT.LOGIC_ENTITY, PROJECT.ENTITY].includes(nodeType);
            case 'genConceptModel':
                return (nodeType === PROJECT.DIAGRAM && (v.type === 'P' || v.type === 'L')) ||
                    [PROJECT.ENTITY, PROJECT.LOGIC_ENTITY].includes(nodeType);
            case 'genLogicModel':
                return (nodeType === PROJECT.DIAGRAM && (v.type === 'P' || v.type === 'C')) ||
                    [PROJECT.ENTITY, PROJECT.CONCEPT_ENTITY].includes(nodeType);
            case 'genPhysicalModel':
                return (nodeType === PROJECT.DIAGRAM && (v.type === 'C' || v.type === 'L')) ||
                    [PROJECT.CONCEPT_ENTITY, PROJECT.LOGIC_ENTITY].includes(nodeType);
            default:
                return false;
        }
    };
    const getContentNsKey = (menu, type) => {
        const getDiagramMap = (menuType, opt) => {
            return {
                C: conceptNsKey[opt],
                L: logicNsKey[opt],
                P: physicNsKey[opt],
                M: mindNsKey[opt],
                MER: mermaidNsKey[opt],
                F: flowNsKey[opt],
            }[menuType];
        };
        const getModelMap = (menuType, opt) => {
          return {
              C: conceptNsKey[opt],
              L: logicNsKey[opt],
              P: physicNsKey[[opt]],
          }[menuType];
        };
        switch (type){
            case 'editDiagram':
                return getDiagramMap(menu.type, 'U');
            case 'delDiagram':
                return getDiagramMap(menu.type, 'D');
            case 'editModel':
                return getModelMap(menu.type, 'U');
            case 'newModel':
                return getModelMap(menu.type === 'default' ? menu.id.split('_').slice(-1)[0] : menu.type, 'C');
            case 'delModel':
                return getModelMap(menu.type, 'D');
            default: return '';
        }
    };

    const contentMenus = useMemo(() => {
        return [{ key: 'editDiagram', name: '编辑', nsKey: m => getContentNsKey(m, 'editDiagram')},
            { key: 'newDiagram', name: '新建'}]
        .concat([{key: 'newDiagramC', name: '新建-概念模型图', value: 'conceptEntityNode', nsKey: conceptNsKey.C},
            {key: 'newDiagramL', name: '新建-逻辑模型图', value: 'logicEntityNode', nsKey: logicNsKey.C},
            {key: 'newDiagramP', name: '新建-物理模型图', value: 'physicEntityNode', nsKey: physicNsKey.C}]
            .sort((a, b) => {
            return userProfile?.modelingNavDisplay?.[a.value]?.orderValue
                - userProfile?.modelingNavDisplay?.[b.value]?.orderValue;
        }).map(t => ({
            key: t.key,
            name: t.name,
        }))).concat([{key: 'newCategory', name: '新建子目录', nsKey: categoryNsKey.C},
            {key: 'newSchema', name: '新建schema', nsKey: categoryNsKey.C},
            {key: 'editCategory', name: '编辑', nsKey: categoryNsKey.U},
            {key: 'editModel', name: '编辑', nsKey: m => getContentNsKey(m, 'editModel')},
            {key: 'newModel', name: '新建', nsKey: m => getContentNsKey(m, 'newModel')},
            {key: 'newDiagramS', name: '新建-流程图', nsKey: flowNsKey.C},
            {key: 'newDiagramM', name: '新建-思维导图', nsKey: mindNsKey.C},
            {key: 'newDiagramMER', name: '新建-Mermaid图', nsKey: mermaidNsKey.C},
            {key: 'copyModel', name: '复制'},
            {key: 'copyDiagram', name: '复制'},
            {key: 'pasteModel', name: '粘贴', disable:pasteCheckData},
            {key: 'pasteDiagram', name: '粘贴'},
            {key: 'createShallowCopy', name: '创建副本'},
            {key: 'changeModel', name: '分类', nsKey: categoryNsKey.C},
            {key: 'genLine', line: true},
            {key: 'genConceptModel', name: '转概念', nsKey: conceptNsKey.C},
            {key: 'genLogicModel', name: '转逻辑', nsKey: logicNsKey.C},
            {key: 'genPhysicalModel', name: '转物理', nsKey: physicNsKey.C},
            {key: 'delLine', line: true},
            {key: 'setHomeCoverDiagram', name: '设为首页封面', nsKey: m => getContentNsKey(m, 'editDiagram')},
            {key: 'cancelHomeCoverDiagram', name: '取消首页封面', nsKey: m => getContentNsKey(m, 'editDiagram')},
            {key: 'genLine', line: true},
            {key: 'mark', name: '标记', nsKey: physicNsKey.C},
            {key: 'genConceptDiagram', name: '生成关系图', nsKey: conceptNsKey.C},
            {key: 'genLogicDiagram', name: '生成关系图', nsKey: logicNsKey.C},
            {key: 'genPhysicalDiagram', name: '生成关系图', nsKey: physicNsKey.C},
            {key: 'delLine', line: true},
            {key: 'delCategory', name: '删除', nsKey: categoryNsKey.D },
            {key: 'delDiagram', name: '删除', nsKey: m => getContentNsKey(m, 'delDiagram')},
            {key: 'delModel', name: '删除', nsKey: m => getContentNsKey(m, 'delModel')},
            {key: 'itemCheckAll', name: '项下全选'},
            {key: 'batchAdjustment', name: '批量调整', nsKey: physicNsKey.C},
        ]).filter((m) => {
            return (readonly ? m.key.startsWith('copy') : true);
        });
    }, [userProfile?.modelingNavDisplay, pasteCheckData, readonly]);
    const takeAim = () => {
        const activeTab = getCurrentTab();
        if(activeTab) {
            treeRef.current.setNodeSelected([activeTab]);
            //treeRef.current.scrollToItem(activeTab);
        }
    };
    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(APP_EVENT.CLICK, () => {
            // const currentTarget = e.target;
            if(sortableRef.current) {
                setSortable(false);
                sortableRef.current = false;
                setStyle();
            }
        }, eventId);
        return () => {
            unSubscribeEvent(APP_EVENT.CLICK, eventId);
        };
    }, []);
    useImperativeHandle(ref, () => {
        return {
            setMenuSelected: (selected) => {
                treeRef.current.setNodeSelected([selected]);
                treeRef.current.scrollToItem(selected);
            },
        };
    }, []);
    const onKeyDown = (e) => {
        // 67 86
        if(e.ctrlKey || e.metaKey && selectedNodesRef.current.length > 0) {
            if(e.keyCode === 67) {
                const targetEntities = entities.filter((entity) => {
                    return selectedNodesRef.current.includes(entity.id);
                });
                const targetDiagrams = diagrams.filter((diagram) => {
                    return selectedNodesRef.current.includes(diagram.id);
                });
                Copy([...targetEntities, ...targetDiagrams],
                    `成功复制了${[...targetEntities, ...targetDiagrams].length}个对象！`);
                e.preventDefault();
            } else if(e.keyCode === 86 && !isView) {
                const lastMenu = selectedNodesRef.current[selectedNodesRef.current.length - 1];
                const lastData = tree2array(treeData).find(d => d.id === lastMenu);
                if(lastData) {
                    if(lastData.nodeType === 'entity' || lastData.nodeType === 'entity_sub') {
                        rightPasteClick(lastData, entities,
                            modelingNavDisplayRef.current.hierarchyType,
                            WS.ENTITY.MOP_ENTITY_CREATE, getCurrentDataSource);
                    } else if(lastData.nodeType === 'diagram' ||  lastData.nodeType === 'diagram_sub') {
                        rightPasteClick(lastData, diagrams,
                            modelingNavDisplayRef.current.hierarchyType,
                            WS.DIAGRAM.MOP_DIAGRAM_CREATE, getCurrentDataSource);
                    }
                    e.preventDefault();
                }
            }
        }
        console.log('onKeyDown', e.keyCode);
    };
    const _setSortable = (e) => {
        setSortable(!sortable);
        sortableRef.current = !sortable;
        sortable ? setStyle() : setCursorStyle({
            newCursor: DISABLE,
            editCursor: DISABLE,
            delCursor: DISABLE,
        });
        e.stopPropagation();
    };
    const onMouseDown = (e) => {
        notify(APP_EVENT.CLICK, e);
    };
    return <div onMouseDown={onMouseDown} className={currentPrefix}>
      <div className={`${currentPrefix}-tool`}>
        <span>建模设计</span>
        <DropDown
          trigger='hover'
          menuClick={onDropMenuClick}
          menus={angleMenu.filter(a => a.key !== angleType)}
          position='buttom'>
          <span><Icon type='icon-exchange'/><span>{angleMenu
              .find(a => a.key === angleType)?.name}</span></span>
        </DropDown>
        <Tooltip
          placement='bottomLeft'
          force
          trigger='hover'
          title={<MenuSort
            close
            updateUserProfile={updateUserProfile}
            userProfile={userProfile}
            projectId={dataSource.id}
          />}>
          <span><Icon type='icon-adjust'/></span>
        </Tooltip>
      </div>
      <div className={`${currentPrefix}-opt`}>
        <span>
          <DropDown
            trigger='hover'
            menus={(cursorStyle.newCursor === DISABLE || readonly) ? [] : addDropMenu}
            menuClick={_dropClick}
          >
            <span>
              <Icon
                type='icon-oper-plus'
                style={{
                      cursor: 'pointer',
                  }}
                status={readonly ? DISABLE : cursorStyle.newCursor}/>
            </span>
          </DropDown>
          {
            <span>
              <Icon
                type='icon-oper-edit'
                onClick={_updateClick}
                style={{
                      cursor: 'pointer',
                  }}
                status={readonly ? DISABLE : cursorStyle.editCursor}/>
            </span>
            }
          <span>
            <Icon
              type='icon-oper-delete'
              onClick={_delClick}
              style={{
                    cursor: 'pointer',
                }}
              status={readonly ? DISABLE : cursorStyle.delCursor}/>
          </span>
          <DropDown
            trigger='hover'
            menus={hardwareMenu}
            menuClick={_hardwareDropClick}
            >
            <span>
              <Icon
                type='icon-import-export'
                style={{
                      cursor: 'pointer',
                  }}
              />
            </span>
          </DropDown>
        </span>
        <span>
          <span>
            <Icon onClick={takeAim} type='icon-take-aim'/>
          </span>
          <span>
            <Icon
              onClick={e => _setSortable(e)}
                //     className={classesMerge({
                //       [`${currentPrefix}-opt-sort`]: true,
                //       [`${currentPrefix}-opt-sort-enable`]: sortable,
                //   })}
              status={readonly ? DISABLE : NORMAL}
              type='icon-active-sort'/>
          </span>
          <span>
            <Icon
              onClick={e => showSearch(e, selectedNodesRef.current)}
                // className={`${currentPrefix}-opt-search`}
              type='icon-search'
            />
          </span>
        </span>
      </div>
      {/*<div className={`${currentPrefix}-home`}>*/}
      {/*  <Icon type='icon-home'/>*/}
      {/*    首页封面*/}
      {/*</div>*/}
      <ContentMenu
        menuClick={contentMenuClick}
        filterMenus={filterMenus}
        contentMenus={contentMenus}
        >
        <div onKeyDown={onKeyDown} className={`${currentPrefix}-tree`}>
          <Tree
            countable
            onSelected={_onSelected}
            onDragSuccess={onDragSuccess}
            labelRender={labelRender}
            ref={treeRef}
            onDoubleClick={onDoubleClick}
            sortable={sortable}
            data={treeData}
            onNodeClick={onNodeClick}
            checkSortable={checkSortable}
            onNodeDragStart={onNodeDragStart}
            onExpend={onExpend}
            allowCrossDirectorySelection={false}
          />
        </div>
      </ContentMenu>
    </div>;
}));
