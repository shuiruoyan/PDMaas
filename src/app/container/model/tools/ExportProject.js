import React, {useRef, useState} from 'react';
import { Button, Icon } from 'components';
import {getPrefix} from '../../../../lib/classes';
import {downloadString} from '../../../../lib/rest';
import {
    baseBizDataType, baseConceptNsKey,
    baseDataType, baseFlowNsKey, baseLogicNsKey, baseMermaidNsKey,
    baseMindNsKey, basePhysicNsKey, checkDataPermission,
    checkPermission,
    codegen,
    commandTpl,
    dbenv,
    dbType,
} from '../../../../lib/permission';

export default React.memo(({_close, getCurrentDataSource}) => {
    const [active, setActive] = useState([1]);
    const activeRef = useRef([]);
    activeRef.current = active;
    const currentPrefix = getPrefix('container-model-tools');
    const onCancel = () => {
        _close && _close();
    };
    const onOk = () => {
        const dataSource = getCurrentDataSource();
        const tempData = {};
        const typeMap = {
            C: baseConceptNsKey,
            L: baseLogicNsKey,
            P: basePhysicNsKey,
            M: baseMindNsKey,
            MER: baseMermaidNsKey,
            F: baseFlowNsKey,
        };
        const filterPermissionModel = (project) => {
            return {
                ...project,
                entities: (project.entities || []).filter((e) => {
                    return checkDataPermission(typeMap[e.type]) > -1;
                }),
                diagrams: (project.diagrams || []).filter((d) => {
                    return checkDataPermission(typeMap[d.type]) > -1;
                }),
            };
        };
        activeRef.current.forEach((key) => {
            if(key === 1) {
                tempData.project = filterPermissionModel(dataSource.project);
                tempData.profile = {
                    ...tempData.profile,
                    project: dataSource.profile.project,
                    user: dataSource.profile.user,
                };
            }
            if(key === 2) {
                tempData.profile = {
                    ...tempData.profile,
                    team: {
                        ...tempData.profile?.team,
                        bizDomainTypes: dataSource.profile.team.bizDomainTypes || [],
                    },
                };
            }
            if(key === 3) {
                tempData.profile = {
                    ...tempData.profile,
                    global: dataSource.profile.global,
                };
            }
            if(key === 4) {
                tempData.profile = {
                    ...tempData.profile,
                    team: {
                        ...tempData.profile?.team,
                        dbEnvironments: (dataSource.profile.team.dbEnvironments || []).map((d) => {
                            return {
                                ...d,
                                dbConnections: d.dbConnections || [],
                            };
                        }),
                    },
                };
            }
        });
        downloadString(JSON.stringify(tempData, null, 2),
            'PDMaas', `${dataSource.project.name}.pdma`);
    };
    const getPermission = (nsKeys) => {
        if(nsKeys.some(nsKey => !checkPermission(nsKey))) {
            return 'disable';
        }
        return 'normal';
    };
    const getActive = (key) => {
        if(active.includes(key)) {
            return `${currentPrefix}-exportProject-item-active`;
        }
        return '';
    };
    const itemActive = (key) => {
        setActive((p) => {
            if(p.includes(key)) {
                return p.filter(pKey => pKey !== key);
            }
            return p.concat(key);
        });
    };
    return <div className={`${currentPrefix}-exportProject`}>
      <div className={`${currentPrefix}-exportProject-list`}>
        <div onClick={() => itemActive(1)} className={`${currentPrefix}-exportProject-item-normal ${getActive(1)}`}>模型<Icon type='icon-check-solid'/></div>
      </div>
      <div className={`${currentPrefix}-exportProject-list`}>
        <div onClick={() => itemActive(2)} className={`${getActive(2)} ${currentPrefix}-exportProject-item-${getPermission([baseBizDataType])}`}>业务域类型<Icon type='icon-check-solid'/></div>
        <div onClick={() => itemActive(3)} className={`${getActive(3)} ${currentPrefix}-exportProject-item-${getPermission([baseDataType, dbType, codegen, commandTpl])}`}>基本数据类型+数据库品牌+编程语言类型+操作格式化显示<Icon type='icon-check-solid'/></div>
      </div>
      <div className={`${currentPrefix}-exportProject-list`}>
        <div onClick={() => itemActive(4)} className={`${getActive(4)} ${currentPrefix}-exportProject-item-${getPermission([dbenv])}`}>数据库连接<Icon type='icon-check-solid'/></div>
      </div>
      <div className={`${currentPrefix}-exportProject-opt`}>
        <Button onClick={onCancel}>取消</Button>
        <Button onClick={onOk} type='primary'>下载</Button>
      </div>
    </div>;
});
