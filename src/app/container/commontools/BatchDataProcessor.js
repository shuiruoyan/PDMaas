import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import { SimpleTab, Table, IconTitle, Select, NumberInput, Checkbox, Modal, Icon ,closeLoading, openLoading} from 'components';
import _ from 'lodash';
import {ENTITY, WS} from '../../../lib/constant';
import {filterBaseDataType, groupDataTypes} from '../model/menu/tool';
import {sendData} from '../../../lib/utils';

import {updateDomain} from '../../../lib/profile_data_handling';

const TableRender = React.memo(forwardRef(({ baseClass, title, defaultColumns,
                                           defaultData, onChange}, ref) => {
    const [tableData, setTableData] = useState([...(defaultData || [])]);
    const tableDataRef = useRef([]);
    tableDataRef.current = [...(tableData || [])];
    const titleMap = {
        domainUse: '业务域类型-使用情况',
        physicalUse: '数据类型-使用情况',
        baseDataTypeUse: '基本数据类型-使用情况',
    };

    const _onChange = useCallback((value, column, row) => {
        onChange && onChange(value, column, row, setTableData);
    }, []);

    useImperativeHandle(ref, () => {
        return {
            setTableData,
            getCurrentData: () => {
                return [...(tableDataRef.current || [])];
            },
        };
    }, []);

    return <div className={`${baseClass}-batchDataProcessor-tableRender`}>
      <div className={`${baseClass}-batchDataProcessor-tableRender-title`}>
        {titleMap[title]}
        {title === 'domainUse' &&
          <div><IconTitle
            icon="icon-warning-triangle"/>业务域类型在当前项目所在团队中共享，请注意影响范围，谨慎修改</div>
        }
      </div>
      <div className={`${baseClass}-batchDataProcessor-tableRender-body`}>
        <Table
          columns={defaultColumns}
          data={tableData}
          onChange={_onChange}
          rowEnableSelected={false}
        />
      </div>
    </div>;
}));

