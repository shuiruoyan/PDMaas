import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, closeLoading, IconTitle, Message, Modal, openDrawer, openLoading, Table} from 'components';
import {getPrefix} from '../../../../lib/classes';
import './style/index.less';
import AddOrEditBizDomain from './AddOrEditBizDomain';
import {LOADING, NORMAL} from '../../../../lib/constant';
import {moveArrayPositionByArray} from '../../../../lib/array';
import {bizdatatyeNskey} from '../../../../lib/permission';
import {downloadString, upload} from '../../../../lib/rest';
import {exportBizDomainTypes, importBizDomainTypes} from '../../../../lib/utils';
// eslint-disable-next-line import/order
import _ from 'lodash';
import {
    batchAddDomain,
    copyDomain,
    createDomain,
    deleteDomain,
    dragDomain,
    updateDomain,
} from '../../../../lib/profile_data_handling';

export default React.memo(({dataSource, ...restProps}) => {
    const {updateUser, getCurrentUserConfig} = restProps;
    const domainDrawerRef = useRef();
    const prefix = getPrefix('biz-domain');
    // eslint-disable-next-line max-len
    const [bizDomainTypes, setBizDomainTypes] = useState(dataSource.profile.team.bizDomainTypes || []);
    const configOften = (data) => {
        const temp = [...data];
        const oftenData = [];
        const filterData = temp.filter((it) => {
            if(it.often) {
                oftenData.push(it);
            }
            return !it.often;
        });
        return [...oftenData, ...filterData];
    };

    const columnsFilter = (key) => {
        if(key === 'dbDataType') {
            return dataSource.profile.project.dbDialect;
        }

        if(key === 'operate') {
            return updateUser;
        }

        return true;
    };

    const columns = [
        {
            key: 'defKey',
            width: 200,
            fixed: 'L',
            label: '业务域类型代码',
            component: (value, id, name, row) => {
                return <div
                  style={{width: '100%'}}
                  className={`${prefix}-font-primary`}
                    // eslint-disable-next-line no-use-before-define
                  onClick={() => addOrEditBizDomain(row, bizdatatyeNskey.U)}>{value}</div>;
            },
        },
        {
            key: 'defName',
            width: 200,
            fixed: 'L',
            label: '业务域类型名称',
            component: value => <div style={{width: '100%'}}>{value}</div>,
        },
        {
            key: 'baseDataType',
            width: 200,
            label: '基本数据类型',
            component: (value, id, name, row) => {
                const dataTypes = dataSource.profile.global.dataTypes;
                // eslint-disable-next-line max-len
                const dataTypeItem = dataTypes ? dataTypes.find(it => it.defKey === row.baseDataType) : null;
                return <div style={{width: '100%'}}>{`${dataTypeItem ? `${row.baseDataType}-${dataTypeItem.defName}` : row.baseDataType}`}</div>;
            },
        },
        {
            key: 'dbDataType',
            width: 200,
            label: `${dataSource.profile.project.dbDialect || 'MySQL'}数据类型`,
            component: (value, id, name, row) => {
                const dataTypes = dataSource.profile.global.dataTypes;
                // eslint-disable-next-line max-len
                const dataTypeItem = (dataTypes || []).find(it => it.defKey === row.baseDataType);
                if (dataTypeItem) {
                    const dbDataTypeObj = dataTypeItem.dbDataType;
                    const dbDialect = dataSource.profile.project.dbDialect;
                    return <div style={{width: '100%'}}>{dbDialect ? dbDataTypeObj[dbDialect] : ''}</div>;
                }
                return null;
            },
        },
        {
            key: 'dataLen',
            width: 80,
            label: '长度',
            component: value => <div style={{width: '100%'}}>{value}</div>,
        },
        {
            key: 'numScale',
            width: 80,
            label: '小数点',
            component: value => <div style={{width: '100%'}}>{value}</div>,
        },
        {
            key: 'primaryKey',
            width: 80,
            label: '主键',
            component: value => (value ? <IconTitle icon="icon-check-solid"/> : null),
        },
        {
            key: 'notNull',
            width: 80,
            label: '不为空',
            component: value => (value ? <IconTitle icon="icon-check-solid"/> : null),
        },
        {
            key: 'autoIncrement',
            width: 80,
            label: '自增',
            component: value => (value ? <IconTitle icon="icon-check-solid"/> : null),
        },
        {key: 'intro', width: 200, widthFit: true, label: '业务域类型-备注说明', component: value => <div style={{ width: '100%' }}>{value}</div>},
        {
            key: 'operate',
            width: 120,
            label: '操作',
            component: (value, id, name, row) => (() => {
                // eslint-disable-next-line no-shadow
                const array = bizDomainTypes || [];
                const rowIndex = array.findIndex(it => it.id === row.id);
                const length = array.length;
                return <React.Fragment>
                  {/* eslint-disable-next-line no-use-before-define */}
                  <IconTitle icon="icon-arrow-up" onClick={() => changeLocation(row, 'up')} nsKey={bizdatatyeNskey.R} disable={rowIndex === 0} />
                  {/* eslint-disable-next-line no-use-before-define */}
                  <IconTitle icon="icon-arrow-down" onClick={() => changeLocation(row, 'down')} nsKey={bizdatatyeNskey.R} disable={rowIndex === length - 1} />
                  {/* eslint-disable-next-line no-use-before-define */}
                  <IconTitle icon="icon-clipboard-copy" onClick={() => copyBizType(row)} nsKey={bizdatatyeNskey.D} />
                  {/* eslint-disable-next-line no-use-before-define */}
                  <IconTitle onClick={() => deleteBizType(row)} icon="icon-oper-delete" nsKey={bizdatatyeNskey.D} />
                </React.Fragment>;
            })(),
            fixed: 'R',
        },
    ].filter(it => columnsFilter(it.key));

    const changeLocation = useCallback((row, direction) => {
        openLoading('移动中...');
        const id = row.id;
        const tempFields = moveArrayPositionByArray(bizDomainTypes,
            [id],
            direction === 'up' ? -1 : 1, 'id');
        let targetArray = tempFields || [];
        const rowOrderValue = row.orderValue;
        targetArray = targetArray.map(it => ({
            ...it,
            orderValue: (() => {
                if (it.orderValue === rowOrderValue) {
                    return direction === 'up' ? rowOrderValue - 1 : rowOrderValue + 1;
                }
                if (it.orderValue === rowOrderValue - 1 && direction === 'up') {
                    return it.orderValue + 1;
                }
                if (it.orderValue === rowOrderValue + 1 && direction === 'down') {
                    return it.orderValue - 1;
                }
                return it.orderValue;
            })(),
        }));
        updateUser(dragDomain(getCurrentUserConfig,
            { domainArray: tempFields || [], id, step: direction === 'up' ? 1 : -1}))
            .then(() => {
                setBizDomainTypes(configOften(targetArray));
                closeLoading();
            });
    }, [bizDomainTypes]);
    const confirmAddOrUpdate = (domainObj, e, btn, drawer) => {
        btn.updateStatus(LOADING);
        const prevObj = domainDrawerRef.current?.getPrevObj();
        const bizDomainObj = domainDrawerRef.current?.getBizDomainObj();
        const notRepeatArr = [{key: 'defKey', label: '业务类型代码'}];
        const notNullArr = [
            {key: 'defKey', label: '业务类型代码'},
            {key: 'defName', label: '业务类型名称'},
            {key: 'baseDataType', label: '基础数据类型'},
        ];
        // eslint-disable-next-line no-use-before-define,max-len
        validateForm(bizDomainObj, prevObj, { notNullArr, notRepeatArr }).then(() => {
            if (domainObj) {
                updateUser(updateDomain(getCurrentUserConfig, bizDomainObj)).then(() => {
                    drawer ? drawer.close() : domainDrawerRef.current?.resetBizDomainObj();
                });
            } else {
                updateUser(createDomain(getCurrentUserConfig, bizDomainObj)).then(() => {
                    if(drawer) {
                        drawer.close();
                    } else {
                        btn.updateStatus(NORMAL);
                        domainDrawerRef.current?.resetBizDomainObj();
                    }

                });
            }
        }).catch((error) => {
            btn.updateStatus(NORMAL);
            let displayTitle = '';
            let notNullArray = [];
            let notRepeatArray = [];
            error && Object.keys(error).forEach((it) => {
                const array = error[it];
                notNullArray.push(array.find(p => p.key === 'notNull'));
                notRepeatArray.push(array.find(p => p.key === 'notRepeat'));
            });
            notNullArray.forEach((it) => {
                displayTitle += `<div>${it ? it.message : ''}</div>`;
            });
            notRepeatArray.forEach((it) => {
                displayTitle += `<div>${it ? it.message : ''}</div>`;
            });
            Modal.error({
                title: '错误',
                // eslint-disable-next-line react/no-danger
                message: <div dangerouslySetInnerHTML={{__html: displayTitle}} />,
            });
        });
    };

    const addOrEditBizDomain = (domainObj, nsKey) => {
        let drawer;
        const buttons = updateUser ? [
          <Button key='oCancel' onClick={() => drawer.close()}>取消</Button>,
          <Button
            nsKey={nsKey}
            key='onOk'
            type="primary"
            onClick={(e, btn) => confirmAddOrUpdate(domainObj, e, btn, drawer)}>确定</Button>,
        ] : [];
        if(!domainObj) {
            buttons.splice(1, 0, <Button
              nsKey={nsKey}
              key='saveAndContinue'
              type='primary'
              onClick={(e, btn) => confirmAddOrUpdate(domainObj, e, btn)}
            >保存并新增下一条</Button>);
        }
        // eslint-disable-next-line max-len,no-use-before-define
        drawer = openDrawer(<AddOrEditBizDomain readonly={!updateUser} validateForm={validateForm} ref={domainDrawerRef} dataSource={dataSource} domainObj={domainObj} baseClass={prefix} />, {
            title: `${domainObj ? '编辑' : '新增'}业务域类型`,
            placement: 'right',
            width: '35%',
            buttons: buttons,
        });
    };
    // 复制业务域类型
    const copyBizType = useCallback((row) => {
        openLoading('复制中...');
        let startOrderValue = 0;
        const currentDefKey = row.defKey;
        let copiedDomainType = { ...(row || {}) };
        let tmpOperateDomainTypes = [...(bizDomainTypes || [])];
        // eslint-disable-next-line max-len
        const filterBizDomainTypes = (tmpOperateDomainTypes || []).filter(it => it.defKey.startsWith(currentDefKey));
        if (filterBizDomainTypes && filterBizDomainTypes.length > 1) {
            const lastFilterDomainType = filterBizDomainTypes[filterBizDomainTypes.length - 1];
            const lastDataTypeDefKey = (lastFilterDomainType || {}).defKey || '';
            const leftBracketIndex = lastDataTypeDefKey.lastIndexOf('(');
            const rightBracketIndex = lastDataTypeDefKey.lastIndexOf(')');
            if (leftBracketIndex !== -1 && rightBracketIndex !== -1) {
                // eslint-disable-next-line max-len
                const copiedNum = parseInt(lastDataTypeDefKey.substring(leftBracketIndex + 1, rightBracketIndex), 10);
                const lastDataTypeDefKeyPrefix = lastDataTypeDefKey.substring(0, leftBracketIndex);
                copiedDomainType.defKey = `${lastDataTypeDefKeyPrefix}(${copiedNum + 1})`;
            }
            startOrderValue = lastFilterDomainType.orderValue + 1;
            copiedDomainType.orderValue = startOrderValue;
        } else {
            const currentDomainType = filterBizDomainTypes[0];
            copiedDomainType.defKey = `${currentDomainType.defKey}(1)`;
            startOrderValue = currentDomainType.orderValue + 1;
            copiedDomainType.orderValue = startOrderValue;
        }
        // eslint-disable-next-line max-len
        tmpOperateDomainTypes = tmpOperateDomainTypes.map((it => (it.orderValue >= startOrderValue ? ({
            ...it,
            orderValue: it.orderValue + 1,
        }) : it)));
        copiedDomainType.id = Math.uuid();
        tmpOperateDomainTypes.push(copiedDomainType);
        tmpOperateDomainTypes.sort((x, y) => x.orderValue - y.orderValue);
        setBizDomainTypes(configOften(tmpOperateDomainTypes));
        // 进行请求更新数据
        updateUser(copyDomain(getCurrentUserConfig, { ...(row || {}) }))
            .then(() => {
                closeLoading();
            });
    }, [bizDomainTypes]);
    // 删除业务域类型
    const deleteBizType = (row) => {
        Modal.confirm({
            title: '警告',
            message: `确定删除${row.defKey}业务域吗`,
            okText: '确定',
            cancelText: '取消',
            onOk: (e, btn) => {
                btn.updateStatus(LOADING);
                return updateUser(deleteDomain(getCurrentUserConfig, row));
            },
        });
    };
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
                    let operateArray = [...(originalArray || bizDomainTypes)];
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
    }, [bizDomainTypes]);
    useEffect(() => {
        const bizDomainTypeList = dataSource.profile.team.bizDomainTypes || [];
        bizDomainTypeList.sort((x, y) => x.orderValue - y.orderValue);
        setBizDomainTypes(configOften(bizDomainTypeList));
    }, [dataSource.profile.team.bizDomainTypes]);
    const exportSetup = (btn) => {
        const current = dataSource.profile?.team?.bizDomainTypes || [];
        if(current.length <= 0) {
            Modal.error({
                title: '错误',
                message: '导出失败，检测到当前项目中不存在业务域类型。',
            });
            return;
        }
        btn.updateStatus(LOADING);
        exportBizDomainTypes(dataSource).then((res) => {
            downloadString(res, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '业务域类型');
            Message.success({title: '导出成功'});
            btn.updateStatus(NORMAL);
        });
    };
    const importSetup = () => {
        upload('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', (file) => {
            importBizDomainTypes(file).then((domainList) => {
                const keys = _.map(bizDomainTypes, 'defKey');
                const filterDomainList = domainList.filter(d => !keys.includes(d.defKey));
                console.log(filterDomainList);
                if(filterDomainList.length !== 0) {
                    updateUser(batchAddDomain(getCurrentUserConfig, filterDomainList.map((f) => {
                        return {
                            ...f,
                        };
                    }))).then(() => {
                        Message.success({title: `成功导入${filterDomainList.length}条数据，
                            重复${domainList.length - filterDomainList.length}条数据`});
                    }).catch((err) => {
                        Message.error({title: JSON.stringify(err)});
                    });
                } else {
                    Message.success({title: `成功导入${filterDomainList.length}条数据，
                    重复${domainList.length - filterDomainList.length}条数据`});
                }
            });
        }, () => true, false);
    };
    return <div className={prefix}>
      {
        updateUser && <div className={`${prefix}-header`}>
          <span>
            <Button type="primary" onClick={() => addOrEditBizDomain(null, bizdatatyeNskey.C)} nsKey={bizdatatyeNskey.C}>添加业务域类型</Button>
            <Button type="primary" nsKey={bizdatatyeNskey.C} onClick={importSetup}>导入</Button>
            <Button type="primary" onClick={(e, btn) => exportSetup(btn)}>导出</Button>
          </span>
          <span />
        </div>
      }
      <div className={`${prefix}-table`}>
        {/* eslint-disable-next-line max-len */}
        <Table columns={columns} data={bizDomainTypes} />
      </div>
    </div>;
});
