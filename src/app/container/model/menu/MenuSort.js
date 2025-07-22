import React, {useMemo} from 'react';
import {Button, Input, Icon} from 'components';
import {getPrefix} from '../../../../lib/classes';
import {PROFILE} from '../../../../lib/constant';
import {getCache} from '../../../../lib/cache';

export default React.memo(({userProfile, updateUserProfile, projectId, close}) => {
    const loginUser = getCache('user', true) || {};
    const modelingNavDisplay = userProfile.modelingNavDisplay;
    const ButtonGroup = Button.ButtonGroup;
    const options = [
        {
            label: '全部',
            value: PROFILE.USER.A,
        },
        {
            label: '名称',
            value: PROFILE.USER.N,
        },
        {
            label: '代码',
            value: PROFILE.USER.K,
        },
        {
            label: '自定义',
            value: PROFILE.USER.C,
        }];
    const sortData = useMemo(() => {
        return [
            {
                label: '显示分层',
                value: 'hierarchyType',
                options: [
                    {
                        label: '目录树',
                        value: PROFILE.USER.TREE,
                    },
                    {
                        label: '平铺',
                        value: PROFILE.USER.FLAT,
                    }],
            },
            {
                label: '显示节点',
                value: 'nodeType',
                options: [
                    {
                        label: '全部',
                        value: PROFILE.USER.ALL,
                    },
                    {
                        label: '非空项',
                        value: PROFILE.USER.NON_EMPTY,
                    }],
            },
            {
                label: '目录名条目',
                value: 'categoryNode',
                customer: true,
                options,
            },
        ].concat([{
            label: '物理模型条目',
            value: 'physicEntityNode',
            customer: true,
            sort: true,
            options,
        },
            {
                label: '逻辑模型条目',
                value: 'logicEntityNode',
                customer: true,
                sort: true,
                options,
            },
            {
                label: '概念模型条目',
                value: 'conceptEntityNode',
                customer: true,
                sort: true,
                options,
            },
            {
                label: '关系图条目',
                value: 'diagramNode',
                customer: true,
                sort: true,
                options,
            }].sort((a, b) => {
                return modelingNavDisplay[a.value].orderValue
                    - modelingNavDisplay[b.value].orderValue;
        }));
    }, [modelingNavDisplay]);
    const currentPrefix = getPrefix('container-model-left-menu-sort');
    const updateSortDataClick = (e, value, sort, name) => {
        updateUserProfile({
            userId: loginUser.userId,
            projectId,
            profile: {
                ...userProfile,
                modelingNavDisplay: {
                    ...modelingNavDisplay,
                    [sort.value]: sort.customer ? {
                        ...modelingNavDisplay[sort.value],
                        [name]: value,
                    } : value,
                },
            },
        });
        if(value !== PROFILE.USER.C && name === 'optionValue') {
            close();
        }
    };
    const onMove = (sort, type, preSort) => {
        updateUserProfile({
            userId: loginUser.userId,
            projectId,
            profile: {
                ...userProfile,
                modelingNavDisplay: {
                    ...modelingNavDisplay,
                    [sort.value]: {
                        ...modelingNavDisplay[sort.value],
                        orderValue: modelingNavDisplay[sort.value].orderValue + (type === 'up' ? -1 : 1),
                    },
                    [preSort.value]: {
                        ...modelingNavDisplay[preSort.value],
                        orderValue: modelingNavDisplay[preSort.value].orderValue + (type === 'up' ? +1 : -1),
                    },
                },
            },
        });
    };
    return <div className={currentPrefix}>
      {
          sortData.map((s, i) => {
                const active = s.customer ? modelingNavDisplay[s.value].optionValue
                    : modelingNavDisplay[s.value];
                const isFirstSort = !sortData[i - 1]?.sort && sortData[i].sort;
                return <div key={s.value} className={`${currentPrefix}-item`}>
                  <span>{s.sort && <>
                      {!isFirstSort && <Icon onClick={() => onMove(s, 'up', sortData[i - 1])} className={`${currentPrefix}-item-top`} type='icon-trian-up'/>}
                      {i !== sortData.length - 1 && <Icon onClick={() => onMove(s, 'down', sortData[i + 1])} className={`${currentPrefix}-item-bottom`} type='icon-trian-down'/>}
                    </>}</span>
                  <span>{s.label}</span>
                  <span>
                    <span>
                      <ButtonGroup
                        onClick={(e, key) => updateSortDataClick(e, key, s, 'optionValue')}
                        defaultActive={active}
                      >
                        {
                            s.options.map((o) => {
                                return <Button key={o.value}>{o.label}</Button>;
                            })
                        }
                      </ButtonGroup>
                    </span>
                  </span>
                  {s.customer && active === 'C' && <span>
                    <Input
                      onMouseLeave={e => e.stopPropagation()}
                      defaultValue={modelingNavDisplay[s.value].customValue}
                      onChange={e => updateSortDataClick(e, e.target.value, s, 'customValue')}
                      placeholder='{defKey}[{defName}]'
                      disable={active !== 'C'}
                      // value={}
                    />
                  </span>}
                </div>;
            })
        }
    </div>;
});
