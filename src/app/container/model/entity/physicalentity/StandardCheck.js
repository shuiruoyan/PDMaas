import React, {forwardRef, useImperativeHandle, useMemo, useRef, useState, useCallback} from 'react';
import {getPrefix} from '../../../../../lib/classes';
import './style/index.less';

export default React.memo(forwardRef(({ setButtonText, buttonText },ref) => {
    const currentPrefix = getPrefix('container-model-entity-physical-content-createstatement-otherdatabase');
    const [databases, setDatabases] = useState(['PostgreSQL', 'Oracle', 'DB2', 'SQLite', 'DaMeng']);
    useImperativeHandle(ref, () => {
        return {
        };
    },[]);
    return <div className={`${currentPrefix}`}>
      {
            databases.map((item) => {
                return <span
                  key={item}
                  onClick={() => {
                        databases.push(buttonText);
                        setDatabases(databases.filter(db => db !== item));
                        setButtonText(item);
                    }}>
                  {item}
                </span>;
            })
        }
    </div>;
}));
