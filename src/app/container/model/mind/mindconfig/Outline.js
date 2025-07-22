import React, {useEffect, useMemo, useRef, useState} from 'react';
import { Tree } from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {mind2tree, textToNodeRichTextWithWrap} from '../util';
import {tree2array} from '../../../../../lib/tree';

export default React.memo(({getMind, readonly}) => {
    const treeRef = useRef(null);
    const [mindData, setMindData] = useState(() => {
        const mind = getMind();
        return mind2tree(mind.getData());
    });
    const defaultExpand = useMemo(() => tree2array(mindData).map(d => d.id), []);
    const currentPrefix = getPrefix('container-model-mind-config-outline');
    const onNodeClick = (node) => {
        const mind = getMind();
        mind.execCommand('GO_TARGET_NODE', node.id);
    };
    const onNodeKeyDown = (e, treeNode) => {
        const mind = getMind();
        if ([46, 8].includes(e.keyCode)) {
            e.stopPropagation();
            mind.renderer.textEdit.hideEditTextBox();
            const node = mind.renderer.findNodeByUid(treeNode.id);
            if (node && !node.isRoot) {
                mind.execCommand('REMOVE_NODE', [node]);
            }
        }
        if (e.keyCode === 13 && !e.shiftKey) {
            // 插入兄弟节点
            e.preventDefault();
            mind.execCommand('INSERT_NODE', false, [], {
                uid: Math.uuid(),
            });
            e.target.blur();
        }
        if (e.keyCode === 9) {
            e.preventDefault();
            if (e.shiftKey) {
                // 节点上升一级
                mind.execCommand('MOVE_UP_ONE_LEVEL');
                e.target.blur();
            } else {
                // 插入子节点
                mind.execCommand('INSERT_CHILD_NODE', false, [], {
                    uid:  Math.uuid(),
                });
                treeRef.current.setExpand((p) => {
                    if(!p.includes(treeNode.id)) {
                        return p.concat(treeNode.id);
                    }
                    return p;
                });
                e.target.blur();
            }
        }
    };
    useEffect(() => {
        const mind = getMind();
        const handleDataChange = (data) => {
            setMindData(mind2tree(data));
        };
        mind.on('data_change', handleDataChange);
        return () => {
            mind.off('data_change', handleDataChange);
        };
    }, []);
    const onEditBlur = (e, node) => {
        const mind = getMind();
        if(!mind.readonly) {
            const richText = node.data.richText;
            const text = richText ? e.target.innerHTML : e.target.innerText;
            const targetNode = mind.renderer.findNodeByUid(node.id);
            if (!targetNode) return;
            if (richText) {
                targetNode.setText(textToNodeRichTextWithWrap(text), true, true);
            } else {
                targetNode.setText(text);
            }
        }
    };
    const labelRender = (node) => {
        const mind = getMind();
        return <span
          suppressContentEditableWarning
          onBlur={e => onEditBlur(e, node)}
          className={`${currentPrefix}-edit`}
          contentEditable={!mind.readonly && !readonly}>{node.defName}</span>;
    };
    return <div className={currentPrefix}>
      <Tree
        ref={treeRef}
        labelRender={labelRender}
        defaultExpand={defaultExpand}
        countable
        onNodeClick={onNodeClick}
        onNodeKeyDown={onNodeKeyDown}
        data={mindData}
        nodeExpand={false}
      />
    </div>;
});
