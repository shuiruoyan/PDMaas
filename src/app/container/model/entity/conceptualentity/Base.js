import React, {useState, forwardRef, useImperativeHandle, useContext} from 'react';
import _ from 'lodash';
import {Input, Icon, Message} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {ViewContent} from '../../../../../lib/context';
import {conceptNsKey} from '../../../../../lib/permission';

export default React.memo(forwardRef(({defaultData, onCheck,
                                          getCurrentDataSource, user}, ref) => {
    const isView = useContext(ViewContent);
    const reserveWord = user.reserveWord || [];
    const [baseData, setBaseData] = useState(_.pick(defaultData, ['defKey', 'defName', 'intro']));
    const [disable, setDisable] = useState(true);
    const currentPrefix = getPrefix('container-model-entity-conceptual-base');
    const _onValueChange = (e, name) => {
        const value = e.target.value;
        setBaseData((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
    };
    const validateDefKeyValue = (defKey) => {
        const result = (getCurrentDataSource().project.entities || [])
            .find(e => e.defKey?.toLocaleLowerCase() === defKey?.toLocaleLowerCase()
                && e.id !== defaultData.id);
        if(result) {
            Message.error({title: `代码${defKey}已经存在`});
            return false;
        }
        return true;
    };
    const validateKeyWordValue = (name, value) => {
        const keyWord = reserveWord
            .find(r => r.keyWord?.toLocaleLowerCase() === value?.toLocaleLowerCase());
        if(keyWord) {
            Message.error({title: `${name === 'defName' ? '显示名称' : '代码'}[${value}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
            return false;
        }
        return true;
    };
    const _setDisable = (status) => {
        if(status) {
            // 此处校验下 关键字和重复
            if(!validateDefKeyValue(baseData.defKey) || !validateKeyWordValue('defKey', baseData.defKey)
                || !validateKeyWordValue('defName', baseData.defName)) {
                return;
            }
            if(!baseData.defKey) {
                Message.error({title: '代码不能为空！'});
                return;
            }
        }
        setDisable(status);
        if(status) {
            onCheck && onCheck(baseData);
        }
    };
    useImperativeHandle(ref, () => {
        return {
            setBaseData,
        };
    }, []);
    return <div className={currentPrefix}>
      <div>
        <span className={`${currentPrefix}-item`}>
          <span>
                代码
          </span>
          <span>
            <Input
              toggleCase={!disable}
              disable={disable}
              onChange={e => _onValueChange(e, 'defKey')}
              value={baseData.defKey}
            />
          </span>
        </span>
        <span className={`${currentPrefix}-item`}>
          <span>
                显示名称
          </span>
          <span>
            <Input disable={disable} onChange={e => _onValueChange(e, 'defName')} value={baseData.defName}/>
          </span>
        </span>
        {!isView && <span className={`${currentPrefix}-opt`}>
          <Icon
            onClick={() => _setDisable(!disable)}
            type={`${disable ? 'icon-oper-edit' : 'icon-check-solid'}`}
            nsKey={conceptNsKey.U}/>
          </span>}
      </div>
      <div>
        <span className={`${currentPrefix}-item`}>
          <span>
            备注说明
          </span>
          <span>
            <Input disable={disable} onChange={e => _onValueChange(e, 'intro')} value={baseData.intro}/>
            {/*<ViewContent.Provider value={disable}>*/}
            {/*  <Textarea*/}
            {/*    style={{*/}
            {/*      resize: 'none'}}*/}
            {/*    rows={6}*/}
            {/*    onChange={e => _onValueChange(e, 'intro')}*/}
            {/*    value={baseData.intro}/>*/}
            {/*</ViewContent.Provider>*/}
          </span>
        </span>
      </div>
    </div>;
}));
