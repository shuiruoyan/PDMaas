import {Button, Icon, Tooltip, CodeEditor, openModal, Message} from 'components';
import React, {forwardRef, useImperativeHandle, useState, useCallback, useRef, useEffect, useContext} from 'react';
import _ from 'lodash';
import {filterEntityHelpField} from 'dataSource_utils';
import {getPrefix, classesMerge} from '../../../../../lib/classes';
import './style/index.less';
import ImmersiveEdit from './ImmersiveEdit';
import OtherDatabase from './OtherDatabase';
import {getTemplate2String} from '../../../../../lib/json2code';
import {LOADING, NORMAL} from '../../../../../lib/constant';
import {transformEntityDbDataType} from '../../../../../lib/utils';
import {checkPermission, dbTypeNsKey} from '../../../../../lib/permission';
import {getSimpleUserCache} from '../../../../../lib/cache';
import {ViewContent} from '../../../../../lib/context';
import {updateDb} from '../../../../../lib/profile_data_handling';

export default React.memo(forwardRef(({ dataSource, entityData,
                                          getCurrentDataSource, updateUser,
                                          activeState, profile},ref) => {
    const isView = useContext(ViewContent);
    const needUpdateRef = useRef(true);
    const currentPrefix = getPrefix('container-model-entity-physical-content-createstatement');
    const [dbDialects, setDbDialects] = useState([
        ...(dataSource.profile.global.dbDialects || []),
    ]);
    const entityDataRef = useRef(null);
    entityDataRef.current = entityData;
    const defaultDbRef = useRef(_.find(dbDialects,
        {defKey: getCurrentDataSource().profile.project.dbDialect}));
    const [selectDbDialect, setSelectDbDialect] = useState(defaultDbRef.current);
    const selectDbDialectRef = useRef(null);
    selectDbDialectRef.current = selectDbDialect;
    const [active, setActive] = useState(false);
    const [buttonType, setButtonType] = useState('primary');
    const [codeValue, setCodeValue] = useState('');
    const [editId, setEditId] = useState(Math.uuid());

    const immersiveEditRef = useRef(null);
    const transformEntityDataRef = useRef(null);
    const activeStateRef = useRef(null);
    activeStateRef.current = activeState;

    const getCurrentSelectDbDialectData = () => {
       return (getCurrentDataSource().profile.global.dbDialects || [])
           .find(d => d.id === selectDbDialectRef.current.id);
    };

    const updateCode = () => {
        try {
            selectDbDialectRef.current = getCurrentSelectDbDialectData();
            const transformEntityData = transformEntityDbDataType(getCurrentDataSource(),
                entityDataRef.current,  selectDbDialectRef.current.defKey);
            const tableCreate =
                getTemplate2String(selectDbDialectRef.current.tableCreate, transformEntityData,
                    getSimpleUserCache());
            const indexCreate =
                getTemplate2String(selectDbDialectRef.current.indexCreate, transformEntityData,
                    getSimpleUserCache());
            setSelectDbDialect(selectDbDialectRef.current);
            setCodeValue(tableCreate + indexCreate);
            transformEntityDataRef.current = transformEntityData;
            setEditId(Math.uuid());
        } catch (e) {
            setEditId(Math.uuid());
            setCodeValue('');
        }
    };

    useEffect(() => {
        if(activeStateRef.current === '3') {
            updateCode();
        } else {
            needUpdateRef.current = true;
        }
    }, [selectDbDialect, entityData, profile.global.dbDialects]);

    useEffect(() => {
        if(activeState === '3' && needUpdateRef.current) {
            updateCode();
            needUpdateRef.current = false;
        }
    }, [activeState]);
    useImperativeHandle(ref, () => {
        return {
            updateDefaultDb: () => {
                const tempDbDialects = getCurrentDataSource().profile.global.dbDialects || [];
                setDbDialects(tempDbDialects);
                defaultDbRef.current = _.find(tempDbDialects,
                    {defKey: getCurrentDataSource().profile.project.dbDialect});
                setSelectDbDialect(defaultDbRef.current);
            },
        };
    },[]);
    const openImmersiveEdit = useCallback(() => {
        let modal;
        const oncancel = () => {
            modal.close();
        };
        const onOK = (type, btn) => {
            btn.updateStatus(LOADING);
            const tableCreate = immersiveEditRef.current.templateData;
            const tempSelectDbDialect = {...selectDbDialect};
            tempSelectDbDialect.tableCreate = tableCreate;
            setSelectDbDialect(tempSelectDbDialect);
            updateUser(updateDb(getCurrentDataSource, {
                dbDialect: {...tempSelectDbDialect },
                dataTypes: [...getCurrentDataSource().profile.global.dataTypes],
            })).then(() => {
                btn.updateStatus(NORMAL);
                setDbDialects([
                    ...(getCurrentDataSource().profile.global.dbDialects || []),
                ]);
                type === 'ok' ? modal.close() : immersiveEditRef.current.onSuccess();
            })
            .catch(() => {
                btn.updateStatus(NORMAL);
                Message.error({title: '保存失败，请稍后重试！'});
            });
        };
        modal = openModal(<ImmersiveEdit
          getCurrentDataSource={getCurrentDataSource}
          entityData={filterEntityHelpField(transformEntityDataRef.current)}
          template={selectDbDialect.tableCreate}
          ref={immersiveEditRef}
        />, {
            title: '模板调整',
            fullScreen: true,
            closeable: false,
            buttons: [
              <Button
                onClick={oncancel}
                key='oncancel'>
                    取消
              </Button>,
              <Button
                nsKey={dbTypeNsKey.U}
                key='onOK'
                onClick={(e,btn) => onOK('ok', btn)}
                type='primary'>
                    确认
              </Button>,
              <Button
                nsKey={dbTypeNsKey.U}
                key="onOk"
                type="primary"
                style={{float: 'right',marginRight: '1%'}}
                onClick={(e, btn) => onOK('save', btn)}
                >
                    保存
              </Button>],
        });
    }, [selectDbDialect]);
    const openStructuredData = useCallback(() => {
        let modal;
        const oncancel = () => {
            modal.close();
        };
        modal = openModal(<CodeEditor
          style={{
            margin: 10,
          }}
          readOnly
          value={JSON.stringify(filterEntityHelpField(transformEntityDataRef.current), null, 2)}
          width='100%'
        />, {
            title: '结构数据',
            borderStyle: {
                margin: 10,
            },
            buttons: [
              <Button
                onClick={oncancel}
                key='oncancel'>
                    取消
              </Button>,
              <Button
                key='onOK'
                type='primary'>
                    确认
              </Button>],
        });
    },[]);
    const onClick = () => {
        setButtonType('primary');
        setSelectDbDialect(_.find(dbDialects,
            {defKey: getCurrentDataSource().profile.project.dbDialect}));
        setActive(false);
    };
    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-top`}>
        <div className={`${currentPrefix}-top-left`}>
          <Button
            type={buttonType}
            onClick={onClick}
          >{defaultDbRef.current.defKey}</Button>
          <span />
          <Tooltip
            force
            trigger='click'
            title={<OtherDatabase
              setSelectDbDialect={setSelectDbDialect}
              selectDbDialect={selectDbDialect}
              dbDialects={dbDialects}
              defaultDb={defaultDbRef.current}
              setActive={setActive}
              setButtonType={setButtonType}
            />}>
            <span className={classesMerge({
                [`${currentPrefix}-top-left-active`]: active,
            })}>
              {
                  selectDbDialect.defKey === defaultDbRef.current.defKey ? '请选择' : selectDbDialect.defKey
              }<Icon type='icon-down-more-copy' />
            </span>
          </Tooltip>
        </div>
        <div className={`${currentPrefix}-top-right`}>
          <span onClick={openStructuredData}>结构数据</span>
          {checkPermission(dbTypeNsKey.V) && !isView &&
          <span onClick={openImmersiveEdit}>模板调整</span>}
        </div>
      </div>
      <div className={`${currentPrefix}-bottom`}>
        <CodeEditor
          key={editId}
          value={codeValue}
          readOnly
          width='100%'
          height='100%'
        />
      </div>
    </div>;
}));
