import React, {useEffect, useRef, useImperativeHandle, forwardRef} from 'react';
import {Form, Input, Radio, Icon, Tooltip, Select, Modal} from 'components';
import {Graph} from '@antv/x6';
import {getPrefix} from '../../../../../lib/classes';
import {relationMarkerMap} from '../util/celltools';

export default React.memo(forwardRef(({cells, getCurrentDataSource,
                                          defaultData, otherEdges}, ref) => {

    const currentPrefix = getPrefix('container-model-relation-celltool-edge-relation');
    const FormItem = Form.FormItem;
    const RadioGroup = Radio.RadioGroup;
    const Option = Select.Option;
    const graphRef = useRef(null);
    const container = useRef(null);
    const edge = cells[0];
    const relationMap = relationMarkerMap();
    const parent = cells[1]?.originData || {};
    const children = cells[2]?.originData || {};
    const labels = edge.labels || [];
    const targetPort = edge.target.originPort || edge.target.port;
    const sourcePort = edge.source.originPort || edge.source.port;
    const erType = defaultData.type;
    const entityRelationRank = defaultData.entityRelationRank;
    const getProjectEdges = () => {
      return (getCurrentDataSource().project.diagrams || [])
          .filter(d => d.type === 'P' || d.type === 'L' || d.type === 'C').reduce((p, n) => {
              return p.concat((n.cellsData || []).filter(c => c.shape === 'edge' && c.relation));
          }, []);
    };
    const allEdges = getProjectEdges();
    const genRelationKey = () => {
        const genCount = (count) => {
            if(allEdges.some(e => e.relation.defKey.startsWith(`RS_${defaultData.defKey}_${erType}_${count}`))) {
                return genCount(count + 1);
            }
            return count;
        };
        return `RS_${defaultData.defKey}_${erType}_${genCount(1)}_${parent.defKey || 'NONE'}_${children.defKey || 'NONE'}`;
    };
    const validateRelationKey = (key) => {
        if(!key) {
            Modal.error({
                title: '操作失败',
                message: '关系代码不能为空',
            });
            return false;
        } else if(edge.relation?.defKey && key === edge.relation.defKey) {
            return true;
        } else if(getProjectEdges().some(e => e.relation.defKey === key)) {
            Modal.error({
                title: '操作失败',
                message: '关系代码不能重复，且全项目唯一',
            });
            return false;
        }
        return true;
    };
    const relationRef = useRef({
        defKey: edge.relation?.defKey || genRelationKey(),
        defName: edge.relation?.defName || (labels[0] ? labels[0].attrs?.label?.text : ''),
        type: edge.relation?.type || ((edge.attrs.line['stroke-dasharray'] === '0' || edge.attrs.line['stroke-dasharray'] === 0) ? 'Identifying' : 'Non-Identifying'),
        startBase: edge.relation?.startBase || relationMap[edge.attrs.line.sourceMarker.name] || '',
        endBase: edge.relation?.endBase || relationMap[edge.attrs.line.targetMarker.name] || '',
        parentId: edge.relation?.parentId || edge.source.cell || '',
        parentFieldId: edge.relation?.parentFieldId || (sourcePort ? sourcePort.split('_')[0] : ''),
        childId: edge.relation?.childId || edge.target.cell || '',
        childFieldId: edge.relation?.childFieldId || (targetPort ? targetPort.split('_')[0] : ''),
        startLabel: edge.relation?.startLabel || (labels[1] ? labels[1].attrs.text.text : ''),
        endLabel: edge.relation?.endLabel || (labels[2] ? labels[2].attrs.text.text : ''),
    });
    useEffect(() => {
        const graph = new Graph({
            container: container.current,
            autoResize: true,
            panning: {
                enabled: true,
            },
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
            },
            scaling: {
                min: 0.1,
                max: 2,
            },
            connecting: {
                snap: true,
                connectionPoint: 'anchor',
            },
            interacting: false,
            background: {
                color: '#ffffff',
            },
        });
        graph.getCurrentDataSource = getCurrentDataSource;
        graph.fromJSON(cells.concat(otherEdges));
        graph.centerContent();
        graph.zoomToFit();
        graphRef.current = graph;
        console.log(cells);
    }, []);
    useImperativeHandle(ref, () => {
        return {
            getRelationData: () => {
                if(validateRelationKey(relationRef.current.defKey)) {
                    return relationRef.current;
                }
                return null;
            },
        };
    }, []);
    const _onChange = (e, name) => {
        const cell = graphRef.current.getCellById(edge.id);
        if(name === 'defName') {
            const currentLabel = cell.getLabels()[0]?.attrs;
            cell.setLabelAt(0,{
                attrs: {
                    ...currentLabel,
                    label: {
                        ...currentLabel?.label,
                        text: e.target.value,
                    },
                },
            });
        } else if(name === 'startLabel' || name === 'endLabel') {
            const index = name === 'startLabel' ? 1 : 2;
            while (cell.getLabels().length < 3) {
                cell.appendLabel({
                    attrs: {
                        text: {
                            text: '',
                        },
                    },
                    position: {
                        distance: 0.9,
                    },
                });
            }
            cell.setLabelAt(index, {
                attrs: {
                            text: {
                                text: e.target.value,
                            },
                        },
                        position: {
                            distance: name === 'startLabel' ? 0.1 : 0.9,
                        },
            });
        } else if(name === 'startBase' || name === 'endBase') {
            const type = name === 'startBase' ? 'sourceMarker' : 'targetMarker';
            const markerName = Object.keys(relationMap)
                .find(r => relationMap[r] === e.target.value);
            cell.attr(`line/${type}/name`, markerName);
        } else if(name === 'parentFieldId' || name === 'childFieldId') {
            const type = name === 'parentFieldId' ? 'source' : 'target';
            const currentPortType = cell.prop(`${type}/port`).split('_')[1];
            const newPortId = `${e.target.value}_${currentPortType}`;
            cell.prop(`${type}/port`, newPortId, { relation: true });
        } else if(name === 'type') {
            cell.attr('line/stroke-dasharray', e.target.value === 'Identifying' ? '0' : '2');
        }
        relationRef.current[name] = e.target.value;
    };
    const renderRelationTitle = () => {
        return <div style={{width: 500, padding: 5}}>
          <div>
                1. 标识关系（Identifying Relationship）：
          </div>
          <div style={{marginLeft: 20, marginTop: 5}}>
                标识关系是指子实体的存在完全依赖于父实体，且子实体的主键包含了父实体的主键。
          </div>
          <div style={{marginLeft: 20, marginTop: 5}}>
                例如，在一个学生和成绩的模型中，如果成绩的记录（子实体）的唯一标识包含了学生的ID（父实体），那么这种关系就是标识关系。也就是说，没有学生就不会有对应的成绩记录。
          </div>
          <div style={{marginTop: 10}}>
                2. 非标识关系（Non-Identifying Relationship）：
          </div>
          <div style={{marginLeft: 20, marginTop: 5}}>
              非标识关系是指子实体与父实体关联，但子实体的存在不完全依赖于父实体，且子实体的主键不包括父实体的主键。
          </div>
          <div style={{marginLeft: 20, marginTop: 5}}>
                例如，一个学生（父实体）和书籍（子实体）的关系。学生可能有推荐书籍，但书籍的存在并不依赖于特定的学生，且书籍的唯一标识（如ISBN）不包含学生的信息。
          </div>
        </div>;
    };
    return <div className={currentPrefix}>
      <Form>
        <FormItem label='关系代码' require>
          <Input
            defaultValue={relationRef.current.defKey}
            autoFocus
            maxLength={120}
            toggleCase
            onChange={e => _onChange(e, 'defKey')}
                />
        </FormItem>
        <FormItem label='关系名称'>
          <Input
            defaultValue={relationRef.current.defName}
            maxLength={120}
            onChange={e => _onChange(e, 'defName')}
                />
        </FormItem>
        <FormItem label={<span><span>关系类型</span><span>
          <Tooltip force title={renderRelationTitle()}><Icon type='icon-issue'/></Tooltip>
        </span></span>}>
          <RadioGroup onChange={e => _onChange(e, 'type')} defaultValue={relationRef.current.type}>
            <Radio value='Identifying'>
                        标识关系
            </Radio>
            <Radio value='Non-Identifying'>
                        非标识关系
            </Radio>
          </RadioGroup>
        </FormItem>
      </Form>
      <div className={`${currentPrefix}-item`}>
        <div className={`${currentPrefix}-item-title`}>映射关系</div>
        <div className={`${currentPrefix}-item-content`}>
          <div>
            <Form>
              <FormItem label='起始端基数'>
                <Select
                  defaultValue={relationRef.current.startBase}
                  onChange={e => _onChange(e, 'startBase')}
                  notAllowEmpty
                  >
                  <Option value='exactly-one'>一(Exactly One)</Option>
                  <Option value='zero-or-one'>零或一(Zero or One)</Option>
                </Select>
              </FormItem>
              <FormItem label='起始端文字'>
                <Input
                  maxLength={10}
                  defaultValue={relationRef.current.startLabel}
                  onChange={(e) => {
                                    _onChange(e, 'startLabel');
                                }}
                            />
              </FormItem>
              <FormItem label='父对象'>
                <Input
                  defaultValue={parent.defKey ? `${parent.defKey}(${parent.defName})` : ''}
                  disable
                />
              </FormItem>
              <FormItem label='父键'>
                <Select
                  onChange={(e) => {
                          _onChange(e, 'parentFieldId');
                      }}
                  allowClear={false}
                  defaultValue={relationRef.current.parentFieldId}
                  disable={(parent.fields || []).length === 0 || entityRelationRank === 'E'}
                  notAllowEmpty
                  >
                  {
                          (parent.fields || []).map((f) => {
                              return <Option key={f.id} value={f.id}>{`${f.defKey}(${f.defName})`}</Option>;
                          })
                      }
                </Select>
              </FormItem>
            </Form>
          </div>
          <div>
            <Form>
              <FormItem label='结束端基数'>
                <Select
                  notAllowEmpty
                  defaultValue={relationRef.current.endBase}
                  onChange={e => _onChange(e, 'endBase')}
                            >
                  <Option value='zero-or-more'>零或多(Zero or More)</Option>
                  <Option value='one-or-more'>一或多(One or More)</Option>
                  <Option value='exactly-one'>一(Exactly One)</Option>
                  <Option value='zero-or-one'>零或一(Zero or One)</Option>
                </Select>
              </FormItem>
              <FormItem label='结束端文字'>
                <Input
                  maxLength={10}
                  defaultValue={relationRef.current.endLabel}
                  onChange={(e) => {
                                    _onChange(e, 'endLabel');
                                }}
                            />
              </FormItem>
              <FormItem label='子对象'>
                <Input
                  defaultValue={children.defKey ? `${children.defKey}(${children.defName})` : ''}
                  disable
                />
              </FormItem>
              <FormItem label='子表键'>
                <Select
                  allowClear={false}
                  onChange={(e) => {
                        _onChange(e, 'childFieldId');
                    }}
                  defaultValue={relationRef.current.childFieldId}
                  disable={(children.fields || []).length === 0 || entityRelationRank === 'E'}
                  notAllowEmpty
                 >
                  {
                        (children.fields || []).map((f) => {
                            return <Option key={f.id} value={f.id}>{`${f.defKey}(${f.defName})`}</Option>;
                        })
                    }
                </Select>
              </FormItem>
            </Form>
          </div>
        </div>
      </div>
      <div className={`${currentPrefix}-item-title`}>效果预览</div>
      <div className={`${currentPrefix}-item`} style={{width: 'calc(100% - 10px)', height: 400, marginBottom: 10}}>
        <div
          style={{height: '100%', width: '100%'}}
          ref={container}
          className={`${currentPrefix}-item-content`}/>
      </div>
    </div>;
}));
