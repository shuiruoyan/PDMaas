import React from 'react';

import DropDown from '../dropdown';

export default React.memo(({children, contentMenus, menuClick, filterMenus}) => {
    return <DropDown
      filterMenus={filterMenus}
      trigger='contextmenu'
      menus={contentMenus}
      menuClick={menuClick}
      position='buttom'
    >
      {children}
    </DropDown>;
});
