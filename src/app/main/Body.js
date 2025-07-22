import React, {forwardRef, useImperativeHandle, useMemo, useRef, useState} from 'react';
import { Icon } from 'components';
import Model from '../container/model';
import Type from '../container/type';
import Branch from '../container/branch';
import {getPrefix, classesMerge} from '../../lib/classes';
import {
    baseBizDataType,
    baseBranchNsKey, baseDataType,
    baseModelNsKey,
    checkPermission, codegen, commandTpl, dbType,
} from '../../lib/permission';

export default React.memo(forwardRef(({dataSource, standard,
                               openStand, getCurrentStandard, openStandList,
                               updateUserProfile, onSelectedLenChange, onRefresh,
                               getCurrentUserConfig, updateUser, config, user,
                                          openProjectSetting}, ref) => {
    const currentPrefix = getPrefix('main-body');
    const comRef = useRef({});
    const datatypeDisable = () => {
        return !(
            checkPermission(baseBizDataType) ||
            checkPermission(baseDataType) ||
            checkPermission(dbType) ||
            checkPermission(codegen) ||
            checkPermission(commandTpl)
        );
    };
    const bodyComponents = useMemo(() => [
        {
        type: 'model',
        icon: 'icon-model-design',
        name: '模型',
        content: Model,
        nsKey: baseModelNsKey,
        },
        {
            type: 'type',
            icon: 'icon-datatype',
            name: '类型',
            content: Type,
            disable: datatypeDisable(),
        },
        {
            type: 'branch',
            icon: 'icon-code-branch',
            name: '分支',
            content: Branch,
            nsKey: baseBranchNsKey,
        },
    ], [dataSource.project.readonly]);
    const [selectedType, setSelectedType] = useState(bodyComponents[0].type);
    const selectedTypeRef = useRef(null);
    selectedTypeRef.current = selectedType;
    const getContent = (type) => {
        return bodyComponents.find(t => t.type === type).content;
    };
    const [loadContent, updateLoadContent] = useState([{
        type: bodyComponents[0].type,
        content: getContent(bodyComponents[0].type),
    }]);
    const _setSelectedType = (type, disable) => {
        if(!disable) {
            if(loadContent.find(c => c.type === type)) {
                setSelectedType(type);
            } else {
                setSelectedType(type);
                updateLoadContent(p => p.concat({
                    type,
                    content: getContent(type),
                }));
            }
        }
        comRef.current[type]?.setSelectedType?.(type);
    };
    const getSelectedType = () => {
        return selectedTypeRef.current;
    };
    const initComInstance = (instance, type) => {
        comRef.current[type] = instance;
    };

    useImperativeHandle(ref, () => {
        return {
            jump: (item, isDetail) => comRef.current.model?.jump(item, isDetail),
            setNodeSelected: id => comRef.current.model?.setNodeSelected(id),
        };
    }, []);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-left`}>
        {
            bodyComponents.map((t) => {
                    let disable;
                    if(t.disable !== undefined) {
                        disable = t.disable;
                    } else {
                        disable = t.nsKey && !checkPermission(t.nsKey);
                    }
                    return <div
                      onClick={() => _setSelectedType(t.type, disable)}
                      key={t.type}
                      className={classesMerge({
                          [`${currentPrefix}-left-item`]: true,
                          [`${currentPrefix}-left-item-selected`]: selectedType === t.type,
                          [`${currentPrefix}-left-item-disable`]: disable,
                        })}>
                      <span><Icon type={t.icon}/></span>
                      <span>{t.name}</span>
                    </div>;
                })
            }
      </div>
      <div className={`${currentPrefix}-right`}>
        {
            loadContent.map((c) => {
                const Com = c.content;
                return <div
                  className={`${currentPrefix}-right-item`}
                  key={c.type}
                  style={{display: c.type === selectedType ? 'block' : 'none'}}
                >
                  <Com
                    openProjectSetting={openProjectSetting}
                    user={user}
                    config={config}
                    ref={instance => initComInstance(instance, c.type)}
                    standard={standard}
                    getCurrentStandard={getCurrentStandard}
                    getSelectedType={getSelectedType}
                    getCurrentUserConfig={getCurrentUserConfig}
                    updateUser={updateUser}
                    onRefresh={onRefresh}
                    onSelectedLenChange={onSelectedLenChange}
                    openStandList={openStandList}
                    openStand={openStand}
                    dataSource={dataSource}
                    updateUserProfile={updateUserProfile}
                  />
                </div>;
            })
        }
      </div>
    </div>;
}));
