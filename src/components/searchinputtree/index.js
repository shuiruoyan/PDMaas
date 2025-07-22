import React, {useRef, useState, useEffect, useContext} from 'react';
import ReactDOM from 'react-dom';
import Icon from '../icon';


import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {addOnResize, removeOnResize} from '../../lib/listener';
import {getScroller} from '../multipleselect/util';
import {PermissionContext, ViewContent} from '../../lib/context';
import {checkPermission} from '../../lib/permission';
import {getSafeReg} from '../../lib/reg';
import Tooltip from '../tooltip';

const TreeSelect = React.memo(({
                             defaultValue, onChange, value, onKeyDown,
                             allowClear = true, style,
                                 autoSelection, readOnly, nsKey, minHeight = 150, validate,
                                 getAllFields, similarEnable, similarName, row}) => {
  const similarEnableRef = useRef(false);
  const scrollRef = useRef(null);
  similarEnableRef.current = similarEnable;
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalReadOnly = useContext(ViewContent) ||
      (finalNsKey ? (!checkPermission(finalNsKey) || readOnly) : readOnly);
  const currentPrefix = getPrefix('components-tree-select-search');
  const [similarFields, setSimilarFields] = useState([]);
  const preValue = useRef('');
  const [searchValue, setSearchValue] = useState(value === undefined ? defaultValue : value);
  const inputContainerRef = useRef(null);
  const inputRef = useRef(null);
  const searchValueRef = useRef('');
  searchValueRef.current = searchValue;
  const [treeStyle, setTreeStyle] = useState({
    display: 'none',
  });
  const treeStyleRef = useRef(null);
  treeStyleRef.current = treeStyle;
  const hiddenTree = () => {
   setTreeStyle({display: 'none'});
  };
  useEffect(() => {
    if(value !== undefined) {
      setSearchValue(value);
      if(value) {
        // eslint-disable-next-line no-use-before-define
        searchSimilar(value);
      }
    }
  }, [value]);
  const showTree = () => {
    if(treeStyle.display !== 'block' && !finalReadOnly) {
      const getWidthSize = () => {
        return 1.5;
      };
      const inputContainerRect = inputContainerRef.current.getBoundingClientRect();
      let maxHeight = window.innerHeight - inputContainerRect.bottom - 2;
      // 如果仅有相似推荐 则无需限制高度
      if((maxHeight < minHeight)) {
        setTreeStyle({
          display: 'block',
          width: inputContainerRect.width * getWidthSize(),
          bottom: window.innerHeight - inputContainerRect.top + getWidthSize(),
          left: inputContainerRect.left,
          minHeight: 150,
        });
      } else {
        setTreeStyle({
          display: 'block',
          width: inputContainerRect.width * getWidthSize(),
          top: inputContainerRect.bottom + 2,
          left: inputContainerRect.left,
          maxHeight: maxHeight,
        });
      }
    }
  };
  const onSimilarClick = (field) => {
    onChange && onChange({
      target: {
        value: field.id,
      },
    }, {
      ...field,
      isField: true,
    });
    hiddenTree();
  };
  const searchSimilar = (v) => {
    if(v && similarEnableRef.current) {
      setSimilarFields(getAllFields().filter((f) => {
        const reg = getSafeReg(v);
        return (f.field.id !== row?.id) && reg.test(f.field[similarName]);
      }));
    } else {
      setSimilarFields([]);
    }
  };
  const _onSearch = (e) => {
    const v = e.target.value;
    setSearchValue(v);
    searchSimilar(v);
  };
  const _onFocus = (e) => {
    if(autoSelection) {
      e.target.setSelectionRange(0, e.target.value.length);
    }
    preValue.current = e.target.value;
    showTree();
  };
  const _onBlur = (e) => {
    if(preValue.current !== e.target.value) {
      if(validate) {
        if(validate(searchValue, preValue.current)) {
          onChange && onChange({
            target: {
              value: searchValue,
            },
          });
          preValue.current = e.target.value;
        } else {
          setSearchValue(preValue.current);
        }
      } else {
        onChange && onChange({
          target: {
            value: searchValue,
          },
        });
        preValue.current = e.target.value;
      }
    }
    hiddenTree();
  };
  const onClear = () => {
    setSearchValue('');
    onChange && onChange({
      target: {
        value: '',
      },
    });
  };
  const _onKeyDown = (e) => {
    if(e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      hiddenTree();
    }
    onKeyDown && onKeyDown(e);
  };
  useEffect(() => {
    const resizeId = Math.uuid();
    addOnResize(resizeId, () => {
      if(treeStyleRef.current.display !== 'none') {
        showTree();
      }
    });
    return () => {
      removeOnResize(resizeId);
    };
  }, []);
  useEffect(() => {
    const scrollDom = getScroller(inputContainerRef.current);
    const onScroll = () => {
      inputRef.current.blur();
    };
    if(scrollDom) {
      scrollDom.addEventListener('scroll', onScroll);
    }
    return () => {
      if(scrollDom) {
        scrollDom.removeEventListener('scroll', onScroll);
      }
    };
  }, []);
  const onMouseDown = () => {
    showTree();
  };
  const renderFiledType = (f) => {
    if(f.dataLen && f.numScale) {
      return `${f.dbDataType}(${f.dataLen}, ${f.numScale})`;
    } else if(f.dataLen || f.numScale) {
      return `${f.dbDataType}(${f.dataLen})`;
    }
    return f.dbDataType;
  };
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
  const renderSingleText = (text, size) => {
    if(text?.length > size) {
      return `${text.slice(0, size / 2)}...${text.slice(-size / 2)}`;
    }
    return text;
  };
  return <div className={currentPrefix}>
    <span ref={inputContainerRef} className={`${currentPrefix}-input`}>
      {
          allowClear && searchValue && !finalReadOnly && <Icon
            className={`${currentPrefix}-input-clear`}
            onClick={onClear}
            type='icon-close'
          />
      }
      <input
        readOnly={finalReadOnly}
        onMouseDown={onMouseDown}
        autoComplete='off'
        onKeyDown={_onKeyDown}
        ref={inputRef}
        value={searchValue}
        onChange={_onSearch}
        onFocus={_onFocus}
        onBlur={_onBlur}
      />
      <Icon onClick={showTree} type='icon-down-more-copy'/>
    </span>
    {
      treeStyle.display !== 'none' && ReactDOM.createPortal(<div
        style={{...style, minHeight, ...treeStyle}}
        className={`${currentPrefix}-container`}
      >
        <div className={`${currentPrefix}-container-content`}>
          {similarEnable && <div className={`${currentPrefix}-container-similar`}>
            <div><span>相似推荐</span><span>共{similarFields.length}个相似字段</span></div>
            <div onScroll={onScroll}>
              {
                similarFields.map((f) => {
                  return <div key={f.id} onClick={() => onSimilarClick(f)}>
                    <Tooltip
                      placement='top'
                      force={f.entityDefKey?.length > 8}
                      title={f.entityDefKey}><span>{renderSingleText(f.entityDefKey, 8)}</span>
                    </Tooltip>
                    <Tooltip
                      placement='top'
                      force={f.field.defKey?.length > 8}
                      title={f.field.defKey}><span>{renderSingleText(f.field.defKey, 8)}</span>
                    </Tooltip>
                    <Tooltip
                      placement='top'
                      force={f.entityDefName?.length > 8}
                      title={f.entityDefName}><span>{renderSingleText(f.entityDefName, 8)}</span>
                    </Tooltip>
                    <Tooltip
                      placement='top'
                      force={f.field.defName?.length > 8}
                      title={f.field.defName}><span>{renderSingleText(f.field.defName, 8)}</span>
                    </Tooltip>
                    <Tooltip
                      placement='top'
                      title={renderFiledType(f.field)}><span>{renderFiledType(f.field)}</span>
                    </Tooltip>
                  </div>;
                })
              }
            </div>
            <div
              style={{display: similarFields.length > 5 ? 'block' : 'none'}}
              ref={scrollRef}
              className={`${currentPrefix}-scroll`}/>
          </div>}
        </div>
      </div>, document.body)
    }
  </div>;
});

TreeSelect.defaultProps = {
  fieldNames: {
    icon: 'icon',
    defKey: 'id',
    defName: 'defName',
  },
};

export default TreeSelect;
