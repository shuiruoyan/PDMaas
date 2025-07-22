import React, {
    useEffect,
    useRef,
    forwardRef,
    useState,
    useImperativeHandle,
    useMemo,
    useContext,
} from 'react';

import './style/index.less';
import {getPrefix} from '../../../../../lib/classes';
import { subscribeEvent, unSubscribeEvent, notify } from '../../../../../lib/subscribe';
import {COMPONENT, ENTITY, PROFILE, WS} from '../../../../../lib/constant';
import Base from './Base';
import Attribute from './Attribute';
import Content from './Content';
import {sendData} from '../../../../../lib/utils';
import {
    basePhysicFieldNsKey, basePhysicIndexNsKey,
    checkPermission,
} from '../../../../../lib/permission';
import { ViewContent } from '../../../../../lib/context';
import {moveArrayPositionByArray} from '../../../../../lib/array';

export default React.memo(forwardRef(({defaultDataSource,defaultData,
                                          getCurrentStandard, defaultParams,
                                          updateUserProfile, config,
                                          getCurrentDataSource, readOnly,updateUser, user,
                                          openProjectSetting, open},
                                      ref) => {
    const isView = useContext(ViewContent) || readOnly;
    const isActive = useRef(true);
    const updateCache = useRef([]);
    const currentPrefix = getPrefix('container-model-entity-physical');
    const baseRef = useRef(null);
    const contentRef = useRef(null);
    const attrRef = useRef(null);
    const [profileState, setProfileState] = useState(defaultDataSource.profile);
    const currentDataRef = useRef(
        // getCurrentDataSource().project.entities.find(d => d.id === defaultData.id)
        {...defaultData},
    );
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
                    to: defaultData.parentId === '_UNCATE' ? null : defaultData.parentId,
                    type: COMPONENT.TREE.SUB,
                    data: {
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
        sendData(data, null, null, true);
    };
    const currentEntity = {
        entityId: defaultData.id,
        entityType: defaultData.type,
        defName: currentDataRef.current.defName,
        defKey: currentDataRef.current.defKey,
    };
    const onEntityAttrsChange = (attrs) => {
        // console.log(attrs);
        if(attrs.pre === attrs.next) {
            return;
        }

        const data = {
            event: WS.ENTITY.MOP_ENTITY_UPDATE,
            payload: [{
                hierarchyType: defaultData.parentId === '_UNCATE'
                    ? PROFILE.USER.FLAT
                    : defaultDataSource.profile.user.modelingNavDisplay.hierarchyType,
                updateKeys: attrs.updateKeys,
                pre: {
                    id: defaultData.id,
                    from: defaultData.id,
                    to: defaultData.parentId === 'base_flat' || defaultData.parentId === '_UNCATE' ? null : defaultData.parentId,
                    type: COMPONENT.TREE.SUB,
                    data: {
                        ...defaultData,
                        ...currentDataRef.current,
                        parentId: defaultData.parentId === '_UNCATE' ? 'base_flat' : defaultData.parentId,
                    },
                },
                next: {
                    id: defaultData.id,
                    from: defaultData.id,
                    to: defaultData.parentId === 'base_flat' || defaultData.parentId === '_UNCATE' ? null : defaultData.parentId,
                    position: COMPONENT.TREE.AFTER,
                    type: COMPONENT.TREE.SUB,
                    data: {
                        defKey: defaultData.defKey,
                        defName: defaultData.defName,
                        [attrs.updateKeys]: attrs.next,
                        type: defaultData.type,
                    },
                },
            }],
        };
        notify(WS.TAB_LOCAL_UPDATE, data);
        sendData(data);

    };
    const onFieldsChange = (fields) => {
        if(fields && fields.length > 0) {
            const data = {
                event: WS.FIELD.MOP_FIELD_UPDATE,
                payload: [{
                    ...currentEntity,
                    data: fields,
                }],
            };
            notify(WS.TAB_LOCAL_UPDATE, data);
            sendData(data);
        }
    };
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

    const onIndexesChange = (indexes) => {
        const data = {
            event: WS.INDEX.MOP_INDEX_UPDATE,
            payload: [{
                ...currentEntity,
                data: indexes,
            }],
        };
        sendData(data);
    };
    const onIndexesAdd = (step, indexes) => {
        const data = {
            event: WS.INDEX.MOP_INDEX_CREATE,
            payload: [{
                ...currentEntity,
                step,
                data: indexes,
            }],
        };
        sendData(data);
    };
    const onIndexesDelete = (indexes) => {
        const data = {
            event: WS.INDEX.MOP_INDEX_DELETE,
            payload: [{
                ...currentEntity,
                data: indexes,
            }],
        };
        sendData(data);
    };
    const onIndexesMove = (step, moveData) => {
        const data = {
            event: WS.INDEX.MOP_INDEX_DRAG,
            payload: [{
                ...currentEntity,
                step,
                data: moveData,
            }],
        };
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
            console.log(getCurrentDataSource());
            if(message.event === WS.USER.SWITCH_DBDIALECT) {
                const currentFields = (getCurrentDataSource().project.entities || [])
                    .find(it => it.id === defaultData.id)?.fields || [];
                const updateFields = currentFields.map((field) => {
                    return {
                        id: field.id,
                        defKey: field.defKey,
                        defName: field.defName,
                        updateKeys: 'dbDataType',
                        pre: {},
                        next: {dbDataType: field.dbDataType},
                    };
                });
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
                return;
            }
            message.payload.map((payload) => {
                if(message.event === WS.CATEGORY.MOP_CATEGORY_UPDATE &&
                    payload.next.data.bindSchema === 1 &&
                    payload.next.id === defaultData.parentId) {
                    const tempBaseData = {
                        schemaName: payload.next.data.defKey,
                    };
                    const updateCallback = (pre) => {
                        return {
                            ...pre,
                            ...tempBaseData,
                        };
                    };
                    if(isActive.current) {
                        baseRef.current.setBaseData(updateCallback);
                    } else {
                        updateCache.current.push({
                            fuc: baseRef.current.setBaseData,
                            data: updateCallback,
                        });
                    }
                }
                if(defaultData.id === payload.next?.id
                    || defaultData.id === payload.next?.data?.id
                    || defaultData.id === payload.entityId) {
                    // 数据表变更 字段变更
                    if(message.event === WS.ENTITY.MOP_ENTITY_UPDATE) {
                        const updateKeys = payload.updateKeys.split(',');
                        const tempBaseData = _.pick(payload.next.data, payload.updateKeys.split(','));
                        currentDataRef.current = {
                            ...currentDataRef.current,
                            ...tempBaseData,
                        };

                        const updateCallback = (pre) => {
                            return {
                                ...pre,
                                ...tempBaseData,
                            };
                        };
                        if(isActive.current) {
                            if(updateKeys[0].indexOf('attr') === -1) {
                                baseRef.current.setBaseData(updateCallback);
                            } else {
                                attrRef.current.setAttrsData(updateCallback);
                            }
                        } else {
                            updateCache.current.push({
                                fuc: updateKeys[0].indexOf('attr') === -1 ?
                                    baseRef.current.setBaseData : attrRef.current.setAttrsData,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.ENTITY.MOP_ENTITY_DRAG ||
                        message.event === WS.ENTITY.MOP_ENTITY_CATEGORY_CHANGE) {
                        if(payload?.next?.data && defaultData.type === ENTITY.TYPE.P) {
                            const tempBaseData = _.pick(payload.next.data, ['schemaName']);
                            const updateCallback = (pre) => {
                                return {
                                    ...pre,
                                    ...tempBaseData,
                                };
                            };
                            if(isActive.current) {
                                baseRef.current.setBaseData(updateCallback);
                            } else {
                                updateCache.current.push({
                                    fuc: baseRef.current.setBaseData,
                                    data: updateCallback,
                                });
                            }
                        }
                    } else if(message.event === WS.FIELD.MOP_FIELD_UPDATE) {
                        const updateFields = [...(payload.data || [])];
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
                            // return pre.concat(payload.data);
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
                    } else if(message.event === WS.INDEX.MOP_INDEX_UPDATE) {
                        const updateIndexes = [...(payload.data || [])];
                        const updateCallback = (pre) => {
                            const tempPre = [...pre];
                            return tempPre.map((i) => {
                                const currentIndex = updateIndexes.find(u => u.id === i.id);
                                if(currentIndex) {
                                    return {
                                        ...i,
                                        ..._.pick(currentIndex.next, currentIndex.updateKeys.split(',')),
                                    };
                                }
                                return i;
                            });
                        };
                        if(isActive.current) {
                            contentRef.current.setIndexes(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setIndexes,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.INDEX.MOP_INDEX_DRAG) {
                        const updateCallback = (pre) => {
                            return moveArrayPositionByArray(pre,
                                payload.data.map(d => d.id),
                                payload.step, 'id');
                        };
                        if(isActive.current) {
                            contentRef.current.setIndexes(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setIndexes,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.INDEX.MOP_INDEX_CREATE) {
                        const updateCallback = (pre) => {
                            // return pre.concat(payload.data);
                            const temp = [...pre];
                            temp.splice(payload.step, 0, ...payload.data);
                            return temp;
                        };
                        if(isActive.current) {
                            contentRef.current.setIndexes(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setIndexes,
                                data: updateCallback,
                            });
                        }
                    } else if(message.event === WS.INDEX.MOP_INDEX_DELETE) {
                        const deleteIndexes = payload.data;
                        const updateCallback = (pre) => {
                            return pre.filter(i => !deleteIndexes.find(d => d.id ===  i.id));
                        };
                        if(isActive.current) {
                            contentRef.current.setIndexes(updateCallback);
                        } else {
                            updateCache.current.push({
                                fuc: contentRef.current.setIndexes,
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
    const isDisable = useMemo(() => {
        return checkPermission(basePhysicFieldNsKey)
            || checkPermission(basePhysicIndexNsKey);
    }, []);
    return <div className={currentPrefix}>
      <ViewContent.Provider value={isView}>
        <Base
          user={user}
          getCurrentDataSource={getCurrentDataSource}
          dataSource={defaultDataSource}
          ref={baseRef}
          defaultData={defaultData}
          onCheck={onBaseChange}/>
        <Attribute
          openProjectSetting={openProjectSetting}
          onEntityAttrsChange={onEntityAttrsChange}
          defaultData={defaultData}
          profile={profileState}
          ref={attrRef}
          defaultDataSource={defaultDataSource}
            />
        {
                isDisable && <Content
                  open={open}
                  config={config}
                  user={user}
                  getCurrentStandard={getCurrentStandard}
                  updateUserProfile={updateUserProfile}
                  defaultDataSource={defaultDataSource}
                  getCurrentDataSource={getCurrentDataSource}
                  ref={contentRef}
                  profile={profileState}
                  onFieldsChange={onFieldsChange}
                  defaultData={defaultData}
                  onFieldsAdd={onFieldsAdd}
                  onFieldsMove={onFieldsMove}
                  updateUser={updateUser}
                  onFieldsDelete={onFieldsDelete}
                  onIndexesChange={onIndexesChange}
                  onIndexesAdd={onIndexesAdd}
                  onIndexesDelete={onIndexesDelete}
                  onIndexesMove={onIndexesMove}
                  currentDataRef={currentDataRef}
                />
            }
      </ViewContent.Provider>
    </div>;
}));
