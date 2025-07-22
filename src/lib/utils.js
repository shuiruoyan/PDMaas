import _ from 'lodash';
import { parseEZDML, parsePdmaas, parsePDManer, removeInvalidCells} from "dataSource_utils";
import allLangData from '../lang';
import {COMPONENT, ENTITY, PROFILE, WS} from './constant'
import {getTemplate2String} from "./json2code";
import {tree2array} from "./tree";
import ExcelJS from "exceljs";
import {baseCategoryNsKey, basePhysicNsKey, checkDataPermission} from "./permission";
import {
    AlignmentType, convertInchesToTwip,
    File, Footer,
    HeadingLevel, ImageRun, LevelFormat, Packer, PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow, TextRun,
    VerticalAlign,
    WidthType
} from "docx";
import moment from "moment";
import { html } from "./html";
import {markdown} from './markdown';

export const getMessage = ({lang = 'zh', id, defaultMessage, format, data}) => {
    const reg = /\{(\w+)\}/g; // 国际化变量替换 格式为 {变量名} data中的变量名与之匹配
    const langData = allLangData[lang];
    const message = _.get(langData, id, defaultMessage);
    const defaultFormat = () => {
        if (data) {
            return message.replace(reg, (...replaces) => {
                return data[replaces[1]];
            });
        }
        return message;
    };
    return format ? format(message) : defaultFormat();
};

export const sendData = (data, ctId, callback, notifyLocal) => {
    // 通知ws发消息
    notify(WS.SEND_DATA, {
        ctId: ctId || Math.uuid(),
        ...data,
        notifyLocal,
        timestamp: moment().valueOf(),
        callback,
    })
}

export const checkFrom = (selectedNode) => {
    if(selectedNode.after && selectedNode.after.type !== ENTITY.TYPE.DEFAULT
        && selectedNode.after.id !== '_UNCATE') {
        return {
            from: selectedNode.after.id,
            type: COMPONENT.TREE.PEER,
            position: COMPONENT.TREE.BEFORE,
        };
        // eslint-disable-next-line max-len
    } else if(selectedNode.before && selectedNode.before.type !== ENTITY.TYPE.DEFAULT
        && selectedNode.before.id !== '_UNCATE') {
        return {
            from: selectedNode.before.id,
            type: COMPONENT.TREE.PEER,
            position: COMPONENT.TREE.AFTER,
        };
    }
    return {
        from: selectedNode.current.parentId === '_UNCATE' ? null : selectedNode.current.parentId,
        type: COMPONENT.TREE.SUB,
        position: null,
    };
};


// 缓存文本宽度 减少dom计算渲染
let textWidthCache = {};
export  const getTextSize = (text = '', style = {}) => {
    const styles = Object.keys(style);
    const cacheName = `${text}${styles.map(s => `${s}:${style[s]}`).join('')}`;
    if(cacheName in textWidthCache) {
        return textWidthCache[cacheName]
    }
    let dom = document.getElementById('calcTextWidth');
    if (!dom) {
        dom = document.createElement('div');
        dom.setAttribute('id', 'calcTextWidth');
        dom.style.display = 'inline-block';
        styles.forEach(s => {
            dom.style[s] = style[s];
        })
        document.body.appendChild(dom);
    }
    dom.innerText = typeof text === 'string' ?
        text.replace(/\r|\n|\r\n/g, '')
        : text;
    const { width, height } =  dom.getBoundingClientRect();
    if(Object.keys(textWidthCache).length > 1000000) {
        // 如果缓存数量超过百万 则清除数据 释放内存
        textWidthCache = {}
    }
    textWidthCache[cacheName] = {
        width: Math.ceil(width),
        height: Math.ceil(height),
    };
    return textWidthCache[cacheName];
};

export const getEmptyField = () => {
    return {
        id: '',
        defKey:'',
        defName:'',
        intro:'',
        baseDataType:'',
        bizDomainType:'',
        dbDataType:'',
        dataLen:'',
        numScale:'',
        primaryKey: 0,
        notNull: 0,
        autoIncrement: 0,
        defaultValue:'',
        stndDictId: '',
        stndFieldId: '',
        attr1:'',
        attr2:'',
        attr3:'',
        attr4:'',
        attr5:'',
        attr6:'',
        attr7:'',
        attr8:'',
        attr9:'',
        attr10:'',
        attr11:'',
        attr12:'',
        attr13:'',
        attr14:'',
        attr15:'',
        attr16:'',
        attr17:'',
        attr18:'',
        attr19:'',
        attr20:'',
        origin:'UI',
    }
}

export const getEmptyIndex = () => {
    return {
        id: '',
        type: '',
        defKey: '',
        defName: '',
        intro: '',
        fields: []
    }
}

export const pasteFilterKey = (tempArray, data, id) => {
    let findValueKey = data.defKey;
    // eslint-disable-next-line no-loop-func
    while (tempArray.find(f => f.defKey === findValueKey)) {
        if(findValueKey === '' || findValueKey === undefined || findValueKey === null) {
            break;
        }
        let findValueKeySplit = findValueKey.split('_');
        if(findValueKeySplit.length === 1) {
            findValueKey = `${findValueKey}_${1}`;
            continue;
        }
        let lastStr = findValueKeySplit[findValueKeySplit.length - 1];
        let tempNum = parseInt(lastStr, 10);
        // eslint-disable-next-line no-restricted-globals
        if(isNaN(tempNum)) {
            findValueKey = `${findValueKey}_${1}`;
        } else {
            findValueKey = `${findValueKey.slice(0, findValueKey.length - lastStr.length - 1)}_${tempNum + 1}`;
        }
    }
    return {
        ...data,
        origin: 'PASTE',
        defKey: findValueKey,
        id,
    };
}

