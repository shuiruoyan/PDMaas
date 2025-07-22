import React, {forwardRef, useCallback, useRef} from 'react';
import {Button,Message} from 'components';
import _ from 'lodash';
import CommonToolTree from './CommonToolTree';
import Fields from '../model/entity/physicalentity/Fields';
import {ENTITY, WS} from '../../../lib/constant';

const BatchDeleteFields = React.memo(forwardRef(({baseClass,
                                                     labelRender, treeData, setIsFlat,
                                                     isFlat,currentDataSource, progress,
                                                     _sendData, getCurrentStandard,
                                                     getCurrentDataSource, user }) => {
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
            Message.error({title: '需删除的字段不能为空！'});
        }
        const sendDataArray = filterEntities.filter((f) => {
            return f.type === ENTITY.TYPE.P;
        }).map((f) => {
            return {
                event: WS.FIELD.MOP_FIELD_DELETE,
                defKey: f.defKey,
                payload: [{
                    data: f.fields.filter((field) => {
                        return _.some(fieldsDataRef.current, o => o.defKey === field.defKey);
                    }),
                    defKey: f.defKey,
                    defName: f.defName,
                    entityId: f.id,
                    entityType: f.type,
                }],
            };
        }).filter(s => s.payload[0].data.length !== 0);
        // console.log(sendDataArray);
        _sendData(sendDataArray, 'batchAddField',filterEntities.length - sendDataArray.length);
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
            getCurrentDataSource={getCurrentDataSource}
            defaultDataSource={currentDataSource}
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
                >以上字段从左边实体中删除掉</Button>
        </div>
      </div>
    </div>;
}));

BatchDeleteFields.orderValue = 4;

export default BatchDeleteFields;
