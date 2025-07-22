import React, {useRef, useState, useEffect, useMemo, useContext} from 'react';
import ReactDOM from 'react-dom';
import Tree from '../tree';
import Icon from '../icon';


import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {addOnResize, removeOnResize} from '../../lib/listener';
import {antiShake} from '../../lib/event';
import {tree2array} from '../../lib/tree';
import {getScroller} from '../multipleselect/util';
import {PermissionContext, ViewContent} from '../../lib/context';
import {checkPermission} from '../../lib/permission';


const TreeSelect = React.memo(({options, fieldNames,
                             defaultValue, onChange, value, onKeyDown,
                             allowClear = true, nodeExpand, placeholder,
                                 countable = true, onFocus, labelRender, style, scrollStyle,
                                 disable, nsKey, suffix, minHeight = 150}) => {
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalDisable = useContext(ViewContent) ||
      (finalNsKey ? (!checkPermission(finalNsKey) || disable) : disable);
  const { defKey, defName } = fieldNames;
  const arrayTree = useMemo(() => {
    return tree2array(options);
  }, [options]);
  const [containerStyle, setContainerStyle] = useState({display: 'none'});
  const [searchValue, setSearchValue] = useState('');
  const [selectedNode, setSelectedNode] = useState([]);
  const currentPrefix = getPrefix('components-multipl-tree-select');
  const containerStyleRef = useRef(null);
  containerStyleRef.current = containerStyle;
  const inputContainerRef = useRef(null);
  const inputRef = useRef(null);
  const treeRef = useRef(null);
  const searchValueRef = useRef('');
  searchValueRef.current = searchValue;
  const searchFuc = antiShake((v) => {
    treeRef.current?.search?.(v);
  });

  const hiddenTree = () => {
    setSearchValue('');
    searchFuc('');
    setContainerStyle({
      display: 'none',
    });
  };
  useEffect(() => {
    const finalValue = ((value === undefined ? defaultValue : value) || '').split(',');
    setSelectedNode(arrayTree
        .filter(n => finalValue.includes(n[defKey])).reduce((a, b) => {
          return a.concat(b.parents).concat(b);
        }, []));
  }, [value]);
  const showTree = () => {
    if(!finalDisable) {
      const inputContainerRect = inputContainerRef.current.getBoundingClientRect();
      inputRef.current.focus();
      let maxHeight = window.innerHeight - inputContainerRect.bottom - 2;
      if(maxHeight < minHeight) {
        setContainerStyle({
          display: 'block',
          width: inputContainerRect.width,
          bottom: window.innerHeight - inputContainerRect.top + 2,
          left: inputContainerRect.left,
          //maxHeight: maxHeight,
        });
      } else {
        setContainerStyle({
          display: 'block',
          width: inputContainerRect.width,
          top: inputContainerRect.bottom + 2,
          left: inputContainerRect.left,
          maxHeight: maxHeight,
        });
      }
    }
  };
  const onCheck = (node) => {
    const checkNode = arrayTree.filter(t => node.includes(t[defKey]));
    if(value === undefined) {
      setSelectedNode(checkNode);
    }
    onChange && onChange({
      target: {
        value: checkNode.map(n => n[defKey]).join(','),
      },
    }, checkNode);
  };
  const _onSearch = (e) => {
    const v = e.target.value;
    setSearchValue(v);
    searchFuc(v);
  };
  const _onFocus = () => {
    onFocus && onFocus();
  };
  const onMouseDown = () => {
    showTree();
  };
  const _onBlur = () => {
    hiddenTree();
  };
  const onClear = () => {
    setSearchValue('');
    if(value === undefined) {
      setSelectedNode([]);
    }
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
      if(containerStyleRef.current.display !== 'none') {
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
      hiddenTree();
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
  const _valueRender = () => {
    return selectedNode.filter(s => !s.children).map((s) => {
      return <span key={s[defKey]} className={`${currentPrefix}-data-item`}>{s[defName]}</span>;
    });
  };
  const _labelRender = (node, search) => {
    return labelRender?.(node, search) || node[fieldNames.defName];
  };
  return <div className={currentPrefix}>
    <span ref={inputContainerRef} className={`${currentPrefix}-input`}>
      {!searchValue && <span
        onClick={showTree}
        className={`${currentPrefix}-input-search`}
      >
        {_valueRender()}</span>}
      {
          (allowClear && !finalDisable) && (selectedNode.length > 0 || searchValue) && <Icon
            className={`${currentPrefix}-input-clear`}
            onClick={onClear}
            type='icon-close'
          />
      }
      <input
        placeholder={selectedNode.length > 0 ? '' : placeholder}
        onMouseDown={onMouseDown}
        autoComplete='off'
        onKeyDown={_onKeyDown}
        ref={inputRef}
        value={searchValue}
        onChange={_onSearch}
        onFocus={_onFocus}
        readOnly={finalDisable}
        onBlur={_onBlur}
      />
      {!finalDisable && <Icon onClick={showTree} type='icon-down-more-copy'/>}
    </span>
    {suffix && <span className={`${currentPrefix}-suffix`}>{typeof suffix === 'function' ? suffix(selectedNode) : suffix}</span>}
    {
        (containerStyle.display !== 'none' && !finalDisable) && ReactDOM.createPortal(<div
          style={{...containerStyle, ...style, minHeight}}
          className={`${currentPrefix}-container`}
        >
          <Tree
            checkable
            showExpandArrow
            scrollStyle={scrollStyle}
            countParent
            preventDefault
            labelRender={_labelRender}
            fieldNames={fieldNames}
            defaultChecked={selectedNode.map(n => n[defKey])}
            ref={treeRef}
            nodeExpand={nodeExpand}
            onCheck={onCheck}
            data={options}
            countable={countable}
            arrayData={arrayTree}
          />
        </div>, document.body)
    }
  </div>;
});

TreeSelect.defaultProps = {
  fieldNames: {
    key: 'defKey',
    icon: 'icon',
    defKey: 'id',
    defName: 'defName',
  },
};

export default TreeSelect;