export const filterRepeatKey = (tempArray, defKey) => {
    let tempDefKey = defKey;
    while (tempArray.find(f => f.defKey?.toLocaleLowerCase?.() === tempDefKey?.toLocaleLowerCase?.())) {
        if(tempDefKey === '' || tempDefKey === undefined || tempDefKey === null) {
            tempDefKey = 'column_1'
            continue;
        }
        let findValueKeySplit = tempDefKey.split('_');
        if(findValueKeySplit.length === 1) {
            tempDefKey = `${tempDefKey}_${1}`;
            continue;
        }
        let lastStr = findValueKeySplit[findValueKeySplit.length - 1];
        let tempNum = parseInt(lastStr, 10);
        // eslint-disable-next-line no-restricted-globals
        if(isNaN(tempNum)) {
            tempDefKey = `${tempDefKey}_${1}`;
        } else {
            tempDefKey = `${tempDefKey.slice(0, tempDefKey.length - lastStr.length - 1)}_${tempNum + 1}`;
        }

    }
    return tempDefKey;
}

export const transformProject2Filter = (project, categories, currentCategory) => {
    const categoryArray = tree2array(categories);
    const getEntityPath = (id, type) => {
        const category = categoryArray.find(c => c[type === 'D' ? 'diagramRefs' : 'entityRefs']?.some(r => r.refObjectId === id));
        if(category) {
            return (category.parents || []).concat(category).map(c => c.defKey).join('/');
        }
        return ''
    }
    const currentCategoryData = categoryArray.find(c => c.id === currentCategory);
    const getCategoryRefObjectId = (category) => {
        return (category.entityRefs || [])
            .concat((category.children || []).reduce((p, n) => {
                return p.concat(getCategoryRefObjectId(n))
            }, []));
    }
    const currentCategoryRefEntities = currentCategoryData ? getCategoryRefObjectId(currentCategoryData)
        .map(e => e.refObjectId) : []
    return (project.entities || []).filter(e => {
        if(currentCategoryData) {
            return currentCategoryRefEntities.includes(e.id)
        }
        return true;
    }).reduce((p, n) => {
        const entity = {id: n.id, type: n.type, defKey: n.defKey, defName: n.defName, path: getEntityPath(n.id)};
        return p.concat(entity)
            .concat((n.fields || []).map(f => ({
                id: f.id, entity, type: 'F', defKey: f.defKey, defName: f.defName, path: `${getEntityPath(n.id)}/${entity.defKey}`})))
    }, [])
        .concat((project.diagrams || []).map(d => ({id: d.id, type: `D${d.type}`, defKey: d.defKey, defName: d.defName, path: getEntityPath(d.id, 'D')})))
}