const BatchDataProcessor = React.memo(forwardRef(({
                                                      baseClass,
                                                      getCurrentDataSource,
                                                      getCurrentUserConfig,
                                                      updateUser}) => {

    const domainUseRef = useRef();
    const physicalUseRef = useRef();
    const baseDataTypeUseRef = useRef();

    const computeDBDataType = useCallback((baseDataType) => {
        const dataTypes = getCurrentDataSource().profile.global.dataTypes;
        // eslint-disable-next-line max-len
        const dataTypeItem = (dataTypes || []).find(it => it.defKey === baseDataType);
        if (dataTypeItem) {
            const dbDataTypeObj = dataTypeItem.dbDataType;
            const dbDialect = getCurrentDataSource().profile.project.dbDialect;
            return <div style={{width: '100%', textAlign: 'left', paddingLeft: 9}}>{dbDialect ? dbDataTypeObj[dbDialect] : ''}</div>;
        }
        return null;
    }, []);

    const entities = getCurrentDataSource().project.entities || [];
    const physicalEntitiesFields = _.flatMap([...(entities || [])].filter(it => it.type === ENTITY.TYPE.P), 'fields');
    const logicalEntitiesFields = _.flatMap([...(entities || [])].filter(it => it.type === ENTITY.TYPE.L), 'fields');

    const domainUseCountData = _.countBy(_.map([...(physicalEntitiesFields || [])].filter(it => it.bizDomainType), 'bizDomainType'));
    const physicalUseCountData = _.countBy(_.map([...(physicalEntitiesFields || [])], 'dbDataType'));
    const logicalUseCountData = _.countBy(_.map([...(logicalEntitiesFields || [])], 'baseDataType'));

    const bizDomainTypes = (getCurrentDataSource().profile.team.bizDomainTypes || []).map(it => ({
        ...it,
        isUpdate: false,
        usageCount: domainUseCountData[it.defKey] || 0,
    }));

    const physicalBaseDataTypes = [...(Object.keys(physicalUseCountData || {}) || [])].map((it) => {
        const dataTypes = getCurrentDataSource().profile.global.dataTypes;
        // eslint-disable-next-line max-len
        const currentDataType = [...(dataTypes || [])].find(dataType => dataType.dbDataType[getCurrentDataSource().profile.project.dbDialect] === it);
        return {
            id: Math.uuid(),
            defKey: currentDataType ? currentDataType.defKey : '',
            defName: currentDataType ? currentDataType.defName : '',
            defaultDBDataType: it === 'null' ? null : it,
            dbDataType: it === 'null' ? null : it,
            isUpdate: false,
            usageCount: physicalUseCountData[it] || 0,
        };
    });

    const physicalDBDataTypeRef = useRef(_.mapValues(_.keyBy(physicalBaseDataTypes, 'id'), 'dbDataType'));

    const logicalBaseDataTypes = [...(Object.keys(logicalUseCountData || {}) || [])].map((it) => {
        const dataTypes = getCurrentDataSource().profile.global.dataTypes;
        const currentDataType = [...(dataTypes || [])].find(dataType => dataType.defKey === it);
        return {
            id: Math.uuid(),
            baseDataType: currentDataType ? currentDataType.defKey : '',
            defaultBaseDataType: currentDataType ? currentDataType.defKey : '',
            isUpdate: false,
            usageCount: logicalUseCountData[it] || 0,
        };
    });

    const logicalBaseDataTypeRef = useRef(_.mapValues(_.keyBy(physicalBaseDataTypes, 'id'), 'baseDataType'));

    const leftStyle = {
        width: '100%',
        textAlign: 'left',
        paddingLeft: 9,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };

    const rightStyle = {
        width: '100%',
        textAlign: 'right',
        paddingRight: 5,
    };

    // eslint-disable-next-line max-len
    const groupBaseDataTypeArray = [...(groupDataTypes(getCurrentDataSource().profile.global.dataTypes) || [])];

    const domainUpdate = async (updateValue, changeFlag, row) => {
        domainUseRef.current?.setTableData((pre) => {
            return [...(pre || [])].map((it) => {
                if(row.id === it.id) {
                    if(updateValue) {
                        return {
                            ...it,
                            isUpdate: updateValue,
                            preData: {
                                ..._.omit(it, ['isUpdate', 'preData', 'id', 'usageCount', 'dbDataType']),
                            },
                        };
                    }
                    if(!changeFlag) {
                        return {
                            ...it,
                            isUpdate: updateValue,
                            ..._.omit(it.preData, ['isUpdate', 'preData', 'id', 'usageCount', 'dbDataType']),
                        };
                    }
                    return {
                        ...it,
                        isUpdate: updateValue,
                    };
                }
                return it;
            });
        });
        if(changeFlag) {
            openLoading('业务域类型批量更新中');
            const currentRow = domainUseRef.current?.getCurrentData().find(it => it.id === row.id);
            updateUser(updateDomain(getCurrentUserConfig,
                _.omit(currentRow, ['usageCount', 'dbDataType', 'isUpdate', 'preData'])).then(() => {
                sendData({
                    event: WS.USER.MOP_BATCH_UPDATE_DATATYPE,
                    ctId: Math.uuid(),
                    payload: {
                        type: WS.BATCH.DOMAIN_BATCH_UPDATE,
                        bizDomainObj: _.omit(currentRow, ['usageCount', 'dbDataType', 'isUpdate', 'preData']),
                    },
                }, null, () => {
                    closeLoading();
                });
            })).catch((err) => {
                closeLoading();
                Modal.error({
                    title: '错误',
                    message: JSON.stringify(err?.message || err),
                });
            });
        }
    };

    const _onDomainChange = (e, key, row) => {
        domainUseRef.current?.setTableData((pre) => {
            return [...(pre || [])].map(((it) => {
                if(row.id === it.id) {
                    const targetValue = ['primaryKey', 'notNull', 'autoIncrement'].includes(key) ? e.target.checked : e.target.value;
                    return {
                        ...it,
                        [key]: targetValue,
                    };
                }
                return it;
            }));
        });
    };

    const checkboxValueFormat = {
        checked: 1,
        unchecked: 0,
    };

    const domainUsageColumns = [{
        key: 'defKey',
        label: '业务域类型-代码',
        component: (v) => {
            return <span style={leftStyle}>{v}</span>;
        },
        align: 'left',
        width: 200,
    },{
        key: 'defName',
        label: '业务域类型-名称',
        component: (v) => {
            return <span style={leftStyle}>{v}</span>;
        },
        width: 200,
    },{
        key: 'baseDataType',
        label: '基本数据类型',
        component: 'Select',
        width: 260,
        options: groupBaseDataTypeArray.map((d) => {
            return {
                value: d.defKey,
                label: d.label,
                style: d.style,
                disable: d.disable,
            };
        }),
    },{
        key: 'dataLen',
        label: '长度',
        effectUpdate: () => {
            return false;
        },
        component: (value, id, name, row) => {
            return !row.isUpdate ? <span style={rightStyle}>{value}</span> : <NumberInput
              value={value}
              onChange={e => _onDomainChange(e, 'dataLen', row)}
            />;
        },
        align: 'center',
        width: 100,
    },{
        key: 'numScale',
        label: '小数位',
        effectUpdate: () => {
            return false;
        },
        component: (value, id, name, row) => {
            return !row.isUpdate ? <span style={rightStyle}>{value}</span> : <NumberInput
              value={value}
              onChange={e => _onDomainChange(e, 'numScale', row)}
            />;
        },
        align: 'center',
        width: 100,
    },  {
        key: 'primaryKey',
        width: 80,
        label: '主键',
        effectUpdate: () => {
            return false;
        },
        component: (value, id, name, row) => {
            return !row.isUpdate ? <span><Icon type={value ? 'icon-check-solid' : ''}/></span> : <Checkbox
              checked={value}
              valueFormat={checkboxValueFormat}
              onChange={e => _onDomainChange(e, 'primaryKey', row)}
            />;
        },
    },{
        key: 'notNull',
        label: '不为空',
        effectUpdate: () => {
            return false;
        },
        component: (value, id, name, row) => {
            return !row.isUpdate ? <span><Icon type={value ? 'icon-check-solid' : ''}/></span> :  <Checkbox
              checked={value}
              valueFormat={checkboxValueFormat}
              onChange={e => _onDomainChange(e, 'notNull', row)}
            />;
        },
        width: 120,
    },{
        key: 'autoIncrement',
        label: '自增',
        effectUpdate: () => {
            return false;
        },
        component: (value, id, name, row) => {
            return !row.isUpdate ? <span><Icon type={value ? 'icon-check-solid' : ''}/></span> :  <Checkbox
              checked={value}
              valueFormat={checkboxValueFormat}
              onChange={e => _onDomainChange(e, 'autoIncrement', row)}
            />;
        },
        width: 120,
    },{
        key: 'isUpdate',
        label: `${getCurrentDataSource().profile.project.dbDialect || 'MySQL'}数据类型`,
        component: (value, id, name, row) => {
            return <div className={`${baseClass}-batchDataProcessor-displayUpdate`}>
              {computeDBDataType(row.baseDataType)}
              {
                value ? <div>
                  <IconTitle icon="icon-check-solid" onClick={() => { domainUpdate(false, true, row); }}/>
                  <IconTitle icon="icon-close" onClick={() => { domainUpdate(false, false ,row); }}/>
                </div> : <div
                  className={`${baseClass}-batchDataProcessor-displayUpdate-update`}
                  onClick={() => { domainUpdate(true, false, row); }}>修改</div>
                }
            </div>;
        },
        width: 200,
    }, {
        key: 'usageCount',
        label: '被使用次数',
        component: (v) => {
            return <span style={{
                ...rightStyle,
                paddingRight: 19,
            }}>{v}</span>;
        },
    }];

    const selectCheck = useCallback((value, column, rowId, key, updateDB = false) => {
        let currentData = [];
        (key === 'physicalUse' ? physicalUseRef.current : baseDataTypeUseRef.current)?.setTableData((p) => {
            const temp = p.map((r) => {
                if(r.id === rowId) {
                    if(!updateDB){
                        key === 'physicalUse' ?
                            physicalDBDataTypeRef.current[rowId] = r.dbDataType :
                            logicalBaseDataTypeRef.current[rowId] = r.baseDataType;
                    }
                    return {
                        ...r,
                        [column] : value,
                        [key === 'physicalUse' ? 'dbDataType' : 'baseDataType']:
                            key === 'physicalUse'  ? physicalDBDataTypeRef.current[rowId] : logicalBaseDataTypeRef.current[rowId],
                    };
                }
                return r;
            });
            currentData = [...temp];
            return temp;
        });
        if(updateDB) {
            openLoading('数据批量更新中');
            const currentRow =  currentData.find(it => it.id === rowId);
            if(key === 'physicalUse') {
                if(currentRow && currentRow.defaultDBDataType !== currentRow.dbDataType) {
                    openLoading('数据批量更新中');
                    const dbDialect = getCurrentDataSource().profile.project.dbDialect;
                    const baseDataType = getCurrentDataSource().profile.global.dataTypes
                        .find(d => d.dbDataType?.[dbDialect] === currentRow.dbDataType);
                    sendData({
                        event: WS.USER.MOP_BATCH_UPDATE_DATATYPE,
                        ctId: Math.uuid(),
                        payload: {
                            type: WS.BATCH.ENTITY_P_BASE_DATATYPE_UPDATE,
                            preDBDataType: currentRow.defaultDBDataType,
                            nextBaseDataType: baseDataType?.defKey || null,
                            nextDBDataType: currentRow.dbDataType,
                        },
                    }, null, () => {
                        physicalUseRef.current?.setTableData((p) => {
                            const temp = p.map((r) => {
                                if(r.id === rowId) {
                                    return {
                                        ...r,
                                        defaultDBDataType: currentRow.dbDataType,
                                    };
                                }
                                return r;
                            });
                            currentData = [...temp];
                            return temp;
                        });
                        closeLoading();
                    }, true);
                }
            } else {
                sendData({
                    event: WS.USER.MOP_BATCH_UPDATE_DATATYPE,
                    ctId: Math.uuid(),
                    payload: {
                        type: WS.BATCH.ENTITY_L_BASE_DATATYPE_UPDATE,
                        preBaseDataType: currentRow.defaultBaseDataType,
                        nextBaseDataType: currentRow.baseDataType,
                    },
                }, null, () => {
                    baseDataTypeUseRef.current?.setTableData((p) => {
                        const temp = p.map((r) => {
                            if(r.id === rowId) {
                                return {
                                    ...r,
                                    defaultBaseDataType: currentRow.baseDataType,
                                };
                            }
                            return r;
                        });
                        currentData = [...temp];
                        return temp;
                    });
                    closeLoading();
                }, true);
            }

        }
    }, []);

    const currentFilterBaseDataTypes = filterBaseDataType(getCurrentDataSource()) || [];

    const selectChange = useCallback((e, id, key) => {
        const { value } = e.target;
        if(key === 'physicalUse') {
            physicalDBDataTypeRef.current[id] = value;
        } else {
            logicalBaseDataTypeRef.current[id] = value;
        }
    }, []);


    const physicalUseColumns = [{
        key: 'defKey',
        label: '基本数据类型-代码',
        component: (v) => {
            return <span style={leftStyle}>{v || '-'}</span>;
        },
        width: 260,
    },{
        key: 'defName',
        label: '基本数据类型-名称',
        component: (v) => {
            return <span style={leftStyle}>{v || '-'}</span>;
        },
        width: 260,
    },{
        key: 'isUpdate',
        label: `${getCurrentDataSource().profile.project.dbDialect || 'MySQL'}数据类型`,
        component: (value, id, name, row) => {
            return value ? <div className={`${baseClass}-batchDataProcessor-update`}>
              <div>
                <Select
                  valueRender={(item, v) => {
                    return (item && (item.value || item)) || v || '';
                  }}
                  onChange={e => selectChange(e, id, 'physicalUse')}
                  defaultValue={row.dbDataType}
                >
                  {
                    currentFilterBaseDataTypes.map((it) => {
                      return <Select.Option value={it.defKey} >
                        {it.defName}
                      </Select.Option>;
                    })
                  }
                </Select>
              </div>
              <div>
                <IconTitle
                  icon='icon-check-solid'
                  onClick={() => { selectCheck(false, 'isUpdate', id, 'physicalUse', true); }}
                />
                <IconTitle
                  icon='icon-close'
                  onClick={() => { selectCheck(false, 'isUpdate', id, 'physicalUse'); }}/>
              </div>
            </div> : <div className={`${baseClass}-batchDataProcessor-update`}>
              <div style={leftStyle}>{row.dbDataType || '<NULL>'}</div>
              <div>
                <span
                  onClick={() => { selectCheck(true, 'isUpdate', id, 'physicalUse'); }}
                  className={`${baseClass}-batchDataProcessor-primaryKey ${baseClass}-batchDataProcessor-displayUpdate-update`}>修改</span>
              </div>
            </div>;
        },
        width: 360,
    }, {
        key: 'usageCount',
        label: '被使用次数',
        component: (v) => {
            return <span style={rightStyle}>{v}</span>;
        },
    }];

    const baseDataTypeUseColumns = [{
        key: 'isUpdate',
        label: '基本数据类型',
        component: (value, id, name, row) => {
            return value ? <div className={`${baseClass}-batchDataProcessor-update`}>
              <div>
                <Select
                  onChange={e => selectChange(e, id, 'baseDataTypeUse')}
                  defaultValue={row.baseDataType}
                >
                  {
                    groupBaseDataTypeArray.map((it) => {
                      return <Select.Option value={it.defKey} disable={it.disable} style={it.style}>
                        {/*{`${it.defKey}-${it.defName}`}*/}
                        {it.label}
                      </Select.Option>;
                    })
                  }
                </Select>
              </div>
              <div>
                <IconTitle
                  icon='icon-check-solid'
                  onClick={() => { selectCheck(false, 'isUpdate', id, 'baseDataTypeUse', true); }}
                    />
                <IconTitle
                  icon='icon-close'
                  onClick={() => { selectCheck(false, 'isUpdate', id, 'baseDataTypeUse'); }}/>
              </div>
            </div> : <div className={`${baseClass}-batchDataProcessor-update`}>
              <div style={leftStyle}>{row.baseDataType || '-'}</div>
              <div>
                <span
                  onClick={() => { selectCheck(true, 'isUpdate', id, 'baseDataTypeUse'); }}
                  className={`${baseClass}-batchDataProcessor-primaryKey ${baseClass}-batchDataProcessor-displayUpdate-update`}>修改</span>
              </div>
            </div>;
        },
        width: '50%',
    },{
        key: 'usageCount',
        label: '被使用次数',
        component: (v) => {
            return <span style={rightStyle}>{v}</span>;
        },
    }];


    const domainUseChange = useCallback((value, column, row, setTableData) => {
        setTableData((p) => {
            return p.map((r) => {
                if(r.id === row) {
                    if(column === 'baseDataType') {
                        return {
                            ...r,
                            [column]: value,
                            dbDataType: computeDBDataType(value),
                        };
                    } else {
                        return {
                            ...r,
                            [column]: value,
                        };
                    }
                }
                return r;
            });
        });
    }, []);

    const options = [{
        key: '1',
        title: '物理模型',
        content: <div className={`${baseClass}-batchDataProcessor-phy`}>
          <TableRender
            ref={domainUseRef}
            title="domainUse"
            computeDBDataType={computeDBDataType}
            baseClass={baseClass}
            onChange={domainUseChange}
            defaultColumns={domainUsageColumns}
            defaultData={bizDomainTypes}
          />
          <TableRender
            ref={physicalUseRef}
            title="physicalUse"
            baseClass={baseClass}
            defaultColumns={physicalUseColumns}
            defaultData={physicalBaseDataTypes}
          />
        </div>,
    }, {
        key: '2',
        title: '逻辑模型',
        content: <TableRender
          title="baseDataTypeUse"
          ref={baseDataTypeUseRef}
          baseClass={baseClass}
          defaultColumns={baseDataTypeUseColumns}
          defaultData={logicalBaseDataTypes}
        />,
    }];
    return <div className={`${baseClass}-batchDataProcessor`}>
      <SimpleTab options={options}/>
      {/*<div className={`${baseClass}-batchDataProcessor-bottom`}>*/}
      {/*  <Button>关闭</Button>*/}
      {/*  <Button key='primary'>确认</Button>*/}
      {/*</div>*/}
    </div>;
}));

BatchDataProcessor.orderValue = 15;

export default BatchDataProcessor;
