import React, {forwardRef, useCallback, useRef} from 'react';
import {Button,Message} from 'components';
import _ from 'lodash';
import CommonToolTree from './CommonToolTree';
import Fields from '../model/entity/physicalentity/Fields';
import {ENTITY, WS} from '../../../lib/constant';
import {getId} from '../../../lib/idpool';

const BatchAddFields = React.memo(forwardRef(({baseClass,
                                                  labelRender, treeData, setIsFlat,
                                                  isFlat,currentDataSource, progress,
                                                  _sendData, getCurrentStandard,
                                                  getCurrentDataSource, user}) => {
    const commonToolTreeRef = useRef();
    const fieldsRef = useRef([]);
    const fieldsDataRef = useRef([]);
    const _onchange = useCallback(() => {
        fieldsDataRef.current = fieldsRef.current?.getFields();
    }, []);
    const buttonStyle = {
        height: '45px',
        lineHeight: '33px',
        fontSize: '16px',
    };
    const _onClick = () => {
        const filterEntities = currentDataSource.project.entities.filter((e) => {
            return commonToolTreeRef.current?.getCheckValue()
                .includes(e.id);
        });
        if(filterEntities.length === 0) {
            Message.error({title: '当前无选中实体！'});
            return;
        }
        if (fieldsDataRef.current.length === 0) {
            Message.error({title: '需添加的字段不能为空！'});
            return;
        }
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
            const filterField = fieldsDataRef.current.filter((f) => {
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
            if(filterField.length < fieldsDataRef.current.length) {
                const updateFields = fieldsDataRef.current.filter((f) => {
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
        _sendData(sendData, 'batchAddField', filterDataLen, filterEntities.length);
    };
    return <div className={`${baseClass}-add-fields`}>
      <div className={`${baseClass}-add-fields-left`}>
        <CommonToolTree
          ref={commonToolTreeRef}
          baseClass={baseClass}
          treeData={treeData}
          setIsFlat={setIsFlat}
          isFlat={isFlat}
          labelRender={labelRender}
        />
      </div>
      <div className={`${baseClass}-add-fields-right`}>
        <div>
          <Fields
            user={user}
            defaultDataSource={currentDataSource}
            getCurrentDataSource={getCurrentDataSource}
            getCurrentStandard={getCurrentStandard}
            ref={fieldsRef}
            onChange={_onchange}
            profile={currentDataSource.profile}
            defaultData={{fields: []}}
            rowEnableSelected={false} />
        </div>
        <div>
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
            onClick={_onClick}
            style={buttonStyle}
          >以上字段添加并覆盖至左边选中实体</Button>
        </div>
      </div>
    </div>;
}));

BatchAddFields.orderValue = 3;

export default BatchAddFields;