export const getProjectFilterData = (filterValue, filterData) => {
    const safeFilterValue = (filterValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    if(!safeFilterValue) {
        return  []
    }
    const reg = new RegExp(safeFilterValue, 'ig');
    const namesMap = {
        P: '物理模型',
        L: '逻辑模型',
        C: '概念模型',
        F: '字段',
        DP: '物理模型图',
        DL: '逻辑模型图',
        DC: '概念模型图',
        DF: '流程图',
        DM: '思维导图',
        DMER: 'Mermaid图'
    }
    const getDefValue = (d) => {
      if(d.defName) {
          return `${d.defKey}-${d.defName}`
      }
      return d.defKey
    }
    return filterData.map(d => {
        reg.lastIndex = 0;
        if(reg.test(d.defName) || reg.test(d.defKey)) {
            if(d.type === 'F') {
                const entity = d.entity;
                const html = `${getDefValue(d)}`.replace(reg, '<span class="quick-search-list">$&</span>')
                return {
                    html: `${namesMap[entity.type]}:[${getDefValue(entity)}]:字段[${html}]`,
                    data: d
                }
            }
            const html = `${getDefValue(d)}`.replace(reg, '<span class="quick-search-list">$&</span>')
            return {
                html: `${namesMap[d.type]}:[${html}]`,
                data: d
            }
        }
        return null;
    }).filter(d => !!d);
}

export const removeDuplicates = (arrayData, key = 'id') => {
    // 去除重复数据
    return [...new Set(arrayData.map(d => d.id))].map(id => {
        return arrayData.find(d => d.id === id);
    })
}

export const parsePDManerFile = (originData, currentData, getIds, resolve) => {
    // 计算所有的字段/索引/数据表/关系图的数据 生成所需ID
    const removeEntityDuplicates = (e) => {
      return {
            ...e,
            fields: removeDuplicates(e.fields || []),
            indexes: removeDuplicates(e.indexes || []).map(i => {
                return {
                    ...i,
                    fields: removeDuplicates(i.fields || []),
                }
            }),
        }
    }
    const data = {
        ...originData,
        viewGroups: removeDuplicates(originData.viewGroups || []),
        entities: removeDuplicates(originData.entities || [])
            .map(e => removeEntityDuplicates(e)),
        logicEntities: removeDuplicates(originData.logicEntities || [])
            .map(e => removeEntityDuplicates(e)),
        diagrams: removeDuplicates(originData.diagrams || []),
    }
    const viewGroups = data.viewGroups
    const enitites = data.entities.concat(data.logicEntities);
    const diagrams = data.diagrams;
    const fields = enitites.reduce((p, n) => {
        const indexes = n.indexes || [];
        return p.concat(n.fields || [])
            .concat(indexes)
            .concat(indexes.reduce((pre, next) => {
                return pre.concat(next.fields || [])
            }, []))
    }, [])
    getIds(enitites.length + diagrams.length + fields.length + viewGroups.length).then((res) => {
        resolve(parsePDManer(data, currentData, res))
    })
}

export const parseEZDMLFile = (data, currentData, getIds, resolve) => {
    const Tables = (data.items || []).reduce((p, n) => {
        return p.concat(n.Tables?.items || [])
    }, [])
    const fields = Tables.reduce((p, n) => {
        return p.concat(n.MetaFields?.items || [])
    }, [])
    getIds((data.Count || 0) + (data.TableCount || 0) + fields.length).then((res) => {
        resolve(parseEZDML(data, currentData, res))
    })
}

export const parsePdmaasEEFile = (data, currentData, getIds, resolve) => {
    // 计算所有的字段/索引/数据表/关系图的数据 生成所需ID
    const categories = tree2array(data.categories || [])
    const enitites = data.entities;
    const diagrams = data.diagrams;
    const fields = enitites.reduce((p, n) => {
        const indexes = n.indexes || [];
        return p.concat(n.fields || [])
            .concat(indexes)
            .concat(indexes.reduce((pre, next) => {
                return pre.concat(next.fields || [])
            }, []))
    }, [])
    getIds(enitites.length + diagrams.length + fields.length + categories.length).then((res) => {
        resolve(parsePdmaas(data, currentData, res))
    })
}

export const parseProjectFile = (fileData, currentData, getIds) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(fileData);
        reader.onload = (event) => {
            const result = event.target.result;
            try {
                const data = JSON.parse(result);
                if(data.RootName) {
                    parseEZDMLFile(data, currentData, getIds, resolve)
                } else if(data.flat || data.project) {
                    const tempData = data.project ? data.project : data;
                    parsePdmaasEEFile(tempData, currentData, getIds, resolve)
                } else {
                    parsePDManerFile(data, currentData, getIds, resolve)
                }
            } catch (e) {
                reject(e)
            }
        };
    })
}

export const removeInvalidPDManerCells = (...args) => {
  return removeInvalidCells(...args)
}

export const transformEntityDbDataType = (dataSource, entity, dbDialect) => {
    const projectDbDialect = dataSource.profile.project.dbDialect;
    const dataTypes = dataSource.profile.global.dataTypes;
    const bizDomainTypes = dataSource.profile.team.bizDomainTypes;
    const dbType2daType = (f) => {
        // 2.无显示设置的基本数据类型 则需手动匹配转换
        const currentBaseType = dataTypes.find(d => {
            return (d.dbDataType?.[projectDbDialect] === f.dbDataType)
                || (Object.keys(d.dbDataType || {})
                    .some(dataType => d.dbDataType[dataType] === f.dbDataType))
        });
        // 3.最终未匹配到 则直接返回原值
        return currentBaseType?.dbDataType?.[dbDialect] || f.dbDataType
    }
    const baseType2DbType = (f) => {
        const currentBaseType = dataTypes.find(d => d.defKey === f.baseDataType);
        if(currentBaseType) {
            return currentBaseType.dbDataType[dbDialect] || dbType2daType(f)
        }
        return dbType2daType(f)
    }
    const getDbDataType = (f) => {
        // 1.寻找baseDataType
        if(f.baseDataType) {
            return baseType2DbType(f);
        } else if(f.bizDomainType) {
            const currentBizDomainType = bizDomainTypes.find(d => d.defKey === f.bizDomainType);
            if(currentBizDomainType && currentBizDomainType.baseDataType) {
                return baseType2DbType({
                    ...f,
                    baseDataType: currentBizDomainType.baseDataType,
                });
            }
        }
        return dbType2daType(f)
    }
    return {
        ...entity,
        fields: (entity.fields || []).map(f => {
            return {
                ...f,
                dbDataType: getDbDataType(f)
            }
        }),
        indexes: (entity.indexes || []).map(index => {
            if(!index.type) {
                return {
                    ...index,
                    type: 'NORMAL'
                };
            }
            return index;
        })
    }
}

