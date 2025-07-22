import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import './style/index.less';
import ModelTools from './ModelTools';
import BasicTools from './BasicTools';
import {classesMerge, getPrefix} from '../../../../../../lib/classes';

export default React.memo(forwardRef(({ renderDetail, cell,
                                          opt, lock }, ref) => {
    const cellType = cell.prop('cellType');
    const currentPrefix = getPrefix('container-model-relation-celltool-modeltool');
    const [active, setActive] = useState('modelTools');
    const changeTools = useCallback((tool) => {
        setActive(tool);
    }, []);
    useImperativeHandle(ref, () => {
        return {

        };
    }, []);
    return <div className={`${currentPrefix}`}>
      {
          lock ? <div style={{
                padding: '3px',
            }}>{renderDetail('lock')}</div> : <>
              <div className={`${currentPrefix}-top`}>
                <span
                  onClick={() => changeTools('modelTools')}
                  className={classesMerge({
                      [`${currentPrefix}-top-active`]: active === 'modelTools',
                  })}>模型样式</span>
                <span
                  onClick={() => changeTools('basicTools')}
                  className={classesMerge({
                      [`${currentPrefix}-top-active`]: active === 'basicTools',
                  })}>基础工具</span>
              </div>
              <div className={`${currentPrefix}-bottom`}>
                {
                      active === 'basicTools' ?
                        <BasicTools
                          opt={opt}
                          cell={cell}
                          renderDetail={renderDetail}
                            /> :
                        <ModelTools
                          cellType={cellType}
                          renderDetail={renderDetail}
                            />
                    }
              </div>
            </>
        }
    </div>;
}));
