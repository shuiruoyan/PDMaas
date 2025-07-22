import React, {useState, forwardRef, useImperativeHandle} from 'react';
import {DropDown, Icon} from 'components';

import './style/index.less';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import Search from './Search';

export default React.memo(forwardRef((props, ref) => {
    const [expand, setExpand] = useState(true);
    const { exportSVG, getGraph, exportPNG } = props;
    const currentPrefix = getPrefix('container-model-relation-quicktool');
    const exportMenu = [
        {key: 'svg', name: 'SVG'},
        {key: 'png', name: 'PNG(背景透明)'},
        {key: 'jpg', name: 'JPG'},
    ];
    const onDropMenuClick = (m) => {
        if(m.key === 'svg') {
            exportSVG();
        } else {
            exportPNG(m.key);
        }
    };
    useImperativeHandle(ref, () => {
        return {
            setExpand,
        };
    }, []);
    return <div className={classesMerge({
        [currentPrefix]: true,
        [`${currentPrefix}-fold`]: !expand,
    })}>
      <span>
        <Icon
          onClick={() => setExpand(!expand)}
          type={expand ? 'icon-double-arrow-right' : 'icon-double-arrow-left'}
        />
      </span>
      <span className={`${currentPrefix}-line`}/>
      <span>
        <DropDown
          trigger='click'
          menuClick={onDropMenuClick}
          menus={exportMenu}
          position='buttom'
        >
          <Icon type='icon-cloud-download'/>
        </DropDown>
      </span>
      <span>
        <Search getGraph={getGraph}/>
      </span>
      {/*<span>*/}
      {/*  <Icon type='icon-share'/>*/}
      {/*</span>*/}
      {/*<span>*/}
      {/*  <Icon type='icon-history'/>*/}
      {/*</span>*/}
    </div>;
}));
