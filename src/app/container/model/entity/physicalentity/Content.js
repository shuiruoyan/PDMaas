import React, {
    useRef,
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { SimpleTab } from 'components';
import SearchInput from 'components/searchinput';
import _ from 'lodash';
import { getPrefix} from '../../../../../lib/classes';
import { subscribeEvent, unSubscribeEvent } from '../../../../../lib/subscribe';
import Fields from './Fields';
import Indexes from './Indexes';
import CreateStatement from './CreateStatement';
import CodeGenerate from './CodeGenerate';
import { PROJECT} from '../../../../../lib/constant';
import {getCache} from '../../../../../lib/cache';
import {
    basePhysicFieldNsKey, basePhysicIndexNsKey,
    checkPermission,
} from '../../../../../lib/permission';
import EntityRelation from './EntityRelation';


export default React.memo(forwardRef(({defaultData, onFieldsChange, onFieldsDelete,
                               onFieldsAdd, onFieldsMove, defaultDataSource, onIndexesDelete,
                                          onIndexesAdd, onIndexesMove, onIndexesChange,
                                          profile, updateUserProfile,
                                          currentDataRef, getCurrentDataSource,
                                          updateUser, user, open}, ref) => {
    const currentPrefix = getPrefix('container-model-entity-physical-content');
    // 下方内容区域如需要该内容可从state内获取
    const [entityData, setEntityData] = useState(defaultData);
    const entityDataRef = useRef(entityData);
    const projectDataRef = useRef(defaultDataSource.project);
    const indexesRef = useRef(null);
    const fieldsRef = useRef(null);
    const createStatementRef = useRef(null);
    const onChange = (e) => {
        fieldsRef.current?.filterFields?.(e.target.value);
    };
    useImperativeHandle(ref, () => {
        return {
            setSheetData: (...args) => {
                fieldsRef.current.setSheetData(...args);
            },
            addSheetData: (...args) => {
                fieldsRef.current.addSheetData(...args);
            },
            deleteSheetData: (...args) => {
                fieldsRef.current.deleteSheetData(...args);
            },
            setFields: (updateData) => {
                fieldsRef.current.setFields(updateData);
            },
            setIndexes: (updateData) => {
                indexesRef.current.setIndexes(updateData);
            },
            setFieldsParams: (params) => {
                fieldsRef.current.setParams(params);
            },
            onDrop: (e) => {
                fieldsRef.current.onDrop(e);
            },
        };
    }, []);
    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(PROJECT.UPDATE, (project) => {
            projectDataRef.current = project;
            const current = project.entities.find(e => e.id === defaultData.id);
            if(current && current !== entityDataRef.current) {
                setEntityData(current);
            }
        }, eventId);
        return () => {
            unSubscribeEvent(PROJECT.UPDATE, eventId);
        };
    }, []);
    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(PROJECT.REFRESH, ([pre, next]) => {
            if(pre.profile?.project?.dbDialect
                !== next?.profile?.project?.dbDialect) {
                // 数据库切换了 需要刷新字段
                const current = next?.project?.entities?.find(e => e.id === defaultData.id);
                if(current) {
                    fieldsRef.current?.setFields?.(current.fields);
                    createStatementRef.current?.updateDefaultDb();
                }
            }
        }, eventId);
        return () => {
            unSubscribeEvent(PROJECT.REFRESH, eventId);
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
                ...profile.user,
                freezeEntityHeader: {
                    physicEntity: result,
                },
            },
        });
    }, []);
    const isDisable = useMemo(() => {
        return !(checkPermission(basePhysicFieldNsKey)
            && checkPermission(basePhysicIndexNsKey));
    }, []);
    const options = [{
        key: '1',
        title: '字段',
        nsKey: basePhysicFieldNsKey,
        extra:<div className={`${currentPrefix}-extra`}>
          <SearchInput placeholder='代码/名称' onChange={onChange}/>
        </div>,
        content: <Fields
          user={user}
          onColumnsChange={onColumnsChange}
          getCurrentDataSource={getCurrentDataSource}
          profile={profile}
          defaultDataSource={defaultDataSource}
          onFieldsAdd={onFieldsAdd}
          onFieldsChange={onFieldsChange}
          ref={fieldsRef}
          onFieldsDelete={onFieldsDelete}
          onIndexesChange={onIndexesChange}
          defaultData={defaultData}
          onFieldsMove={onFieldsMove}
          currentDataRef={currentDataRef}
          entityData={entityData}
        />,
    }, {
        key: '2',
        title: '索引',
        nsKey: basePhysicIndexNsKey,
        content: <Indexes
          user={user}
          defaultDataSource={defaultDataSource}
          entityData={entityData}
          profile={profile}
          ref={indexesRef}
          defaultData={defaultData}
          onIndexesChange={onIndexesChange}
          onIndexesAdd={onIndexesAdd}
          onIndexesDelete={onIndexesDelete}
          onIndexesMove={onIndexesMove}
        />,
    }, {
        key: '3',
        title: '建表语句',
        disable: isDisable,
        content: <CreateStatement
          profile={profile}
          ref={createStatementRef}
          entityData={entityData}
          dataSource={defaultDataSource}
          updateUser={updateUser}
          defaultData={defaultData}
          getCurrentDataSource={getCurrentDataSource}
        />,
    }, {
        key: '4',
        title: '代码生成',
        disable: isDisable,
        content: <CodeGenerate
          entityData={entityData}
          profile={profile}
          updateUser={updateUser}
          getCurrentDataSource={getCurrentDataSource}
          dataSource={defaultDataSource}
          defaultData={defaultData}
        />,
    }, {
        key: '5',
        title: '关联关系',
        disable: isDisable,
        content: <EntityRelation
          open={open}
          getCurrentDataSource={getCurrentDataSource}
          defaultData={defaultData}
        />,
    }];
    return <div className={currentPrefix}>
      <SimpleTab options={options}/>
    </div>;
}));
