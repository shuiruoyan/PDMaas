import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { Form, Input, TreeSelect } from 'components';
import {getPrefix} from '../../../../lib/classes';
import {COMPONENT} from '../../../../lib/constant';
import {tree2array} from '../../../../lib/tree';

export default React.memo(forwardRef(({ treeData, selectedNode, update, labelRender,
                                          valueRender, fullTreeData}, ref) => {

    const currentPrefix = getPrefix('container-model-category-schema');
    const FormItem = Form.FormItem;
    const [tree, setTree] = useState([...(treeData || [])]);
    const treeRef = useRef([]);
    treeRef.current = [...(tree || [])];
    const computeTo = useCallback(() => {
        if(selectedNode?.id === '_UNCATE') {
            return null;
        }
        const fullArray = tree2array([...(fullTreeData || [])]);
        const findParent = (node) => {
            const currentParent = fullArray.find(it => it.id === node.parentId);
            if(currentParent) {
                if(currentParent.bindSchema === 1) {
                    return findParent(currentParent);
                }
                return currentParent.id;
            }
            return null;
        };
        if(selectedNode) {
            if(selectedNode.nodeType === 'category' && selectedNode.bindSchema !== 1) {
                return selectedNode.id;
            }
            return findParent(selectedNode);
        }
        return null;
    }, []);
    const [to, setTo] = useState(computeTo());
    const [defKey, setDefKey] = useState('');
    const [defName, setDefName] = useState('');

    useEffect(() => {
        if(update) {
            setDefKey(selectedNode.defKey);
            setDefName(selectedNode.defName);
        }
    }, []);

    const inputChange = (e, key) => {
        const { value } = e.target;
        switch (key) {
            case 'defKey':
                setDefKey(value);
                break;
            case 'defName':
                setDefName(value);
                break;
            default:
                break;
        }
    };

    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return {
                    to,
                    defKey,
                    defName,
                    type: (to &&
                        selectedNode?.bindSchema === 1 ?
                            selectedNode?.id !== to : true)
                        ? COMPONENT.TREE.SUB : COMPONENT.TREE.PEER,
                };
            },
            resetTree: (newTree) => {
                setTree(newTree);
            },
            getCurrentTree: () => {
                return [tree, to];
            },
            restData: (id) => {
                setDefKey('');
                setTimeout(() => {
                    setTo(id);
                }, 100);
            },
        };
    });

    return <div className={`${currentPrefix}`}>
      <Form>
        <FormItem label='父节点'>
          <TreeSelect
            labelRender={labelRender}
            valueRender={valueRender}
            countable
            countParent
            value={to}
            options={tree}
            onChange={(e) => {
              setTo(e.target.value);
            }}/>
        </FormItem>
        <FormItem label='schema' require>
          <div className={`${currentPrefix}-line`}>
            <Input
              value={defKey}
              autoFocus
              maxLength={60}
              onChange={e => inputChange(e, 'defKey')} />
          </div>
        </FormItem>
        <FormItem label='名称'>
          <div className={`${currentPrefix}-line`}>
            <Input
              value={defName}
              maxLength={60}
              onChange={e => inputChange(e, 'defName')} />
          </div>
        </FormItem>
      </Form>
    </div>;
}));
