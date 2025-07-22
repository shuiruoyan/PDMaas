import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {IconTitle, Input, Select, Table} from 'components';
import _ from 'lodash';
import {editOrChoseDatasource, selectFrameOptions} from './index';

export default React.memo(({ baseClass, dataList, ...restProps }) => {
    const { setCommandObj, setTabs, currentTab, headerDataList, defaultSetting } = restProps;
    const [tableData, setTableData] = useState(dataList);
    const tableDataRef = useRef(null);
    tableDataRef.current = tableData;
    const columns = [
        {
            key: 'defKey',
            label: '属性代码',
            component: (v) => {
                return <span
                  style={{
                        width: '100%',
                  }}
                >{v}</span>;
            },
            width: 100,
            fixed: 'L',
        },
        { key: 'title', label: '属性标题', component: 'Input', width: 200 },
        {
            key: 'editType',
            label: '内容编辑形式',
            component: 'Select',
            width: 200,
            options: selectFrameOptions,
        },
        {
            key: 'optionsData',
            label: '数据源',
            width: 400,
            effectUpdate: (pre, next) => {
                return pre.row.editType === next.row.editType;
            },
            component: (value, id, name, row, onChange, resize, readOnly, tempProps) => (() => {
                return <React.Fragment key={id}>
                  {/* eslint-disable-next-line no-use-before-define */}
                  <Input
                    {...tempProps}
                    style={{marginRight: '6px'}}
                    defaultValue={row.optionsData}
                    // eslint-disable-next-line no-use-before-define
                    onChange={e => handleDatasourceChange(e, id)}/>
                  {/* eslint-disable-next-line no-use-before-define */}
                  <IconTitle
                    icon="icon-oper-edit"
                    onClick={() => editOrChoseDatasource(id, {
                            row,
                            setTableData,
                            baseClass,
                        })}/>
                </React.Fragment>;
            })(),
        },
        {
            key: 'preview',
            label: '效果预览',
            width: 300,
            effectUpdate: (pre, next) => {
                return (pre.row.editType === next.row.editType) &&
                    (pre.row.enable === next.row.enable) &&
                    (pre.row.optionsData === next.row.optionsData);
            },
            component: (value, id, name, row) => {
                let options = [];
                const optionsData = row.optionsData;
                try {
                    options = JSON.parse(optionsData);
                } catch (error) {
                    options = [];
                }
                return row.enable ? <div style={{ width: '100%' }}>
                  {(() => {
                        const frameItem = selectFrameOptions.find(it => it.value === row.editType);
                        const Com = frameItem?.component || Input;
                        // eslint-disable-next-line max-len
                        return <Com options={options || []} fieldNames={{ defKey: 'value', defName: 'label' }}>{
                            Array.isArray(options) ? options.map((it, _ind) => {
                                // eslint-disable-next-line max-len
                                return <Select.Option key={_ind} value={it.value}>{it.label}</Select.Option>;
                            }) : <></>
                        }</Com>;
                    })()}
                </div> : null;
            },
        },
    ];
    const handleDatasourceChange = (e, id) => {
        e.persist();
        const inputValue = e.target?.value;
        setTableData(prevState => prevState.map((it) => {
            if (it.id === id) {
                return {
                    ...it,
                    optionsData: inputValue,
                };
            }
            return it;
        }));
        setTabs(prevState => prevState.map((it) => {
            if (it.id === currentTab.id) {
                return {
                    ...it,
                    dataList: tableDataRef.current,
                };
            }
            return it;
        }));
    };
    const _onChange = useCallback((value, column, row) => {
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
    }, []);
    const dataObj = useMemo(() => {
        let resultObj = {};
        tableData.forEach((it) => {
            resultObj[it.defKey] = _.omit(it, 'defKey', 'id', 'preview');
        });
        return resultObj;
    }, [tableData]);
    useEffect(() => {
        setCommandObj(prevState => ({ ...prevState, [currentTab.id]: dataObj }));
    }, [tableData]);
    useEffect(() => {
        setTableData(prevState => prevState.map((it) => {
            const dataItem = headerDataList.find(o => o.defKey === it.defKey);
            if (dataItem) {
                return {
                    ...it,
                    enable: dataItem.enable,
                    orderValue: dataItem.orderValue,
                    columnWidth: dataItem.columnWidth,
                };
            }
            return it;
        }));
    }, []);
    useEffect(() => {
        if (defaultSetting) {
            // eslint-disable-next-line max-len
            const settingArray = Object.keys(defaultSetting).map(p => ({ ...defaultSetting[p], defKey: p, id: Math.uuid() }));
            setTableData(settingArray);
        }
    }, [defaultSetting]);
    return <div className={baseClass}>
      <div className={`${baseClass}-tips`}>统一配置本项目所有数据表字段的增强属性，启用并配置后，在数据表编辑界面的数据列区域可以生效并使用</div>
      <div className={`${baseClass}-table`}>
        <Table columns={columns} data={tableData} onChange={_onChange} rowEnableSelected={false} />
      </div>
    </div>;
});
