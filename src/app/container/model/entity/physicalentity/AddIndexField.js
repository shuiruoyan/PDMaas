import {Button, Icon, Select} from 'components';
import _ from 'lodash';
import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import './style/index.less';
import { TableContext } from '../../../../../lib/context';
import {getId} from '../../../../../lib/idpool';
import {indexNsKey} from '../../../../../lib/permission';

export default React.memo(forwardRef(({ fields, indexesField, setIndexes,
    onChange, resize, onIndexesChange, close, disable, ...restProps },ref) => {
    console.log(indexesField);
    const currentPrefix = getPrefix('container-model-entity-physical-content-indexes-more');
    const [selectedNodes, setSelectedNodes] = useState([]);
    const selectedRef = useRef([]);
    const [editIndexes, setEditIndexes] = useState(indexesField || []);
    const indexesRef = useRef([...indexesField]);
    const [selectedOptions, setSelectOptions] = useState(
        _.map(indexesField, item => item?.fieldId));
    const selectOptionsRef = useRef([]);
    const {value,rowId,column,rowData} = restProps;
    const SelectOption = Select.Option;
    selectedRef.current = [...selectedNodes];
    selectOptionsRef.current = [...selectedOptions];
    console.log(selectOptionsRef.current);
    useImperativeHandle(ref, () => {
        return {
            // formData,
        };
    },[]);
    const removeIndex = () => {
        if(!disable) {
            return;
        }
        if(selectedNodes.length === 0) return;

        setEditIndexes((p) => {
            return p.filter(d => !selectedNodes.includes(d.id));
        });
        const filteredData = _.map(_.filter(editIndexes,
                item => _.includes(selectedNodes, item.id)), 'fieldId');
        let selectedOptionsTemp = selectOptionsRef.current.filter(i => !filteredData.includes(i));
        setSelectOptions(selectedOptionsTemp);
        indexesRef.current = indexesRef.current.filter(d => !selectedNodes.includes(d.id));
        setSelectedNodes([]);
    };
    const addIndex = () => {
        if(!disable) {
            return;
        }
        const id = getId(1)[0];
        const tempData = {
            id: id,
            fieldId: '',
            fieldDefKey : '',
            sortType:'',
        };
        indexesRef.current.push(tempData);
        setEditIndexes((p) => {
            const temp = [...p];
            temp.push(tempData);
            return temp;
        });
    };
    const onCancel = () => {
        close();
    };
    const onConfirm = () => {
        console.log(value);
        let isChange;
        const updateData = indexesRef.current.filter(i => i.fieldId !== '');
        if(value.length !== updateData.length) {
            isChange = true;
        } else {
            value.map((v) => {
                const tempV = updateData.find(u => u.fieldId === v.fieldId);
                if(!tempV) {
                    isChange = true;
                }
                if(tempV && tempV.sortType !== v.sortType) {
                    isChange = true;
                }
                return v;
            });
        }
        if(isChange) {
            onIndexesChange && onIndexesChange([{
                id: rowId,
                defKey: rowData.defKey,
                defName: rowData.defName,
                updateKeys: column,
                pre: {
                    fields: value,
                    defKey: rowData.defKey,
                },
                next: {
                    fields: updateData,
                    defKey: rowData.defKey,
                },
            }]);
            let length = updateData.length > 3 ? 4 : updateData.length;
            resize(35 * length, true);
            setIndexes((p) => {
                return p.map((r) => {
                    if(r.id === rowId) {
                        return {
                            ...r,
                            [column]: updateData,
                        };
                    }
                    return r;
                });
            });
        }

        close();
    };
    const updateIndexes = (e, index, key, preId) => {
        if(key === 'sortType') {
            indexesRef.current = indexesRef.current.map((i) => {
                if(index.id === i.id) {
                    return {
                        ...i,
                        sortType:  e.target.value,
                    };
                }
                return i;
            });
            return;
        }
        const field = _.find(fields, {id: e.target.value});
        let selectedOptionsTemp = selectOptionsRef.current.filter(i => i !== preId);
        selectedOptionsTemp = selectedOptionsTemp.concat(field.id);
        setSelectOptions(selectedOptionsTemp);
        indexesRef.current = indexesRef.current.map((i) => {
            if(index.id === i.id) {
                return {
                    ...i,
                    fieldId: field.id,
                    fieldDefKey : field.defKey,
                };
            }
            return i;
        });
        setEditIndexes([...indexesRef.current]);
    };
    const onSelected = (id) => {
        let selectedData = [...selectedRef.current];
        if(selectedData.includes(id)) {
            selectedData = selectedData.filter(i => i !== id);
        } else {
            selectedData = selectedData.concat(id);
        }
        setSelectedNodes(selectedData);
    };
    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-top`}>
        <TableContext.Provider value={{isTable: false}}>
          <table>
            <thead>
              <tr>
                <td/>
                <td>字段</td>
                <td>排序顺序</td>
              </tr>
            </thead>
            <tbody>
              {
                      editIndexes.map((index, i) => {
                          return <tr
                            key={index.id}
                          >
                            <td onClick={() => {
                                  onSelected(index.id);
                              }}>
                              <span
                                className={classesMerge({
                                [`${currentPrefix}-top-active`]: selectedNodes.includes(index.id),
                            })}
                        >
                                <Icon type="icon-check-solid"/>
                              </span>
                              <span>{i + 1}</span>
                            </td>
                            <td>
                              <Select
                                defaultValue={index.fieldId}
                                notAllowEmpty
                                allowClear={false}
                                onChange={(e) => {
                                          updateIndexes(e, index, 'field', index.fieldId);
                                      }}
                                  >
                                {
                                          fields.filter(
                                              d => !selectedOptions.filter(s => s !== index.fieldId)
                                                  .includes(d.id))
                                              .map((f) => {
                                                  return <SelectOption
                                                    key={f.id}
                                                    value={f.id}
                                                  >
                                                    {f.defKey}
                                                  </SelectOption>;
                                              })
                                      }
                              </Select>
                            </td>
                            <td>
                              <Select
                                defaultValue={index.sortType}
                                notAllowEmpty
                                      // allowClear={false}
                                onChange={(e) => {
                                          updateIndexes(e, index, 'sortType');
                                      }}
                                  >
                                <SelectOption value="DESC">DESC</SelectOption>
                                <SelectOption value="ASC">ASC</SelectOption>
                              </Select>
                            </td>
                          </tr>;
                      })
                  }
            </tbody>
          </table>
        </TableContext.Provider>
      </div>
      <div className={`${currentPrefix}-bottom`}>
        <div className={`${currentPrefix}-bottom-left`}>
          <span
            onClick={addIndex}
            className={classesMerge({
              [`${currentPrefix}-bottom-left-disable`] : !disable,
          })}><Icon type='icon-oper-plus' nsKey={indexNsKey.U}/> 添加</span>
          <span
            onClick={removeIndex}
            className={classesMerge({
              [`${currentPrefix}-bottom-left-disable`] : !disable,
          })}><Icon type='icon-line-real' nsKey={indexNsKey.U}/>移除</span>
        </div>
        <div className={`${currentPrefix}-bottom-right`}>
          <Button onClick={onCancel}>取消</Button>
          <Button onClick={onConfirm} type='primary' nsKey={indexNsKey.U}>确认</Button>
        </div>
      </div>
    </div>;
}));
