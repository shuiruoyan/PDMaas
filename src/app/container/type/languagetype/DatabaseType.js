import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Button, IconTitle, Message, Modal, openDrawer} from 'components';
import _ from 'lodash';
import AddOrEditDatabaseType from './AddOrEditDatabaseType';
import {LOADING, NORMAL, WS} from '../../../../lib/constant';
import {checkPermission, dbTypeNsKey} from '../../../../lib/permission';
import {downloadString, upload} from '../../../../lib/rest';
import {
    changeDbEnable,
    createDb,
    deleteDb,
    dragDb,
    updateDb,
} from '../../../../lib/profile_data_handling';
import {sendData} from '../../../../lib/utils';

export const defaultDBSvg = '<svg t="1745274474022" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9471" width="200" height="200"><path d="M98.3 540.2l2.3 2.1 345.3 189.1c17.6 14.7 40.5 22.8 64.6 22.8 24.1 0 47-8.1 64.6-22.8l344.8-188.8 0.5-0.3 2.3-2.1c34.8-31.3 39-82 9.8-118-1.7-2.1-4.9-2.5-7-0.7l-33.7 27.4c-2.1 1.7-2.5 4.9-0.7 7 10.6 13 9.7 30.5-2.1 42.7L544.7 687.1l-0.5 0.3-2.3 2.1c-17 15.3-45.8 15.3-62.8 0l-2.3-2.1-344.7-188.8c-11.8-12.2-12.7-29.7-2.1-42.7 1.7-2.1 1.4-5.3-0.7-7l-33.7-27.4c-2.1-1.7-5.3-1.4-7 0.7-29.4 35.9-25.1 86.7 9.7 118z" fill="#424242" p-id="9472"></path><path d="M925.5 608.3l-33.7 27.4c-2.1 1.7-2.5 4.9-0.7 7 10.6 13 9.7 30.5-2.1 42.7L544.7 873.9l-0.5 0.3-2.3 2.1c-17 15.3-45.8 15.3-62.8 0l-2.3-2.1-344.7-188.8c-11.8-12.2-12.7-29.7-2.1-42.7 1.7-2.1 1.4-5.3-0.7-7l-33.7-27.4c-2.1-1.7-5.3-1.4-7 0.7-29.2 35.9-25 86.7 9.8 118l2.3 2.1L446 918.2c17.6 14.7 40.5 22.8 64.6 22.8 24.1 0 47-8.1 64.6-22.8L920 729.4l0.5-0.3 2.3-2.1c34.8-31.3 39-82 9.8-118-1.8-2.1-4.9-2.5-7.1-0.7zM116.1 372.6l54.5 29.8 290.6 159.1c27.2 24.5 71.4 24.5 98.6 0l290.6-159.1 54.5-29.8c2.6-2.3 4.9-4.8 7-7.4 19.9-24.5 17.7-59.1-7-81.3L559.8 99.3c-27.2-24.5-71.4-24.5-98.6 0L116.1 283.9c-24.6 22.2-26.9 56.7-7 81.3 2.2 2.6 4.4 5.1 7 7.4z" fill="#424242" p-id="9473"></path></svg>';

