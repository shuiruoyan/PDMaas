import React, { useState } from 'react';
import Icon from '../icon';

import './style/index.less';
import {classesMerge, getPrefix} from '../../lib/classes';

export default React.memo(({total = 0, onChange, pageSize = 10, current = 1}) => {
    const currentPrefix = getPrefix('components-pagination');
    const maxPage = Math.ceil(total / pageSize);
    const [currentState, updateCurrentState] = useState(current);
    const setCurrentState = (page) => {
      onChange && onChange(page);
      updateCurrentState(page);
    };
    const pre = (page) => {
      if(currentState !== 1) {
        if((currentState - page) < 1) {
          setCurrentState(1);
        } else {
          setCurrentState(currentState - page);
        }
      }
    };
    const next = (page) => {
      if(currentState !== maxPage) {
        if((currentState + page) > maxPage) {
          setCurrentState(maxPage);
        } else {
          setCurrentState(currentState + page);
        }
      }
    };
    const renderCurrentLeft = () => {
        const page = [];
        if (currentState > 4 && maxPage > 7) {
          for (let i = 0; i < (2 - (maxPage - currentState)); i += 1) {
            page.push(currentState - 4 + i);
          }
          return <>
            <span onClick={() => setCurrentState(1)}>1</span>
            <span onClick={() => pre(5)}><Icon type='icon-double-arrow-left'/></span>
            {
              page.map((p) => {
                return <span
                  onClick={() => setCurrentState(p)}>{p}
                </span>;
              })
            }
            <span
              onClick={() => setCurrentState(currentState - 2)}>{currentState - 2}
            </span>
            <span
              onClick={() => setCurrentState(currentState - 1)}>{currentState - 1}</span>
          </>;
        }
        for (let i = 1; i < currentState; i += 1) {
          page.push(i);
        }
        return page.map((p) => {
          return <span onClick={() => setCurrentState(p)} key={p}>{p}</span>;
        });
      };
    const renderCurrentRight = () => {
      const page = [];
      for (let i = 1; i <= maxPage - currentState; i += 1) {
        page.push(i + currentState);
      }
      if ((maxPage - currentState) >= 4 && maxPage > 7) {
        const sliceData = page.slice(0, 4);
        return <>
          {
            (sliceData[3] !== maxPage && currentState < 3 ? sliceData.filter(p => p < maxPage - 2)
                : sliceData.slice(0, 2)).map((p) => {
              return <span onClick={() => setCurrentState(p)} key={p}>{p}</span>;
            })
          }
          <span onClick={() => next(5)}><Icon type='icon-double-arrow-right'/></span>
          <span onClick={() => setCurrentState(maxPage)}>{maxPage}</span>
        </>;
      }
      return page.map((p) => {
        return <span onClick={() => setCurrentState(p)} key={p}>{p}</span>;
      });
    };
    return <div className={currentPrefix}>
      <span className={classesMerge({
        [`${currentPrefix}-quick-left`]: true,
        [`${currentPrefix}-quick-disable`]: currentState === 1,
      })}>
        <Icon onClick={() => pre(1)} type='icon-down-more-copy'/>
      </span>
      <span className={`${currentPrefix}-page-item`}>
        {renderCurrentLeft()}
        <span className={`${currentPrefix}-page-item-current`}>{currentState}</span>
        {renderCurrentRight()}
      </span>
      <span className={classesMerge({
          [`${currentPrefix}-quick-right`]: true,
          [`${currentPrefix}-quick-disable`]: currentState === maxPage,
      })}>
        <Icon onClick={() => next(1)} type='icon-down-more-copy'/>
      </span>
    </div>;
});
