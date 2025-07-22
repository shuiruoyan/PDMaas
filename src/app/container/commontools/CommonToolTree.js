import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import _ from 'lodash';
import {Checkbox, Icon, SearchInput, Tree, DropDown} from 'components';
import {ENTITY, PROJECT} from '../../../lib/constant';
import {getPrefix} from '../../../lib/classes';


export default React.memo(forwardRef(({
                                          labelRender, treeData, setIsFlat,
                                          isFlat, showCheckAll = true,
                                          check = true, onDoubleClick, close,
                                          wrapper = {}, currentMenu = [],
                                          enableFlat = true, filterParentNode = true}, ref) => {

    const baseClass = getPrefix('common-tools');

    const [checkValue, setCheckValue] = useState([]);

    const treeRef = useRef();
    const checkValueRef = useRef([]);
    const treeDataRef = useRef([...(treeData || [])]);
    const expendRef = useRef(false);

    treeDataRef.current = [...(treeData || [])];
    checkValueRef.current = checkValue;

    const onSearch = (e) => {
        const value = e.target.value;
        treeRef.current.search(value);
    };

    const checkBoxChange = () => {
        setIsFlat(pre => !pre);
    };
    const _onCheck = (e, all) => {
        setCheckValue(filterParentNode ? e : all);
    };

    useImperativeHandle(ref, () => {
        return {
            getCheckValue: () => {
                return checkValueRef.current.filter(f => f.indexOf('_') === -1);
            },
        };
    }, []);
    const cursorStyle = {
        cursor:'pointer',
    };
    const getTreeDataIds = (type = null, isTree = false) => {
        const ids = [];
        const treeIteration = (data) => {
            for (let i = 0; i < data.length; i += 1) {
                if(isTree) {
                    if(data[i].children) {
                        ids.push(data[i].id);
                    }
                } else {
                    const tempData = data[i];
                    switch (type) {
                        case ENTITY.TYPE.P:
                            if(tempData.nodeType === PROJECT.ENTITY
                                || tempData.nodeType === PROJECT.ENTITY_SUB) {
                                ids.push(data[i].id);
                            }
                            break;
                        case ENTITY.TYPE.C:
                            if(tempData.nodeType === PROJECT.CONCEPT_ENTITY
                                || tempData.nodeType === PROJECT.CONCEPT_ENTITY_SUB) {
                                ids.push(data[i].id);
                            }
                            break;
                        case ENTITY.TYPE.L:
                            if(tempData.nodeType === PROJECT.LOGIC_ENTITY
                                || tempData.nodeType === PROJECT.LOGIC_ENTITY_SUB) {
                                ids.push(data[i].id);
                            }
                            break;
                        default:
                            ids.push(data[i].id);
                            break;
                    }
                }
                if(data[i].children && data[i].children.length > 0) {
                    treeIteration(data[i].children);
                }
            }
        };
        treeIteration([...treeDataRef.current]);
        return ids;
    };
    const _checkAll = (type) => {
        const ids = getTreeDataIds(type, false);
        treeRef.current?.setChecked(ids);
        setCheckValue(ids);
    };
    const _checkInvert = (type) => {
        const ids = getTreeDataIds(type, false);
        const invertSelection = _.difference(ids, treeRef.current?.getChecked());
        setCheckValue(invertSelection);
        treeRef.current?.setChecked(invertSelection);
    };
    const _expendAll = () => {
        if(!expendRef.current)  {
            treeRef.current?.setExpand([...getTreeDataIds(null,true)]);
        } else {
            treeRef.current?.setExpand([]);
        }
        expendRef.current = !expendRef.current;
    };
    const checkMenu = [
        {key: ENTITY.TYPE.P, name: '数据表'},
        ...currentMenu,
    ];
    const _hardwareDropClick = (m, type) => {
        type === 'all' ? _checkAll(m.key) : _checkInvert(m.key);
    };
    const _onDoubleClick = (node) => {
        if(onDoubleClick) {
            if(node.nodeType === PROJECT.ENTITY ||
            node.nodeType === PROJECT.LOGIC_ENTITY ||
            node.nodeType === PROJECT.CONCEPT_ENTITY) {
                onDoubleClick(node);
                close();
            }
        }
    };
    return <div style={wrapper} className={`${baseClass}-tree`}>
      <div>
        {
              showCheckAll && <>
                <span>
                  <span
                    style={cursorStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        _checkAll();
                    }}
                  >全选</span>
                  <span className={`${baseClass}-tree-line`}/>
                  <DropDown
                    trigger='hover'
                    menus={checkMenu}
                    menuClick={m => _hardwareDropClick(m, 'all')}
                  >
                    <span>
                      <Icon
                        style={cursorStyle}
                          // onClick={_checkAll}
                        type="icon-down-more-copy"/>
                    </span>
                  </DropDown>
                </span>
                <span>
                  <span
                    style={cursorStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        _checkInvert();
                    }}
                  >反选</span>
                  <span className={`${baseClass}-tree-line`}/>
                  <DropDown
                    trigger='hover'
                    menus={checkMenu}
                    menuClick={m => _hardwareDropClick(m, 'invert')}
                  >
                    <span>
                      <Icon
                          // onClick={_checkInvert}
                        style={cursorStyle}
                        type="icon-down-more-copy"/>
                    </span>
                  </DropDown>
                </span>
              </>
          }
        <span>
          <span
            onClick={(e) => {
                e.stopPropagation();
                _expendAll();
            }}
          >全部展开/收起</span>
          {
            enableFlat && <>
              <Checkbox
                checked={isFlat}
                onChange={checkBoxChange}
                  />
              <span onClick={(e) => {
                  e.stopPropagation();
                  checkBoxChange();
              }}>平铺</span>
            </>
          }
        </span>
      </div>
      <div>
        <SearchInput placeholder="请输入" onChange={onSearch}/>
      </div>
      <div>
        <Tree
          countable
          labelRender={labelRender}
          ref={treeRef}
          checkable={check}
          data={treeData}
          onDoubleClick={_onDoubleClick}
          onCheck={_onCheck}
          allowCrossDirectorySelection={false}
        />
      </div>
    </div>;
}));
