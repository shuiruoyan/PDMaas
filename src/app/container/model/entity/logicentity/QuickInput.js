import React, { useContext, useState} from 'react';
import { Textarea, Icon, Message, Modal } from 'components';
import _ from 'lodash';
import { getPrefix } from '../../../../../lib/classes';
import {getId} from '../../../../../lib/idpool';
import {getEmptyField} from '../../../../../lib/utils';
import {logicNsKey} from '../../../../../lib/permission';
import {ViewContent} from '../../../../../lib/context';


export default React.memo(({ contentRef, onBaseChange,
                                          baseRef, onFieldsAdd, onFieldsDelete,
                                          defaultData, currentDataRef, user}) => {
    const isView = useContext(ViewContent);
    const reserveWord = user.reserveWord || [];
    const currentPrefix = getPrefix('container-model-entity-logic-quickinput');
    const resultString = `${defaultData.defName || defaultData.defKey}(${_.join(
        _.map((defaultData.fields || []), 'defName'), ',')})`;
    const [quickInputVal, setQuickInputVal] = useState(resultString);
    const changeValue = (e) => {
        const targetValue = e.target.value;
        setQuickInputVal(targetValue);
    };
    const analyzeStrToEntity = () => {
        const result = quickInputVal.replace(/\s/g, '')
            .replace(/[；;]/g, ',')
            .replaceAll('，', ',')
            .replaceAll('）', ')')
            .replaceAll('（', '(');
        if (result.match(/(?<=\().*(?=\))/)) {
            const entityDefName = result.split('(')[0];
            let tmpDefNames = _.compact(_.uniq(result.match(/(?<=\().*(?=\))/)[0]?.split(',') || []));
            let ids = [];
            if(tmpDefNames.length > 0) {
                ids = getId(tmpDefNames.length);
            }
            if(tmpDefNames.length > 0 && ids.length  !== tmpDefNames.length) {
                Message.warring({title: '操作太快了'});
            } else {
                const tmpFieldsArr = tmpDefNames.map((t, index) => ({
                    ...getEmptyField(),
                    id: ids[index],
                    defName: t,
                    defKey: `column_${index}`,
                }));
                const keyWordFields = tmpFieldsArr
                    .map((f) => {
                        const word = reserveWord.find(r => r.keyWord?.toLocaleLowerCase()
                            === f.defName?.toLocaleLowerCase());
                        if(word) {
                            return {
                                field: f,
                                word,
                            };
                        }
                        return null;
                    }).filter(f => !!f);
                const keyWordBase = reserveWord
                    .find(r => r.keyWord?.toLocaleLowerCase()
                        === entityDefName?.toLocaleLowerCase());
                if(keyWordFields.length > 0) {
                    Message.error({title: `字段名称[${[...new Set(keyWordFields.map(f => f.field.defName))].join('/')}]与数据库关键字:${[...new Set(keyWordFields.map(f => f.word.keyWord))].join('/')}(${[...new Set(keyWordFields.map(f => f.word.intro))].join('/')})冲突，请重新命名`});
                    return;
                }
                if(keyWordBase) {
                    Message.error({title: `显示名称[${entityDefName}]与数据库关键字:${keyWordBase.keyWord}(${keyWordBase.intro})冲突，请重新命名`});
                    return;
                }
                Modal.confirm({
                    title: '删除',
                    okText: '确认',
                    cancelText: '取消',
                    message: '该操作将会清空当前实体的所有字段，并不可撤回，是否继续？',
                    onOk: () => {
                        if(currentDataRef.current.defName !== entityDefName) {
                            onBaseChange({defName: entityDefName});
                        }
                        baseRef.current.setBaseData((pre) => {
                            return {
                                ...pre,
                                defName: entityDefName,
                            };
                        });
                        contentRef.current.setFields(tmpFieldsArr);
                        contentRef.current.resetOpt();
                        if(contentRef.current.getFields().length > 0) {
                            onFieldsDelete && onFieldsDelete(contentRef.current.getFields());
                        }
                        if(tmpFieldsArr.length > 0) {
                            onFieldsAdd && onFieldsAdd([{
                                step: 0,
                                data: tmpFieldsArr,
                            }]);
                        }
                    },
                });
                // setFieldsData({ fields: tmpFieldsArr });

            }
        }
    };
    const onOk = () => {
        analyzeStrToEntity();
    };
    return <div className={currentPrefix}>
      <span>快速录入</span>
      <span>
        <Textarea
          style={{
            resize: 'none',
          }}
          value={quickInputVal}
          onChange={e => changeValue(e)}
          placeholder="例如：学生(姓名，性别，年龄，身高，体重)" />
        {!isView && <Icon
          type='icon-check-solid'
          onClick={onOk}
          nsKey={logicNsKey.U}
          />}
      </span>
    </div>;
});
