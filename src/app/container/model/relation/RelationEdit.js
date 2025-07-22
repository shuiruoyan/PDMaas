import React, {forwardRef, useImperativeHandle, useRef, useState, useEffect} from 'react';
import {Form, Input, Radio, TreeSelect, Select, Checkbox, Message} from 'components';
import {getPrefix} from '../../../../lib/classes';
import './style/index.less';
import { DIAGRAM } from '../../../../lib/constant';
import {
  conceptNsKey,
  flowNsKey,
  logicNsKey, mermaidNsKey,
  mindNsKey,
  physicNsKey,
} from '../../../../lib/permission';
import {getDefaultSetting, myArray2tree} from '../menu/tool';
import {tree2array} from '../../../../lib/tree';

export default React.memo(forwardRef(({pageType = '', treeData,
  selectedNode, type, update = false}, ref) => {
  const SelectOption = Select.Option;
  const FormItem = Form.FormItem;
  const RadioGroup = Radio.RadioGroup;
  const currentPrefix = getPrefix('container-model-relation-edit');
  const [to, setTo] = useState(selectedNode?.parentId || selectedNode?.id?.split('_')[0]);
  const [tree, setTree] = useState(
      myArray2tree(tree2array(treeData).filter(d => !d.bindSchema)) || [],
  );
  const [myRelationType, setRelationType] = useState(type);
  const [defKey, setDefKey] = useState();
  const [defName, setDefName] = useState();
  const [relationAccuracy, setRelationAccuracy] = useState('F');
  const [codeAsName, setCodeAsName] = useState(!update);
  const preDefKeyRef = useRef('');
  useImperativeHandle(ref, () => {
    return {
      getData: () => {
        let cellsData = [];
        if(myRelationType === DIAGRAM.TYPE.M) {
          cellsData = [{
            data: {
              text: '根节点',
              uid: Math.uuid(),
            },
            children: [],
          }];
        }
        if(myRelationType === DIAGRAM.TYPE.F) {
          cellsData = [{
            data: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>',
          }];
        }
        return {
          to: to === '_UNCATE' ? null : to,
          type: myRelationType,
          defKey,
          defName,
          entityRelationRank: relationAccuracy,
          props: getDefaultSetting(myRelationType),
          cellsData,
        };
      },
      resetTree: (newTree) => {
        setTree(myArray2tree(tree2array(newTree).filter(d => !d.bindSchema)) || []);
      },
      restData: () => {
        setDefKey('');
        setDefName('');
      },
    };
  });

  useEffect(() => {
    if(update) {
      setDefKey(selectedNode.defKey);
      setDefName(selectedNode.defName);
    }
  }, []);
  const _onChange = (e, key) => {
    const targetValue = e.target.value;
    switch (key) {
      case 'defKey':
        setDefKey(targetValue);
        if(codeAsName) {
          setDefName(targetValue);
        }
        break;
      case 'to':
        setTo(targetValue);
        break;
      case 'defName':
        setDefName(targetValue);
        if(codeAsName) {
          setCodeAsName(false);
        }
        break;
      case 'type':
        setRelationType(targetValue);
        break;
      case 'entityRelationRank':
        setRelationAccuracy(targetValue);
        break;
      default:
        break;
    }
  };
  const _onFocus = () => {
    preDefKeyRef.current = defKey;
  };
  const _onBlur = (e) => {
    const targetValue = e.target.value;
    // let tempValue = targetValue.replace(/[-—]/g, '_');
    if(targetValue === '' ||  /^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_\-$#.\u4e00-\u9fff]*$/.test(targetValue)) {
      setDefKey(targetValue);
      if(codeAsName) {
        setDefName(targetValue);
      }
    } else {
      setDefKey(preDefKeyRef.current);
      if(codeAsName) {
        setDefName(preDefKeyRef.current);
      }
      Message.error({title: '必须以字母，下划线，$,#，中文开头，可包含数字、字母，下划线，$,#，中文,.'});
    }
  };
  return <div className={`${currentPrefix}`}>
    <Form>
      {
        (pageType !== 'details' && pageType !== 'edit') &&
        <>
          {
          /*modelingNavDisplay.hierarchyType === PROFILE.USER.FLAT  && !*/update ||
            <FormItem label='归属分类'>
              <TreeSelect
                countable
                value={to}
                countParent
                options={tree}
                onChange={e => _onChange(e, 'to')}/>
            </FormItem>
         }
          {
            update ||
              <FormItem
                label='绘图类型'
                require
              >
                <Select
                  notAllowEmpty
                  value={myRelationType}
                  onChange={e => _onChange(e, 'type')}
                >
                  <SelectOption nsKey={conceptNsKey.C} value={DIAGRAM.TYPE.C}>
                    概念模型图
                  </SelectOption>
                  <SelectOption nsKey={logicNsKey.C} value={DIAGRAM.TYPE.L}>
                    逻辑模型图
                  </SelectOption>
                  <SelectOption nsKey={physicNsKey.C} value={DIAGRAM.TYPE.P}>
                    物理模型图
                  </SelectOption>
                  <SelectOption nsKey={flowNsKey.C} value={DIAGRAM.TYPE.F}>
                    流程图
                  </SelectOption>
                  <SelectOption nsKey={mindNsKey.C} value={DIAGRAM.TYPE.M}>
                    思维导图
                  </SelectOption>
                  <SelectOption nsKey={mermaidNsKey.C} value={DIAGRAM.TYPE.MER}>
                    Mermaid图
                  </SelectOption>
                </Select>
              </FormItem>
          }
          {
            (myRelationType === DIAGRAM.TYPE.L || myRelationType === DIAGRAM.TYPE.P) &&
            <FormItem
              label='关系连接精度'
              require
              name=''>
              <RadioGroup
                value={relationAccuracy}
                onChange={e => _onChange(e, 'entityRelationRank')}
            >
                <Radio value='F'>
                字段/属性
                </Radio>
                <Radio value='E'>
                表/实体
                </Radio>
              </RadioGroup>
            </FormItem>
          }
        </>
      }
      <FormItem label='代码' require>
        <div className={`${currentPrefix}-line`}>
          <Input
            autoFocus
            value={defKey}
            maxLength={64}
            toggleCase
            onBlur={_onBlur}
            onFocus={_onFocus}
            onChange={e => _onChange(e, 'defKey')}
            />
        </div>
      </FormItem>

      <FormItem label='显示名称'>
        <div className={`${currentPrefix}-line`}>
          <Input
            value={defName}
            maxLength={64}
            onChange={e => _onChange(e, 'defName')}
          />
          <Checkbox
            checked={codeAsName}
            onChange={(e) => {
              const checkedValue = e.target.checked;
              setCodeAsName(checkedValue);
              if(checkedValue) {
                setDefName(defKey);
              }

            }}
          />代码作为名称
        </div>
      </FormItem>

    </Form>
  </div>;
}));
