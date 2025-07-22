import React, {useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect, useMemo} from 'react';
import {VariableSizeTree} from 'react-vtree';
import AutoSizer from 'react-virtualized-auto-sizer';

import {Icon, Checkbox, SearchInput} from 'components';
import { TableContext, PermissionContext } from '../../lib/context';
import Cell from './Cell';
import './style/index.less';
import {classesMerge, getPrefix} from '../../lib/classes';
import {getSafeReg} from '../../lib/reg';

export default React.memo(forwardRef(({
                                          data, columns, rowKey = 'id', columnEnableSelected,
                                          onColumnSelected, onSelect, onChange, onInputBlur,
                                          onInputFocus, onColumnsChange, itemSize = 35,
                                          fixed = false, rowEnableSelected = true,
                                          onFilter, quickOpt, onCopy, onPaste, multiple = false,
                                          onDrop, nsKey, tableHeader, scrollStyle, onSort,
                                          customSorting,
                                      }, ref) => {
    const [expand, setExpand] = useState([]);
    const [columnsData, setColumnsData] = useState([]);
    const columnsDataRef = useRef([]);
    columnsDataRef.current = columnsData;
    const [rowSelected, setRowSelected] = useState([]);
    const rowSelectedRef = useRef([]);
    const listRef = useRef(null);
    const scrollRef = useRef(null);
    const [searchData, setSearchData] = useState(null);
    const [sortData, setSortData] = useState(null);
    const sortDataRef = useRef(null);
    sortDataRef.current = sortData;
    const [filterData, setFilterData] = useState(null);
    const resizeRef = useRef({
        isResize: false,
    });
    const headerRef = useRef(null);
    const resizeLineRef = useRef(null);
    const tableRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState('');
    const scrollPositionRef = useRef('');
    scrollPositionRef.current = scrollPosition;
    rowSelectedRef.current = [...rowSelected];
    const currentPrefix = getPrefix('components-table');
    const headerId = 'header';
    const indexWidthRef = useRef(0);
    // 序号宽度最多容纳99999
    indexWidthRef.current = 45;
    // 缓存数据高度 防止重新渲染时数据丢失
    const itemSizeRef = useRef({});
    const getFlexGrow = (i, cData) => {
        const column = cData[i];
        if(cData.some(c => c.widthFit)){
            if(column.widthFit) {
                return 1;
            }
            return 0;
        }
        return i === cData.length - 1 ? 1 : 0;
    };
    const getSticky = (c, i, cData, node) => {
        if(c.fixed) {
            const offsetData = c.fixed === 'L' ? cData.slice(0, i)
                : cData.slice(i + 1);
            return {
                zIndex: node === 'header' ? 4 : 3,
                position: c.fixed ? 'sticky' : 'relative',
                [c.fixed === 'L' ? 'left' : 'right']: offsetData.reduce((p, n) => {
                    return p + n.width;
                }, c.fixed === 'L' ? indexWidthRef.current : 0),
            };
        }
        return {};
    };
    const dataRef = useRef([]);
    dataRef.current = data;
    const finalDataRef = useRef([]);
    const getPositionClass = (c, next, pre, scroll) => {
        return classesMerge({
            [`${currentPrefix}-body-header-column-resize`]: c.resize,
            [`${currentPrefix}-body-fixed-left-last`]: scroll && scroll !== 'left' && c.fixed === 'L' && next?.fixed !== 'L',
            [`${currentPrefix}-body-fixed-right-first`]: scroll && scroll !== 'right' && c.fixed === 'R' && pre?.fixed !== 'R',
        });
    };
    const onHeaderColumnMouseDown = (c, e) => {
        const tableRect = tableRef.current.getBoundingClientRect();
        const left = e.clientX - tableRect.x;
        resizeRef.current = {
            isResize: true,
            left,
            x: e.clientX,
            column: c,
        };
        tableRef.current.style.cursor = 'col-resize';
        resizeLineRef.current.style.left = `${left}px`;
    };
    const onTableMouseMove = (e) => {
        if(resizeRef.current.isResize) {
            const offsetLeft = e.clientX - resizeRef.current.x;
            resizeLineRef.current.style.left = `${resizeRef.current.left + offsetLeft}px`;
            e.preventDefault();
        }
    };
    const onTableMouseLeave = (e) => {
        if(resizeRef.current.isResize) {
            tableRef.current.style.cursor = 'default';
            const offsetLeft = e.clientX - resizeRef.current.x;
            const tempColumns = columnsDataRef.current.map((c) => {
                if(c.key === resizeRef.current.column.key) {
                    return {
                        ...c,
                        width: c.width + offsetLeft,
                    };
                }
                return c;
            });
            resizeRef.current = {
                isResize: false,
            };
            resizeLineRef.current.style.left = `${-4}px`;
            setColumnsData(tempColumns);
            onColumnsChange && onColumnsChange(tempColumns);
        }
    };
    const onLockClick = (column) => {
        const isLock = !!column.fixed;
        let tempColumns;
        // 计算是固定至左侧还是右侧
        const currentIndex = columnsDataRef.current.findIndex(c => c.key === column.key);
        let fixedType;
        if(currentIndex < (columnsDataRef.current.length / 2)) {
            // 固定左侧
            fixedType = 'L';
        } else {
            // 固定右侧
            fixedType = 'R';
        }
        // 由锁定状态切换至非锁定状态
        if(isLock) {
            tempColumns = columnsDataRef.current.map((c, i) => {
                if(column.fixed === 'R' && i <= currentIndex && c.fixed === 'R') {
                    return {
                        ...c,
                        fixed: '',
                    };
                } else if(column.fixed === 'L' && i >= currentIndex && c.fixed === 'L') {
                    return {
                        ...c,
                        fixed: '',
                    };
                }
                return c;
            });
        } else {
            // 由非锁定状态切换至锁定状态
            tempColumns = columnsDataRef.current.map((c, i) => {
                if(fixedType === 'L' && i <= currentIndex) {
                    return {
                        ...c,
                        fixed: fixedType,
                    };
                } else if(fixedType === 'R' && i >= currentIndex) {
                    return {
                        ...c,
                        fixed: fixedType,
                    };
                }
                return c;
            });
        }
        setColumnsData(tempColumns);
        onColumnsChange && onColumnsChange(tempColumns);
    };
    const checkIndexClass = (defaultClass, scroll, c) => {
        return classesMerge({
            [defaultClass]: true,
            [`${currentPrefix}-body-fixed-left-last`]: scroll && scroll !== 'left' && c?.fixed !== 'L',
        });
    };
    const checkRowSelected = (id, node) => {
        if(typeof rowEnableSelected === 'function') {
            return rowEnableSelected(id, node);
        }
        return true;
    };
    const Header = useCallback(() => {
        const ids = finalDataRef.current.filter(d => checkRowSelected(d[rowKey], d))
            .map(d => d[rowKey]);
        const checkStatus = () => {
            return {
                checked: rowSelectedRef.current.length > 0,
                indeterminate: (rowSelectedRef.current.length > 0) &&
                    (rowSelectedRef.current.length !== ids.length),
            };
        };
        const onCheckChange = (e) => {
            const checked = e.target.checked;
            if(checked) {
                setRowSelected(ids);
                onSelect && onSelect(ids);
            } else {
                setRowSelected([]);
                onSelect && onSelect([]);
            }
        };
        const [columnSelected, setColumnSelected] = useState([]);
        const [sort, setSort] = useState({});
        const [filter, setFilter] = useState({});
        const [openFilter, setOpenFilter] = useState('');
        const _sort = (direction, column) => {
            if(column === sort.column && direction === sort.direction) {
                setSort({});
                !customSorting && setSortData(null);
                onSort && onSort(null);
            } else {
                setSort({direction, column});
                !customSorting && setSortData({direction, column});
                onSort && onSort({direction, column});
            }
        };
        const _onColumnSelected = (c) => {
            if(columnEnableSelected && columnEnableSelected.length > 0 &&
                columnEnableSelected.includes(c.key)) {
                if(columnSelected[0] === c) {
                    setColumnSelected([]);
                    onColumnSelected([]);
                } else {
                    setColumnSelected([c]);
                    onColumnSelected([c]);
                }
            }
        };
        const onSearchChange = (e, column) => {
            setFilter((pre) => {
                return {
                    ...pre,
                    [column.key]: e.target.value,
                };
            });
            setFilterData((pre) => {
                return {
                    ...pre,
                    [column.key]: {
                        value: e.target.value,
                        filter: column.filter,
                    },
                };
            });
        };
        useImperativeHandle(headerRef, () => {
            return {
                clearSortStatus: () => {
                    setSort({});
                },
            };
        }, []);
        return <div
          className={`${currentPrefix}-body-header`}
          style={{height: 35, width: 'fit-content',  minWidth: '100%', zIndex: 4, top: tableHeader ? 35 : 0}}
        >
          <span
            className={checkIndexClass(`${currentPrefix}-body-header-index`, scrollPositionRef.current, columnsDataRef.current[0])}
            style={{width: indexWidthRef.current}}
          >{rowEnableSelected &&
          <span
            className={`${currentPrefix}-body-header-checkbox`}
          >
            <Checkbox
              {...checkStatus()}
              onChange={onCheckChange}
            />
          </span>
          }
          </span>
          {columnsDataRef.current.map((c, i) => {
                return <span
                  onMouseDown={e => onHeaderColumnMouseDown(c, e)}
                  className={getPositionClass(c, columnsDataRef.current[i + 1],
                        columnsDataRef.current[i - 1], scrollPositionRef.current)}
                  style={{
                        width: c.width,
                        ...getSticky(c, i, columnsDataRef.current, 'header'),
                        flexGrow: getFlexGrow(i, columnsDataRef.current),
                    }}
                  key={c.key}
                >
                  <span
                    onMouseDown={e => e.stopPropagation()}
                    style={{pointerEvents: 'auto', cursor: 'pointer'}}
                    onClick={() => _onColumnSelected(c)}
                      >
                    {c.labelRender ? c.labelRender() : c.label}
                  </span>
                  {fixed && <span
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => onLockClick(c)}
                    className={classesMerge({
                        [`${currentPrefix}-body-header-lock`]: true,
                        [`${currentPrefix}-body-header-lock-fixed`]: c.fixed,
                    })}>
                      {c.fixed ? <Icon type='icon-nail-fixed'/>
                              : <Icon type='icon-nail-unfixed'/>}
                    </span>}
                  {c.sort && <span
                    onMouseDown={e => e.stopPropagation()}
                    className={classesMerge({
                        [`${currentPrefix}-body-header-sort`]: true,
                        [`${currentPrefix}-body-header-sort-${sort.direction}`]: sort.column === c,
                    })}
                  >
                    <Icon type='icon-trian-up' onClick={() => _sort('up', c)}/>
                    <Icon type='icon-trian-down' onClick={() => _sort('down', c)}/>
                    </span>}
                  {c.filter && openFilter === c.key && <span
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <SearchInput
                      placeholder={c.label}
                      onBlur={() => setOpenFilter('')}
                      autoFocus
                      className={`${currentPrefix}-body-header-filter-input`}
                      defaultValue={filter[c.key] || ''}
                      onChange={e => onSearchChange(e, c)}
                    />
                  </span>}
                  {c.filter && <span
                    onClick={() => setOpenFilter(c.key)}
                    style={{right: c.sort ? 17 : 3}}
                    onMouseDown={e => e.stopPropagation()}
                    className={classesMerge({
                            [`${currentPrefix}-body-header-filter`]: true,
                            [`${currentPrefix}-body-header-filter-value`]: filter[c.key],
                        })}
                    >
                    <Icon type='icon-filter'/>
                    </span>}
                  {
                      columnSelected[0]?.key === c.key &&
                        <span
                          className={`${currentPrefix}-body-header-selected`}
                        >
                          <Icon type='icon-check-solid'/>
                        </span>
                    }
                </span>;
            })}
        </div>;
    }, []);
    const onDragOver = (e) => {
        e.preventDefault();
    };
    const _onDrop = (e) => {
        onDrop && onDrop(e);
    };
    const setTableRef = (instance) => {
        tableRef.current = instance;
        if(instance && scrollRef.current) {
            if(instance.parentElement.scrollHeight !== instance.parentElement.clientHeight) {
                scrollRef.current.style.display = 'block';
            }
        }
    };
    const innerElementType = useCallback(({children, ...props}) => {
        return <div
          ref={setTableRef}
          onMouseUp={onTableMouseLeave}
          onMouseMove={onTableMouseMove}
          onMouseLeave={onTableMouseLeave}
          className={`${currentPrefix}-body`}
          {...props}
          style={{...props.style}}>
          <div ref={resizeLineRef} className={`${currentPrefix}-body-resize`}/>
          {tableHeader && tableHeader(columnsDataRef.current, scrollPositionRef.current)}
          <Header ref={headerRef}/>
          {
              children.length > 1 ? children : <div className={`${currentPrefix}-body-empty`}>暂无数据</div>
          }
        </div>;
    }, []);
    const getNodeData = (node, index, scroll) => ({
        data: {
            defaultHeight: itemSizeRef.current[node[rowKey]] ||
                (typeof itemSize === 'object' ? (itemSize[node[rowKey]] || 35) : itemSize),
            id: node[rowKey],
            isOpenByDefault: expand.includes(node[rowKey]),
            node,
            index,
            columnData: columnsData,
            selectedNodes: rowSelected,
            scroll,
        },
    });
    const _onSelect = (node, e) => {
        const id = node[rowKey];
        if(rowEnableSelected && checkRowSelected(id, node)) {
            let selectedData = [...rowSelectedRef.current];
            if(e.shiftKey) {
                const selectedDataIndex = selectedData.map((s) => {
                    return finalDataRef.current.findIndex(d => d[rowKey] === s);
                });
                const minSelectedIndex = Math.min(...selectedDataIndex);
                const currentIndex = finalDataRef.current.findIndex(d => d[rowKey] === id);
                if(minSelectedIndex === Infinity || minSelectedIndex === currentIndex) {
                    selectedData = [id];
                } else if(currentIndex > minSelectedIndex) {
                    selectedData = finalDataRef.current.slice(minSelectedIndex, currentIndex + 1)
                        .filter(d => checkRowSelected(d[rowKey], d))
                        .map(d => d[rowKey]);
                } else if(currentIndex < minSelectedIndex){
                    selectedData = finalDataRef.current.slice(currentIndex, minSelectedIndex + 1)
                        .filter(d => checkRowSelected(d[rowKey], d))
                        .map(d => d[rowKey]);
                }
            } else if(e.ctrlKey || e.metaKey || multiple) {
                if(selectedData.includes(id)) {
                    selectedData = selectedData.filter(i => i !== id);
                } else {
                    selectedData = selectedData.concat(id);
                }
            } else if(selectedData.includes(id)) {
                    selectedData = [];
                } else {
                    selectedData = [id];
                }
            setRowSelected(selectedData);
            onSelect && onSelect(selectedData);
        }
    };
    function* treeWalker() {
        let tempData = [...data];
        if(searchData?.filterValue) {
            const reg = getSafeReg(searchData.filterValue);
            tempData = tempData.filter((f) => {
                reg.lastIndex = 0;
                return searchData.filterName.some(n => reg.test(f[n]));
            });
        }
        if(sortData) {
            const currentColumn = sortData.column;
            const direction = sortData.direction;
            tempData.sort((a, b) => {
                if(typeof currentColumn.sort === 'function') {
                    return currentColumn.sort(a, b, direction);
                } if(direction === 'down') {
                    return a[currentColumn.key].localeCompare(b[currentColumn.key]);
                } else {
                    return b[currentColumn.key].localeCompare(a[currentColumn.key]);
                }
            });
        }
        if(filterData && Object.keys(filterData).some(f => filterData[f].value)) {
            tempData = tempData.filter((d) => {
                return !Object.keys(filterData).some((f) => {
                    const reg = getSafeReg(filterData[f].value);
                    const filter = d[f]?.filter;
                    if(typeof filter === 'function') {
                        return filter(d, f, filterData);
                    }
                    return !reg.test(d[f]);
                });
            });
        }
        finalDataRef.current = tempData;
        tempData = [{id: headerId}].concat(tempData);
        if(tableHeader) {
            tempData.unshift({id: 'tableHeader'});
        }
        for (let i = 0; i < tempData.length; i += 1) {
            yield getNodeData(tempData[i], i, scrollPosition);
        }
        while (true){
            const parent = yield;
            const children = parent.data.node?.children;
            for (let i = 0; i < children?.length; i += 1) {
                yield getNodeData(children[i], parent.data.nestingLevel + 1,
                    i === (children.length - 1), children[i - 1], children[i + 1]);
            }
        }
    }
    const getCurrentNodeData = (node) => {
        return dataRef.current.find(d => d[rowKey] === node[rowKey]);
    };
    const TreeNode = useCallback(({data: {node, index, columnData, selectedNodes, scroll},
                                      style, resize}) => {
        const rowRef = useRef(null);
        const _resize = useCallback((...args) => {
            resize(...args);
            // 缓存高度
            itemSizeRef.current[node[rowKey]] = args[0];
        }, []);
        const _onInputBlur = useCallback((...args) => {
            onInputBlur && onInputBlur(...args, getCurrentNodeData(node));
        }, []);
        const _onInputFocus = useCallback((...args) => {
            if(args[2]?.resetSelected) {
                setRowSelected([]);
                onSelect && onSelect([]);
            }
            onInputFocus && onInputFocus(...args, getCurrentNodeData(node));
        }, []);
        const _onChange = useCallback((...args) => {
            onChange && onChange(...args.slice(0, 5), getCurrentNodeData(node), ...args.slice(5));
        }, []);
        const _setExpand = useCallback(() => {
            setExpand((p) => {
                const currentIndex = p.findIndex(key => key === node[rowKey]);
                if(currentIndex > -1) {
                    const temp = [...p];
                    temp.splice(currentIndex, 1);
                    return temp;
                }
                return p.concat(node[rowKey]);
            });
        }, []);
        const focusInput = (e, rowsDom, columnIndex) => {
            const rowIndex = rowsDom.findIndex(row => row === rowRef.current);
            if(rowIndex >= 0 && columnIndex >= 0) {
                if(e.keyCode === 37 || e.keyCode === 39) {
                    const findInput = (inputs, i) => {
                        const input = inputs[i]?.querySelector?.('input');
                        if(i < 0 || !inputs[i]) {
                            return e.currentTarget;
                        } else if(!input ||
                            (input.getAttribute('type') && input.getAttribute('type') !== 'text') ||
                            input.getAttribute('disabled') !== null) {
                            return findInput(inputs, e.keyCode === 37 ? i - 1 : i + 1);
                        }
                        return input;
                    };
                    const selectionStart = e.currentTarget.selectionStart;
                    const valueLength = e.currentTarget.value.length;
                    if((selectionStart === 0 && e.keyCode === 37)
                        || (selectionStart === valueLength && e.keyCode === 39)) {
                        const currentRowDom = rowsDom[rowIndex];
                        const currentRowCellsDom = Array.from(currentRowDom.querySelectorAll(`.${currentPrefix}-cell`));
                        const focusDom = findInput(currentRowCellsDom, columnIndex);
                        focusDom.click();
                        focusDom.focus();
                        focusDom.setSelectionRange(0,  focusDom.value.length);
                        e.preventDefault();
                    }
                } else {
                   const currentDom = rowsDom[e.keyCode === 38 ? rowIndex - 1 : rowIndex + 1];
                   if(currentDom) {
                       const currentRowCellsDom = Array.from(currentDom.querySelectorAll(`.${currentPrefix}-cell`));
                       const input = currentRowCellsDom[columnIndex].querySelector('input');
                       input.click();
                       input.focus();
                       input.setSelectionRange(0, input.value.length);
                       e.preventDefault();
                   }
                }
            }
            e.stopPropagation();
        };
        const onKeyDown = useCallback((e, column) => {
            const code = e.keyCode;
            const columnIndex = columnData.findIndex(c => c.key === column.key);
            const rowsDom = Array.from(tableRef.current.querySelectorAll(`.${currentPrefix}-body-item`));
            switch (code) {
                case 37: focusInput(e, rowsDom,
                    columnIndex - 1); break;
                case 38: focusInput(e, rowsDom, columnIndex); break;
                case 39: focusInput(e, rowsDom,
                    columnIndex + 1); break;
                case 40: focusInput(e, rowsDom, columnIndex); break;
                default: break;
            }
        }, []);
        if(index === 0 || (index === 1 && tableHeader)) {
            return null;
        }
        if(node.render) {
            return node.render(node, style);
        }
        let nodeStyle = {};
        try {
            nodeStyle = node.mark ? JSON.parse(node.mark) : {};
        } catch (e) {
            console.log(e);
        }
        return <div
          data-id={node[rowKey]}
          ref={rowRef}
          className={classesMerge({
            [`${currentPrefix}-body-item`]: true,
            [`${currentPrefix}-body-item-check`]: selectedNodes.includes(node[rowKey]),
            [`${currentPrefix}-body-item-check-disable`]: !checkRowSelected(node[rowKey], node),
        })}
          style={{...style, width: 'fit-content', minWidth: '100%'}}>
          <span
            onClick={e => _onSelect(node, e)}
            className={checkIndexClass(`${currentPrefix}-body-item-index`, scroll, columnData[0])}
            style={{
                width: indexWidthRef.current,
                background: nodeStyle.bgColor,
                color: nodeStyle.fontColor,
            }}>
            <span><Icon type='icon-check-solid'/></span>
            <span>{index - (tableHeader ? 1 : 0)}</span>
          </span>
          {columnData.map((c, i) => {
                return <span
                  className={getPositionClass(c, columnData[i + 1], columnData[i - 1], scroll)}
                  style={{
                      flexGrow: getFlexGrow(i, columnData),
                      width: c.width,
                      ...getSticky(c, i, columnData, node),
                }}
                  key={c.key}>
                  <Cell
                    setExpand={_setExpand}
                    autoSelection
                    onKeyDown={onKeyDown}
                    props={c.props}
                    readOnly={c.readOnly}
                    resize={_resize}
                    onBlur={_onInputBlur}
                    onFocus={_onInputFocus}
                    rowKey={node[rowKey]}
                    column={c}
                    row={node}
                    onChange={_onChange}
                    options={c.options}
                    component={c.component}
                    value={node[c.key]}
                    effectUpdate={c.effectUpdate}
                    fieldNames={c.fieldNames}
                    />
                </span>;
            })}
        </div>;
    }, []);
    const onScroll = (e) => {
        const scrollLeft = e.target.scrollLeft;
        if(scrollLeft === 0) {
            // 最左侧
            setScrollPosition('left');
        } else if((e.target.scrollWidth - e.target.clientWidth) === scrollLeft) {
            // 最右侧
            setScrollPosition('right');
        } else {
            setScrollPosition('center');
            // 中间位置
        }
        if(scrollRef.current && (e.target.clientHeight !== e.target.scrollHeight)) {
            const scrollTop = e.target.scrollTop;
            if((scrollTop + e.target.clientHeight) >= e.target.scrollHeight) {
                // 滚到底了
                scrollRef.current.style.display = 'none';
            } else {
                scrollRef.current.style.display = 'block';
            }
        }
    };
    const onKeyDown = (e) => {
        if(rowEnableSelected) {
            let selectedData = [...rowSelectedRef.current];
            const currentIndex = finalDataRef.current
                .findIndex(d => d[rowKey] === selectedData[selectedData.length - 1]);
            if(currentIndex > -1) {
                const code = e.keyCode;
                if(e.ctrlKey || e.metaKey) {
                    if(code === 38 || code === 40) {
                        const checkNext = (index) => {
                            const newSelectedData =  finalDataRef.current[index];
                            const newSelected = newSelectedData?.[rowKey];
                            if(newSelected) {
                                if(checkRowSelected(newSelected, newSelectedData) &&
                                    selectedData.findIndex(d => d === newSelected) < 0) {
                                    // 增加选中
                                    selectedData = selectedData.concat(newSelected);
                                    setRowSelected(selectedData);
                                    onSelect && onSelect(selectedData);
                                } else {
                                    checkNext(index + (code === 38 ? -1 : 1));
                                }
                            }
                        };
                        checkNext(currentIndex + (code === 38 ? -1 : 1));
                    } else if(code === 73 || code === 68) {
                        quickOpt && quickOpt(code);
                        e.preventDefault();
                    } else if(code === 67) {
                        onCopy && onCopy();
                    } else if(code === 86) {
                        onPaste && onPaste();
                    }
                } else if(code === 38 || code === 40) {
                    const checkNext = (index) => {
                        const newSelectedData =  finalDataRef.current[index];
                        const newSelected = newSelectedData?.[rowKey];
                        if(newSelected) {
                            if(checkRowSelected(newSelected, newSelectedData)) {
                                selectedData = [newSelected];
                                setRowSelected(selectedData);
                                onSelect && onSelect(selectedData);
                            } else {
                                checkNext(index + (code === 38 ? -1 : 1));
                            }
                        }
                    };
                    checkNext(currentIndex + (code === 38 ? -1 : 1));
                }
            }
        }
    };
    useEffect(() => {
        // 列的数据发生变化 需要重新计算固定属性
        setColumnsData(fixed ? columns.map((c, i) => {
            if(!c.fixed && columns[i + 1] && columns[i + 1].fixed === 'L') {
                return {
                    ...c,
                    fixed: 'L',
                };
            } else if(!c.fixed && columns[i - 1] && columns[i - 1].fixed === 'R') {
                return {
                    ...c,
                    fixed: 'R',
                };
            }
            return c;
        }) : [...columns]);
    }, [columns]);
    useEffect(() => {
        if(filterData) {
            if(Object.keys(filterData).some(f => filterData[f].value)) {
                onFilter && onFilter(finalDataRef.current);
            } else {
                onFilter && onFilter([]);
            }
        }
    }, [filterData]);
    useEffect(() => {
        // const click = (e) => {
        //     const target = e.target;
        //     if(!(target === tableRef.current || isChild(tableRef.current, target))) {
        //         setRowSelected([]);
        //         onSelect && onSelect([]);
        //     }
        // };
        // document.addEventListener('click', click);
        // return () => {
        //     document.removeEventListener('click', click);
        // };
    }, []);
    useImperativeHandle(ref, () => {
        return {
            resetExpand: (expandValue) => {
                setExpand(expandValue);
            },
            filterRow: (filterValue, filterName = ['defKey', 'defName']) => {
                setSearchData({
                    filterName,
                    filterValue,
                });
            },
            resetSelected: (selected = []) => {
                setRowSelected(selected);
            },
            scroll: (id, autoTwinkle = true) => {
                setTimeout(() => {
                    if(listRef.current) {
                        listRef.current.scrollToItem(id);
                        if(autoTwinkle) {
                            const items = Array.from(tableRef.current
                                .querySelectorAll(`.${currentPrefix}-body-item`));
                            const scrollItem = items.find(i => i.getAttribute('data-id') === id);
                            if(scrollItem) {
                                const tempClass = scrollItem.getAttribute('class');
                                const twinkle = `${currentPrefix}-body-item-twinkle`;
                                scrollItem.setAttribute('class', `${tempClass} ${twinkle}`);
                                setTimeout(() => {
                                    scrollItem.setAttribute('class', tempClass);
                                }, 1000);
                            }
                        }
                    }
                }, 200);
            },
            getSortData: () => {
                return sortDataRef.current;
            },
            clearSortStatus: () => {
                headerRef.current.clearSortStatus();
            },
        };
    }, []);
    const provider = useMemo(() => ({isTable: true}), []);
    return <div
      onDragOver={onDragOver}
      onDrop={_onDrop}
      tabIndex='-1'
      onKeyDown={onKeyDown}
      onScroll={onScroll}
      className={currentPrefix}>
      <TableContext.Provider value={provider}>
        <PermissionContext.Provider value={nsKey}>
          <AutoSizer>
            {({height, width}) => {
                    return <VariableSizeTree
                      ref={listRef}
                      innerElementType={innerElementType}
                      treeWalker={treeWalker}
                      height={height}
                      width={width}
                    >
                      {TreeNode}
                    </VariableSizeTree>;
                }}
          </AutoSizer>
        </PermissionContext.Provider>
      </TableContext.Provider>
      {scrollStyle && <div ref={scrollRef} className={`${currentPrefix}-scroll`} />}
    </div>;
}));
