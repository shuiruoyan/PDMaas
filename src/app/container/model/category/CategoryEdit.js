import { Form, Input, Radio, TreeSelect, Checkbox, Message } from 'components';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {getPrefix} from '../../../../lib/classes';
import {CATEGORY, COMPONENT, PROJECT} from '../../../../lib/constant';
import './style/index.less';
import {tree2array} from '../../../../lib/tree';
import {computeSchemaTree} from '../menu/tool';

export default React.memo(forwardRef(({treeData, selectedNode,
  nodeType = COMPONENT.TREE.PEER, update = false, labelRender, valueRender,
                                        filterTreeData}, ref) => {

  const FormItem = Form.FormItem;
  const RadioGroup = Radio.RadioGroup;
  const CheckboxGroup = Checkbox.CheckboxGroup;
  const currentPrefix = getPrefix('container-model-category');
  const treeDataRef = useRef([...(treeData || [])]);
  let currentNodeType = nodeType;
  const classifyType = [{
    name: '自动分类',
    key: CATEGORY.CLASSIFY_TYPE.AUTO,
  }, {
    name: '手动选择',
    key: CATEGORY.CLASSIFY_TYPE.MANUAL,
  }, {
    name: '不分类',
    key: CATEGORY.CLASSIFY_TYPE.NONE,
  }];

  const manualClassify = [{
    name: '概念模型',
    key: CATEGORY.MANUAL_CLASSIFY.C,
  }, {
    name: '逻辑模型',
    key: CATEGORY.MANUAL_CLASSIFY.L,
  }, {
    name: '物理模型',
    key: CATEGORY.MANUAL_CLASSIFY.P,
  }, {
    name: '关系图',
    key: CATEGORY.MANUAL_CLASSIFY.D,
  }];

  const categoryPropsRef = useRef();


  const [tree, setTree] = useState(() => {
    return nodeType === COMPONENT.TREE.PEER ?
        computeSchemaTree([...(treeDataRef.current || [])]) : filterTreeData(treeDataRef.current);
  });
  const treeRef = useRef([]);
  treeRef.current = [...(tree || [])];
  const computeTo = useCallback(() => {
    if(update) {
      if(selectedNode.before &&
          selectedNode.before.nodeType === PROJECT.CATEGORY) {
        return selectedNode?.before?.id;
      } else if(selectedNode.after &&
          selectedNode.after.nodeType === PROJECT.CATEGORY) {
        return selectedNode.after.id;
      }
      if(selectedNode.current && selectedNode.current.parentId) {
        currentNodeType = COMPONENT.TREE.SUB;
      }
      return selectedNode.current ? selectedNode.current.parentId : null;
    } else {
      if(!selectedNode || !selectedNode.id) {
        return null;
      }
      if(selectedNode.nodeType === PROJECT.CATEGORY) {
        return selectedNode?.bindSchema === 1 ? null : selectedNode?.id;
      }
      const currentParent = tree2array([...(treeRef.current || [])])
          .find(it => it.id === selectedNode?.parentId?.split('_')[0]);
      if(currentParent) {
        return currentParent.bindSchema === 1 ? null : currentParent.id;
      }
      return null;
    }
  }, []);
  const [to, setTo] = useState(computeTo());
  const [type, setType] = useState(currentNodeType);
  const [defKey, setDefKey] = useState('');
  const [defName, setDefName] = useState('');

  const [checked, setChecked] = useState(false);
  const [codeAsName, setCodeAsName] = useState(!update);
  const [categoryProps, setCategoryProps] = useState({
    classifyType: 'AUTO',
    manualClassify: [],
  });

  categoryPropsRef.current = {...categoryProps};

  useEffect(() => {
    if(update) {
      setDefKey(selectedNode.current.defKey);
      setDefName(selectedNode.current.defName);
      setCategoryProps({
        classifyType: selectedNode.current.classifyType || 'AUTO',
        manualClassify: JSON.parse(selectedNode.current.manualClassify || '[]') ,
      });
    }
  }, []);

  useEffect(() => {
    setTree(type === COMPONENT.TREE.PEER ?
        computeSchemaTree([...(treeDataRef.current || [])]) :
        filterTreeData([...(treeDataRef.current || [])]));
  }, [type]);


  const generateRandomString = () => {
    let letters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 8; i += 1) {
      result += letters[Math.floor(Math.random() * letters.length)];
    }
    return result;
  };

  useImperativeHandle(ref, () => {
    return {
      getData: () => {
        return {
          type,
          to,
          defKey,
          defName,
          ...categoryPropsRef.current,
          manualClassify: JSON.stringify(categoryPropsRef.current.manualClassify || '[]'),
        };
      },
      resetTree: (newTree) => {
        setTree(newTree);
        treeDataRef.current = [...(newTree || [])];
      },
      getCurrentTree: () => {
        return [tree, to];
      },
      restData: (id) => {
        setDefKey('');
        setDefName('');
        setChecked(false);
        setCategoryProps({
          classifyType: 'AUTO',
          manualClassify: [],
        });
        setTimeout(() => {
          setTo(id);
        }, 100);
      },
    };
  });
  const inputChange = (e, key) => {
    const {value} = e.target;
    switch (key) {
      case 'defKey':
        if(value !== 'UNCATE') {
          setDefKey(value);
          if(codeAsName) {
            setDefName(value);
          }
        } else {
          Message.error({title: 'UNCATE为系统关键字！'});
        }
        break;
      default:
        break;
    }
  };

  const _onChange = (key, value) => {
    setCategoryProps(pre => ({
      ...pre,
      [key]: value,
    }));
  };

  return <div className={`${currentPrefix}-category`}>
    <Form >
      <FormItem label='参考节点'>
        <TreeSelect
          labelRender={labelRender}
          valueRender={valueRender}
          countable
          countParent
          value={to}
          options={tree}
          // allowClear={false}
          onChange={(e) => {
            setTo(e.target.value);
          }}/>
      </FormItem>
      {
        to &&
          <FormItem
            label='节点关系'
            require
          >
            <RadioGroup
              value={type}
              onChange={(e) => {
                  setType(e.target.value);
                }}
            >
              <Radio value={COMPONENT.TREE.PEER}>
                同级分类目录
              </Radio>
              <Radio value={COMPONENT.TREE.SUB}>
                子分类目录
              </Radio>
            </RadioGroup>
          </FormItem>
      }
      <FormItem label='分类代码' require>
        <div className={`${currentPrefix}-category-line`}>
          <Input
            value={defKey}
            autoFocus
            maxLength={20}
            toggleCase
            onChange={e => inputChange(e, 'defKey')} />
          <Checkbox
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              if(e.target.checked) {
                const s = generateRandomString();
                setDefKey(s);
                if(codeAsName) {
                  setDefName(s);
                }
              }
            }}/>我不想填，自动生成
        </div>
      </FormItem>
      <FormItem label='分类名称'>
        <div className={`${currentPrefix}-category-line`}>
          <Input
            value={defName}
            maxLength={20}
            onChange={(e) => {
              setDefName(e.target.value);
              if(codeAsName) {
                setCodeAsName(false);
              }
            }}
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
      <FormItem
        label='对象类型分类'
        require
      >
        <RadioGroup
          value={categoryProps.classifyType}
          onChange={(e) => { _onChange('classifyType', e.target.value); }}
        >
          {
            classifyType.map(item => (
              <Radio value={item.key}>{item.name}</Radio>
            ))
          }
        </RadioGroup>
      </FormItem>
      {
        categoryProps.classifyType === CATEGORY.CLASSIFY_TYPE.MANUAL && <FormItem
          label='只展示以下分类'
        >
          <CheckboxGroup
            value={categoryProps.manualClassify}
            onChange={(e) => { _onChange('manualClassify', e.target.value); }}
        >
            {
            manualClassify.map(item => (
              <Checkbox value={item.key}>{item.name}</Checkbox>
            ))
          }
          </CheckboxGroup>
        </FormItem>
      }
    </Form>
  </div>;
}));
