import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CodeEditor, SearchInput, Tree, Button, Icon, DropDown, Loading, Checkbox, Tooltip} from 'components';
import {getPrefix} from '../../../../lib/classes';
import {tree2array} from '../../../../lib/tree';
import {postWorkerFuc, Copy} from '../../../../lib/event';
import {downloadString} from '../../../../lib/rest';
import {renderLabel} from '../menu/tool';
import {getSimpleUserCache} from '../../../../lib/cache';

export default React.memo(({treeData, getCurrentDataSource}) => {
    const Group = Checkbox.CheckboxGroup;
    const dataSource = getCurrentDataSource();
    const currentPrefix = getPrefix('container-model-tools');
    const modelingNavDisplay = dataSource.profile?.user?.modelingNavDisplay;
    const dbDialects = dataSource.profile.global.dbDialects;

    const [dbDialect, setDbDialect] = useState(dataSource.profile.project.dbDialect);
    const [codeValue, setCodeValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [createValue, setCreateValue] = useState(['tableCreate', 'indexCreate']);

    const treeRef = useRef(null);
    const createValueCacheRef = useRef([...createValue]);
    const createValueRef = useRef(null);

    createValueRef.current = [...createValue];


    const filterPhysicalEntity = useMemo(() => {
        const filterEntity = (data) => {
            return data.map((d) => {
                if(d.children) {
                    return {
                        ...d,
                        children: filterEntity(d.children),
                    };
                }
                return d;
            }).filter((d) => {
                if(d.nodeType === 'entity_sub' || d.nodeType === 'entity' || d.nodeType === 'category') {
                    if(d.children) {
                        return d.children.length > 0;
                    }
                    return true;
                }
                return false;
            });
        };
        return filterEntity(treeData);
    }, []);
    const filterPhysicalEntityArray = useMemo(() => {
        return tree2array(filterPhysicalEntity);
    }, [filterPhysicalEntity]);
    const defaultTreeData = useMemo(() => {
        return {
            defaultExpand: filterPhysicalEntityArray
                .filter(p => p.nodeType === 'entity_sub' || p.nodeType === 'category')
                .map(p => p.id),
            defaultChecked: filterPhysicalEntityArray.map(p => p.id),
        };
    }, [filterPhysicalEntityArray]);
    const [checked, setChecked] = useState(defaultTreeData.defaultChecked);
    const checkedRef = useRef(null);
    checkedRef.current = [...checked];
    const checkedCacheRef = useRef([...checked]);
    const _onCheck = useCallback((checkeds) => {
        checkedCacheRef.current = [...checkeds];
    }, []);
    const getCodeString = (checkedData, createValueData) => {
        return new Promise((resolve) => {
            const dbDialectData = dbDialects.find(d => d.defKey === dbDialect);
            if(dbDialectData) {
                postWorkerFuc('utils.getProjectAllTableCreateDDL', true, [
                    dataSource,
                    checkedData || checkedRef.current,
                    dbDialectData,
                    dbDialect,
                    createValueData || createValueRef.current,
                    getSimpleUserCache(),
                ]).then((res) => {
                    setCodeValue(res);
                    resolve();
                }).catch((err) => {
                    console.error(err);
                    resolve();
                }).finally(() => {
                    resolve();
                });
            }
        });
    };
    useEffect(() => {
        setLoading(true);
        getCodeString().then(() => {
            setLoading(false);
        });
    }, [dbDialect]);
    const onSearch = (e) => {
        const value = e.target.value;
        treeRef.current?.search?.(value);
    };
    const dropDownMenus = useMemo(() => (dbDialects
        .map(d => ({
            key: d.defKey,
            name: d.defName || d.defKey,
        }))),[]);
    const _menuClick = (m) => {
        setDbDialect(m.key);
    };
    const genDDL = (e, btn) => {
        btn.updateStatus('loading');
        setChecked(checkedCacheRef.current);
        setCreateValue(createValueCacheRef.current);
        getCodeString(checkedCacheRef.current, createValueCacheRef.current).then(() => {
            btn.updateStatus('normal');
        });
    };
    const onChange = (e) => {
      setCodeValue(e.target.value);
    };
    const downloadDDL = () => {
        downloadString(codeValue,
            'application/sql', `${dataSource.project.name}.sql`);
    };
    const createValueChange = (e) => {
        createValueCacheRef.current = e.target.value;
    };
    const onSelect = (type) => {
        if(type === 'all') {
            checkedCacheRef.current = [...defaultTreeData.defaultChecked];
            treeRef.current.setChecked(defaultTreeData.defaultChecked);
        } else {
            const currentChecked = treeRef.current.getChecked();
            const newChecked = defaultTreeData.defaultChecked.filter((c) => {
                return !currentChecked.includes(c);
            });
            checkedCacheRef.current = [...new Set(newChecked.reduce((p, n) => {
                const parents = (filterPhysicalEntityArray.find(e => e.id === n)?.parents || [])
                    .map(e => e.id);
                return p.concat(parents);
            }, [...newChecked]))];
            treeRef.current.setChecked(checkedCacheRef.current);
        }
    };
    const onExpand = () => {
        if(treeRef.current.getExpand().length > 0) {
            // checkedCacheRef.current = [];
            treeRef.current.setExpand([]);
        } else {
            // checkedCacheRef.current = defaultTreeData.defaultExpand;
            treeRef.current.setExpand(defaultTreeData.defaultExpand);
        }
    };
    const copyDDL = () => {
        Copy(codeValue, '复制成功');
    };
    const labelRender = (node) => {
        if(node.nodeType === 'entity_sub') {
            return node.defName;
        }
        return renderLabel(node,
            modelingNavDisplay.conceptEntityNode.optionValue,
            modelingNavDisplay.conceptEntityNode.customValue);
    };
    return <div className={`${currentPrefix}-exportDDL`}>
      <div className={`${currentPrefix}-exportDDL-left`}>
        <div className={`${currentPrefix}-exportDDL-left-tool`}>
          <span onClick={() => onSelect('all')}>全选</span>
          <span onClick={() => onSelect('reverse')}>反选</span>
          <span onClick={onExpand}>全部展开/收起</span>
        </div>
        <SearchInput placeholder='搜索名称或代码' onChange={onSearch}/>
        <div className={`${currentPrefix}-exportDDL-left-tree`}>
          <Tree
            maxSelected={-1}
            defaultExpand={defaultTreeData.defaultExpand}
            defaultChecked={defaultTreeData.defaultChecked}
            countable
            ref={treeRef}
            checkable
            data={filterPhysicalEntity}
            onCheck={_onCheck}
            labelRender={labelRender}
            allowCrossDirectorySelection={false}
                />
        </div>
        <div className={`${currentPrefix}-exportDDL-left-type`}>
          <Group defaultValue={createValue} onChange={createValueChange}>
            <Checkbox value='tableCreate'>建表</Checkbox>
            <Checkbox value='indexCreate'>建索引</Checkbox>
            <Checkbox disable value='primaryKeyCreate'>
              <Tooltip placement='top' force title='开发中...'>
                <span>建外键</span>
              </Tooltip>
            </Checkbox>
          </Group>
        </div>
        <div className={`${currentPrefix}-exportDDL-left-opt`}>
          <Button onClick={genDDL} type='primary'>重新生成</Button>
        </div>
      </div>
      <div className={`${currentPrefix}-exportDDL-right`}>
        <Loading visible={loading}>
          <div>
            <span>当前数据库：</span>
            <DropDown trigger='click' menus={dropDownMenus} menuClick={_menuClick} position='buttom'>
              <span className={`${currentPrefix}-exportDDL-right-db`}>
                <span>{dbDialect}</span>
                <Icon type='icon-polygon-down'/>
              </span>
            </DropDown>
          </div>
          <div className={`${currentPrefix}-exportDDL-right-code`}>
            <CodeEditor
              onChange={onChange}
              value={codeValue}
              width='100%'
              height='100%'
            />
          </div>
          <div className={`${currentPrefix}-exportDDL-right-opt`}>
            <Button onClick={downloadDDL} type='primary'>下载脚本</Button>
            <Button onClick={copyDDL} type='primary'>复制脚本</Button>
          </div>
        </Loading>
      </div>
    </div>;
});
