import React, { useRef, useState, useEffect } from 'react';
import './style/index.less';
import {Button, openDrawer, Modal } from 'components';
import _ from 'lodash';
import Basic from './Basic';
import AddType from './AddType';
import {getPrefix} from '../../../../lib/classes';
import {LOADING, NORMAL} from '../../../../lib/constant';
import {baseDataTypeNsKey} from '../../../../lib/permission';
import {getDictEnties} from '../../../../lib/json';
import {createBaseDataType} from '../../../../lib/profile_data_handling';

export default React.memo(({dataSource, setActive, updateUser,
                                      getCurrentUserConfig}) => {

  const currentPrefix = getPrefix('type');
  const addTypeRef = useRef(null);
  const basicRef = useRef(null);
  const [baseDataTypes, setBaseDataTypes] = useState([]);
  const dbDialects = dataSource.profile.global.dbDialects.filter(db => db.isEnabled) || [];
  const programLangs = dataSource.profile.global.programLangs.filter(p => p.isEnabled) || [];
  const [sysDataTypeOften, setSysDataTypeOften] = useState([]);

  useEffect(() => {
    getDictEnties(['sys.DataTypeOften']).then((res) => {
      setSysDataTypeOften(res[0].items);
    });
  }, []);
  const onAddClick = () => {
    let drawer;
    const onOk = (e, btn) => {
      btn.updateStatus(LOADING);
      if(!addTypeRef.current.formData.defKey || !addTypeRef.current.formData.defName) {
        Modal.error({
          title: '错误',
          message: '基础数据类型代码或者名称不能为空！',
        });
        btn.updateStatus(NORMAL);
        return;
      }
      if(baseDataTypes?.find(it => it.defKey === addTypeRef.current.formData.defKey)) {
        Modal.error({
          title: '错误',
          message: '基础数据类型代码重复！',
        });
        btn.updateStatus(NORMAL);
        return;
      }
      updateUser(createBaseDataType(getCurrentUserConfig, {
        ...addTypeRef.current.formData,
        orderValue: (baseDataTypes?.[baseDataTypes.length - 1]?.orderValue || 0) + 1,
      })).then(() => {
        btn.updateStatus(NORMAL);
        drawer.close();
      });
    };
    const oncancel = () => {
      drawer.close();
    };
    drawer = openDrawer(<AddType
      ref={addTypeRef}
      nsKey={baseDataTypeNsKey.U}
      sysDataTypeOften={sysDataTypeOften}
      dataSource={dataSource}
      dbDialects={dbDialects}
      programLangs={programLangs}
    />, {
      title: '添加基本数据库类型',
      placement: 'right',
      width: '75%',
      buttons: [
        <Button
          key='onOK'
          onClick={oncancel}>
          取消
        </Button>,
        <Button
          nsKey={baseDataTypeNsKey.U}
          key='onCancel'
          type='primary'
          onClick={(e, btn) => { onOk(e,btn); }}
        >
          确认
        </Button>],
    });

  };
  useEffect(() => {
    const tempData = _.sortBy(dataSource.profile.global.dataTypes  || [], 'orderValue');
    const typeOftenData = {
      common: [],
      general: [],
      low: [],
    };
    tempData.forEach((it) => {
      if(!it.often) {
        typeOftenData.low.push(it);
      } else if(it.often === '5') {
        typeOftenData.general.push(it);
      } else if(it.often === '9') {
        typeOftenData.common.push(it);
      } else {
        typeOftenData.low.push(it);
      }
    });
    setBaseDataTypes([...(tempData || [])]);
  }, [dataSource.profile.global.dataTypes]);
  return <div className={`${currentPrefix}`}>
    {
      updateUser && <div className={`${currentPrefix}-title`}>
        <div className={`${currentPrefix}-title-left`}>
          <Button
            nsKey={baseDataTypeNsKey.U}
            onClick={onAddClick}
            type='primary'
          >添加基本数据类型</Button>
        </div>
        <div className={`${currentPrefix}-title-right`}  />
      </div>
    }
    <Basic
      dataSource={dataSource}
      ref={basicRef}
      sysDataTypeOften={sysDataTypeOften}
      baseDataTypes={baseDataTypes}
      dbDialects={dbDialects}
      updateUser={updateUser}
      getCurrentUserConfig={getCurrentUserConfig}
      setActive={setActive}
      programLangs={programLangs}
    />
  </div>;
});
