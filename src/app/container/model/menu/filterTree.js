import React from 'react';
import {
    baseCategoryNsKey, baseConceptNsKey, baseFlowNsKey,
    baseLogicNsKey, baseMermaidNsKey, baseMindNsKey,
    basePhysicNsKey,
    checkDataPermission,
} from '../../../../lib/permission';
import {CATEGORY, DIAGRAM, ENTITY, PROFILE, PROJECT} from '../../../../lib/constant';
import {tree2array} from '../../../../lib/tree';
import schemaExpand from '../style/schema_expand.svg';
import schemaSelected from '../style/schema_selected.svg';
import schema from '../style/schema.svg';
import {renderLabel} from './tool';
import {getMemoryCache, setMemoryCache} from '../../../../lib/cache';

// eslint-disable-next-line max-len
export const virtualNode = [PROJECT.ENTITY_SUB, PROJECT.LOGIC_ENTITY_SUB, PROJECT.CONCEPT_ENTITY_SUB, PROJECT.DIAGRAM_SUB];

const filterEmpty = (data, dataSource) => {
    if(dataSource?.profile?.user?.modelingNavDisplay?.nodeType === PROFILE.USER.NON_EMPTY) {
        return data.filter(b => b.children.length > 0);
    }
    return data;
};

const getEntityMap = (entityData) => {
    const cache = getMemoryCache('entityData');
    if(entityData === cache) {
        return getMemoryCache('entityMapData');
    }
    const entityMapData = {};
    entityData.forEach((e) => {
        entityMapData[e.id] = e;
    });
    setMemoryCache('entityData', entityData);
    setMemoryCache('entityMapData', entityMapData);
    return entityMapData;
};

const getCategoryRefData = (d, t, nodeType, dataSource, props) => {
    const {filterDiagramType = []} = props;
    const refs = d[t ? 'entityRefs' : 'diagramRefs'] || [];
    const entityMap = getEntityMap(dataSource.project.entities);
    return (t ? refs : refs.filter((e) => {
        const typeMap = {
            C: baseConceptNsKey,
            L: baseLogicNsKey,
            P: basePhysicNsKey,
            M: baseMindNsKey,
            F: baseFlowNsKey,
            MER: baseMermaidNsKey,
        };
        // 关系图模式下 子类权限筛选
        return checkDataPermission(typeMap[e.refObjectType]) > -1;
    })).map((e) => {
        let currentData;
        if(t) {
            currentData = entityMap[e.refObjectId];
            if(currentData.type !== t) {
                currentData = null;
            }
        } else {
            const currentDataArray = (dataSource.project.diagrams || [])
                // eslint-disable-next-line max-len
                .filter(it => (filterDiagramType.length === 0 ? true : filterDiagramType.includes(it.type)));
            currentData = currentDataArray
                .find(c => (!t || (t && c.type === t)) && (c.id === e.refObjectId));
        }
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
                    defKey: currentData.defKey,
                    defName: currentData.defName,
                    id: currentData.id,
                    fields: currentData.fields,
                    indexes: currentData.indexes,
                    cellsData: currentData.cellsData,
                    parentId: d.id,
                    nodeType,
                    draggable: !!t,
                    type: t || currentData.type,
                    sortable: false,
                    icon: t ? '' : diagramIcon[currentData.type],
                };
            }
            return {
                defKey: currentData.defKey,
                defName: currentData.defName,
                id: currentData.id,
                fields: currentData.fields,
                indexes: currentData.indexes,
                cellsData: currentData.cellsData,
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

const transformTreeData = (data, parent, dataSource, props) => {
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
            children:  d.classifyType === CATEGORY.CLASSIFY_TYPE.NONE ?
                // eslint-disable-next-line no-use-before-define
                [...getBaseChildren(d, dataSource, props)] :
                // eslint-disable-next-line no-use-before-define
                filterEmpty([...getBaseChildren(d, dataSource, props)]),
        };
    }), dataSource);
};

