import React, {forwardRef, useImperativeHandle, useEffect, useState} from 'react';
import {getPrefix} from '../../../../../lib/classes';
import './style/index.less';

export default React.memo(forwardRef(({ setSelectDbDialect, selectDbDialect, dbDialects,
    setActive, defaultDb, setButtonType },ref) => {
    const currentPrefix = getPrefix('container-model-entity-physical-content-createstatement-otherdatabase');
    const filterDbDialects = dbDialects.filter(db => db.defKey !== defaultDb.defKey);
    const [dbs, setDbs] = useState(filterDbDialects);
    useImperativeHandle(ref, () => {
        return {
        };
    },[]);
    useEffect(() => {
        setDbs(filterDbDialects.filter(db => db.id !== selectDbDialect.id));
    }, [selectDbDialect]);
    return <div className={`${currentPrefix}`}>
      {
          dbs.length !== 0 ?
          dbs.map((dbDialect) => {
            return <span
              key={dbDialect.id}
              onClick={() => {
                  // if(dbDialect.tableCreate === null) {
                  //     dbDialect.tableCreate = '';
                  // }
                  setSelectDbDialect(dbDialect);
                  setButtonType('');
                  setActive(true);
              }}>
              {dbDialect.defKey}
            </span>;
        }) : <div>没有其他数据库了</div>
      }
    </div>;
}));
