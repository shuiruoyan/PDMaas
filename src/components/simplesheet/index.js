import React, {useEffect, forwardRef, useImperativeHandle, useContext, useMemo} from 'react';

import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {ConfigContent} from '../../lib/context';


export default React.memo(forwardRef(({data, columns, rowId, columnWidth},
                                      ref) => {
    const currentPrefix = getPrefix('components-simple-sheet');
    const container = useMemo(() => `com-${Math.uuid()}`, []);
    const { lang } = useContext(ConfigContent);
    const getDataCell = (d, c) => {
        return d.reduce((p, n, i) => {
            return p.concat(c.map((k, j) => {
                return {
                    r: i,
                    c: j,
                    v: {
                        v: n[columns[j].key],
                        customKey: { [rowId]: n[rowId] },
                    },
                };
            }));
        }, []);
    };
    useEffect(() => {
        const options = {
            container,
            lang,
            showtoolbar: false,
            showinfobar: false,
            showsheetbar: false,
            sheetFormulaBar: false,
            showstatisticBarConfig: {
                count: false, // 计数栏
                view: false, // 打印视图
                zoom: true, // 缩放
            },
            columnHeaderHeight: 27,
            rowTemplate: () => null,
            column: columns.length,
            row: data.length === 0 ? 10 : data.length,
            lockColumns: true,
            enableAddBackTop: false,
            enableAddRow: false,
            hook:{
                pasteHandlerOfCutOrCopyPaste: (copyData) => {
                    return copyData.map((r) => {
                        return r.map((c) => {
                            if(c?.customKey) {
                                return {
                                    ...c,
                                    customKey: {},
                                };
                            }
                            return c;
                        });
                    });
                },
                columnTitleCellRender:  (columnAbc) => {
                    return columns[columnAbc]?.label || columnAbc;
                },
            },
            data: [{
                name: 'Cell',
                defaultRowHeight: 27,
                config: {
                    columnlen: columnWidth,
                },
                celldata: getDataCell(data, columns),
            }],
            cellRightClickConfig: {
                copy: true, // 复制
                copyAs: false, // 复制为
                paste: true, // 粘贴
                insertRow: true, // 插入行
                insertColumn: false, // 插入列
                deleteRow: true, // 删除选中行
                deleteColumn: false, // 删除选中列
                deleteCell: false, // 删除单元格
                hideRow: false, // 隐藏选中行和显示选中行
                hideColumn: false, // 隐藏选中列和显示选中列
                rowHeight: true, // 行高
                columnWidth: true, // 列宽
                clear: true, // 清除内容
                matrix: false, // 矩阵操作选区
                sort: false, // 排序选区
                filter: false, // 筛选选区
                chart: false, // 图表生成
                image: false, // 插入图片
                link: false, // 插入链接
                data: false, // 数据验证
                cellFormat: false, // 设置单元格格式
                customs: [{
                    title: '冻结首行',
                    onClick:  () => {
                        luckysheet.setHorizontalFrozen(false);
                    },
                },{
                    title: '冻结行至选区',
                    onClick:  (clickEvent, event, params) => {
                        luckysheet.setHorizontalFrozen(true, {
                            range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                        });
                    },
                },{
                    title: '冻结首列',
                    onClick:  () => {
                        luckysheet.setVerticalFrozen(false);
                    },
                },{
                    title: '冻结列至选区',
                    onClick:  (clickEvent, event, params) => {
                        luckysheet.setVerticalFrozen(true, {
                            range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                        });
                    },
                },
                    {
                        title: '冻结首行首列',
                        onClick:  () => {
                            luckysheet.setBothFrozen(false);
                        },
                    },
                    {
                        title: '冻结行列至选区',
                        onClick:  (clickEvent, event, params) => {
                            luckysheet.setBothFrozen(true, {
                                range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                            });
                        },
                    },
                    {
                        title: '取消冻结',
                        onClick:  () => {
                            luckysheet.cancelFrozen();
                        },
                    }],
            },
        };
        luckysheet.create(options);
        return () => {
            luckysheet.destroy();
        };
    }, []);
    useImperativeHandle(ref, () => {
        return {
            getSheetData: () => {
                return luckysheet.getSheetData().map((r) => {
                    return columns.reduce((p, n, i) => {
                        return {
                            ...p,
                            [rowId]: p[rowId] || r[i]?.customKey?.[rowId],
                            [n.key]: r[i]?.v,
                        };
                    }, {});
                }).map((r) => {
                    const preRow = data.find(d => d[rowId] === r[rowId]);
                    if(preRow) {
                        return {
                            ...preRow,
                            ...r,
                        };
                    }
                    return r;
                });
            },
            deleteRow: (rowStart, rowEnd, ...setting) => {
                luckysheet.deleteRow(rowStart, rowEnd, setting);
            },
            addRow: (rowLength) => {
                luckysheet.insertRow(luckysheet.flowdata().length - 1,
                    {number: rowLength, direction: 'rightbottom'});
            },
            destroy: () => {
                luckysheet.destroy();
            },
            setRangeValue: (d, setting) => {
                luckysheet.setRangeValue(d, setting);
            },
            getRange: () => {
                return luckysheet.getRange();
            },
        };
    }, []);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-content`} id={`${container}`}/>
    </div>;
}));