// eslint-disable-next-line max-len
const filterClassifyType = (d, dataSource, props) => {
    const { filterNodes = virtualNode} = props;
    const all = [
        {
            id: `${d.id}_${ENTITY.TYPE.P}`,
            defKey: `${d.id}_${ENTITY.TYPE.P}`,
            defName: '物理模型',
            children: getCategoryRefData(d, ENTITY.TYPE.P, PROJECT.ENTITY, dataSource, props),
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
            children: getCategoryRefData(d, ENTITY.TYPE.L, PROJECT.LOGIC_ENTITY, dataSource, props),
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
            // eslint-disable-next-line max-len
            children: getCategoryRefData(d, ENTITY.TYPE.C, PROJECT.CONCEPT_ENTITY, dataSource, props),
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
            children: getCategoryRefData(d, null, PROJECT.DIAGRAM, dataSource, props),
            sortable: false,
            searchable: false,
            type: 'default',
            icon: 'icon-diagram-relation',
            nodeType: PROJECT.DIAGRAM_SUB,
            parentId: d.id,
            value: 'diagramNode',
        },
    ].filter(it => filterNodes.includes(it.nodeType));

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
        }].filter(it => all.find(item => item.value === it.value));

        return sortValue.sort((a, b) => {
            return dataSource?.profile?.user?.modelingNavDisplay?.[a.value]?.orderValue
                - dataSource?.profile?.user?.modelingNavDisplay?.[b.value]?.orderValue;
        }).reduce((acc, cur) => {
            return [
                ...acc,
                ...getCategoryRefData(d, cur.t, cur.nodeType, dataSource, props),
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

const getBaseChildren = (d, dataSource, props) => {
    return (
        d.classifyType === CATEGORY.CLASSIFY_TYPE.NONE ? [
            ...filterClassifyType(d, dataSource, props),
            ...filterEmpty(transformTreeData((d.children || []), d, dataSource, props), dataSource),
        ] : [
            ...filterEmpty([
                ...filterClassifyType(d, dataSource, props),
                ...transformTreeData((d.children || []), d, dataSource, props),
            ], dataSource),
        ]
    ).filter(m => checkDataPermission(m.nsKey) > -1 && (d.bindSchema === 1 ? m.value === 'physicEntityNode' : true)).sort((a, b) => {
        return dataSource.profile.user.modelingNavDisplay?.[a.value]?.orderValue
            - dataSource.profile.user.modelingNavDisplay?.[b.value]?.orderValue;
    });
};

const transformSimpleTreeData = (data, dataSource, props) => {
    return getBaseChildren({
        ...data,
        id: 'base_flat',
    }, dataSource, props);
};

const getNoCategoryData = (project, props) => {
    const {filterDiagramType = []} = props;
    const categories = tree2array(project.categories);
    const allCategoryEntities = {};
    const allCategoryDiagrams = [];
    categories.forEach((category) => {
        category.entityRefs.forEach((entityRef) => {
            allCategoryEntities[entityRef.refObjectId] = entityRef.refObjectId;
        });
        allCategoryDiagrams.push(...category.diagramRefs.map(d => d.refObjectId));
    });
    const entityRefs = [];
    project.entities.forEach((entity) => {
        if(!allCategoryEntities[entity.id]) {
            entityRefs.push({
                refObjectId: entity.id, refObjectType: entity.type,
            });
        }
    });
    return {
        id: '_UNCATE',
        defKey: '$NCO',
        defName: '未分类对象',
        parentId: '',
        entityRefs,
        // eslint-disable-next-line max-len
        diagramRefs: project.diagrams.filter(it => (filterDiagramType.length === 0 ? true : filterDiagramType.includes(it.type)))
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
};


export const filterTreeData = (dataSource, props = {}) => {
    if(dataSource.profile.user.modelingNavDisplay?.hierarchyType === PROFILE.USER.TREE) {
        const noCategoryData = getNoCategoryData(dataSource.project, props);
        return transformTreeData((checkDataPermission(baseCategoryNsKey) > -1
                ? dataSource.project.categories : [])
                .concat((noCategoryData.entityRefs.length > 0
                    || noCategoryData.diagramRefs.length > 0) ? noCategoryData : []), null,
            dataSource, props);
    }
    return transformSimpleTreeData(dataSource.project.flat, dataSource, props);
};


export const labelRenderGlobal = (node, userProfile) => {
    const modelingNavDisplay = userProfile.modelingNavDisplay;
    const type = node.type || '';
    if(node.type === ENTITY.TYPE.DEFAULT) {
        return node.defName;
    } else if(node.nodeType === PROJECT.ENTITY ||
        node.nodeType === PROJECT.LOGIC_ENTITY ||
        node.nodeType === PROJECT.CONCEPT_ENTITY) {
        switch (type) {
            case ENTITY.TYPE.P: return renderLabel(node,
                modelingNavDisplay.physicEntityNode.optionValue,
                modelingNavDisplay.physicEntityNode.customValue);
            case ENTITY.TYPE.L: return renderLabel(node,
                modelingNavDisplay.logicEntityNode.optionValue,
                modelingNavDisplay.logicEntityNode.customValue);
            case ENTITY.TYPE.C: return renderLabel(node,
                modelingNavDisplay.conceptEntityNode.optionValue,
                modelingNavDisplay.conceptEntityNode.customValue);
            default: return node.defName;
        }
    } else if(node.nodeType === PROJECT.DIAGRAM) {
        return renderLabel(node,
            modelingNavDisplay.diagramNode.optionValue,
            modelingNavDisplay.diagramNode.customValue,
        );
    } else {
        return renderLabel(node,
            modelingNavDisplay.categoryNode.optionValue,
            modelingNavDisplay.categoryNode.customValue);
    }
};
