import React from 'react';
import {getPrefix} from '../../lib/classes';

const GroupIconTitle = React.memo(({children}) => {
  const currentPrefix = getPrefix('components-groupicon-group');
  return (
    <div className={currentPrefix}>
      {children}
    </div>
  );
});

export default GroupIconTitle;
