import React, {forwardRef, useMemo, useRef} from 'react';
import {Button,Message, Table} from 'components';
import _ from 'lodash';
import CommonToolTree from './CommonToolTree';
import {ENTITY, WS} from '../../../lib/constant';
import {getId} from '../../../lib/idpool';
import {getColumnComponent, getDefaultColumn} from '../../../lib/component';

const BatchPresetFields = React.memo(forwardRef(({ baseClass,
                                                     labelRender, treeData, setIsFlat,
                                                     isFlat,currentDataSource, progress,
                                                     _sendData }) => {
    const commonToolTreeRef = useRef();
    const physicEntityPresetFields =
        [...(currentDataSource.profile.project.setting.physicEntityPresetFields || [])];
    const defaultColumns = useMemo(() => {
        const profile = currentDataSource.profile;
        const defaultColumn = getDefaultColumn(profile);
        const physicEntityHeader = _.fromPairs(_.sortBy(
            Object.entries(profile.project.setting.physicEntityHeader),
            ([, value]) => value.orderValue));
        const physicEntityFieldAttr = profile.project.setting.physicEntityFieldAttr;

        return Object.keys(physicEntityHeader || {}).map((c) => {
            const column = defaultColumn.find(col => col.key === c);
            if(column) {
                return {
                    ...column,
                    component: column.component === 'Checkbox' ?
                        column.component :
                        (v) => {
                        return <span
                          className={`${baseClass}-cellStyle`}
                        >{v}</span>;
                    },
                    width: physicEntityHeader[c].columnWidth,
                    enable: physicEntityHeader[c].enable === 1,
                };
            }
            const attr = physicEntityFieldAttr?.[c];
            if(attr) {
                const attrColumn = getColumnComponent(attr);
                return {
                    key: c,
                    label: attr.title || c,
                    ...attrColumn,
                    resize: true,
                    width: physicEntityHeader[c].columnWidth,
                    enable: physicEntityHeader[c].enable === 1,
                    component: attrColumn.component === 'Checkbox' ?
                        attrColumn.component :
                        (v) => {
                        return <span
                          className={`${baseClass}-cellStyle`}
                        >{v}</span>;
                    },
                };
            }
            return null;
        }).filter(c => c && c.enable);
    }, [currentDataSource.profile]);
    const buttonStyle = {
        height: '45px',
        lineHeight: '33px',
        fontSize: '13px',
    };
    const _onClick = (type) => {
        const filterEntities = currentDataSource.project.entities.filter((e) => {
            return commonToolTreeRef.current?.getCheckValue()
                .includes(e.id);
        });
        if(filterEntities.length === 0) {
            Message.error({title: '当前无选中实体！'});
            return;
        }
        if (physicEntityPresetFields.length === 0) {
            Message.error({title: '需添加的字段不能为空！'});
            // return;
        }
        if(type === 'del') {
            const sendDataArray = filterEntities.filter((f) => {
                return f.type === ENTITY.TYPE.P;
            }).map((f) => {
                return {
                    event: WS.FIELD.MOP_FIELD_DELETE,
                    defKey: f.defKey,
                    payload: [{
                        data: f.fields.filter((field) => {
                            return _.some(physicEntityPresetFields,
                                    o => o.defKey.toLowerCase()
                                        === field.defKey.toLowerCase());
                        }),
                        defKey: f.defKey,
                        defName: f.defName,
                        entityId: f.id,
                        entityType: f.type,
                    }],
                };
            }).filter(s => s.payload[0].data.length !== 0);
            // console.log(sendDataArray);
            _sendData(sendDataArray, 'batchDel', filterEntities.length - sendDataArray.length);
        }
        if(type === 'cover') {
            let filterDataLen = 0;
            let sendData = [];
            for (let i = 0; i < filterEntities.length; i += 1) {
                const tempEntity = {...filterEntities[i]};
                if(tempEntity.type !== ENTITY.TYPE.P) {
                    filterDataLen += 1;
                    // eslint-disable-next-line no-continue
                    continue;
                }
                const tempFields = [...tempEntity.fields];
                const filterField = physicEntityPresetFields.filter((f) => {
                    return !_.some(tempFields, o => o.defKey === f.defKey);
                });
                if(filterField.length !== 0) {
                    const ids = getId(filterField.length);
                    if(ids.length === 0) {
                        i -= 1;
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    sendData.push({
                        event: WS.FIELD.MOP_FIELD_CREATE,
                        defKey: tempEntity.defKey,
                        payload: [{
                            data: filterField.map((f, id) => {
                                return {
                                    ...f,
                                    id: ids[id],
                                };
                            }),
                            defKey: tempEntity.defKey,
                            defName: tempEntity.defName,
                            entityId: tempEntity.id,
                            entityType: tempEntity.type,
                            step: tempEntity.fields.length,
                        }],
                    });
                }
                if(filterField.length < physicEntityPresetFields.length) {
                    const updateFields = physicEntityPresetFields.filter((f) => {
                        return _.some(tempFields, o => o.defKey === f.defKey);
                    });
                    const updateData = updateFields.map((u) => {
                        const t = tempFields.filter((f) => {
                            return f.defKey === u.defKey;
                        })[0];
                        const updateKeys =  _.filter(Object.keys(u).filter((key) => {
                            return key !== 'id' && key !== 'defKey' && key !== 'orderValue';
                        }), key => u[key] !== t[key]);
                        return {
                            id: t.id,
                            defKey: t.defKey,
                            defName: t.defName,
                            updateKeys: updateKeys.join(','),
                            next: { ..._.pick(u, updateKeys)},
                            pre: {..._.pick(t, updateKeys)},
                        };
                    }).filter(u =>  u.updateKeys !== '');
                    if(updateData.length !== 0) {
                        sendData.push({
                            event: WS.FIELD.MOP_FIELD_UPDATE,
                            defKey: tempEntity.defKey,
                            payload: [{
                                data: updateData,
                                defKey: tempEntity.defKey,
                                defName: tempEntity.defName,
                                entityId: tempEntity.id,
                                entityType: tempEntity.type,
                            }],
                        });
                    }
                    if(updateData.length === 0 &&  filterField.length  === 0) {
                        filterDataLen += 1;
                    }

                }

            }
            _sendData(sendData, 'batchAddF', filterDataLen, filterEntities.length);
        }
    };
    return <div className={`${baseClass}-preset-fields`}>
      <div className={`${baseClass}-preset-fields-left`}>
        <CommonToolTree
          ref={commonToolTreeRef}
          baseClass={baseClass}
          treeData={treeData}
          setIsFlat={setIsFlat}
          isFlat={isFlat}
          labelRender={labelRender}
        />
      </div>
      <div className={`${baseClass}-preset-fields-right`}>
        <div className={`${baseClass}-preset-fields-right-title`}>以下字段为项目设置的预置字段
        </div>
        <div className={`${baseClass}-preset-fields-right-table`}>
          <Table
            rowEnableSelected={false}
            columns={defaultColumns}
            data={physicEntityPresetFields}
          />
        </div>
        <div className={`${baseClass}-preset-fields-right-button`}>
          <span>
            {
                progress.key &&
                <span>
                  <span>总数：{progress.totalNumber}</span>
                  <span>
                    {
                        progress.currentDataKey !== ''
                        && `当前正在执行：${progress.currentDataKey}`
                    }
                  </span>
                  <span>已完成：{progress.completedNumber}</span>
                </span>
            }
          </span>
          <Button
            disable={progress.disable}
            type="primary"
            onClick={() => _onClick('cover')}
            style={buttonStyle}
          >以上预置字段添加并覆盖至左边选中实体</Button>
          <Button
            disable={progress.disable}
            type="primary"
            onClick={() => _onClick('del')}
            style={buttonStyle}
          >以上预置字段从左边选中实体中删除</Button>
        </div>
      </div>
    </div>;
}));

BatchPresetFields.orderValue = 5;

export default BatchPresetFields;
