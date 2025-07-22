import React, {useMemo, useState, useCallback, useRef, useEffect,forwardRef, useImperativeHandle} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeTree} from 'react-vtree';
import { Icon, Checkbox } from 'components';

import './style/index.less';
import {classesMerge, getPrefix} from '../../lib/classes';
import * as constant from '../../lib/constant';
import {tree2array} from '../../lib/tree';
import {getSafeReg} from '../../lib/reg';

const Tree = React.memo(forwardRef(({data, arrayData, fieldNames,
                             sortable, countable, countParent, ignoreShowType = [],
                                        onDoubleClick, asyncNode, nodeExpand = true,
                                        onDragSuccess, labelRender, onNodeClick, onCheck,
                                        selectedNode, checkSortable, onSelected, maxSelected = 200,
                                        allowCrossDirectorySelection = true, preventDefault,
                                        checkable, onExpend, defaultExpand = [],
                                        onNodeKeyDown, onNodeDragStart, leafSelected,
                                        autoScroll = true, onTreeClick, scrollStyle,
                                        defaultChecked = [], showExpandArrow = false,
                                        searchName, selectedCancel = true}, ref) => {
    const treeContainerRef = useRef(null);
    const scrollRef = useRef(null);
    const treeRef = useRef(null);
    const ulRef = useRef(null);
    const arrayTree = arrayData || useMemo(() => {
        return tree2array(data);
    }, [data]);
    const arrayTreeRef = useRef([]);
    arrayTreeRef.current = [...arrayTree];
    const [nodeLoad, setLoadNode] = useState([]);
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState([...defaultChecked]);
    const [expand, setExpand] = useState([...defaultExpand]);
    const [filterNode, setFilterNode] = useState([]);
    const [dragOverData, setDragOverData] = useState(null);
    const [showType, setShowType] = useState(constant.PROFILE.USER.ALL);
    const currentPrefix = getPrefix('components-tree');
    const { defKey, defName, key } = fieldNames;
    const [searchValue, setSearchValue] = useState('');
    const searchValueRef = useRef(null);
    searchValueRef.current = searchValue;
    const arrayTreeFilter = useMemo(() => {
        if(!searchValueRef.current) {
            return arrayTree;
        }
        return arrayTree.filter(node => filterNode.includes(node[defKey]));
    }, [arrayTree, filterNode]);
    const arrayTreeFilterRef = useRef(arrayTreeFilter);
    arrayTreeFilterRef.current = [...arrayTreeFilter];
    const searchCallbackRef = useRef(null);
    const selectedRef = useRef([]);
    selectedRef.current = [...selected];
    const checkedRef = useRef(null);
    checkedRef.current = [...checked];
    const expandRef = useRef(null);
    expandRef.current = [...expand];
    const needScroll = useRef({
        status: false,
        node: [],
    });
    const calcSearch = (value, search) => {
        if(search) {
            const reg = getSafeReg(search);
            const str = `<span class=${currentPrefix}-search-value>$&</span>`;
            // eslint-disable-next-line react/no-danger
            return <span dangerouslySetInnerHTML={{__html: value.replace(reg, str)}} />;
        }
        return value;
    };
    useEffect(() => {
        if(searchValue) {
            const reg = getSafeReg(searchValue);
            const searchNodes = arrayTreeRef.current
                .filter((a) => {
                    reg.lastIndex = 0;
                    return searchName ? reg.test(a[searchName])
                        : (reg.test(a[defName]) || reg.test(a[key]));
                });
            const expands = searchNodes
                .reduce((p, n) => {
                    return p.concat(n.parents.map(d => d[defKey]));
                }, []);
            const searchNodesId = searchNodes.map(n => n[defKey]);
            needScroll.current = { status: true, node: [...searchNodesId]};
            const newExpands = [...new Set(expands.concat(expands))];
            setExpand(newExpands);
            onExpend && onExpend(newExpands);
            setFilterNode([...new Set(newExpands.concat(searchNodesId))]);
            searchCallbackRef.current && searchCallbackRef.current(searchValue, searchNodes);
        } else {
            searchCallbackRef.current && searchCallbackRef.current(searchValue, []);
            setFilterNode([]);
        }
    }, [searchValue]);
    const setNodeSelected = (ids) => {
        // 标记需要滚动
        const firstNode = arrayTreeFilterRef.current
            .find(a => a[defKey] === ids[0]);
        const expandData = [...new Set(expandRef.current
            .concat(firstNode?.parents?.map(d => d[defKey]) || []))];
        needScroll.current = { status: true, node: [...ids]};
        setExpand(expandData);
        setSelected([...ids]);
        onExpend && onExpend(expandData);
    };
    useEffect(() => {
        if(selectedNode) {
            setNodeSelected([selectedNode]);
        }
    }, [selectedNode]);
    useEffect(() => {
        if(needScroll.current.status && autoScroll && expand.length > 0) {
            // 选中节点发生变化 需要滚动到指定位置
            treeRef.current?.scrollToItem?.(needScroll.current.node[0], 'center');
            needScroll.current = { status: false, node: []};
        }
    }, [expand]);
    useEffect(() => {
        if(needScroll.current.status && autoScroll) {
            // 选中节点发生变化 需要滚动到指定位置
            treeRef.current?.scrollToItem?.(needScroll.current.node.slice(-1)[0], 'center');
            needScroll.current = { status: false, node: []};
        }
        onSelected && onSelected(selected);
    }, [selected]);
    useImperativeHandle(ref, () => {
        return {
            setShowType: (type) => {
                setShowType(type);
            },
            search: (value, callback) => {
                searchCallbackRef.current = callback;
                setSearchValue(value);
            },
            setNodeSelected: (ids) => {
                setNodeSelected(ids);
            },
            setExpand: (...args) => {
                setExpand(...args);
            },
            getExpand: () => {
                return expandRef.current;
            },
            scrollToItem: (id) => {
                treeRef.current?.scrollToItem?.(id, 'center');
            },
            setChecked: (ids) => {
                setChecked(ids);
            },
            getChecked: () => {
                return checkedRef.current;
            },
        };
    }, []);
    const getNodeChildren = (node) => {
        return (node.children || []).reduce((p, n) => {
            return p.concat(n[defKey]).concat(getNodeChildren(n));
        }, []);
    };
    const checkIndeterminate = (node) => {
        if(node.checkStrictly) {
            return false;
        }
        const childrenId = getNodeChildren(node);
        return childrenId.some(id => !checked.includes(id));
    };
    const getNodeData = (node, nestingLevel, isEnd, before, after) => ({
        data: {
            search: searchValue,
            dragData: dragOverData,
            id: node[defKey],
            node,
            nestingLevel,
            isOpenByDefault: expand.includes(node[defKey]),
            isLoad: nodeLoad.includes(node[defKey]),
            isLeaf: !node.children,
            isSelected: selected.includes(node[defKey]),
            isChecked: checked.includes(node[defKey]),
            indeterminate: checkIndeterminate(node),
            sort: sortable,
            isEnd,
            before,
            after,
            array: arrayTreeFilter,
            filter: filterNode,
            selectedData: selected,
        },
    });
    const filterSearch = (preData) => {
        return preData.filter(d => filterNode.includes(d[defKey])).map((d) => {
            if(d.children) {
                return {
                    ...d,
                    children: filterSearch(d.children),
                };
            }
            return d;
        });
    };
    let tempData = searchValue ? filterSearch(data) : data;
    const filterEmpty = (d) => {
       return d.filter((b) => {
           if(b.children && !ignoreShowType.includes(b[defKey])) {
               return b.children.length > 0;
           }
           return true;
       });
    };
    const transformTreeData = (d) => {
        return filterEmpty(d.map((c) => {
            if(!c.children) {
                return c;
            }
            return {
                ...c,
                children: transformTreeData(c.children),
            };
        }));
    };
    if(showType !== constant.PROFILE.USER.ALL) {
        tempData = transformTreeData(tempData);
    }
    function* treeWalker() {
        for (let i = 0; i < tempData.length; i += 1) {
            yield getNodeData(tempData[i], 0, i === (tempData.length - 1),
                tempData[i - 1], tempData[i + 1]);
        }
        while (true) {
            const parent = yield;
            const children = parent.data.node?.children || [];
            for (let i = 0; i < children?.length; i += 1) {
                yield getNodeData(children[i], parent.data.nestingLevel + 1,
                    i === (children.length - 1), children[i - 1], children[i + 1]);
            }
        }
    }
    const _onLoadMoreClick = async (node, setLoading) => {
        setLoading(true);
        await asyncNode({
            ...node,
            [defKey]: node.loadMoreId,
            children: node.loadMoreChildren,
        });
        setLoading(false);
    };
    const _onNodeKeyDown = (e, node) => {
        onNodeKeyDown && onNodeKeyDown(e, node);
    };
    const _onNodeClick = async (e, node, isLeaf, setLoading, isLoad,
                                iconExpand, before, after, array) => {
      const nodeId = node[defKey];
      if(nodeExpand || iconExpand) {
          if(!isLeaf) {
              if(asyncNode && !isLoad) {
                  setLoading(true);
                  await asyncNode(node);
                  setLoadNode(p => p.concat(node[defKey]));
                  setLoading(false);
              }
              setExpand((p) => {
                  if(p.includes(nodeId)) {
                      onExpend && onExpend(p.filter(n => n !== nodeId));
                      return p.filter(n => n !== nodeId);
                  }
                  onExpend && onExpend(p.concat(nodeId));
                  return p.concat(nodeId);
              });
          }
      }
      if(!iconExpand && (leafSelected ? isLeaf : true)) {
          let selectedData = [...selectedRef.current];
          const checkSameDir = () => {
              if(allowCrossDirectorySelection || selectedData.length === 0) {
                  return true;
              }
              const preNode = array.find(a => a[defKey] === selectedData[0]);
              if(preNode.nodeType === constant.PROJECT.DIAGRAM_SUB ||
                  preNode.nodeType === constant.PROJECT.CONCEPT_ENTITY_SUB ||
                  preNode.nodeType === constant.PROJECT.LOGIC_ENTITY_SUB ||
                  preNode.nodeType === constant.PROJECT.ENTITY_SUB) {
                  return false;
              }
              const currentNode = array.find(d => d[defKey] === nodeId);
              if(preNode.nodeType !== currentNode.nodeType) {
                  return false;
              }
              return  preNode.parents.slice(-1)[0]?.[defKey]
                  === currentNode.parents.slice(-1)[0]?.[defKey];
          };
          if(e.shiftKey && selectedData.findIndex(s => s === nodeId) === -1 && checkSameDir()) {
              const selectedDataIndex = selectedData.map((s) => {
                  return array.findIndex(d => d[defKey] === s);
              });
              const minSelectedIndex = Math.min(...selectedDataIndex);
              const preNode = array[minSelectedIndex];
              const currentIndex = array.findIndex(d => d[defKey] === nodeId);
              if(minSelectedIndex === Infinity || minSelectedIndex === currentIndex) {
                  selectedData = [nodeId];
              } else if(currentIndex > minSelectedIndex) {
                  selectedData = array.slice(minSelectedIndex, currentIndex + 1)
                      .filter(d => preNode.parents.slice(-1)[0]?.[defKey]
                          === d.parents.slice(-1)[0]?.[defKey])
                      .map(d => d[defKey]);
              } else if(currentIndex < minSelectedIndex){
                  selectedData = array.slice(currentIndex, minSelectedIndex + 1)
                      .filter(d => preNode.parents.slice(-1)[0]?.[defKey]
                          === d.parents.slice(-1)[0]?.[defKey])
                      .map(d => d[defKey]);
              }
          } else if((e.ctrlKey || e.metaKey) && checkSameDir()) {
              if(selectedData.includes(nodeId)) {
                  selectedData = selectedData.filter(i => i !== nodeId);
              } else {
                  selectedData = selectedData.concat(nodeId);
              }
          } else if(selectedData.includes(nodeId) && selectedCancel) {
              selectedData = [];
          } else {
              selectedData = [nodeId];
          }
          setSelected(maxSelected > -1 ? selectedData.slice(0, maxSelected) : selectedData);
          onNodeClick && onNodeClick(node, before, after);
      }
      onTreeClick && onTreeClick(node);
      e.stopPropagation();
    };
    const _onContextMenu = (e, node, isLeaf, setLoading, isLoad, iconExpand, before, after) => {
        const nodeId = node[defKey];
        let selectedData = [...selectedRef.current];
        if(!selectedRef.current.includes(nodeId)) {
            selectedData = [nodeId];
            setSelected(selectedData);
        }
        onNodeClick && onNodeClick(node, before, after);
        e.target.value = node;
        e.target.valueArray = selectedData;
        e.preventDefault();
    };
    const rowOnDragEnter = (e, dragData, array, node, type, position) => {
        if(dragData) {
            const checkChild = () => {
                // 父节点 禁止拖动到子节点
                const currentParents = array
                    .find(a => a[defKey] === node[defKey])?.parents || [];
                return (currentParents.findIndex(p => p[defKey] === dragData.from[defKey]) < 0);
            };
            const checkParent = () => {
                // 禁止拖动到相同的父节点
                const fromParents = array
                    .find(a => a[defKey] === dragData.from[defKey])?.parents || [];
                return (node[defKey] === fromParents.slice(-1)[0]?.[defKey])
                    && type === constant.COMPONENT.TREE.SUB;
            };
            const checkSame = () => {
                // 禁止 自己拖动到自己
                return !(dragData.from[defKey] === node[defKey]) || position;
            };
            const _checkSortable = () => {
                // 自定义拖拽禁用
                if(checkSortable) {
                    return checkSortable(dragData, array, node, type, position);
                }
                return true;
            };
            if(checkSame() && checkChild() && !checkParent() && _checkSortable()) {
                setDragOverData((pre) => {
                    return {
                        ...pre,
                        to: node,
                        type,
                        position,
                    };
                });
            }
        }
    };
    const onDragStart = (e, {current, before, after}) => {
        e.stopPropagation();
        treeContainerRef.current.setAttribute('class', `${currentPrefix} ${currentPrefix}-hiddenX`);
        setDragOverData({
            from: current,
            before,
            after,
        });
    };
    const onDragEnd = () => {
        treeContainerRef.current.setAttribute('class', currentPrefix);
        setDragOverData((pre) => {
            if(pre.to && pre.from) {
                // 判断是否是默认节点
                onDragSuccess && onDragSuccess({
                    from: pre.from[defKey],
                    to: pre.to.type === constant.ENTITY.TYPE.DEFAULT ?
                        pre.to.parentId : pre.to[defKey],
                    type: pre.type,
                    position: pre.position,
                }, {
                    current: pre.from,
                    before: pre.before,
                    after: pre.after,
                });
            }
            return null;
        });
    };
    const _onDoubleClick = (node) => {
        onDoubleClick && onDoubleClick(node);
    };
    const _labelRender = (node, search) => {
        if(labelRender) {
            const renderResult = labelRender(node, search);
            if(typeof renderResult === 'string') {
                return calcSearch(renderResult, search);
            }
            return renderResult;
        }
        return calcSearch(node[defName], search);
    };
    const onDragOver = (e) => {
      e.preventDefault();
    };
    const checkRemoveParents = (parents, currentChecked) => {
        return [...parents].reverse().reduce((p, n) => {
            if(!n.children.some(c => p.includes(c[defKey]))) {
                return p.filter(c => c !== n[defKey]);
            }
            return p;
        }, currentChecked);
    };
    const _onNodeCheck = (e, node) => {
        const isChecked = e.target.checked;
        // eslint-disable-next-line max-len
        const parents = node.checkStrictly ? [] : (arrayTreeRef.current.find(n => n[defKey] === node[defKey])?.parents || [])
            .filter(p => !p.checkStrictly);
        const parentsId = parents
            .map(p => p[defKey]);
        const newCheckedId = [node[defKey]]
            .concat(node.checkStrictly ? [] : getNodeChildren(node).filter(p => !p.checkStrictly));
        setChecked((p) => {
            let tempChecked = [];
            if(isChecked) {
                tempChecked = p.concat(newCheckedId).concat(parentsId);
            } else {
                tempChecked =
                    checkRemoveParents(parents, p.filter(id => !newCheckedId.includes(id)));
            }
            onCheck && onCheck(tempChecked.filter((c) => {
                const checkNode = arrayTreeRef.current.find(n => n[defKey] === c);
                return !checkNode.children || checkNode.children.length === 0;
            }), tempChecked);
            return tempChecked;
        });
    };
    const renderExpand = (loading, isLeaf, node, setLoading, before,
                          after, isOpen, isLoad, array, selectedData) => {
        const iconType = node.renderExpandIcon?.(isOpen, selectedData.includes(node[defKey]))
            || (isOpen ? 'icon-folder-open' : 'icon-folder-close');
        // eslint-disable-next-line no-nested-ternary
        return !isLeaf ? <>
          {(showExpandArrow || checkable) && <Icon
            onClick={e => _onNodeClick(e, node, isLeaf, setLoading,
                    isLoad, true, before, after, array)}
            type='icon-polygon-right'
            style={{transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'}}/>}
          {/* eslint-disable-next-line no-nested-ternary */}
          {node.type !== constant.ENTITY.TYPE.DEFAULT && (loading ?
            <Icon status={constant.LOADING}/> : (typeof iconType === 'string' ? <Icon
              onClick={e => _onNodeClick(e, node, isLeaf, setLoading,
                        isLoad, true, before, after, array)}
              style={{
                        // transform: `${isOpen ? 'rotate(360deg)' : 'rotate(270deg)'}`,
                        paddingRight: 18,
                        fontSize: 20,
                    }}
              type={iconType}
                /> : iconType))}</> : (showExpandArrow || checkable) && <span style={{display: 'inline-block', width: 23}}/>;
    };
    const onSortIconMouseDown = (e) => {
        e.stopPropagation();
    };
    const onDoubleAndSelected = (e, node, isLeaf, setLoading, isLoad,
                                 iconExpand, before, after, array) => {
        _onDoubleClick(node);
        _onNodeClick(e, node, isLeaf, setLoading, isLoad,
            iconExpand, before, after, array);
    };
    const TreeNode = useMemo(() =>
        ({data: {isLeaf, node, nestingLevel, isSelected, sort, isEnd,
            dragData, isLoad, search, array, filter, before, after, selectedData,
            indeterminate, isChecked}, style, isOpen}) => {
            const [loading, setLoading] = useState(false);
            const isExit = useRef(true);
            const padding = 20 * nestingLevel + 5;
            useEffect(() => {
                return () => {
                    isExit.current = false;
                };
            }, []);
            const _setLoading = (status) => {
                if(isExit.current) {
                    setLoading(status);
                }
            };
            if(node.loadMoreId) {
                return <li
                  className={`${currentPrefix}-node-more`}
                  onClick={() => _onLoadMoreClick(node, _setLoading)}
                  style={{...style, paddingLeft: padding}}
                >
                  {loading ?  <Icon status={constant.LOADING}/> : '更多'}
                </li>;
            }
            const children = countable ?
                array.find(t => t[defKey] === node[defKey])
                    ?.children?.filter(c => c.type !== constant.ENTITY.TYPE.DEFAULT
                    && (countParent ? true : !c.children) &&
                    (search ? filter.includes(c[defKey]) : true)) || [] : [];
            if(node.render){
                // 完全自定义节点
                return node.render(style, node, isChecked, isOpen, setExpand, search);
            }
            let nodeStyle = {};
            try {
                nodeStyle = node.mark ? JSON.parse(node.mark) : {};
            } catch (e) {
                console.log(e);
            }
            return <li
              onContextMenu={e => _onContextMenu(e, node, isLeaf,
                  _setLoading, isLoad, false, before, after)}
              tabIndex='-1'
              onKeyDown={e => _onNodeKeyDown(e, node)}
              draggable={node.draggable}
              onDragStart={e => onNodeDragStart(e, node, selectedData)}
              onDoubleClick={e => onDoubleAndSelected(e, node, isLeaf,
                  _setLoading, isLoad, false, before, after, array)}
              onClick={e => _onNodeClick(e, node, isLeaf,
                  _setLoading, isLoad, false, before, after, array)}
              style={{...style, paddingLeft: padding, ...node.otherStyle}}
              className={classesMerge({
                    [`${currentPrefix}-node`]: true,
                    [`${currentPrefix}-node-selected`]: isSelected,
                    [`${currentPrefix}-node-drag-enter-sub`]: dragData?.to?.[defKey] === node[defKey]
                    && dragData?.type === constant.COMPONENT.TREE.SUB,
                  [`${currentPrefix}-node-drag-enter-peer-${dragData?.position}`]:
                  dragData?.to?.[defKey] === node[defKey]
                  && dragData?.type === constant.COMPONENT.TREE.PEER,
                })}
            >
              <span
                style={{marginLeft: padding, width: `calc(100% - ${padding}px)`}}
                className={`${currentPrefix}-node-drag-line-before`}
                onDragEnter={e => rowOnDragEnter(e, dragData, array, node,
                    constant.COMPONENT.TREE.PEER, constant.COMPONENT.TREE.BEFORE)}
              />
              {isEnd && <span
                style={{marginLeft: padding, width: `calc(100% - ${padding}px)`}}
                className={`${currentPrefix}-node-drag-line-after`}
                onDragEnter={e => rowOnDragEnter(e, dragData, array, node,
                        constant.COMPONENT.TREE.PEER, constant.COMPONENT.TREE.AFTER)}
                />}
              <span
                className={`${currentPrefix}-node-drag-content`}
                onDragEnter={e => rowOnDragEnter(e, dragData, array, node,
                    constant.COMPONENT.TREE.SUB)}
                >
                <span className={`${currentPrefix}-node-drag-content-expand-left`}>
                  {renderExpand(loading, isLeaf, node,
                          setLoading, before, after, isOpen, isLoad, array, selectedData)}
                </span>
                <span style={{paddingLeft: (checkable && !node.icon && !node.children) ? 20 : 0}} className={`${currentPrefix}-node-drag-content-data`}>
                  {node.icon && <Icon className={`${currentPrefix}-node-drag-content-data-icon`} type={node.icon}/>}
                  <span className={`${currentPrefix}-node-drag-content-data-label`}>
                    {checkable && <Checkbox
                      disable={node.disable}
                      checked={isChecked}
                      indeterminate={indeterminate}
                      onChange={e => _onNodeCheck(e, node)}
                      className={`${currentPrefix}-node-drag-content-data-check`}
                    />}
                    <span style={{background: nodeStyle.bgColor, color: nodeStyle.fontColor}}>
                      {_labelRender(node, search)}
                    </span>
                  </span>
                </span>
                <span className={`${currentPrefix}-node-drag-content-expand-right`}>
                  {/* {node.type === constant.ENTITY.TYPE.DEFAULT &&
                          renderExpand(loading, isLeaf, node,
                              setLoading, before, after, isOpen, isLoad, array)}*/}
                </span>
                <span className={`${currentPrefix}-node-drag-content-drag`}>
                  {!isLeaf &&
                    <span>
                        {
                            typeof countable === 'function' ? countable(node, children) : `(${children.length})`
                        }
                    </span>}
                  {
                      sort && node.sortable !== false && <Icon
                        onDragEnd={onDragEnd}
                        onMouseDown={onSortIconMouseDown}
                        className={`${currentPrefix}-node-drag-icon shake`}
                        draggable
                        onDragStart={e => onDragStart(e, {
                            current: node,
                            after,
                            before,
                        })}
                        type='icon-drag-block'
                      />
                  }
                </span>
              </span>
            </li>;
        }, []);
    const setUlRef = (instance) => {
        if(instance && scrollRef.current) {
            ulRef.current = instance;
            if(instance.parentElement.scrollHeight !== instance.parentElement.clientHeight) {
                scrollRef.current.style.display = 'block';
            }
        }
    };
    useEffect(() => {
        if(ulRef.current) {
            if(ulRef.current.parentElement.scrollHeight !==
                ulRef.current.parentElement.clientHeight) {
                scrollRef.current.style.display = 'block';
            }
        }
    }, [expand]);
    const onScroll = (e) => {
        if(scrollRef.current && (e.target.clientHeight !== e.target.scrollHeight)) {
            const scrollTop = e.target.scrollTop;
            if((scrollTop + e.target.clientHeight + 0.5) >= e.target.scrollHeight) {
                // 滚到底了
                scrollRef.current.style.display = 'none';
            } else {
                scrollRef.current.style.display = 'block';
            }
        }
    };
    const innerElementType = useCallback(({children, ...props}) => {
        return <ul ref={setUlRef} {...props}>{children}</ul>;
    }, []);
    const onMouseDown = (e) => {
        preventDefault && e.preventDefault();
    };
    const onKeyDown = (e) => {
        if((e.keyCode === 38 || e.keyCode === 40) && selectedRef.current.length > 0) {
            // 更换选中对象
            const currentNode = arrayTreeFilterRef.current
                .find(n => n.id === selectedRef.current[selectedRef.current.length - 1]);
            if(currentNode) {
                const parent = currentNode.parents.slice(-1)[0];
                if(parent) {
                    const children = parent.children;
                    const currentIndex = children.findIndex(c => c.id === currentNode.id);
                    const nextIndex = e.keyCode === 40 ? currentIndex + 1 : currentIndex - 1;
                    if((nextIndex > -1) && (nextIndex < children.length)) {
                        setSelected([children[nextIndex].id]);
                    }
                }
            }
        } else if(e.keyCode === 13 && selectedRef.current.length > 0) {
            const currentNode = arrayTreeFilterRef.current
                .find(n => n.id === selectedRef.current[selectedRef.current.length - 1]);
            _onDoubleClick(currentNode);
        }
    };
    return <div
      onKeyDown={onKeyDown}
      onScroll={onScroll}
      ref={treeContainerRef}
      onMouseDown={onMouseDown}
      onDragOver={onDragOver}
      className={currentPrefix}>
      {
          (tempData.length > 0) ? <AutoSizer>
            {({height, width}) => {
                    return <FixedSizeTree
                      ref={treeRef}
                      innerElementType={innerElementType}
                      treeWalker={treeWalker}
                      itemSize={30}
                      height={height}
                      width={width}
                    >
                      {TreeNode}
                    </FixedSizeTree>;
                }}
          </AutoSizer> : <div className={`${currentPrefix}-empty`}>暂无数据</div>
        }
      {scrollStyle && <div ref={scrollRef} className={`${currentPrefix}-scroll`} />}
    </div>;
}));

Tree.defaultProps = {
    fieldNames: {
        icon: 'icon',
        key: 'defKey',
        defKey: 'id',
        defName: 'defName',
    },
};

export default Tree;
