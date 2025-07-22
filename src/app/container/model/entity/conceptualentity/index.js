import React, {useRef, useEffect} from 'react';

import './style/index.less';
import {Message} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {notify, subscribeEvent, unSubscribeEvent} from '../../../../../lib/subscribe';
import {COMPONENT, PROFILE, WS} from '../../../../../lib/constant';
import {sendData} from '../../../../../lib/utils';
import Base from './Base';


export default React.memo(({defaultDataSource,defaultData,
                                          getCurrentDataSource, user}) => {
    const reserveWord = user.reserveWord || [];
    const currentPrefix = getPrefix('container-model-entity-conceptual');
    const baseRef = useRef(null);
    const isActive = useRef(true);
    const updateCache = useRef([]);

    const currentDataRef = useRef({...defaultData});
    const onBaseChange = (value) => {
        if(currentDataRef.current.defKey === value.defKey &&
            currentDataRef.current.defName === value.defName &&
            currentDataRef.current.intro === value.intro) {
            return;
        }
        const keyWord = reserveWord
            .find(r => r.keyWord?.toLocaleLowerCase() === value.defName?.toLocaleLowerCase()
                || r.keyWord?.toLocaleLowerCase() === value.defKey?.toLocaleLowerCase());
        if(keyWord) {
            const name = keyWord.keyWord?.toLocaleLowerCase() === value.defKey?.toLocaleLowerCase() ? 'defKey' : 'defName';
            Message.error({title: `${name === 'defName' ? '显示名称' : '代码'}[${name === 'defName' ? value.defName : value.defKey}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
            baseRef.current.setBaseData((pre) => {
                return {
                    ...pre,
                    [name]: currentDataRef.current[name],
                };
            });
            return;
        }
        const data = {
            event: WS.ENTITY.MOP_ENTITY_UPDATE,
            payload: [{
                hierarchyType: defaultData.parentId === '_UNCATE'
                    ? PROFILE.USER.FLAT
                    : defaultDataSource.profile.user.modelingNavDisplay.hierarchyType,
                updateKeys: 'defKey,defName,intro',
                pre: {
                    id: defaultData.id,
                    from: defaultData.id,
                    to: defaultData.parentId === '_UNCATE' ? null : defaultData.parentId,
                    type: COMPONENT.TREE.SUB,
                    data:{
                        ...defaultData,
                        ...currentDataRef.current,
                        parentId: defaultData.parentId === '_UNCATE' ? 'base_flat' : defaultData.parentId,
                    },
                },
                next: {
                    id: defaultData.id,
                    from: defaultData.id,
                    to: defaultData.parentId === '_UNCATE' ? null : defaultData.parentId,
                    position: COMPONENT.TREE.AFTER,
                    type: COMPONENT.TREE.SUB,
                    data: {
                        ...value,
                        type: defaultData.type,
                    },
                },
            }],
        };
        currentDataRef.current = {
            ...currentDataRef.current,
            ...value,
        };
        notify(WS.TAB_LOCAL_UPDATE, data);
        sendData(data);
    };
    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(WS.TAB_UPDATE, (message) => {
            message.payload.map((payload) => {
                if(defaultData.id === payload?.next?.id
                    || defaultData.id === payload.entityId) {
                    // 数据表变更 字段变更
                    if(message.event === WS.ENTITY.MOP_ENTITY_UPDATE) {
                        const tempBaseData = _.pick(payload?.next.data, ['defKey', 'defName', 'intro']);
                        if(isActive.current) {
                            baseRef.current.setBaseData(tempBaseData);
                        } else {
                            updateCache.current.push({
                                fuc: baseRef.current.setBaseData,
                                data: tempBaseData,
                            });
                        }
                    }
                }
                return payload;
            });
        }, eventId);
        subscribeEvent(WS.TAB_ACTIVE_CHANGE, (active) => {
            if(active === defaultData.id) {
                while (updateCache.current.length > 0) {
                    const c =  updateCache.current.shift();
                    c.fuc(c.data);
                }
            }
            isActive.current = active === defaultData.id;
        }, eventId);
        return () => {
            unSubscribeEvent(WS.TAB_UPDATE, eventId);
            unSubscribeEvent(WS.TAB_ACTIVE_CHANGE, eventId);
        };
    }, []);
    return <div className={currentPrefix}>
      <Base
        user={user}
        getCurrentDataSource={getCurrentDataSource}
        dataSource={defaultDataSource}
        ref={baseRef}
        defaultData={defaultData}
        onCheck={onBaseChange}/>
    </div>;
});
