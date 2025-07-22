import React, {
  forwardRef,
  useCallback,
  useRef,
  useState,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Input, NumberInput, Table, Checkbox, Form, Message } from 'components';
import _ from 'lodash';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import {WS} from '../../../../lib/constant';
import {getIdAsyn} from '../../../../lib/idpool';
import {filterRepeatKey, sendData} from '../../../../lib/utils';

export default React.memo(forwardRef(({ sourceTitle, targetTitle, defaultData,
                                        modelingNavDisplay, getCurrentDataSource,
                                        targetType, autoRename,
                                        allDefKeys = [], transformEnd}, ref) => {
  const fieldIdsMapRef = useRef([]);
  const allDefKeysRef = useRef([...allDefKeys]);
  const currentPrefix = getPrefix('container-model-left-modelTransformation');
  const projectSetting = useMemo(() => {
    return  getCurrentDataSource().profile.project.setting;
  }, [getCurrentDataSource().profile.project.setting]);
  const FormItem = Form.FormItem;
  const [tableData, setTableData] = useState([...(defaultData || []).map((it) => {
    return {
      id: it.id,
      defaultName: `${it.defKey}[${it.defName}]`,
      defKey: it.defKey,
      defaultDefKey: it.defKey,
      defName: it.defName,
      intro: it.intro,
      status: '已就绪',
      parentId: it.parentId,
    };
  })]);
  const tableDataRef = useRef([]);
  tableDataRef.current = [...tableData];
  const [isTransform, setIsTransform] = useState(false);
  const [wordSeparator, setWordSeparator] = useState('_');
  const [beginNum, setBeginNum] = useState(0);
  const [prefix, setPrefix] = useState('');
  const wordSeparatorRef = useRef('');
  wordSeparatorRef.current = wordSeparator;
  const beginNumRef = useRef(0);
  beginNumRef.current = beginNum;
  const prefixRef = useRef('');
  prefixRef.current = prefix;
  const defaultConfigRef = useRef({
    logicFieldLen: 0,
    defaultFieldsOperation: true,
  });
  const tableRef = useRef();
  const sendQueueRef = useRef([]);
  const isTransformRef = useRef(false);
  isTransformRef.current = isTransform;
  const defaultColumn = [
    {
      key: 'defaultName',
      label: sourceTitle,
      component: (v) => {
        return <span className={`${currentPrefix}-cellStyle`}>{v}</span>;
      },
      width: 350,
      resize: true,
    },
    {
      key: 'defKey',
      label: `${targetTitle  }代码`,
      component: 'Input',
      width: 225,
      resize: true,
    },
    {
      key: 'defName',
      label: `${targetTitle  }名称`,
      component: 'Input',
      width: 225,
      resize: true,
    },
    {
      key: 'status',
      label: '状态',
      component: (v) => {
        return <span className={classesMerge({
          [`${currentPrefix}-cellStyle`]: true,
          [`${currentPrefix}-status-danger`] : v === '出错',
          [`${currentPrefix}-status-success`] : v === '完成',
          [`${currentPrefix}-status-exec`] : v === '转换中',
        })}>{v}</span>;
      },
      width: 80,
    },
  ];
  const _onChange = useCallback((value, column, row) => {
   if(!isTransformRef.current) {
     setTableData((p) => {
       return p.map((r) => {
         if(r.id === row) {
           return {
             ...r,
             [column]: value,
           };
         }
         return r;
       });
     });
   }
  }, [isTransform]);

  const checkBoxChange = (e) => {
    const {checked} = e.target;
    defaultConfigRef.current.defaultFieldsOperation = checked;
  };

  const sendDataCallBack = async (d) => {
    const tempData = d.payload[0].data[0];
    const tempId = tempData.id;
    tableRef.current?.scroll(tempId);
    setTableData((pre) => {
      return pre.map((p) => {
        if (p.id === tempId) {
          return {
            ...p,
            status: '完成',
            statusType: 'success',
            fields: tempData.fields,
          };
        }
        return p;
      });
    });
    if(sendQueueRef.current.length !== 0) {
      // eslint-disable-next-line no-use-before-define
      await _sendData(targetType);
    } else {
      transformEnd && transformEnd(
          tableDataRef.current,
          fieldIdsMapRef.current,
          {
            prefix: prefixRef.current,
            beginNum: beginNumRef.current,
            wordSeparator: wordSeparatorRef.current,
          });
      if(!transformEnd) {
        Message.success({title: '转换完成'});
      }
    }
  };

  const _sendData = async (type) => {
    if(sendQueueRef.current.length === 0) {
      return;
    }
    const { entities } = getCurrentDataSource().project || [];
    const currentDefKey = sendQueueRef.current[0]?.defKey;
    if(entities.find(it => it.defKey === currentDefKey)) {
      const tempData = sendQueueRef.current.shift();
      const tempId = tempData.id;
      Message.error({title:'实体代码重复'});
      setTableData((pre) => {
        return pre.map((p) => {
          if (p.id === tempId) {
            return {
              ...p,
              status: '出错',
              statusType: 'success',
              fields: tempData.fields,
            };
          }
          return p;
        });
      });
      await _sendData(type);
      return;
    }
    const ids = await getIdAsyn((sendQueueRef.current[0]?.fields || []).length);
    if (ids.length === (sendQueueRef.current[0]?.fields || []).length) {
      const tempData = sendQueueRef.current.shift();
      console.log(tempData);
      setTableData((pre) => {
        return pre.map((p) => {
          if(p.id === tempData.id) {
            return {
              ...p,
              status: '转换中',
            };
          }
          return p;
        });
      });
      sendData({
        event: WS.ENTITY.MOP_ENTITY_CREATE,
        payload: [{
          type: 'sub',
          to: tempData.parentId === '_UNCATE' ? null : tempData.parentId,
          position: '',
          data: [{
            ...tempData,
            fields: (tempData.fields || []).map((f, i) => {
              fieldIdsMapRef.current[f.id] = ids[i];
              return {
                ...f,
                id: ids[i],
              };
            }),
            type,
          }],
          hierarchyType: modelingNavDisplay.hierarchyType,
        }],
      }, null, sendDataCallBack);
    } else {
      console.log(type);
      await _sendData(type);
    }
  };
  const transform = async () => {
    if(sourceTitle === '物理模型' && targetTitle === '逻辑模型') {
      sendQueueRef.current = [...(defaultData || [])].map((it) => {
        const tempData = tableData.find(t =>  t.id === it.id);
        if (tempData) {
          let filterData = [...(it.fields || [])];
          if(defaultConfigRef.current.defaultFieldsOperation) {
            filterData = _.differenceWith([...(it.fields || [])],
                [...(projectSetting.physicEntityPresetFields || [])],
                (item1, item2) => item1.defKey.toLowerCase() === item2.defKey.toLowerCase());
          }
          if(defaultConfigRef.current.logicFieldLen > 0) {
            filterData = filterData.slice(0, defaultConfigRef.current.logicFieldLen);
          }
          return {
            ...it,
            schemaName: null,
            indexes: [],
            fields: filterData,
            defKey: tempData.defKey,
            defName: tempData.defName,
          };
        }
        return {
          ...it,
          schemaName: null,
          indexes: [],
        };
      });
    } else if(targetTitle === '概念模型' || sourceTitle === '概念模型') {
      sendQueueRef.current = [...(tableData || [])].map((it) => {
        if(defaultConfigRef.current.defaultFieldsOperation) {
          return {
            id: it.id,
            parentId: it.parentId,
            schemaName: null,
            fields: [...(projectSetting.physicEntityPresetFields || [])],
            defKey: it.defKey,
            defName: it.defName,
            intro: it.intro,
          };
        }
        return {
          id: it.id,
          defKey: it.defKey,
          parentId: it.parentId,
          schemaName: null,
          defName: it.defName,
          intro: it.intro,
        };
      });
    } else if(sourceTitle === '逻辑模型' && targetTitle === '物理模型') {
      sendQueueRef.current = [...(defaultData || [])].map((it) => {
        const tempData = tableData.find(t =>  t.id === it.id);
        if (tempData) {
          let filterData = [...(it.fields || [])];
          if(defaultConfigRef.current.defaultFieldsOperation) {
            filterData = filterData.concat(
                [...(projectSetting.physicEntityPresetFields || [])].filter(f =>
                  !filterData.find(d => d.defKey === f.defKey),
                ),
            );
          }
          return {
            ...it,
            schemaName: null,
            indexes: [],
            fields: filterData.map((f) => {
              if(!f.dbDataType) {
                const dbDialect = getCurrentDataSource().profile.project.dbDialect;
                const baseDataType = getCurrentDataSource().profile.global.dataTypes
                    .find(d => d.defKey === f.baseDataType);
                console.log('f');
                return  {
                  ...f,
                  dbDataType: baseDataType?.dbDataType[dbDialect] || '',
                };
              }
              return f;
            }),
            defKey: tempData.defKey,
            defName: tempData.defName,
          };
        }
        return {
          ...it,
          schemaName: null,
          indexes: [],
        };
      });
    }
    if(autoRename) {
      sendQueueRef.current = sendQueueRef.current.map((d) => {
        const defKey = filterRepeatKey(allDefKeysRef.current, d.defKey);
        allDefKeysRef.current.push({defKey});
        // 自动重命名
        return {
          ...d,
          defKey,
        };
      });
      setTableData((pre) => {
        return pre.map((p) => {
          const queue = sendQueueRef.current.find(d => d.id === p.id);
          if(queue?.defKey !== p.defKey) {
            return {
              ...p,
              defKey: queue?.defKey,
            };
          }
          return p;
        });
      });
    }
    if(sendQueueRef.current.length > 0) {
      await _sendData(targetType);
    }
  };
  useImperativeHandle(ref, () => {
    return {
      beginTransform: async () => {
        if(prefix.trim() === '') {
          Message.error({title: '前缀不能为空'});
          return;
        }
        if(!isTransformRef.current) {
          setIsTransform(true);
          await transform();
        } else if (isTransformRef.current && sendQueueRef.current.length > 0) {
          Message.warring({title: '正在转换，请稍后...'});
        } else if(isTransformRef.current && sendQueueRef.current.length === 0) {
          Message.warring({title: '转换已完成！'});
        }
      },
      getConfig: () => {
        return  {
          prefix: prefixRef.current,
          beginNum: beginNumRef.current,
          wordSeparator: wordSeparatorRef.current,
        };
      },
    };
  });

  const inputChange = (e, key) => {
    const value = e.target.value;
    switch (key) {
      case 'wordSeparator':
        setWordSeparator(() => {
          setTableData((p) => {
            return p.map((r) => {
              if(value.trim() === '') {
                return {
                  ...r,
                  defKey: `${prefix}${r.defaultDefKey}`,
                };
              }
              const splitData = r.defaultDefKey.split(value);
              let tempDefKey = r.defaultDefKey;
              if(prefix.trim() !== '') {
                if (beginNum === '' || beginNum === 0 || beginNum > splitData.length) {
                  tempDefKey = `${prefix}${r.defaultDefKey}`;
                } else {
                  splitData[beginNum - 1] = prefix;
                  tempDefKey = splitData.join(value);
                }
              }
              return {
                ...r,
                defKey: tempDefKey,
              };
            });
          });
          return value;
        });
        break;
      case 'beginNum':
        setBeginNum(() => {
          setTableData((p) => {
            return p.map((r) => {
              if(wordSeparator.trim() === '') {
                return {
                  ...r,
                  defKey: `${prefix}${r.defaultDefKey}`,
                };
              }
              const splitData = r.defaultDefKey.split(wordSeparator);
              let tempDefKey = r.defaultDefKey;
              if(prefix.trim() !== '') {
                if (value === '' || value === 0 || value > splitData.length) {
                  tempDefKey = `${prefix}${r.defaultDefKey}`;
                } else {
                  splitData[value - 1] = prefix;
                  tempDefKey = splitData.join(wordSeparator);
                }
              }
              return {
                ...r,
                defKey: tempDefKey,
              };
           });
         });
         return value;
        });
        break;
      case 'prefix':
        if(value === '' ||  /^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#\u4e00-\u9fff]*$/.test(value)) {
          setPrefix(() => {
          setTableData((p) => {
            return p.map((r) => {
              if(wordSeparator.trim() === '') {
                return {
                  ...r,
                  defKey: `${value}${r.defaultDefKey}`,
                };
              }
              const splitData = r.defaultDefKey.split(wordSeparator);
              let tempDefKey = r.defaultDefKey;
              if(value.trim() !== '') {
                if (beginNum === '' || beginNum === 0 || beginNum > splitData.length) {
                  tempDefKey = `${value}${r.defaultDefKey}`;
                } else {
                  splitData[beginNum - 1] = value;
                  tempDefKey = splitData.join(wordSeparator);
                }
              }
              return {
                ...r,
                defKey: tempDefKey,
              };
            });
          });
          return value;
        });
        } else {
          Message.error({title: '必须以字母，下划线，$,#，中文开头，可包含数字、字母，下划线，$,#，中文'});
        }
        break;
      case 'logicFieldLen':
        defaultConfigRef.current.logicFieldLen = value;
        break;
      default:
        break;
    }
  };
  return <div className={`${currentPrefix}`}>
    <div className={`${currentPrefix}-header`}>
      <Form labelWidth={90}>
        <FormItem label="单词分隔符" key="wordSeparator" cols={1}>
          <span className={`${currentPrefix}-header-cell`}>
            <Input
              disable={isTransform}
              maxLength={5}
              value={wordSeparator}
              onChange={(e) => {
                inputChange(e, 'wordSeparator');
              }}
            />
          </span>
        </FormItem>
        <FormItem label="第几段开始" key="beginNum" cols={1}>
          <span className={`${currentPrefix}-header-cell`}>
            <NumberInput
              disable={isTransform}
              value={beginNum}
              min={0}
              onChange={(e) => {
                inputChange(e, 'beginNum');
              }}
            />
          </span>
        </FormItem>
        <FormItem label="转换后统一前缀" key="prefix" cols={1}>
          <span className={`${currentPrefix}-header-cell`}>
            <Input
              disable={isTransform}
              maxLength={10}
              value={prefix}
              onChange={(e) => {
                inputChange(e, 'prefix');
              }}
            />
          </span>
        </FormItem>
      </Form>
    </div>
    <div className={`${currentPrefix}-body`}>
      <Table
        ref={tableRef}
        rowEnableSelected={false}
        onChange={_onChange}
        columns={defaultColumn}
        data={tableData}
      />
    </div>
    <div className={`${currentPrefix}-footer`}>
      <span>
        {
          sourceTitle === '物理模型' && targetTitle === '逻辑模型' &&
          <>
            <Checkbox
              disable={isTransform}
              defaultChecked={defaultConfigRef.current.defaultFieldsOperation}
              onChange={(e) => { checkBoxChange(e); }}
            />
            <span style={{ marginLeft: 10}}>清除预设字段</span>
          </>
        }
        {
          targetTitle === '物理模型' &&
          <>
            <Checkbox
              disable={isTransform}
              defaultChecked={defaultConfigRef.current.defaultFieldsOperation}
              onChange={(e) => { checkBoxChange(e); }}
            />
            <span style={{ marginLeft: 10}}>添加预设字段</span>
          </>
        }
      </span>
      <span>
        {
          sourceTitle === '物理模型' && targetTitle === '逻辑模型' &&
          <span>
            <span>逻辑模型字段数上线：</span>
            <span className={`${currentPrefix}-footer-cell`}>
              <NumberInput
                disable={isTransform}
                value={defaultConfigRef.current.logicFieldLen}
                onChange={e => inputChange(e, 'logicFieldLen')}
              /></span>
            <span>(0表示不限制)</span>
          </span>
        }
      </span>
    </div>
  </div>;
}));
