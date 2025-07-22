import React, { useContext} from 'react';
import {DropDown, Icon} from 'components';
import './style/index.less';

import GroupIconTitle from './GroupIconTitle';
import {getPrefix, classesMerge} from '../../lib/classes';
import { checkPermission } from '../../lib/permission';
import { ViewContent } from '../../lib/context';

const IconTitle = React.memo(({icon, onClick, title,
                                disable, dropMenu, loading, dropClick, nsKey}) => {
  const isView = useContext(ViewContent);
  const currentPrefix = getPrefix('components-groupicon-item');
  const finalDisable = (nsKey && !checkPermission(nsKey)) || disable || isView;
  const _onClick = (e) => {
    if(!finalDisable && !loading) {
      onClick && onClick(e);
    }
  };
  return <span className={currentPrefix}>
    <span className={
      classesMerge({
        [`${currentPrefix}-content`]: true,
        [`${currentPrefix}-content-disable`]: loading || finalDisable,
        [`${currentPrefix}-content-loading`]: loading,
      })
    }>
      <span tabIndex='-1' onClick={_onClick}>
        {
          loading ? <Icon type='icon-loading'/> :  <Icon type={icon}/>
        }
        <span>{title}</span>
      </span>
      {!finalDisable && !loading && dropMenu && <span className={`${currentPrefix}-content-drop`}>
        <DropDown
          trigger='click'
          menus={dropMenu}
          menuClick={dropClick}
        >
          <Icon type='icon-down-more-copy'/>
        </DropDown>
      </span>}
    </span>
  </span>;
});

IconTitle.Group = GroupIconTitle;
export default IconTitle;
