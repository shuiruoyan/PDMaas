import React, {useRef} from 'react';
import {Button, closeLoading, Modal, openLoading, openModal, SearchInput, Tree} from 'components';
import {getPrefix} from '../../../../lib/classes';
import {postWorkerFuc} from '../../../../lib/event';
import {getPermissionList} from '../../../../lib/permission';
import {getCache} from '../../../../lib/cache';
import {downloadBlob} from '../../../../lib/rest';
import {ENTITY, PROFILE, PROJECT} from '../../../../lib/constant';
import {cell2html, html2svg} from '../relation/util/img';

export default React.memo(({getCurrentDataSource, treeData}) => {
    const currentPrefix = getPrefix('container-model-tools-export-word');
    const dataSource = getCurrentDataSource();
    const modelRef = useRef(null);
    const userProfile = dataSource.profile?.user;
    const hierarchyType = userProfile?.modelingNavDisplay?.hierarchyType;
    const exportHtml = async (filterData) => {
        const filterDataSource = (data) => {
            return {
                ...data,
                project: {
                    ...data.project,
                    entities: filterData.length === 0 ? data.project.entities :
                        (data.project.entities || [])
                        .filter(e => filterData.includes(e.id)),
                    diagrams: (filterData.length === 0 ? data.project.diagrams :
                        (data.project.diagrams || [])
                        .filter(d => filterData.includes(d.id))).filter(d => d.type === 'P'),
                },
            };
        };
        const tempDataSource = filterDataSource(dataSource);
        const images = [];
        for (let i = 0; i < tempDataSource.project.diagrams.length; i += 1) {
            openLoading(`正在生成物理模型图...(${i + 1}/${tempDataSource.project.diagrams.length})`);
            const diagram = tempDataSource.project.diagrams[i];
            // eslint-disable-next-line no-await-in-loop
            await new Promise(((resolve) => {
                cell2html(diagram, dataSource).then(({cells, container}) => {
                    const svg = html2svg(cells, container);
                    images.push({
                        id: diagram.id,
                        svg: svg,
                    });
                    document.body.removeChild(container);
                    resolve();
                });
            }));
            closeLoading();
        }
        openLoading('正在生成html...');
        postWorkerFuc('utils.exportHtml', true, [tempDataSource, images, getPermissionList(), getCache('user', true)]).then((data) => {
            downloadBlob(new Blob([data], { type: '' }), `${dataSource.project.name}.html`);
        }).catch((e) => {
            console.log(e);
        }).finally(() => {
            closeLoading();
        });
    };
    const filterExport = () => {
        let tempCheckData = [];
        let modal;
        const closeModal = () => {
            modal.close();
        };
        const confirm = () => {
            if(tempCheckData.length === 0) {
                Modal.error({
                    title: '提示',
                    message: '请选择需要导出的内容!',
                });
            } else {
                exportHtml(tempCheckData);
                modal.close();
            }
        };
        // 过滤树
        const filterEntityAndDiagramTree = (data = []) => {
            return data.map((c) => {
                    if(c.nodeType === 'entity_sub' || c.nodeType === 'diagram_sub') {
                        return {
                            ...c,
                            children: (c.children || []).filter(cc => cc.type === 'P'),
                        };
                    } else if(c.nodeType === 'category') {
                        return {
                            ...c,
                            children: filterEntityAndDiagramTree(c.children),
                        };
                    }
                    return null;
                }).filter(c => !!c);
        };
        // 过滤平铺
        const filterEntityAndDiagramFlat = (data) => {
            return data.filter((d) => {
                return d.id === 'base_flat_P' || d.id === 'base_flat_D';
            }).map((d) => {
                if(d.id === 'base_flat_D') {
                    return {
                        ...d,
                        children: d.children.filter(c => c.type === 'P'),
                    };
                }
                return d;
            });
        };
        // 去除其他数据 只留下物理模型和物理模型图 根据当前左侧菜单导航过滤
        const filterEntityAndDiagram = (data) => {
            if(hierarchyType === PROFILE.USER.TREE) {
                return data.map((d) => {
                    return {
                        ...d,
                        children: filterEntityAndDiagramTree(d.children),
                    };
                });
            }
            return filterEntityAndDiagramFlat(data);
        };
        const onCheck = (checkData) => {
            tempCheckData = checkData;
        };
        const renderLabel = (node, type, value = '{defKey}[{defName}]') => {
            const reg = /\{(\w+)\}/g;
            switch (type) {
                case PROFILE.USER.A: return '{defKey}[{defName}]'.replace(reg, (match, word) => {
                    return node?.[word] || ''/*|| node?.defKey || ''*/;
                });
                case PROFILE.USER.N: return node.defName || '';
                case PROFILE.USER.K: return node.defKey || '';
                case PROFILE.USER.C: return value.replace(reg, (match, word) => {
                    return node?.[word] || node?.defKey || '';
                });
                default: return '';
            }
        };
        const labelRender = (node) => {
            const modelingNavDisplay = userProfile.modelingNavDisplay;
            if(node.type === ENTITY.TYPE.DEFAULT) {
                return node.defName;
            } else if(node.nodeType === PROJECT.ENTITY) {
                return renderLabel(node,
                    modelingNavDisplay.physicEntityNode.optionValue,
                    modelingNavDisplay.physicEntityNode.customValue);
            } else if(node.nodeType === PROJECT.DIAGRAM) {
                return renderLabel(node,
                    modelingNavDisplay.diagramNode.optionValue,
                    modelingNavDisplay.diagramNode.customValue,
                );
            } else {
                return renderLabel(node,
                    modelingNavDisplay.categoryNode.optionValue,
                    modelingNavDisplay.categoryNode.customValue);
            }
        };
        const onSearch = (e) => {
            modelRef.current.search(e.target.value);
        };
        modal = openModal(<div style={{height:'60vh'}}>
          <SearchInput placeholder='搜索名称或代码' onChange={onSearch}/>
          <div style={{height: 'calc(100% - 30px)'}}>
            <Tree
              ref={modelRef}
              labelRender={labelRender}
              checkable
              leafSelected
              data={filterEntityAndDiagram(treeData)}
              countable
              onCheck={onCheck}
              />
          </div>
        </div>, {
          title: '筛选模型',
          buttons: [
            <Button onClick={closeModal}>取消</Button>,
            <Button type="primary" onClick={confirm}>确定</Button>,
          ],
        });
    };
    const exportAll = () => {
        exportHtml([]);
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-buttons`}>
        <Button type='primary' onClick={filterExport}>筛选导出</Button>
        <Button type='primary' onClick={exportAll}>全部导出</Button>
      </div>
    </div>;
});