export default React.memo(forwardRef(({ baseClass, languageArrayDom, ...restProps }, ref) => {
    const dbDialectDrawRef = useRef();
    // eslint-disable-next-line max-len
    const { dataTypes, dataSource, doImmersiveEdit, validateForm, getCurrentUserConfig, updateUser } = restProps;
    const [dialectDataTypes, setDialectDataTypes] = useState(dataTypes);
    const dialectDataTypesRef = useRef(dialectDataTypes);
    dialectDataTypesRef.current = dialectDataTypes;
    const _onItemClick = useCallback((itemEvent, itemBtn, dbItem) => {
        let drawer = null;
        // eslint-disable-next-line no-shadow
        const confirmAddDbDialect = (e, btn) => {
            let result = null;
            const prevObj = dbDialectDrawRef.current.getPrevObj();
            const dbDialectObj = dbDialectDrawRef.current.getDbDialectObj();
            const tmpDataTypeArray = dialectDataTypesRef.current.map((dataType) => {
                return {
                    ...dataType,
                    dbDataType: {
                        ...prevObj ? _.omit(dataType.dbDataType, [prevObj.defKey])
                            : dataType.dbDataType,
                        [dbDialectObj.defKey]: dbDialectObj.dataType?.[dataType.id] || '',
                    },
                };
            });
            const commonArray = [{ key: 'defKey', label: '数据库品牌代码' }];
            // eslint-disable-next-line max-len
            validateForm(dbDialectObj, prevObj, { notNullArr: commonArray, notRepeatArr: commonArray }).then(() => {
                if (dbDialectObj.id) {
                    const prevDefKey = prevObj.defKey;
                    const currentDefKey = dbDialectObj.defKey;
                    const updateDataTypeKeys = dbDialectDrawRef.current.getUpdateDataTypeKeys();
                    // eslint-disable-next-line max-len
                    if (prevDefKey !== currentDefKey || (updateDataTypeKeys && updateDataTypeKeys.length > 0)) {
                        Modal.confirm({
                            title: '警告',
                            message: '数据库品牌或数据类型修改会影响全局，请提醒项目成员刷新项目，以避免数据混乱。',
                            onOk: (ev, b) => {
                                b.updateStatus(LOADING);
                                result = updateUser(updateDb(getCurrentUserConfig, { dbDialect: dbDialectObj, dataTypes: tmpDataTypeArray || [], updateDataTypeKeys: updateDataTypeKeys.join(',') }));
                                return result.then(() => {
                                    // onRefresh && onRefresh();
                                    sendData({
                                        event: WS.USER.SWITCH_DBDIALECT,
                                        ctId: Math.uuid(),
                                        payload: {
                                            dbDialect:  currentDefKey,
                                        },
                                    }, null, () => {
                                        drawer.close();
                                    }, true);
                                });
                            },
                            onCancel: () => {
                                btn.updateStatus(NORMAL);
                            },
                            okText: '确定',
                            cancelText: '取消',
                        });
                    } else {
                        btn.updateStatus(LOADING);
                        result = updateUser(updateDb(getCurrentUserConfig, { dbDialect: dbDialectObj, dataTypes: tmpDataTypeArray || [], updateDataTypeKeys: '' }));
                        result.then(() => {
                            drawer.close();
                        });
                    }
                    // result.then(() => {
                    //     const prevDefKey = prevObj.defKey;
                    //     const currentDefKey = dbDialectObj.defKey;
                    //     if (prevDefKey !== currentDefKey) {
                    //         onRefresh && onRefresh();
                    //         Message.warring({
                    //             title: '您修改数据库品牌会导致全局受影响，请通知所有打开项目人员刷新项目以防数据乱。',
                    //         });
                    //     }
                    //     drawer.close();
                    // });
                } else {
                    btn?.updateStatus?.(LOADING);
                    result = updateUser(createDb(getCurrentUserConfig,
                    {
                            dbDialect: { ...dbDialectObj, isEnabled: 1 },
                            dataTypes: tmpDataTypeArray || [],
                        }));
                    result.then(() => {
                        btn?.updateStatus?.(NORMAL);
                        drawer.close();
                    });
                }

            }).catch((error) => {
                let displayTitle = '';
                commonArray.forEach((it) => {
                    error[it.key]?.forEach((p) => {
                        displayTitle += ` ${p.message}\n`;
                    });
                });
                Modal.error({
                    title: '错误',
                    message: displayTitle,
                });
                btn.updateStatus(NORMAL);
            });
        };
        const deleteDialect = (e, btn) => {
            btn.updateStatus(LOADING);
            Modal.confirm({
                title: '警告',
                message: '删除后不可恢复，是否继续',
                onOk: (ev, bt) => {
                    bt.updateStatus(LOADING);
                    const dbDialectObj = dbDialectDrawRef.current.getDbDialectObj();
                    return updateUser(deleteDb(getCurrentUserConfig, dbDialectObj)).then(() => {
                        bt.updateStatus(NORMAL);
                        drawer.close();
                    });
                },
                onCancel: () => {
                    btn.updateStatus(NORMAL);
                },
                okText: '确定',
                cancelText: '取消',
            });
        };
        const exportDataBase = () => {
            // dataTypes dbDialects
            const dbDialect = dbDialectDrawRef.current.getDbDialectObj();
            if(dbDialect.defKey) {
                downloadString(JSON.stringify({
                        dbDialect: _.omit(dbDialect, ['dataTypes', 'dataType', 'id']),
                        dataTypes: dialectDataTypesRef.current.map((d) => {
                            return {
                                defKey: d.defKey,
                                dbDataType: dbDialect.dataType?.[d.id],
                            };
                        }),
                    }, null, 2),
                    'application/json', `${dbDialect.defKey}.json`);
            } else {
                Message.error({title: '数据库品牌代码不能为空！'});
            }
        };
        const importDataBase = () => {
            upload('application/json', (data) => {
                try {
                    const dbDialect = JSON.parse(data);
                    if(dbDialect.dbDialect) {
                        dbDialectDrawRef.current.updateDbDialect(dbDialect);
                    } else {
                        Message.error({title: '格式错误，请确认文件内容为数据库品牌数据！'});
                    }
                } catch (e) {
                    Message.error({title: '格式错误，请确认文件内容为数据库品牌数据！'});
                }
            }, (e) => {
                const {name} = e;
                if(name.endsWith('.json')) {
                    return true;
                }
                Message.error({title: '文件类型错误'});
                return false;
            }, true);
        };
        // eslint-disable-next-line max-len
        drawer = openDrawer(<AddOrEditDatabaseType
          ref={dbDialectDrawRef}
          nsKey={dbTypeNsKey.U}
          dataSource={dataSource}
          defaultSvg={defaultDBSvg}
          readonly={!updateUser}
          doImmersiveEdit={doImmersiveEdit}
          dataTypes={dialectDataTypesRef.current}
          baseClass={`${baseClass}-of-database-drawer`}
          databaseObj={dbItem} />, {
            closeable: false,
            title: `${dbItem ? '编辑' : '新增'}数据库品牌`,
            placement: 'right',
            width: '100%',
            buttons: updateUser ? [
              <div className={`${baseClass}-of-database-opt`}>
                {dbItem &&
                <Button nsKey={dbTypeNsKey.U} onClick={deleteDialect}><IconTitle
                  icon="icon-oper-delete"
                  title="删除"
                  nsKey={dbTypeNsKey.U}/>
                </Button>}
                {checkPermission(dbTypeNsKey.U) && <span
                  style={{marginLeft: 20}}
                  onClick={exportDataBase}>导出</span>}
                {checkPermission(dbTypeNsKey.U) && <span
                  style={{marginLeft: 10}}
                  onClick={importDataBase}>导入</span>}
              </div>,
              <Button onClick={() => drawer.close()}>取消</Button>,
              <Button type="primary" onClick={(e, btn) => confirmAddDbDialect(e, btn)} nsKey={dbTypeNsKey.U}>确定</Button>,
            ] : [],
        });
    }, []);
    useEffect(() => setDialectDataTypes(dataTypes), [dataTypes]);
    useImperativeHandle(ref, () => ({
        _onItemClick,
        getLanguageArr: () => dataSource.profile.global.dbDialects,
        defaultSvg: defaultDBSvg,
        statusUpdate: (targetObj) => {
            return updateUser(changeDbEnable(getCurrentUserConfig, targetObj));
        },
        locationUpdate: (operateArray, id, step) => {
            return updateUser(dragDb(getCurrentUserConfig,
                { dialectArray: operateArray, id, step }));
        },
        copyUpdate: (copgetObj,tmpDataTypeArray) => {
            return updateUser(createDb(getCurrentUserConfig,
                { dbDialect: { ...copgetObj, isEnabled: 1 }, dataTypes: tmpDataTypeArray || [] }));
        },
        getNsKey: () => {
            return dbTypeNsKey.U;
        },
    }), [dataSource.profile.global.dbDialects]);
    return <div className={`${baseClass}-of-database`}>
      {
        updateUser && <div className={`${baseClass}-of-database-header`}>
          <Button type="primary" onClick={_onItemClick} nsKey={dbTypeNsKey.U}>添加新的数据库品牌</Button>
          <div />
        </div>
      }
      <div className={`${baseClass}-of-database-body`}>
        {languageArrayDom}
      </div>
    </div>;
}));