export const transformEntityLangDataType = (dataSource, entity, programLang) => {
    const programLangs = dataSource.profile.global.programLangs;
    const currentLang = programLangs.find(p => p.id === programLang);
    const dataTypes = dataSource.profile.global.dataTypes;
    const bizDomainTypes = dataSource.profile.team.bizDomainTypes;
    const projectDbDialect = dataSource.profile.project.dbDialect;
    const dbType2langDataType = (f) => {
        // 2.无显示设置的基本数据类型 则需手动匹配转换
        const currentBaseType = dataTypes.find(d => {
            return (d.dbDataType?.[projectDbDialect] === f.dbDataType)
                || (Object.keys(d.dbDataType || {})
                    .some(dataType => d.dbDataType[dataType] === f.dbDataType))
        });
        // 3.最终未匹配到 则直接返回原值
        return currentBaseType?.langDataType?.[currentLang?.defKey] || ''
    }
    const baseType2LangDataType = (f) => {
        const currentBaseType = dataTypes.find(d => d.defKey === f.baseDataType);
        if(currentBaseType) {
            return currentBaseType.langDataType[currentLang?.defKey] || dbType2langDataType(f)
        }
        return dbType2langDataType(f)
    }
    const getLangDataType = (f) => {
        // 1.寻找baseDataType
        if(f.baseDataType) {
            return baseType2LangDataType(f);
        } else if(f.bizDomainType) {
            const currentBizDomainType = bizDomainTypes.find(d => d.defKey === f.bizDomainType);
            if(currentBizDomainType && currentBizDomainType.baseDataType) {
                return baseType2LangDataType({
                    ...f,
                    baseDataType: currentBizDomainType.baseDataType,
                });
            }
        }
        return dbType2langDataType(f)
    }
    return {
        ...entity,
        fields: (entity.fields || []).map(f => {
            return {
                ...f,
                langDataType: getLangDataType(f)
            }
        })
    }
}

export const getProjectAllTableCreateDDL = (dataSource, entities, dbDialectData, dbDialect, createValue, userInfo) => {
    let currentEntities = dataSource.project.entities;
    currentEntities = currentEntities
        .map(e => transformEntityDbDataType(dataSource, e, dbDialect))
    return currentEntities.filter(e => entities.includes(e.id))
        .reduce((p, n) => {
            let string = ''
            createValue.forEach(d => {
                string +=  getTemplate2String(dbDialectData[d] || '', n, userInfo)
            })
            return p + string
    }, '')
}

export const getProjectTableLangCode = (dataSource, entity, programLang, genKey, genItem, userInfo) => {
    const programLangs = dataSource.profile.global.programLangs;
    const currentLang = programLangs.find(p => p.id === programLang);
    const genData = currentLang?.codegens?.find(d => d.genKey === genKey);
    const genItemData = genData?.genItems?.find(d => d.itemKey === genItem);
    if(genItemData) {
        return getTemplate2String(genItemData.itemTemplate || '',
            entity, userInfo)
    }
    return ''
}

export const getFieldMappingNames = (dataSource) => {
    const physicEntityFieldAttr = dataSource.profile?.project?.setting?.physicEntityFieldAttr;
    return  {
        defKey: '代码',
        defName: '名称',
        primaryKey: '主键',
        notNull: '不为空',
        autoIncrement: '自增',
        bizDomainType: '业务域类型',
        baseDataType: '基本数据类型',
        dbDataType: '数据类型',
        dataLen: '长度',
        numScale: '小数点',
        defaultValue: '默认值',
        intro: '备注字段',
        dictFrom: '字典来源',
        ...Object.keys(physicEntityFieldAttr).reduce((p, n) => {
            return {
                ...p,
                [n]: physicEntityFieldAttr[n].title
            }
        }, {})
    };
}

export const exportRelationExcel = (data) => {
    return new Promise((resolve, reject) => {
        const wb = new ExcelJS.Workbook();
        const sheet = wb.addWorksheet('展示表关系');
        sheet.columns = [
            { header: '主表', key: 'parentName', width: 20 },
            { header: '主表字段', key: 'parentFieldName', width: 20 },
            { header: '从表', key: 'childName', width: 20},
            { header: '从表字段', key: 'childFieldName', width: 20 }
        ];
        sheet.addRows(data);
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb:'FFFFFF00'}
        };
        wb.xlsx.writeBuffer().then((res) => {
            resolve(res)
        }).catch((err) => {
            reject(err)
        })
    })
}

