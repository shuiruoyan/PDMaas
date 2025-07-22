import React, {forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import _ from 'lodash';
import { Button, Table } from 'components';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import './style/index.less';
import {getIdAsyn} from '../../../../lib/idpool';
import {sendData} from '../../../../lib/utils';
import {COMPONENT, PROFILE, WS} from '../../../../lib/constant';
import {tree2array} from '../../../../lib/tree';
import {entityExistsKey, formatTime} from '../menu/tool';

const currentPrefix = getPrefix('container-model-tools');


export default React.memo(forwardRef(({defaultTreeData, defaultData, isRushMode,
                                          type, hasId = false, getCurrentDataSource,
                                          newHomeCover}, ref) => {
    const tempCategoryTree = tree2array(getCurrentDataSource().project.categories);
    // eslint-disable-next-line no-param-reassign
    const _defaultData = [...(defaultData || []).map((d) => {
        const findResult = [...(tempCategoryTree || [])].find(it => it?.id === d?.ctName);
        return {
            ...d,
            schemaName: findResult && findResult?.bindSchema === 1
                ? findResult.defKey : d?.schemaName,
            progress: '已就绪',
        };
    })];

    const [data, setData] = useState([..._defaultData]);
    const [start, setStart] = useState(true);
    const [time, setTime] = useState(0);
    const [finish, setFinish] = useState('运行中……');

    const tableRef = useRef();
    const dataRef = useRef([..._defaultData]);
    const tablesRef = useRef([]);
    const sendQueue = useRef([]);
    const ctIdRef = useRef('');
    const startRef = useRef(true);
    const timeIntervalRef = useRef(null);
    const sendOrderControllerRef = useRef(null);
    const currentCallBackRef = useRef();

    startRef.current = start;
    dataRef.current = [...data];

    const _sendData = () => {
        const id = Math.uuid();
        if(hasId) {
            const tempData = sendQueue.current.shift();
            setData((pre) => {
                return pre.map((p) => {
                    if(p.id === tempData.id) {
                        return {
                            ...p,
                            progress: '新建中',
                        };
                    }
                    return p;
                });
            });
            let sendCommand;
            switch (tempData.nodeType) {
                case 'categories':
                    // eslint-disable-next-line no-case-declarations
                    const arrayTree = tree2array(getCurrentDataSource().project.categories);
                    // eslint-disable-next-line no-case-declarations
                    const exists = arrayTree.find(f => f.id === tempData.parentId);
                    sendCommand = {
                        event: WS.CATEGORY.MOP_CATEGORY_CREATE,
                        payload: [{
                            data: {
                                ..._.omit(tempData, ['ctName', 'tempMark', 'order','sendId', 'progress', 'nodeType']),
                            },
                            hierarchyType: PROFILE.USER.TREE,
                            position: null,
                            to: exists ? tempData.parentId : null,
                            type: tempData.parentId ? COMPONENT.TREE.SUB : COMPONENT.TREE.PEER,
                        }],
                    };
                    break;
                case 'entities':
                    sendCommand = {
                        event: WS.ENTITY.MOP_ENTITY_CREATE,
                        payload: [{
                            type: 'sub',
                            to: tempData.ctName || 'base_flat',
                            position: '',
                            data: [{
                                ..._.omit(tempData, ['ctName', 'tempMark', 'order','sendId', 'progress', 'nodeType']),
                            }],
                            hierarchyType: tempData.ctName ? 'TREE' : 'FLAT',
                        }],
                    };
                    break;
                case 'diagrams':
                    sendCommand = {
                        event: WS.DIAGRAM.MOP_DIAGRAM_CREATE,
                        payload: [{
                            type: 'sub',
                            to: tempData.ctName || 'base_flat',
                            position: '',
                            data: [{
                                ..._.omit(tempData, ['ctName', 'tempMark', 'order','sendId', 'progress', 'nodeType']),
                            }],
                            hierarchyType: tempData.ctName ? 'TREE' : 'FLAT',
                        }],
                    };
                    break;
                default:
                    break;
            }
            if(sendCommand !== undefined) {
                sendData(sendCommand,null, currentCallBackRef.current);
            } else {
                _sendData();
            }
        } else {
            let tempSendData;
            if(sendOrderControllerRef.current === null) {
                tempSendData = sendQueue.current[0];
            } else {
                tempSendData = sendQueue.current
                    .find(f => entityExistsKey(f) === sendOrderControllerRef.current[0]);
            }
            if(tempSendData) {
                let indexesFieldsCount = 0;
                [...(tempSendData.indexes || [])].forEach((f) => {
                    indexesFieldsCount += f?.fields?.length;
                });
                getIdAsyn((tempSendData?.fields || []).length +
                    (tempSendData?.indexes || []).length + indexesFieldsCount + 1)
                    .then((ids) => {
                        if (ids && ids.length > 0) {
                            let tempData;
                            const indexesFieldsIds = ids.splice(0, indexesFieldsCount);
                            let indexesFieldsIdsIndex = 0;
                            if(sendOrderControllerRef.current === null) {
                                tempData = sendQueue.current.shift();
                            } else {
                                const tempKey = sendOrderControllerRef.current.shift();
                                tempData = tempSendData;
                                sendQueue.current = sendQueue.current
                                    .filter(f => f.id !== tempKey);
                            }
                            setData((pre) => {
                                return pre.map((p) => {
                                    if(p.id === tempData.id) {
                                        return {
                                            ...p,
                                            progress: '新建中',
                                        };
                                    }
                                    return p;
                                });
                            });
                            const tempFields =  (tempData.fields || []).map((f, i) => {
                                return {
                                    ...f,
                                    id: ids[i],
                                };
                            });
                            sendData({
                                event: WS.ENTITY.MOP_ENTITY_CREATE,
                                payload: [{
                                    type: 'sub',
                                    to: tempData.ctName || 'base_flat',
                                    position: '',
                                    data: [{
                                        ..._.omit(tempData, ['ctName', 'tempMark', 'order', 'progress','sseSended']),
                                        fields: tempFields,
                                        indexes: (tempData.indexes || []).map((i, index) => {
                                            return {
                                                ...i,
                                                fields: (i.fields || []).map((field) => {
                                                    return {
                                                        ...field,
                                                        // eslint-disable-next-line max-len
                                                        fieldId: tempFields.find(t => t.defKey === field.fieldDefKey)?.id,
                                                        // eslint-disable-next-line max-len
                                                        // eslint-disable-next-line no-plusplus,max-len
                                                        id: indexesFieldsIds[indexesFieldsIdsIndex++],
                                                    };
                                                }),
                                                id: ids[ids.length - 2 - index],
                                            };
                                        }),
                                        id: ids[ids.length - 1],
                                        type: 'P',
                                    }],
                                    hierarchyType: tempData.ctName ? 'TREE' : 'FLAT',
                                }],
                            }, null, currentCallBackRef.current);
                        } else {
                            _sendData();
                        }
                    });
            } else {
                setTimeout(() => {
                    ctIdRef.current = _sendData();
                }, 1000);
            }
        }
        return id;
    };
    const fileSendDataCallBack = (d) => {
        setTimeout(() => {
            let tempId;
            if(d.event === WS.CATEGORY.MOP_CATEGORY_CREATE) {
                tempId = d.payload[0].data.id;
            } else {
                tempId = d.payload[0].data[0][hasId ? 'id' : 'defKey'];
            }
            tableRef.current?.scroll(tempId, false);
            ctIdRef.current = '';
            setData((pre) => {
                return pre.map((p) => {
                    let flag = hasId ? p.id === tempId : p.defKey === tempId;
                    if (flag) {
                        return {
                            ...p,
                            progress: '已完成',
                        };
                    }
                    return p;
                });
            });
            tablesRef.current = tablesRef.current?.filter(t => t !== tempId);
            if (sendQueue.current.length !== 0 && startRef.current) {
                ctIdRef.current = _sendData();
            }
            if(sendQueue.current.length === 0 && tablesRef.current.length === 0) {
                clearInterval(timeIntervalRef.current);
                setFinish('运行完成');
            }
            if(d.payload[0].data[0]?.id === newHomeCover) {
                //如果当前关系图为封面图，则需要设置
                sendData({
                    event: WS.PROJECT.MOP_PROJECT_HOME_COVER_DIAGRAM,
                    payload: {
                        homeCoverDiagramId: newHomeCover,
                    },
                });
            }
        }, 100);
    };

    useEffect(() => {
        switch (type) {
            case 'file':
                tablesRef.current = _.map([..._defaultData], hasId ? 'id' : 'defKey');
                currentCallBackRef.current = fileSendDataCallBack;
                sendQueue.current = dataRef.current;
                ctIdRef.current = _sendData();
                break;
            default:
                break;
        }
        return () => {
            switch (type) {
                default:
                    break;
            }
        };
    }, []);

    useEffect(() => {
        if (start && (tablesRef.current.length !== 0 || sendQueue.current.length !== 0)) {
            timeIntervalRef.current = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (!start) {
            clearInterval(timeIntervalRef.current);
        }
        return () => clearInterval(timeIntervalRef.current);
    }, [start]);

    const defaultColumn = [
        {
            key: 'progress',
            label: '处理进度',
            component: (v) => {
                return <span
                  className={classesMerge({
                        [`${currentPrefix}-execRead-progress-danger`] : v === '出错',
                        [`${currentPrefix}-execRead-progress-success`] : v === '已完成',
                        [`${currentPrefix}-execRead-progress-exec`] : v === '新建中',
                        [`${currentPrefix}-execRead-progress-readOff`] : v === '读取完',
                        [`${currentPrefix}-cellStyle`]: true,
                    })}
                >
                  {v}
                </span>;
            },
            width: 100,
            filter: true,
        },
        {
            key: 'ctName',
            label: '分类目录',
            component: (v) => {
                return <span
                  className={`${currentPrefix}-cellStyle`}
                >{defaultTreeData[v] || v}</span>;
            },
            width: 260,
            filter: true,
        },
        {
            key: 'order',
            label: '顺序',
            component: (v) => {
                return <span
                  style={{
                    textAlign: 'right',
                  }}
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 50,
        },
        {
            key: 'schemaName',
            label: 'schema',
            component: (v) => {
                return <span
                  style={{textAlign: 'center'}}
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 260,
            filter: true,
        },
        {
            key: 'defKey',
            label: '表代码',
            component: (v) => {
                return <span
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 260,
            filter: true,
        },
        {
            key: 'defName',
            label: '表名称',
            component: (v) => {
                return <span
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 260,
            filter: true,
        },
        {
            key: 'intro',
            label: '表注释',
            component: (v) => {
                return <span
                  className={`${currentPrefix}-cellStyle`}
                >{v}</span>;
            },
            width: 200,
            filter: true,
        },
    ];

    useImperativeHandle(ref, () => {
        return {
            setData,
            sendQueue,
        };

    }, []);

    const execController = () => {
        switch (type) {
            case 'file':
                setStart((p) => {
                    if(p === true) {
                        return false;
                    }
                    if(ctIdRef.current === '' && sendQueue.current.length !== 0
                        && !isRushMode) {
                        ctIdRef.current = _sendData();
                    }
                    return true;
                });
                break;
            default:
                break;
        }
    };

    return <div className={`${currentPrefix}-execRead`}>
      <div className={`${currentPrefix}-execRead-table`}>
        <Table
          ref={tableRef}
          rowEnableSelected={false}
          columns={defaultColumn}
          data={data}
        />
      </div>
      <div className={`${currentPrefix}-execRead-count`}>
        <span>
          <span>{data.filter(t => t.progress === '已完成' || t.progress === '出错').length}</span>
          <span>已完成</span>
        </span> +
        <span>
          <span>{data.filter(t => t.progress === '读取完' || t.progress === ''
              || t.progress === '新建中' || t.progress === '已就绪'
              || t.progress === null || t.progress === undefined).length}</span>
          <span>待处理</span>
        </span> =
        <span>
          <span>{data.length}</span>
          <span>总数</span>
        </span>
        <span>
          <span>{formatTime(time)}</span>
          {
            <span>{finish}</span>
             // ? <span>运行完成</span> : <span>运行中……</span>
          }
        </span>
      </div>
      <div className={`${currentPrefix}-execRead-button`}>
        {
          finish === '运行中……' &&
          <Button type='primary' onClick={execController}>{start ? '暂停' : '继续'}</Button>
        }
      </div>
      <div className={`${currentPrefix}-execRead-bottom`}>
        <span>1.</span>{'针对项目中已存在的表您可以通过：“常用工具/物理表模型比较/与数据库比较"比较后，将差异同步至模型'}
      </div>
    </div>;
}));
