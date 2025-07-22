import React, {useEffect, useState, useImperativeHandle, forwardRef, useRef} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

import { Icon, Loading } from 'components';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import * as constant from '../../lib/constant';

export default React.memo(forwardRef(({data, itemRender, innerElementType,
                                          loadData, itemSize = 30, empty,
                                          hoverStyle = true, refactorData}, ref) => {
    const listRef = useRef(null);
    const [dataList, setDataList] = useState([]);
    const [isEnd, setIsEnd] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(Math.uuid());
    const currentPrefix = getPrefix('components-list');
    const currentSize = useRef({});
    useImperativeHandle(ref, () => {
        return {
            setDataList: (d, refresh) => {
                currentSize.current = {};
                setDataList(d);
                refresh && setRefreshKey(Math.uuid());
            },
            setIsEnd,
        };
    }, []);
    const getData = () => {
        setLoading(true);
        loadData().then((res) => {
            setIsEnd(res.isEnd);
            setDataList((p) => {
                if(refactorData) {
                    return refactorData(p, res.data);
                }
                return p.concat(res.data);
            });
        }).finally(() => {
            setLoading(false);
        });
    };
    useEffect(() => {
        setRefreshKey(Math.uuid());
        if(data) {
            setDataList(data);
        } else {
            getData();
        }
    }, [data]);
    const loadMore = () => {
        if(!loading) {
            getData();
        }
    };
    return <Loading visible={loading && dataList.length === 0}>
      <div className={currentPrefix}>
        {
              dataList.length > 0 ? <AutoSizer>
                {({height, width}) => {
                      return <List
                        ref={listRef}
                        innerElementType={innerElementType}
                        key={refreshKey}
                        height={height}
                        itemCount={dataList.length > 0 ? dataList.length + 1 : 0}
                        itemSize={(i) => {
                              if(currentSize.current[i]) {
                                return currentSize.current[i];
                              } else if(typeof itemSize === 'number') {
                                  return itemSize;
                              }
                              return itemSize(i, dataList);
                          }}
                        width={width}
                      >
                        {
                              ({index, style}) => {
                                  const setRowHeight = (h) => {
                                    listRef.current?.resetAfterIndex(index);
                                    currentSize.current[index] = h;
                                  };
                                  if (index === dataList.length) {
                                      if(!isEnd) {
                                          return <div
                                            className={`${currentPrefix}-item-load`}
                                            style={style}
                                          >
                                            <span onClick={loadMore}>
                                              {loading && <Icon status={constant.LOADING}/>}
                                              <span>加载更多</span>
                                            </span>
                                          </div>;
                                      }
                                      return <div
                                        style={style}
                                        className={`${currentPrefix}-item-end`}
                                      >
                                          已经到底了～
                                      </div>;
                                  }
                                  const item = dataList[index];
                                  return <div
                                    className={`${currentPrefix}-item ${currentPrefix}-item-${hoverStyle ? 'hover' : 'nohover'}`}
                                    style={{
                                      ...style,
                                      ...item.style,
                                }}>
                                    {itemRender && itemRender(item, index, setRowHeight)}
                                  </div>;
                              }
                          }
                      </List>;
                  }}
              </AutoSizer> : <div className={`${currentPrefix}-empty`}>{(empty || '暂无数据')}</div>
          }
      </div>
    </Loading>;
}));