export const exportWord = (dataSource, images, permission, user) => {
    const userProfile = dataSource.profile?.user;
    const freezeEntityHeader = userProfile?.freezeEntityHeader;
    const physicEntityHeader = dataSource.profile?.project?.setting?.physicEntityHeader;
    const defKeyMapping = getFieldMappingNames(dataSource);
    const columns = Object.keys(defKeyMapping).filter(defKey => {
        return physicEntityHeader[defKey].enable !== 0
    }).sort((a, b) => {
        return physicEntityHeader[a].orderValue - physicEntityHeader[b].orderValue
    });
    const maxWidth = columns.reduce((p, n) => {
        return p + (physicEntityHeader[n].columnWidth || 100)
    }, 0)
    const booleanColumn = ['primaryKey', 'notNull', 'autoIncrement']
    const getModelData = () => {
        const {entities, diagrams } = dataSource.project;
        const filterEmpty = (data) => {
            if(userProfile?.modelingNavDisplay?.nodeType === PROFILE.USER.NON_EMPTY) {
                return data.filter(b => b.children.length > 0);
            }
            return data;
        };
        const getCategoryRefData = (d, t) => {
            return (d[t ? 'entityRefs' : 'diagramRefs'] || []).filter((e) => {
                if(!t) {
                    const typeMap = {
                        P: basePhysicNsKey,
                    };
                    // 关系图模式下 子类权限筛选
                    return checkDataPermission(typeMap[e.refObjectType], permission) > -1;
                }
                return true;
            }).map((e) => {
                return (t ? entities : diagrams)
                    .find(c => (!t || (t && c.type === t)) && (c.id === e.refObjectId));
            }).filter(c => !!c);
        };
        const transformTreeData = (data) => {
            return filterEmpty(data.map((d) => {
                return {
                    ...d,
                    children: filterEmpty([
                        // eslint-disable-next-line no-use-before-define
                        ...getBaseChildren(d),
                    ]),
                };
            }));
        };
        const getBaseChildren = (d) => {
            return filterEmpty([
                {
                    nsKey: basePhysicNsKey,
                    defName: '物理模型',
                    children: getCategoryRefData(d, ENTITY.TYPE.P),
                    value: 'physicEntityNode',
                },
                {
                    defName: '关系图',
                    children: getCategoryRefData(d, null),
                    value: 'diagramNode',
                },
                ...transformTreeData((d.children || [])),
            ].filter(m => checkDataPermission(m.nsKey, permission) > -1)).sort((a, b) => {
                return userProfile?.modelingNavDisplay?.[a.value]?.orderValue
                    - userProfile?.modelingNavDisplay?.[b.value]?.orderValue;
            });
        };
        const transformSimpleTreeData = (data) => {
            return [{
                defKey: 'FLAT',
                defName: '平铺模式',
                children: getBaseChildren(data)
            }];
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
                defKey: '$NCO',
                defName: '未分类对象',
                entityRefs: project.entities
                    .filter(e => !allCategoryEntities.includes(e.id)).map(e => ({
                        refObjectId: e.id, refObjectType: e.type,
                    })),
                diagramRefs: project.diagrams
                    .filter(d => !allCategoryDiagrams.includes(d.id)).map(d => ({
                        refObjectId: d.id, refObjectType: d.type,
                    })),
            };
            // 获取未分类对象
        };
        if(userProfile?.modelingNavDisplay?.hierarchyType === PROFILE.USER.TREE) {
            const noCategoryData = getNoCategoryData(dataSource.project);
            return transformTreeData((checkDataPermission(baseCategoryNsKey, permission) > -1
                ? dataSource.project.categories : [])
                .concat((noCategoryData.entityRefs.length > 0
                    || noCategoryData.diagramRefs.length > 0) ? noCategoryData : []));
        }
        return transformSimpleTreeData(dataSource.project.flat);
    };
    const modelData = getModelData();
    const cellMargin = {
        bottom: 100,
            top: 100,
            left: 100,
            right: 100
    };
    const renderParagraphs = (data, headingLevel) => {
        let level = headingLevel; // 最大层级4
        if(headingLevel > 4) {
            // 超过四层目录直接忽略
            return []
        }
        return [new Paragraph({
            text: `${data.defKey}[${data.defName}]`,
            heading: HeadingLevel[`HEADING_${level}`],
            numbering: {
                reference: "my-number-numbering-reference",
                level: headingLevel - 1,
            },
        })].concat((data.children || []).reduce((pre, next) => {
            if(next.value === 'physicEntityNode') {
                // 表清单
                // 表字段明细
                return pre.concat([new Paragraph({
                    text: '表清单',
                    heading: HeadingLevel[`HEADING_${level + 1}`],
                    numbering: {
                        reference: "my-number-numbering-reference",
                        level: headingLevel,
                    },
                })]).concat(new Table({
                    rows: [new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({
                                    text: '#',
                                    style: 'cellPara'
                                })],
                                margins: cellMargin,
                                verticalAlign: VerticalAlign.CENTER,
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    text: '数据表',
                                    style: 'cellPara'
                                })],
                                verticalAlign: VerticalAlign.CENTER,
                                margins: cellMargin,
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    text: '名称',
                                    style: 'cellPara'
                                })],
                                verticalAlign: VerticalAlign.CENTER,
                                margins: cellMargin,
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    text: '备注说明',
                                    style: 'cellPara'
                                })],
                                verticalAlign: VerticalAlign.CENTER,
                                margins: cellMargin,
                            })],
                    })].concat(next.children.map((c, i) => {
                        return new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({
                                        text: `${i + 1}`,
                                        style: 'cellPara',
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: cellMargin,
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        text: c.defKey || '',
                                        style: 'cellPara'
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: cellMargin,
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        text: c.defName || '',
                                        style: 'cellPara'
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: cellMargin,
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        text: c.intro || '',
                                        style: 'cellPara'
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: cellMargin,
                                })],
                        });
                    })),
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
                    },
                })).concat(new Paragraph({
                    text: '表字段明细',
                    heading: HeadingLevel[`HEADING_${level + 1}`],
                    numbering: {
                        reference: "my-number-numbering-reference",
                        level: headingLevel,
                    },
                })).concat(next.children.reduce((p, n, i) => {
                    return p.concat(new Paragraph({
                        text: `${n.defKey}[${n.defName}]`,
                        heading: HeadingLevel[`HEADING_${level + 2}`],
                        numbering: {
                            reference: "my-number-numbering-reference",
                            level: headingLevel + 1,
                        },
                    })).concat(new Table({
                        rows: [new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({
                                        text: '#',
                                        style: 'cellPara'
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                    margins: cellMargin
                                }),
                                ...columns.map(c => {
                                    return new TableCell({
                                        children: [new Paragraph({
                                            text: defKeyMapping[c],
                                            style: 'cellPara'
                                        })],
                                        margins: cellMargin,
                                        verticalAlign: VerticalAlign.CENTER,
                                        width: {
                                            size: (physicEntityHeader[c].columnWidth || 100) / maxWidth * 100,
                                            type: WidthType.PERCENTAGE,
                                        },
                                    })
                                })
                            ],
                        })].concat(n.fields.map((f, fI) => {
                            return new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({
                                            text: `${fI + 1}`,
                                            style: 'cellPara'
                                        })],
                                        verticalAlign: VerticalAlign.CENTER,
                                    }),
                                    ...columns.map(c => {
                                        if(booleanColumn.includes(c)) {
                                            return new TableCell({
                                                children: [new Paragraph({
                                                    text: f[c] !== 0 ? '√' : '',
                                                    style: 'cellPara'
                                                })],
                                                verticalAlign: VerticalAlign.CENTER,
                                                margins: cellMargin,
                                            })
                                        }
                                        return new TableCell({
                                            children: [new Paragraph({
                                                text: `${f[c] || ''}`,
                                                style: 'cellPara'
                                            })],
                                            verticalAlign: VerticalAlign.CENTER,
                                            margins: cellMargin,
                                        })
                                    })]
                            });
                        })),
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                    }));
                }, []));
            } else if(next.value === 'diagramNode') {
                return pre.concat([new Paragraph({
                    text: '关系图',
                    heading: HeadingLevel[`HEADING_${level + 1}`],
                    numbering: {
                        reference: "my-number-numbering-reference",
                        level: headingLevel,
                    },
                })]).concat(next.children.reduce((p, n) => {
                    return p.concat(new Paragraph({
                        text: `${n.defKey}[${n.defName}]`,
                        heading: HeadingLevel[`HEADING_${level + 2}`],
                        numbering: {
                            reference: "my-number-numbering-reference",
                            level: headingLevel + 1,
                        },
                    }),  new Paragraph({
                        children: [
                            new ImageRun({
                                type: "png",
                                data: images.find(i => i.id === n.id)?.png || '',
                                transformation: {
                                    width: 600,
                                    height: 600,
                                },
                            }),
                        ],
                    }))
                }, []));
            }
            return pre.concat(renderParagraphs(next, level + 1));
        }, []));
    };
    const paragraphs = (modelData.reduce((p, n) => {
        return p.concat(renderParagraphs(n, 1));
    }, []));
    const level = {
        format: LevelFormat.DECIMAL,
        alignment: AlignmentType.START,
        style: {
            paragraph: {
                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
            },
        },
    }
    const font = '宋体';
    const headingStyle = {
        run: {
            bold: true,
            color: "#000000",
            font,
        },
        paragraph: {
            spacing: {
                before: 200,
                after: 200,
            },
        },
    }
    const doc = new File({
        creator: "PDMaas-EE",
        description: `用户${user.realName || user.userName}使用PDMaas-EE生成`,
        title: dataSource.project.name,
        styles: {
            default: {
                heading1: headingStyle,
                heading2: headingStyle,
                heading3: headingStyle,
                heading4: headingStyle,
                heading5: headingStyle,
                heading6: headingStyle,
            },
            paragraphStyles: [{
                id: "cellPara",
                run: {
                    font,
                    size: 14,
                },
            }]
        },
        numbering: {
            config: [
                {
                    levels: [
                        {
                            ...level,
                            level: 0,
                            text: "%1.",
                        },
                        {
                            ...level,
                            level: 1,
                            text: "%1.%2.",
                        },
                        {
                            ...level,
                            level: 2,
                            text: "%1.%2.%3",
                        },
                        {
                            ...level,
                            level: 3,
                            text: "%1.%2.%3.%4",
                        },
                    ],
                    reference: "my-number-numbering-reference",
                },
            ],
        },
        sections: [
            {
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: "PDMaas-EE 数据表结构文档",
                            size: 40
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            break: 5,
                            text: `生成人：${user.realName || user.userName}`,
                            size: 30,
                            font,
                        }),
                        new TextRun({
                            break: 1,
                            text: `生成日期：${moment().format('YYYY-MM-DD HH:mm:ss')}`,
                            size: 30,
                            font,
                        })]
                    })],
            },
            {
                properties: {
                    titlePage: true,
                },
                footers: {
                    first: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        font,
                                        children: [PageNumber.CURRENT],
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
                children: [
                    ...paragraphs,
                ],
            },
        ],
    });
    return new Promise((resolve, reject) => {
        Packer.toString(doc).then((str) => {
            resolve(str)
        }).catch(err => reject(err));
    })
}

