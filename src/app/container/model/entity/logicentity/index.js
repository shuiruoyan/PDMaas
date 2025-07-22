import React, {useEffect, useRef, forwardRef, useState, useCallback, useImperativeHandle} from 'react';

import './style/index.less';
import _ from 'lodash';
import {getPrefix} from '../../../../../lib/classes';
import { subscribeEvent, unSubscribeEvent, notify } from '../../../../../lib/subscribe';
import {COMPONENT, PROFILE, WS} from '../../../../../lib/constant';
import {sendData} from '../../../../../lib/utils';
import Base from './Base';
import Content from './Content';
import {getCache} from '../../../../../lib/cache';
import QuickInput from './QuickInput';

export default React.memo(forwardRef(({defaultDataSource,defaultData,
                                          updateUserProfile, defaultParams,
                                          getCurrentDataSource, getCurrentStandard, user}, ref) => {
    const currentPrefix = getPrefix('container-model-entity-logic');
    const isActive = useRef(true);
    const updateCache = useRef([]);
    const baseRef = useRef(null);
    const contentRef = useRef(null);
    const [profileState, setProfileState] = useState(defaultDataSource.profile);
    const currentDataRef = useRef({...defaultData});
    const onBaseChange = (value) => {
        if(currentDataRef.current.defKey === value.defKey &&
            currentDataRef.current.defName === value.defName &&
            currentDataRef.current.intro === value.intro) {
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
                    to:  defaultData.parentId === '_UNCATE' ? null : defaultData.parentId,
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
                        ...currentDataRef.current,
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
    const currentEntity = {
        entityId: defaultData.id,
        entityType: defaultData.type,
        defName: currentDataRef.current.defName,
        defKey: currentDataRef.current.defKey,
    };
    const onFieldsChange = (fields) => {
        const data = {
            event: WS.FIELD.MOP_FIELD_UPDATE,
            payload: [{
                ...currentEntity,
                data: fields,
            }],
        };
        notify(WS.TAB_LOCAL_UPDATE, data);
        sendData(data);
    };
    // const onFieldsAdd = (step, fields) => {
    //     const data = {
    //         event: WS.FIELD.MOP_FIELD_CREATE,
    //         payload: [{
    //             ...currentEntity,
    //             step,
    //             data: fields,
    //         }],
    //     };
    //     notify(WS.TAB_LOCAL_UPDATE, data);
    //     sendData(data);
    // };
    const onFieldsAdd = (payload) => {

        const data = {
            event: WS.FIELD.MOP_FIELD_CREATE,
            payload: payload.map((p) => {
                return {
                    ...currentEntity,
                    ...p,
                };
            }),
        };
        notify(WS.TAB_LOCAL_UPDATE, data);
        sendData(data);
    };
    const onFieldsDelete = (fields) => {
        const data = {
            event: WS.FIELD.MOP_FIELD_DELETE,
            payload: [{
                ...currentEntity,
                data: fields,
            }],
        };
        notify(WS.TAB_LOCAL_UPDATE, data);
        sendData(data);
    };
    const onFieldsMove = (step, moveData) => {
        const data = {
            event: WS.FIELD.MOP_FIELD_DRAG,
            payload: [{
                ...currentEntity,
                step,
                data: moveData,
            }],
        };
        notify(WS.TAB_LOCAL_UPDATE, data);
        sendData(data);
    };

    useImperativeHandle(ref, () => {
        return {
            setFieldsParams: (p) => {
                contentRef.current.setFieldsParams(p);
            },
            onDrop: (e) => {
                contentRef.current.onDrop(e);
            },
        };
    }, []);

    useEffect(() => {
        defaultParams && contentRef.current.setFieldsParams(defaultParams);
    }, []);

    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(WS.TAB_UPDATE, (message) => {
            message.payload.map((payload) => {
                if(defaultData.id === payload.next?.id
                    || defaultData.id === payload.entityId) {
                    // 数据表变更 字段变更
                    if(message.event === WS.ENTITY.MOP_ENTITY_UPDATE) {
                        const tempBaseData = _.pick(payload.next.data, ['defKey', 'defName', 'intro']);
                        currentDataRef.current = {
                            ...currentDataRef.current,
                            ...tempBaseData,
                        };
                        if(isActive.current) {
                            baseRef.current.setBaseData(tempBaseData);
                        } else {
                            updateCache.current.push({
                                fuc: baseRef.current.setBaseData,
                                data: tempBaseData,
                            });
                        }
                    } else if(message.event === WS.FIELD.MOP_FIELD_UPDATE) {
                        const updateFields = payload.data;
                        const updateCallback = (pre) => {
                            const tempPre = [...pre];
                            return tempPre.map((f) => {
                                const currentField = updateFields.find(u => u.id === f.id);
                                if(currentField) {
                                    return {
                                        ...f,
                                        ..._.pick(currentField.next, currentField.updateKeys.split(',')),
                                    };
                                }
                                return f;
                            });
                        };
                        if(isActive.current) {
                            contentRef.current.setSheetData(updateFields);
                            contentRef.current.setFields(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setFields,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.FIELD.MOP_FIELD_DRAG) {
                        const updateCallback = (pre) => {
                            return moveArrayPositionByArray(pre,
                                payload.data.map(d => d.id),
                                payload.step, 'id');
                        };
                        if(isActive.current) {
                            contentRef.current.setFields(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setFields,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.FIELD.MOP_FIELD_CREATE) {
                        const updateCallback = (pre) => {
                            const temp = [...pre];
                            temp.splice(payload.step, 0, ...payload.data);
                            return temp;
                        };
                        if(isActive.current) {
                            contentRef.current.addSheetData(payload);
                            contentRef.current.setFields(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setFields,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.FIELD.MOP_FIELD_DELETE) {
                        const deleteFields = payload.data;
                        const updateCallback = (pre) => {
                            return pre.filter(f => !deleteFields.find(d => d.id ===  f.id));
                        };
                        if(isActive.current) {
                            contentRef.current.deleteSheetData(deleteFields);
                            contentRef.current.setFields(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setFields,
                                data: updateCallback,
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
        subscribeEvent(PROFILE.UPDATE, (profile) => {
            if(isActive.current) {
                setProfileState(profile);
            } else {
                updateCache.current.push({
                    fuc: setProfileState,
                    data: profile,
                });
            }
        }, eventId);
        return () => {
            unSubscribeEvent(WS.TAB_ACTIVE_CHANGE, eventId);
            unSubscribeEvent(PROFILE.UPDATE, eventId);
            unSubscribeEvent(WS.TAB_UPDATE, eventId);
        };
    }, []);

    const onColumnsChange = useCallback((columns) => {
        // 触发更新
        const result = _.reduce(columns, (acc, item) => {
            acc[item.key] = { width: item.width, fixed: item.fixed || '' };
            return acc;
        }, {});
        updateUserProfile({
            projectId: defaultDataSource.id,
            userId: getCache('user', true).userId,
            profile: {
                ...profileState.user,
                freezeEntityHeader: {
                    logicEntity: result,
                },
            },
        });
    }, []);
    return <div className={currentPrefix}>
      <QuickInput
        user={user}
        defaultDataSource={defaultDataSource}
        contentRef={contentRef}
        onBaseChange={onBaseChange}
        baseRef={baseRef}
        onFieldsAdd={onFieldsAdd}
        onFieldsDelete={onFieldsDelete}
        defaultData={defaultData}
        currentDataRef={currentDataRef}
        getCurrentDataSource={getCurrentDataSource}
      />
      <Base
        user={user}
        getCurrentDataSource={getCurrentDataSource}
        dataSource={defaultDataSource}
        ref={baseRef}
        defaultData={defaultData}
        onCheck={onBaseChange}/>
      <Content
        user={user}
        defaultDataSource={defaultDataSource}
        ref={contentRef}
        getCurrentStandard={getCurrentStandard}
        defaultData={defaultData}
        getCurrentDataSource={getCurrentDataSource}
        onFieldsChange={onFieldsChange}
        onFieldsAdd={onFieldsAdd}
        onFieldsDelete={onFieldsDelete}
        onFieldsMove={onFieldsMove}
        profile={profileState}
        onColumnsChange={onColumnsChange}
        currentDataRef={currentDataRef}
      />
    </div>;
}));
