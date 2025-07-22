import React, {useCallback, useEffect, useRef} from 'react';
import Fields from '../../model/entity/physicalentity/Fields';

export default React.memo(({ baseClass, dataList,
                                           getCurrentDataSource, user,
                                          ...restProps }) => {
    const fieldsRef = useRef(null);
    const { setCommandObj, setTabs, currentTab, dataSource, defaultSetting } = restProps;
    useEffect(() => {
        setCommandObj(prevState => ({ ...prevState, [currentTab.id]: dataList || [] }));
    }, []);
    const handleChange = useCallback(() => {
        const fields = fieldsRef.current.getFields();
        setCommandObj(prevState => ({ ...prevState, [currentTab.id]: fields }));
        setTabs(prevState => prevState.map((it) => {
            if (it.id === currentTab.id) {
                return {
                    ...it,
                    dataList: fields,
                };
            }
            return it;
        }));
    }, []);
    useEffect(() => {
        // const fieldsInstance = fieldsRef.current;
        // // const currentDataList = currentTab.dataList;
        // const currentDataList = dataSource.profile.project.setting[currentTab.id];
        // fieldsInstance && fieldsInstance.setFields(dataList);
    }, [dataList]);
    useEffect(() => {
        const fieldsInstance = fieldsRef.current;
        if (defaultSetting && fieldsInstance) {
            fieldsInstance.setFields(defaultSetting);
        }
    }, [defaultSetting]);
    return <div className={baseClass}>
      <div className={`${baseClass}-tip`}>新建表结构时，会将一下字段预设到新的数据表中</div>
      <div className={`${baseClass}-fields`}>
        {/* eslint-disable-next-line max-len */}
        <Fields
          user={user}
          getCurrentDataSource={getCurrentDataSource}
          defaultDataSource={dataSource}
          ref={fieldsRef}
          onChange={handleChange}
          profile={dataSource.profile}
          defaultData={{fields: dataList || []}}
          rowEnableSelected={false} />
      </div>
    </div>;
});