export const exportHtml = (dataSource, images, permission, user) => {

    return new Promise((resolve, reject) => {
        exportMarkdown(dataSource, images, permission, user)
            .then((data) => {
                resolve(html(data))
            })
    })
}

export const exportMarkdown = (dataSource, images, permission, user) => {
    const userProfile = dataSource.profile?.user;
    const freezeEntityHeader = userProfile?.freezeEntityHeader;
    const physicEntityHeader = dataSource.profile?.project?.setting?.physicEntityHeader;
    const defKeyMapping = getFieldMappingNames(dataSource);
    const columns = Object.keys(defKeyMapping).filter(defKey => {
        return physicEntityHeader[defKey].enable !== 0
    }).sort((a, b) => {
        return physicEntityHeader[a].orderValue - physicEntityHeader[b].orderValue
    });
    const maxWidth = columns.reduce((p, n) => {
        return p + (physicEntityHeader[n].columnWidth || 100)
    }, 0)
    const booleanColumn = ['primaryKey', 'notNull', 'autoIncrement']
    const getModelData = () => {
        const {entities, diagrams } = dataSource.project;
        const filterEmpty = (data) => {
            if(userProfile?.modelingNavDisplay?.nodeType === PROFILE.USER.NON_EMPTY) {
                return data.filter(b => b.children.length > 0);
            }
            return data;
        };
        const getCategoryRefData = (d, t) => {
            return (d[t ? 'entityRefs' : 'diagramRefs'] || []).filter((e) => {
                if(!t) {
                    const typeMap = {
                        P: basePhysicNsKey,
                    };
                    // 关系图模式下 子类权限筛选
                    return checkDataPermission(typeMap[e.refObjectType], permission) > -1;
                }
                return true;
            }).map((e) => {
                return (t ? entities : diagrams)
                    .find(c => (!t || (t && c.type === t)) && (c.id === e.refObjectId));
            }).filter(c => !!c);
        };
        const transformTreeData = (data) => {
            return filterEmpty(data.map((d) => {
                return {
                    ...d,
                    children: filterEmpty([
                        // eslint-disable-next-line no-use-before-define
                        ...getBaseChildren(d),
                    ]),
                };
            }));
        };
        const getBaseChildren = (d) => {
            return filterEmpty([
                {
                    nsKey: basePhysicNsKey,
                    defName: '物理模型',
                    children: getCategoryRefData(d, ENTITY.TYPE.P),
                    value: 'physicEntityNode',
                },
                {
                    defName: '关系图',
                    children: getCategoryRefData(d, null),
                    value: 'diagramNode',
                },
                ...transformTreeData((d.children || [])),
            ].filter(m => checkDataPermission(m.nsKey, permission) > -1)).sort((a, b) => {
                return userProfile?.modelingNavDisplay?.[a.value]?.orderValue
                    - userProfile?.modelingNavDisplay?.[b.value]?.orderValue;
            });
        };
        const transformSimpleTreeData = (data) => {
            return [{
                defKey: 'FLAT',
                defName: '平铺模式',
                children: getBaseChildren(data)
            }];
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
                defKey: '$NCO',
                defName: '未分类对象',
                entityRefs: project.entities
                    .filter(e => !allCategoryEntities.includes(e.id)).map(e => ({
                        refObjectId: e.id, refObjectType: e.type,
                    })),
                diagramRefs: project.diagrams
                    .filter(d => !allCategoryDiagrams.includes(d.id)).map(d => ({
                        refObjectId: d.id, refObjectType: d.type,
                    })),
            };
            // 获取未分类对象
        };
        if(userProfile?.modelingNavDisplay?.hierarchyType === PROFILE.USER.TREE) {
            const noCategoryData = getNoCategoryData(dataSource.project);
            return transformTreeData((checkDataPermission(baseCategoryNsKey, permission) > -1
                ? dataSource.project.categories : [])
                .concat((noCategoryData.entityRefs.length > 0
                    || noCategoryData.diagramRefs.length > 0) ? noCategoryData : []));
        }
        return transformSimpleTreeData(dataSource.project.flat);
    };
    const modelData = getModelData();
    return new Promise((resolve, reject) => {
        markdown(dataSource, modelData, images, user, {freezeEntityHeader, columns, maxWidth, defKeyMapping, booleanColumn}, (data) => {
            resolve(data)
        });
    })
}

