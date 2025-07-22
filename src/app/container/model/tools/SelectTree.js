import React, {forwardRef, useState, useImperativeHandle, useRef, useCallback} from 'react';
import { TreeSelect,Form } from 'components';
import {getPrefix} from '../../../../lib/classes';
import './style/index.less';
import {computeSchemaTree, renderLabel} from '../menu/tool';
import {tree2array} from '../../../../lib/tree';


export default React.memo(forwardRef(({defaultTreeData, dataSource}, ref) => {
    const currentPrefix = getPrefix('container-model-tools-selectTree');
    const [tree, setTree] = useState(computeSchemaTree(defaultTreeData));
    const treeRef = useRef([]);
    treeRef.current = [...(tree || [])];
    const [treeSelect, setTreeSelect] = useState();
    const treeSelectRef = useRef();
    const [displayName, setDisplayName] = useState('');
    const currentSchemaNameRef = useRef('');
    const displayNameRef = useRef('');
    displayNameRef.current = displayName;
    const FormItem = Form.FormItem;
    treeSelectRef.current = treeSelect;
    const onChange = (e) => {
        const targetValue = e.target.value;
        const selectTree = [...(tree2array(treeRef.current) || [])].find(t => t.id === targetValue);
        if(selectTree && selectTree.bindSchema === 1) {
            currentSchemaNameRef.current = selectTree.defKey;
        }
        setTreeSelect(targetValue);
    };
    useImperativeHandle(ref, () => ({
        resetTree: (t) => {
            setTree(computeSchemaTree(t));
        },
        getSelectValue: () => {
            return [treeSelectRef.current, displayNameRef.current, currentSchemaNameRef.current];
        },
    }), []);
    const _valueRender = (selectNode) => {
        if(!selectNode) {
            return '';
        }
        const parents = [...(selectNode.parents || [])];
        let name = selectNode.defName || selectNode.defKey;
        while (parents.length) {
            const parent = parents.pop();
            name = `${parent.defName || parent.defKey}/${name}`;
        }
        setDisplayName(name);
        return name;
    };
    const _labelRender = useCallback((node) => {
        const userProfile = dataSource.profile?.user;
        const modelingNavDisplay = userProfile.modelingNavDisplay;
        return renderLabel(node,
            modelingNavDisplay.conceptEntityNode.optionValue,
            modelingNavDisplay.conceptEntityNode.customValue);
    }, []);
    return <div className={`${currentPrefix}`}>
      <Form>
        <FormItem
          label='参考节点'
        >
          <TreeSelect
            countable
            countParent
            labelRender={_labelRender}
            valueRender={_valueRender}
            options={tree}
            onChange={onChange} />
        </FormItem>
      </Form>
    </div>;
}));
