import React, { useCallback, useRef } from 'react';
import './style/index.less';
import { Tooltip, List } from 'components';
import moment from 'moment';
import _ from 'lodash';
import { getPrefix } from '../../lib/classes';
import {getTemplate2String} from '../../lib/json2code';
import {getCmdHistory} from '../../lib/json';

const UserOperationLog = React.memo(({dataSource,
                                       listRef, config}) => {
    const currentPrefix = getPrefix('components-userlist-useroperationlog');
    const historiesRef = useRef(getCmdHistory(config, dataSource.project.name));

    const timeArrRef = useRef([]);
    const opceTemplets = _.keyBy([...dataSource.profile.global.opceTemplets], 'opceKey');


    const historyList = useCallback(() => {
        return historiesRef.current.next(20).then(({data, isEnd}) => {
            return {
                isEnd: isEnd,
                data: data.map(it => JSON.parse(it)),
            };
        });
    },[]);

    const getOpceName = (name, item) => {
        if(item.payload?.[0]?.data?.bindSchema === 1) {
            return name.replace('目录', 'Schema');
        }
        return name;
    };

    const itemRender = useCallback((item) => {
      try {
          const opceTemplet = opceTemplets[item.event];
          const dateString  = item.timestamp ?
              moment(Number(item.timestamp)).format('YYYY-MM-DD') : false;
          if(timeArrRef.current.length === 0) {
              timeArrRef.current.push(item.timestamp);
          } else if(dateString &&
              !_.find(timeArrRef.current, d =>  moment(Number(d)).format('YYYY-MM-DD') === dateString)) {
              timeArrRef.current.push(item.timestamp);
          }
          const timeFormat = () => {
              let momentDate = moment(dateString);
              if (momentDate.isSame(moment(), 'day')) {
                  return '今天';
              } else if (momentDate.isSame(moment().subtract(1, 'day'), 'day')) {
                  return '昨天';
              } else {
                  return dateString;
              }
          };

          return<div className={`${currentPrefix}-body-list-item`} key={item.id}>
            <div className={`${currentPrefix}-body-list-item-left`}>
              {!timeArrRef.current.includes(item.timestamp) ||
              <div className={`${currentPrefix}-body-list-item-left-date`}>{timeFormat()}</div>}
            </div>
            <div className={`${currentPrefix}-body-list-item-right`}>
              <div className={`${currentPrefix}-body-list-item-right-up`}>
                <span>
                  {getOpceName(opceTemplet.opceName, item)}
                </span>
                <span>
                  {item.userName}
                  <span>(成功)</span>
                </span>
                <span>
                  {moment(Number(item.timestamp)).format('YYYY-MM-DD HH:mm')}
                  {/*{*/}
                  {/*  item.status || <span>{item.status}</span>*/}
                  {/*}*/}
                </span>
              </div>
              <div className={`${currentPrefix}-body-list-item-right-down`}>
                <Tooltip
                  title={<span
                    style={{
                            display: 'inline-block',
                            width: '300px',
                            wordBreak: 'break-all',
                        }}
                    >
                    {getTemplate2String(opceTemplet.messageTemplet, item)}
                  </span>}
                >
                  <span>
                    {getTemplate2String(opceTemplet.messageTemplet, item)}
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>;
      } catch (e) {
          return <></>;
      }
    }, []);

    return <div className={`${currentPrefix}`} >
      <div className={`${currentPrefix}-body`}>
        <div className={`${currentPrefix}-body-list`}>
          <List
            empty='暂无数据'
            loadData={historyList}
            itemRender={itemRender}
            ref={listRef}
            itemSize={75}
         />
        </div>

      </div>
    </div>;
});

export default UserOperationLog;