export const getBizDomainTypesHeader = () => {
    return [
        { header: '#', key: 'index', width: 10 },
        { header: '业务域类型代码', key: 'defKey', width: 32 },
        { header: '业务域类型名称', key: 'defName', width: 32 },
        { header: '基本数据类型', key: 'baseDataType', width: 32},
        { header: '长度', key: 'dataLen', width: 10},
        { header: '小数点', key: 'numScale', width: 10},
        { header: '主键', key: 'primaryKey', width: 10},
        { header: '不为空', key: 'notNull', width: 10},
        { header: '自增', key: 'autoIncrement', width: 10},
        { header: '业务域类型-备注说明', key: 'intro', width: 32},
    ]
}

export const exportBizDomainTypes = (dataSource) => {
    return new Promise((resolve, reject) => {
        const bizDomainTypes = dataSource.profile?.team?.bizDomainTypes || [];
        const wb = new ExcelJS.Workbook();
        const sheet = wb.addWorksheet('业务域类型');
        sheet.columns = getBizDomainTypesHeader();
        const checkBoolean = (v) => {
            if(!v || v === '0' || v === 0) {
                return ''
            }
            return '√'
        }
        sheet.addRows(bizDomainTypes.map((d, i) => {
            return {
                ...d,
                index: i + 1,
                primaryKey: checkBoolean(d.primaryKey),
                notNull: checkBoolean(d.notNull),
                autoIncrement: checkBoolean(d.autoIncrement),
            }
        }))
        const headerRow = sheet.getRow(1)
        headerRow.alignment = {
            vertical: 'middle', horizontal: 'center'
        }
        headerRow.font = {
            bold: true
        }
        wb.xlsx.writeBuffer().then((res) => {
            resolve(res)
        }).catch((err) => {
            reject(err)
        })
    })
}

