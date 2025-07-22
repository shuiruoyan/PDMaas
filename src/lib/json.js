import {
    readJsonPromise,
    getUserConfigPath,
    fileExists,
    saveJsonPromise,
    dirname,
    dirSplicing,
    getFileWriteStream,
    getFileReadStreamAll,
    ensureDirectoryExistence, getDir, getBaseName, getStat, saveJsonPromiseAs, parseJson, checkIsAppPath
} from "./file";

import * as idpool from './idpool';
import moment from "moment";
import {fixFiled} from "dataSource_utils";
import defaultProfile from './default_profile.json';
import DiagramSettingP from './DiagramSettingP.json'
import DiagramSettingC from './DiagramSettingC.json'
import DiagramSettingL from './DiagramSettingL.json'
import DiagramSettingM from './DiagramSettingM.json'
import ProjectSetting from './ProjectSetting.json'
import {decrypt, encrypt, genSignature} from "./crypto";
import _ from 'lodash';
import {array2tree, tree2array} from './tree';
import {closeLoading, Modal} from "components";
const dict = [
    {
        nsKey: 'sys.DataTypeOften',
        namespace: 'sys',
        key: 'DataTypeOften',
        name: '数据类型使用频率',
        intro: '数据类型使用频率',
        i18n: '',
        items: [
            {
                value: '1',
                label: '低频',
                labelPinyin: 'dipin',
                sort: '1',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
            {
                value: '5',
                label: '一般',
                labelPinyin: 'yiban',
                sort: '2',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
            {
                value: '9',
                label: '常用',
                labelPinyin: 'changyong',
                sort: '3',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
        ],
    },
    {
        nsKey: 'clab.DBConnUsedFor',
        namespace: 'clab',
        key: 'DBConnUsedFor',
        name: '连接用途',
        intro: '连接用途',
        i18n: '',
        items: [
            {
                value: 'ALL_IN_ONE',
                label: '多合一',
                labelPinyin: 'duoheyi',
                sort: '010',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
            {
                value: 'READ_META_DATA',
                label: '读取元数据',
                labelPinyin: 'duquyuanshuju',
                sort: '020',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
            {
                value: 'EXEC_DDL',
                label: '执行DDL',
                labelPinyin: 'zhixingDDL',
                sort: '030',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
            {
                value: 'EXEC_DML',
                label: '执行DML',
                labelPinyin: 'zhixingDML',
                sort: '040',
                status: '1',
                hotspot: 0,
                correlation: '',
                intro: '',
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            },
        ],
    },
    {
        "nsKey": "YesNo",
        "namespace": null,
        "key": "YesNo",
        "name": "是否",
        "intro": null,
        "i18n": null,
        "items": [
            {
                "value": "Y",
                "label": "是",
                "labelPinyin": "shi",
                "sort": "1",
                "status": "1",
                "hotspot": 0,
                "correlation": null,
                "intro": null,
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "N",
                "label": "否",
                "labelPinyin": "fou",
                "sort": "2",
                "status": "1",
                "hotspot": 0,
                "correlation": null,
                "intro": null,
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            }
        ]
    },
    {
        "nsKey": "stnd.StndSubjectType",
        "namespace": "stnd",
        "key": "StndSubjectType",
        "name": "数据标准主题类别",
        "intro": "数据标准主题类别",
        "i18n": "",
        "items": [
            {
                "value": "D",
                "label": "字典标准",
                "labelPinyin": "zidianbiaozhun",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "F",
                "label": "基础标准",
                "labelPinyin": "jichubiaozhun",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "W",
                "label": "词根分类",
                "labelPinyin": "cigenfenlei",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            }
        ]
    },
    {
        "nsKey": "stnd.ValueDomainType",
        "namespace": "stnd",
        "key": "ValueDomainType",
        "name": "值域类型",
        "intro": "值域类型",
        "i18n": "",
        "items": [
            {
                "value": "D",
                "label": "字典标准",
                "labelPinyin": "zidianbiaozhun",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "R",
                "label": "数字范围",
                "labelPinyin": "shuzifanwei",
                "sort": "1",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            }
        ]
    },
    {
        "nsKey": "stnd.StndPublishStatus",
        "namespace": "stnd",
        "key": "StndPublishStatus",
        "name": "数据标准发布状态",
        "intro": "数据标准发布状态",
        "i18n": "",
        "items": [
            {
                "value": "A",
                "label": "审核中",
                "labelPinyin": "shenhezhong",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "D",
                "label": "已删除",
                "labelPinyin": "yishanchu",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "N",
                "label": "新创建",
                "labelPinyin": "xinchuangjian",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "R",
                "label": "已发布",
                "labelPinyin": "yifabu",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "T",
                "label": "已废止",
                "labelPinyin": "yifeizhi",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            },
            {
                "value": "U",
                "label": "更新中",
                "labelPinyin": "gengxinzhong",
                "sort": "0",
                "status": "1",
                "hotspot": 1,
                "correlation": "",
                "intro": "",
                "attr1": null,
                "attr2": null,
                "attr3": null,
                "attr4": null,
                "attr5": null,
                "attr6": null,
                "attr7": null,
                "attr8": null
            }
        ]
    }
];

export const getProject = (project) => {
    const adjustDataSource = (data) => {
        // 2.1.3版本没有项目一层
        if(!data.flat && !data.project?.flat) {
            if(data.views) {
                throw new Error('PDManer');
            } else {
                throw new Error('Invalid');
            }
        }
        if(!data.project) {
            // 修复213版本导出没有配置信息
            const tempProfile = {
                ...defaultProfile,
                project: {
                    ...defaultProfile.project,
                    dbDialect: 'MySQL'
                }
            };
            return {
                project: {
                    ...data,
                    entities: (data.entities || []).map((entity) => {
                        return {
                            ...entity,
                            fields: (entity.fields || []).map(field => ({
                                ...field,
                                ...fixFiled(field, tempProfile),
                            })),
                        };
                    }),
                },
                profile: tempProfile
            }
        } else if(!data.profile.global || !data.profile.team || !data.profile.team?.bizDomainTypes) {
            // 修复导出时未选择数据类型的项目
            const tempProfile = {
                ...data.profile,
                project: {
                    ...data.profile.project,
                    dbDialect: data.profile.project?.dbDialect || 'MySQL'
                }
            };
            if(!data.profile.global) {
                tempProfile.global = defaultProfile.global;
            }
            if(!data.profile.team) {
                tempProfile.team = defaultProfile.team;
            }
            if(!data.profile.team?.bizDomainTypes) {
                tempProfile.team.bizDomainTypes = defaultProfile.team.bizDomainTypes;
            }
            return {
                ...data,
                project: {
                    ...data.project,
                    entities: (data.project.entities || []).map((entity) => {
                        return {
                            ...entity,
                            fields: (entity.fields || []).map(field => ({
                                ...field,
                                ...fixFiled(field, tempProfile),
                            })),
                        };
                    }),
                },
                profile: tempProfile
            }
        }
        if(!data.profile.project?.dbDialect) {
            data.profile.project.dbDialect = 'MySQL'
        }
        return data

    }
    return new Promise((resolve, reject) => {
        return readJsonPromise(project, true).then((res) => {
            // 校验文件签名
            if(res.signature) {
                parseJson({
                    entities: res.project?.entities,
                    diagrams: res.project?.diagrams
                }, true).then((str) => {
                    if(res.signature === genSignature(str)) {
                        resolve({
                            ...adjustDataSource(res)
                        })
                    } else {
                        closeLoading();
                        Modal.confirm({
                            title: '警告',
                            message: '当前项目文件中的模型和关系图可能被手动修改，可能会导致文件内容异常！',
                            okText: '知道了',
                            cancelText: '暂不打开',
                            onOk:() => {
                                resolve({
                                    ...adjustDataSource(res)
                                })
                            }
                        })
                    }
                }).catch(err => reject(err))
            } else {
                resolve({
                    ...adjustDataSource(res)
                })
            }
        }).catch(err => reject(err))
    })
}

export const saveProjectData = (projectPath, projectData) => {
    return new Promise((resolve, reject) => {
        const finalData = {
            ...fixOrderValue(projectData),
            updateTime: Date.now(),
        };
        parseJson({
            entities: finalData.project?.entities,
            diagrams: finalData.project?.diagrams
        }, true).then((res) => {
            // 根据项目的实体和关系图生成hash
            finalData.signature = genSignature(res);
            if(checkIsAppPath(projectPath)) {
                reject(new Error("项目文件不能保存在软件的安装或运行目录！"))
            } else {
                saveJsonPromise(projectPath, finalData, false, true).then((res) => {
                    resolve(res);
                }).catch(err => {
                    reject(err)
                })
            }
        }).catch(err => {
            reject(err)
        })
    })
}

const fixOrderValue = (datasource) => {
    const { categories, flat, entities, diagrams} = datasource.project;
    const entityIdMap =  _.reduce(entities || [], (acc, cur) => {
        return {
            ...acc,
            [cur.id]: cur
        }
    }, {})

    const diagramIdMap =  _.reduce(diagrams || [], (acc, cur) => {
        return {
            ...acc,
            [cur.id]: cur
        }
    }, {})

    const fixEntityRefs = (entityRefs) => {
        const newData = (entityRefs || []).map(e => ({
            ...e,
            type: entityIdMap[e.refObjectId]?.type
        }))

        const grouped = _.groupBy(newData, 'type');

        const result = _.flatMap(grouped, (items, type) =>
            items.map((item, index) => ({
                ..._.omit(item, ['type']),
                orderValue: index + 1
            }))
        );

        return result;
    }

    const fixCategoryPeerOrder = (data) => {
        const grouped = _.groupBy(data, item => {
            return item.parentId === null || item.parentId === undefined ? 'nullish' : item.parentId;
        });

        const result = _.flatMap(grouped, (items, type) =>
            items.map((item, index) => ({
                ...item,
                peerOrder: index + 1
            }))
        );

        return result;
    }

    return {
        ...datasource,
        project: {
            ...datasource.project,
            categories: array2tree(
                fixCategoryPeerOrder(tree2array(categories || []).map(c => ({
                    ..._.omit(c, ['parents']),
                    diagramRefs: (c?.diagramRefs || []).map((d, i) => ({
                        ...d,
                        orderValue: i + 1
                    })),
                    entityRefs: fixEntityRefs(c?.entityRefs || [])
                })))
            ),
            flat: {
                ...flat,
                diagramRefs: (flat?.diagramRefs || []).map((d, i) => ({
                    ...d,
                    orderValue: i + 1
                })),
                entityRefs: fixEntityRefs(flat?.entityRefs || [])
            }

        }
    }

}

export const saveProjectDataAs = (projectData) => {
    return new Promise((resolve, reject) => {
        const finalData = {
            ...fixOrderValue(projectData),
            updateTime: Date.now(),
        };
        parseJson({
            entities: finalData.project?.entities,
            diagrams: finalData.project?.diagrams
        }, true).then((res) => {
            // 根据项目的实体和关系图生成hash
            finalData.signature = genSignature(res);
            saveJsonPromiseAs(finalData, {
                defaultPath: projectData.project.name
            }).then((res) => {
                resolve(res);
            }).catch(err => {
                reject(err)
            })
        }).catch(err => {
            reject(err)
        })
    })
}

export const getUser = () => {
    const userConfigPath = getUserConfigPath();
    if(fileExists(userConfigPath)) {
        return readJsonPromise(userConfigPath);
    }
    return Promise.resolve({
        projectHistories: [],
        profile: {
            team: {
                ...defaultProfile.team
            },
            global: {
                ...defaultProfile.global
            }
        },
        serviceConfig: {},
    });
}

export const updateUser = (data) => {
    return saveJsonPromise(getUserConfigPath(), data)
}

export const getPermissions = () => {
    return Promise.resolve([]);
}

export const initIdPool = () => {
    return idpool.initIdPool()
}

export const getDictEnties = (keys) => {
    return Promise.resolve(dict.filter(it => (keys || []).includes(it.nsKey)))
}

export const saveCmdHistory = (config, projectName) => {
    if(config.cmdHistory.length > 0) {
        // 将操作记录保存到文件中
        // 1.获取项目所在目录
        const path = dirname(config.path);
        // 按天分类
        const currentDay = moment().format('YYYY-MM-DD');
        // 3.读取当前的文件
        const logPath = dirSplicing(path, `.${projectName}/log/`);
        ensureDirectoryExistence(logPath);
        const currentHistoryFile = dirSplicing(logPath, `${currentDay}.log`);
        const write = getFileWriteStream(currentHistoryFile);
        // 4.写入命令记录
        write.append(`${config.cmdHistory.map(cmd => JSON.stringify(cmd)).join('\n')}\n`);
    }
}

// 获取操作记录
export const getCmdHistory = (config, projectName) => {
    const path = dirname(config.path);
    let currentDay = null;
    // 获取所有的日志文件
    const logPath = dirSplicing(path, `.${projectName}/log/`);
    const logFiles = getDir(logPath, 'F');
    const logDays = logFiles.filter(f => getStat(f).size > 0).map(file => getBaseName(file).split('.log')[0])
        .sort((a, b) => b.localeCompare(a));
    const cmdData = [...config.cmdHistory];
    let isFirst = true;
    return {
        next: () => {
            if(logDays.length === 0) {
                return Promise.resolve({
                    data: cmdData,
                    isEnd: true
                });
            } else {
                currentDay = logDays.shift();
                // 3.读取当前的文件
                const currentHistoryFile = dirSplicing(logPath, `${currentDay}.log`);
                return new Promise(resolve => {
                    getFileReadStreamAll(currentHistoryFile).then((data) => {
                        const preData = data.split('\n').filter(d => !!d).reverse()
                        resolve({
                            data: isFirst ? cmdData.map(c => JSON.stringify(c)).concat(preData) : preData,
                            isEnd: logDays.length === 0
                        })
                        isFirst = false;
                    })
                })
            }
        }
    }
}

export const getCanvasDefaultSetting = (diagramType) => {
    const diagramSettingMap = {
        P: DiagramSettingP,
        C: DiagramSettingC,
        L: DiagramSettingL,
        M: DiagramSettingM,
    }
    return Promise.resolve(diagramSettingMap[diagramType] || null);
}

export const getHistoryCommandByTimeRange = async (config, projectName) => {
    const path = dirname(config.path);
    // 获取所有的日志文件
    const logPath = dirSplicing(path, `.${projectName}/log/`);
    const logFiles = getDir(logPath, 'F');
    const logDays = logFiles.filter(f => getStat(f).size > 0).map(file => getBaseName(file).split('.log')[0])
        .sort((a, b) => b.localeCompare(a));
    const cmdData = [...config.cmdHistory].map(c => JSON.stringify(c));
    for (let i = 0; i < logDays.length; i+=1) {
        const currentHistoryFile = dirSplicing(logPath, `${logDays[i]}.log`);
        await getFileReadStreamAll(currentHistoryFile).then((data) => {
            cmdData.push(...data.split('\n').filter(d => !!d).reverse().map(d => JSON.parse(d)));
        })
    }
    return {
        data: cmdData,
    }
}

export const dbConnEncrypt = (data) => {
    return new Promise((resolve, reject) => {
        resolve({
            body: encrypt(data)
        })
    })
}

export const dbConnDecrypt = (data) => {
    return new Promise((resolve, reject) => {
        resolve({
            body: decrypt(data)
        })
    })
}

export const getDefaultProjectSetting = () => {
    return Promise.resolve(ProjectSetting);
}

