import React, {forwardRef, useState, useImperativeHandle, useRef, useCallback} from 'react';
import { TreeSelect } from 'components';
import {getPrefix} from '../../../../lib/classes';
import {computeSchemaTree, renderLabel} from './tool';
import {tree2array} from '../../../../lib/tree';


export default React.memo(forwardRef(({defaultTreeData, updateData,
                                          getCurrentDataSource, defaultValue}, ref) => {
    const currentPrefix = getPrefix('container-model-left-changeCategory');
    const [tree, setTree] = useState(computeSchemaTree([...defaultTreeData]));
    const [treeSelect, setTreeSelect] = useState(defaultValue);
    const treeSelectRef = useRef();
    treeSelectRef.current = treeSelect;
    const currentSchemaNameRef = useRef('');
    const treeRef = useRef([]);
    treeRef.current = [...(tree || [])];
    const onChange = (e) => {
        const targetValue = e.target.value;
        const selectTree = [...(tree2array(treeRef.current) || [])].find(t => t.id === targetValue);
        if(selectTree && selectTree.bindSchema === 1) {
            currentSchemaNameRef.current = selectTree.defKey;
        } else {
            currentSchemaNameRef.current = null;
        }
        setTreeSelect(targetValue);
    };
    useImperativeHandle(ref, () => ({
        resetTree: (t) => {
            setTree(computeSchemaTree([...(t || [])]));
        },
        getSelectValue: () => {
            return treeSelectRef.current || null;
        },
        getSelectSchemaName: () => {
            return currentSchemaNameRef.current || null;
        },
    }), []);
    const labelRender = useCallback((node) => {
        const modelingNavDisplay = getCurrentDataSource().profile.user.modelingNavDisplay;
        return renderLabel(node,
            modelingNavDisplay.categoryNode.optionValue,
            modelingNavDisplay.categoryNode.customValue);
    }, []);
    const _valueRender = (selectNode) => {
        if(!selectNode) {
            return '';
        }
        const parents = [...(selectNode.parents || [])];
        let displayName = labelRender(selectNode);
        while (parents.length) {
            const parent = parents.pop();
            displayName = `${labelRender(parent)}/${displayName}`;
        }
        return displayName;
    };
    const countable = (node, children) => {
        return `(${children.reduce((p, n) => {
            return p + n.entityRefs.length + n.diagramRefs.length;
        }, node.entityRefs.length + node.diagramRefs.length)})`;
    };
    return <div className={`${currentPrefix}`}>
      <span>
        <span>将选择的以下数据表：</span>
        <span>
          {updateData}
        </span>
      </span>
      <span>
        <span>放至目录：</span>
        <span>
          <TreeSelect
            defaultValue={defaultValue}
            countable={countable}
            labelRender={labelRender}
            valueRender={_valueRender}
            options={tree}
            onChange={onChange} />
        </span>
      </span>
    </div>;
}));
