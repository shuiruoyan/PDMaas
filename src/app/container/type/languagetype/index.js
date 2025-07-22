import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button, IconTitle, openModal, Switch, Message,Tooltip , openLoading, closeLoading} from 'components';
import {getPrefix} from '../../../../lib/classes';
import DatabaseType from './DatabaseType';
import ProgramLangType from './ProgramLangType';
import './style/index.less';
import ImmersiveEditBox from './ImmersiveEditBox';

export default React.memo(({ type, dataSource, onRefresh,
                               updateUser, getCurrentUserConfig }) => {
    const languageDomRef = useRef(null);
    const immersiveBoxRef = useRef(null);
    const prefix = getPrefix('language-type');
    const switchValueFormat = { checked: 1, unchecked: 0 };
    const [dataTypes, setDataTypes] = useState([]);
    const [languageArr, setLanguageArr] = useState([]);
    const languageArrayRef = useRef(languageArr);
    languageArrayRef.current = languageArr;
    const _onLanguageItemClick = useCallback((e, btn, it) => {
        const languageDomInstance = languageDomRef.current;
        // eslint-disable-next-line max-len
        languageDomInstance && languageDomInstance._onItemClick && languageDomInstance._onItemClick(e, btn, it);
    }, []);
    //复制方言
    const handlCopyLanguage = useCallback((e, it) => {
        console.log(it,'复制');
        const globDataTypes = dataSource.profile.global.dataTypes;
        openLoading('复制中...');
        let dataType = {};
        let newglobDataTypes = [];
        globDataTypes.forEach((items) => {
            dataType[items.id] = items.dbDataType[it.defKey];
        });
        const copyItem = { ...it };
        delete copyItem.id;
        delete copyItem.orderValue;
        delete copyItem.opacity;
        console.log(copyItem,'copyItem复制');
        console.log(languageArr,'languageArr复制');
        if (languageArr.some(item => item.defKey === copyItem.defKey)) {
            let i = 1;
            // eslint-disable-next-line
            while (languageArr.some(item => item.defKey === `${copyItem.defKey}_${i}`)) {
                // eslint-disable-next-line
                    i++;
                }
            copyItem.defKey += `_${i}`;
        }
        delete copyItem.undefined;
        globDataTypes.forEach((gitems) => {
        const newGitems = { ...gitems };
        newGitems.dbDataType[copyItem.defKey] = dataType[gitems.id];
        console.log(dataType[gitems.id],'dataType[gitems.id]');
        newglobDataTypes[gitems.orderValue - 1] = newGitems;
        });
        console.log(newglobDataTypes,'复制后数据');
        languageDomRef.current.copyUpdate({...copyItem,dataType},globDataTypes).then(() => {
                Message.success({ title: '复制成功' });
                closeLoading();
            }).catch(() => {
                Message.error({ title: '复制失败' });
                closeLoading();
            });
    }, [languageArr]);
    const handleCheckChange = useCallback((status, targetObj) => {
        openLoading(status ? '开启中...' : '关闭中...');
        // 调用是否启用编程语言 / 方言的方法
        languageDomRef.current.statusUpdate({ ...targetObj, isEnabled: status ? 1 : 0})
            .then(() =>  {
                // eslint-disable-next-line max-len
                setLanguageArr(prevState => prevState.map(p => ((p.defKey === targetObj.defKey) ? ({ ...p, isEnabled: status }) : p)));
                closeLoading();
            });
    }, [languageArr]);
    const handleItemMouseOver = useCallback((e, $index) => {
        setLanguageArr(prevState => prevState.map((it, _ind) => ({
            ...it,
            opacity: $index === _ind ? 1 : 0,
        })));
    }, []);
    const handleItemMouseLeave = useCallback(() => {
        setLanguageArr(prevState => prevState.map(it => ({
            ...it,
            opacity: 0,
        })));
    }, []);
    const handleChangeLocation = useCallback((programLang, $index, location) => {
        openLoading('移动中...');
        const id = programLang.id;
        const operateArray = languageArr.map((it, _ind) => ({
            ...it,
            // eslint-disable-next-line no-nested-ternary,max-len
            orderValue: it.id === id ? (location === 'right' ? it.orderValue + 1 : it.orderValue - 1) :
                // eslint-disable-next-line no-nested-ternary
                (_ind === (location === 'right' ? $index + 1 : $index - 1) ? (location === 'right' ? it.orderValue - 1 : it.orderValue + 1) : it.orderValue),
        }));
        const step = location === 'left' ? -1 : 1;
        languageDomRef.current.locationUpdate(operateArray, id, step)
            .then(() => {
                setLanguageArr(operateArray);
                closeLoading();
            });
    }, [languageArr]);
    const LanguageArrayDom = useMemo(() => {
        const languageDomInstance = languageDomRef.current;
        return languageArr && languageArr.sort((x, y) => x.orderValue - y.orderValue)
            .map((it, ind) => <div
              key={ind}
              className={`${prefix}-item`}
              onMouseOver={e => handleItemMouseOver(e, ind)}
              onMouseLeave={e => handleItemMouseLeave(e, ind)}
              onClick={e => _onLanguageItemClick(e, null,  it)}>
              {/* eslint-disable-next-line react/no-danger */}
              <div className={`${prefix}-item-svg`} dangerouslySetInnerHTML={{__html: it.icon || languageDomInstance.defaultSvg}}/>
              <div className={`${prefix}-item-content`}>
                <Tooltip title={it.defKey || it.defName}><div className={`${prefix}-item-content-title`}>{it.defKey || it.defName}</div></Tooltip>
                {updateUser && <span onClick={e => e.stopPropagation()}>
                  {it.id ? <div className={`${prefix}-item-content-arrow`} style={{opacity: it.opacity,marginRight: '18px',display: 'flex',gap: '-3px' }}>
                    {ind !== 0 ? <IconTitle nsKey={languageDomInstance?.getNsKey()} icon="icon-arrow-left" onClick={() => handleChangeLocation(it, ind, 'left')} /> : null}
                    {ind !== languageArr.length - 1 ? <IconTitle nsKey={languageDomInstance?.getNsKey()} icon="icon-arrow-right" onClick={() => handleChangeLocation(it, ind, 'right')}/> : null}
                  </div> : null}
                  {/* eslint-disable-next-line max-len */}
                  <div style={{marginLeft: '50px'}}><Switch nsKey={languageDomInstance?.getNsKey()} valueFormat={switchValueFormat} checked={it.isEnabled} onChange={status => handleCheckChange(status, it)} />
                  </div>
                  {/* 添加复制按钮 */}
                  {/*调整div标签和上一个标签的距离 */}
                  {type === 'database' && (<div style={{marginLeft: '10px',marginTop: '3px',opacity: it.opacity,color: '#1890ff'}}><IconTitle style={{}} nsKey={languageDomInstance?.getNsKey()} onClick={(e) => { e.stopPropagation(); handlCopyLanguage(e, it); }} icon="icon-clipboard-copy"/>
                  </div>)}
                </span>}
              </div>
            </div>);
    }, [languageArr]);
    // 更新languageArr
    const doUpdateLanguageArray = useCallback(() => {
        const languageDomInstance = languageDomRef.current;
        let array = languageDomInstance.getLanguageArr() || [];
        array = array.map(it => ({ ...it, opacity: 0 }));
        setLanguageArr(array);
    }, []);
    // 当前语言的表单校验
    // eslint-disable-next-line max-len
    const validateForm = useCallback((dataObj, prevObj, { notNullArr, notRepeatArr, originalArray }) => {
        return new Promise((resolve, reject) => {
            let rejectObj = {};
            notNullArr.forEach((it) => {
                // eslint-disable-next-line max-len
                (!dataObj[it.key] || (dataObj[it.key]?.length === 0)) && (rejectObj[it.key] = (() => {
                    const array = rejectObj[it.key] || [];
                    array.push({ key: 'notNull', message: `${it.label}不能为空` });
                    return array;
                })());
            });
            notRepeatArr.forEach((it) => {
                const objItem = dataObj[it.key];
                if (objItem) {
                    let operateArray = [...(originalArray || languageArrayRef.current)];
                    // 排除掉自己
                    // eslint-disable-next-line max-len
                    if (prevObj) operateArray = operateArray.filter(o => o[it.key] !== prevObj[it.key]);
                    // eslint-disable-next-line max-len
                    const dialectItem = operateArray.find(dialect => dialect[it.key] === dataObj[it.key]);
                    dialectItem && (rejectObj[it.key] = (() => {
                        const array = rejectObj[it.key] || [];
                        array.push({ key: 'notRepeat', message: `${it.label}[${dataObj[it.key]}]名称重复` });
                        return array;
                    })());
                }
            });
            Object.keys(rejectObj).length === 0 ? resolve() : reject(rejectObj);
        });
    }, [languageArr]);
    const doImmersiveEdit = useCallback((viewObj) => {
        let modal = null;
        const closeModal = () => modal.close();
        const confirmViewData = () => {
           const viewData = immersiveBoxRef.current.getViewData();
          viewObj._onConfirmViewData(viewData);
          closeModal();
        };
        // eslint-disable-next-line max-len
        modal = openModal(<ImmersiveEditBox ref={immersiveBoxRef} readonly={!updateUser} viewObj={viewObj} baseClass={prefix} />, {
            title: '沉浸式编辑',
            fullScreen: true,
            buttons: [
              <Button onClick={closeModal}>取消</Button>,
              <Button type="primary" onClick={confirmViewData}>确定</Button>,
            ],
        });
    }, []);
    // eslint-disable-next-line max-len
    useEffect(() => doUpdateLanguageArray(), [dataSource.profile.global.dbDialects]);
    // eslint-disable-next-line max-len
    useEffect(() => doUpdateLanguageArray(),[dataSource.profile.global.programLangs]);
    useEffect(() => {
        const globDataTypes = dataSource.profile.global.dataTypes;
        console.log(globDataTypes,'gluseEffect');
        setDataTypes(globDataTypes || []);
    }, [dataSource.profile.global.dataTypes]);
    return <div className={`${prefix}`}>{(() => {
        let Com = null;
        switch (type) {
            case 'database':
            default:
                Com = DatabaseType;
                break;
            case 'program':
                Com = ProgramLangType;
                break;
        }
        // eslint-disable-next-line max-len
        return <Com ref={languageDomRef} updateUser={updateUser} getCurrentUserConfig={getCurrentUserConfig} onRefresh={onRefresh} validateForm={validateForm} baseClass={prefix} dataTypes={dataTypes} doImmersiveEdit={doImmersiveEdit} languageArrayDom={LanguageArrayDom} dataSource={dataSource} />;
    })()}</div>;
});
