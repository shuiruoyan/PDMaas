import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import { Form, Radio } from 'components';
import {getPrefix} from '../../../../lib/classes';
import SchemaEdit from './SchemaEdit';
import CategoryEdit from './CategoryEdit';
import {COMPONENT} from '../../../../lib/constant';
import { tree2array } from '../../../../lib/tree';
import {myArray2tree, renderLabel, renderValue} from '../menu/tool';

export default React.memo(forwardRef(({ dataSource, treeData, fullTree, selectedNode,
    nodeType = COMPONENT.TREE.PEER, update = false }, ref) => {

    const filterTreeData = (data) => {
        return myArray2tree(tree2array(data).filter(d => !d.bindSchema));
    };

    const currentPrefix = getPrefix('container-model-category-wrapper');
    const treeDataRef = useRef([...(filterTreeData(treeData) || [])]);
    const CATEGORY_TYPE = {
        CATEGORY: 'CATEGORY',
        SCHEMA: 'SCHEMA',
    };
    const FormItem = Form.FormItem;
    const RadioGroup = Radio.RadioGroup;
    const [categoryType, setCategoryType] = useState(
        nodeType === COMPONENT.TREE.SCHEMA ? CATEGORY_TYPE.SCHEMA : CATEGORY_TYPE.CATEGORY);
    const editRef = useRef();
    const _categoryTypeChange = (e) => {
        const { value } = e.target;
        setCategoryType(value);
    };

    useImperativeHandle(ref, () => {
        return {
            resetTree: (newTree) => {
                if(categoryType === CATEGORY_TYPE.SCHEMA) {
                    treeDataRef.current = [...(filterTreeData(newTree) || [])];
                    editRef.current?.resetTree([...treeDataRef.current]);
                } else {
                    editRef.current?.resetTree([...newTree]);
                }
            },
            getCurrentTree: () => {
                editRef.current?.getCurrentTree();
            },
            restData: (id) => {
                editRef.current?.restData(id);
            },
            getData: () => {
                return {
                    ...(editRef.current?.getData() || {}),
                    bindSchema: categoryType === CATEGORY_TYPE.SCHEMA ? 1 : 0,
                    to: (editRef.current?.getData() || {})?.to || null,
                };
            },
        };
    }, [categoryType]);

    const _labelRender = useCallback((node) => {
        const userProfile = dataSource.profile?.user;
        const modelingNavDisplay = userProfile.modelingNavDisplay;
        return renderLabel(node,
            modelingNavDisplay.conceptEntityNode.optionValue,
            modelingNavDisplay.conceptEntityNode.customValue);
    }, []);

    const _valueRender = useCallback((node) => {
        return renderValue(node);
    }, []);

    const computeSelectedAfter = (after) => {
        if(!after) {
            return after;
        }
        if(after.id === '_UNCATE') {
            return undefined;
        }
        return after;
    };

    return <div className={currentPrefix}>
      {
        !update && <Form>
          <FormItem
            label='节点类型'
            require
              >
            <RadioGroup
              value={categoryType}
              onChange={_categoryTypeChange}
                  >
              <Radio value={CATEGORY_TYPE.CATEGORY}>分类</Radio>
              <Radio value={CATEGORY_TYPE.SCHEMA}>数据库schema</Radio>
            </RadioGroup>
          </FormItem>
          </Form>
      }
      {
        categoryType === CATEGORY_TYPE.SCHEMA ?
          <SchemaEdit
            ref={editRef}
            labelRender={_labelRender}
            valueRender={_valueRender}
            treeData={[...treeDataRef.current]}
            selectedNode={update ? selectedNode.current : selectedNode}
            update={update}
            fullTreeData={fullTree}
          /> :
          <CategoryEdit
            ref={editRef}
            labelRender={_labelRender}
            valueRender={_valueRender}
            dataSource={dataSource}
            treeData={[...treeData]}
            selectedNode={{
                ...selectedNode,
                after: computeSelectedAfter(selectedNode?.after),
            }}
            filterTreeData={filterTreeData}
            nodeType={nodeType}
            update={update}
          />
      }
    </div>;
}));
