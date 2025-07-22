import React, { useRef } from 'react';
import './style/index.less';
import { Icon, openDrawer } from 'components';
import { getPrefix } from '../../lib/classes';
import UserOperationLog from './UserOperationLog';

const UserList = React.memo(({dataSource, config}) => {
  const currentPrefix = getPrefix('components-userlist');

  const operationRef = useRef('');
  const execCmd = useRef([]);
  const listRef = useRef(null);



  const showUserOperationLog = async () => {
    openDrawer(<UserOperationLog
      listRef={listRef}
      config={config}
      execCmd={execCmd}
      dataSource={dataSource}
      ref={operationRef}
    />, {
      title: '操作历史',
      placement: 'right',
      width: '35%',
    });
  };

  return (
    <div className={`${currentPrefix}`}>
      <span className={`${currentPrefix}-opt`} onClick={showUserOperationLog}>
        <Icon type='icon-history'/><span>操作历史</span></span>
    </div>
  );
});


export default UserList;
