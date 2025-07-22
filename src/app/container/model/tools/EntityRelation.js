import React, {useMemo} from 'react';
import {Table} from 'components';
import {getPrefix} from '../../../../lib/classes';

export default React.memo(({data}) => {
    const currentPrefix = getPrefix('container-model-tools-EntityRelation');
    const columns = useMemo(() => {
        return [
            {
                key: 'parentName',
                label: '主表',
                component: (v) => {
                    return <span style={{width: '100%'}}>{v}</span>;
                },
                resize: true,
                width: 200,
                sort: true,
            },
            {
                key: 'parentFieldName',
                label: '主表字段',
                width: 200,
                component: (v) => {
                    return <span style={{width: '100%'}}>{v}</span>;
                },
                resize: true,
                readOnly: true,
                sort: true,
            },
            {
                key: 'childName',
                label: '从表',
                width: 200,
                component: (v) => {
                    return <span style={{width: '100%'}}>{v}</span>;
                },
                resize: true,
                readOnly: true,
                sort: true,
            },
            {
                key: 'childFieldName',
                width: 200,
                label: '从表字段',
                component: (v) => {
                    return <span style={{width: '100%'}}>{v}</span>;
                },
                resize: true,
                readOnly: true,
                sort: true,
            }];
    }, []);
    return <div className={currentPrefix}>
      <Table
        rowEnableSelected={false}
        columnEnableSelected={false}
        data={data}
        columns={columns}/>
    </div>;
});