export const importBizDomainTypes = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const wb = new ExcelJS.Workbook();
        reader.onload = (event) => {
            const result = event.target.result;
            const header = getBizDomainTypesHeader();
            const bizDomainTypes = [];
            const checkBooleanNames = ['primaryKey', 'notNull', 'autoIncrement']
            const checkBoolean = (v) => {
                if(v === '√') {
                    return 1
                }
                return 0
            }
            wb.xlsx.load(result).then(() => {
                wb.eachSheet(ws => {
                    if(ws.name === '业务域类型') {
                        ws.eachRow(((row, rowNumber) => {
                            if(rowNumber > 1) {
                                const rowValues = row.values;
                                bizDomainTypes.push(header.reduce((prev, next, i) => {
                                    if(next.key !== 'index') {
                                        if(checkBooleanNames.includes(next.key)) {
                                            return {
                                                ...prev,
                                                [next.key]: checkBoolean(rowValues[i + 1])
                                            }
                                        }
                                        return {
                                            ...prev,
                                            [next.key]: rowValues[i + 1] || ''
                                        }
                                    }
                                    return prev;
                                }, {}))
                            }
                        }))
                    }
                })
                resolve(bizDomainTypes.filter(b => b.defKey))
            }).catch((err) => {
                reject(err)
            })
        };
        reader.readAsArrayBuffer(file);
    })
}

export const json2string = (data, closeSpace) => {
    // 大量json数据转字符串 性能下降
    if(closeSpace) {
        return JSON.stringify(data);
    }
    return JSON.stringify(data, null,2);
}

export const string2json = (data) => {
    return JSON.parse(data.replace(/^\uFEFF/, ''));
}

// 批量重算数据表关联关系
export const updateEntityRefersBatch = (dataSource) => {
    const { entities, diagrams } = dataSource.project;
    const updateEntities = [];
    const originUpdateEntity = {};
    const mapRelation = {
        'er-1': 'one',
        'er-01': 'one',
        'er-n': 'many',
        'er-1n': 'many',
    }
    // 只需要计算到字段级别的物理模型
    const currentDiagrams = diagrams.filter(diagram => (diagram.type === 'P')
        && diagram.entityRelationRank === 'F');
    const currentEntities = entities.filter(entity => (entity.type === 'P'));
    // 获取所有的连线
    currentDiagrams.forEach((n) => {
        // 筛选出 起点和终点都是节点的连线
        const cellsData = n.cellsData;
        const originNodeIds = cellsData.filter(c => c.originData?.id).map(c => c.id);

        cellsData.forEach(c => {
            if(c.shape === 'edge'
                && c.target.cell
                && c.source.cell
                && originNodeIds.includes(c.target.cell)
                && originNodeIds.includes(c.source.cell)) {
                // 需要记录下
                const targetEntityId = cellsData.find(cell => cell.id === c.target.cell)?.originData?.id;
                const sourceEntityId = cellsData.find(cell => cell.id === c.source.cell)?.originData?.id;
                const targetFieldId = (c.target.originPort || c.target.port)?.split('_')?.[0] || '';
                const sourceFieldId = (c.source.originPort || c.source.port)?.split('_')?.[0] || '';
                const relationSource = c.attrs?.line?.sourceMarker?.name || '';
                const relationTarget = c.attrs?.line?.targetMarker?.name || '';
                if(targetEntityId && sourceEntityId && targetFieldId && sourceFieldId && mapRelation[relationSource] && mapRelation[relationTarget]) {
                    const relation = `${mapRelation[relationTarget]}-to-${mapRelation[relationSource]}`;
                    if(!updateEntities.find(e => (e.relation === relation)
                        && (e.targetEntityId === targetEntityId)
                        && (e.sourceEntityId === sourceEntityId)
                        && (e.targetFieldId === targetFieldId)
                        && (e.sourceFieldId === sourceFieldId))) {
                        //  去重
                        updateEntities.push({
                            relation,
                            targetEntityId,
                            sourceEntityId,
                            targetFieldId,
                            sourceFieldId
                        })
                    }
                }
            }
        })

    });
    // 更新所有连线终点的实体
    updateEntities.forEach(u => {
        const sourceEntity = currentEntities.find(e => e.id === u.sourceEntityId);
        const targetEntity = currentEntities.find(e => e.id === u.targetEntityId);
        if(sourceEntity && targetEntity) {
            const sourceField = (sourceEntity.fields || []).find(f => f.id === u.sourceFieldId);
            const targetField = (targetEntity.fields || []).find(f => f.id === u.targetFieldId);
            if(sourceField && targetField) {
                if(!originUpdateEntity[targetEntity.id]) {
                    originUpdateEntity[targetEntity.id] = {
                        refers: []
                    }
                }
                originUpdateEntity[targetEntity.id].refers.push({
                    type: u.relation,
                    defKey: "",
                    defName: "",
                    intro: "",
                    myFieldKey: targetField.defKey,
                    refSchemaName: sourceEntity.schemaName,
                    refEntityKey: sourceEntity.defKey,
                    refFieldKey: sourceField.defKey,
                    orderValue: 1
                })
            }
        }
    })
    return Object.keys(originUpdateEntity).map(id => {
        return {
            id,
            refers: originUpdateEntity[id].refers
        }
    });
};
