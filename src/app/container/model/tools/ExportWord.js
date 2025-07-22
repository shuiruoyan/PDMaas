import React, {useRef} from 'react';
import {Button, closeLoading, Modal, openLoading, openModal, SearchInput, Tree} from 'components';
import {getPrefix} from '../../../../lib/classes';
import {postWorkerFuc} from '../../../../lib/event';
import {getPermissionList} from '../../../../lib/permission';
import {getCache} from '../../../../lib/cache';
import {downloadBlob} from '../../../../lib/rest';
import {DIAGRAM, ENTITY, PROFILE, PROJECT} from '../../../../lib/constant';
import {cell2html, html2svg, svg2png} from '../relation/util/img';
import {filterTreeData} from '../menu/filterTree';

export default React.memo(({getCurrentDataSource}) => {
    const currentPrefix = getPrefix('container-model-tools-export-word');
    const dataSource = getCurrentDataSource();
    const modelRef = useRef(null);
    const userProfile = dataSource.profile?.user;
    const exportWORD = async (filterData) => {
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
                    svg2png(html2svg(cells, container)).then((buffer) => {
                        images.push({
                            id: diagram.id,
                            png: buffer,
                        });
                        document.body.removeChild(container);
                        resolve();
                    });
                });
            }));
            closeLoading();
        }
        openLoading('正在生成word...');
        postWorkerFuc('utils.exportWord', true, [tempDataSource, images, getPermissionList(), getCache('user', true)]).then((data) => {
            const bytes = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i += 1) {
                bytes[i] = data.charCodeAt(i);
            }
            downloadBlob(new Blob([bytes.buffer], { type: 'application/octet-stream' }), `${dataSource.project.name}.docx`);
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
                exportWORD(tempCheckData);
                modal.close();
            }
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
              data={filterTreeData(getCurrentDataSource(), {
                  filterNodes: [PROJECT.ENTITY_SUB, PROJECT.DIAGRAM_SUB],
                  filterDiagramType: [DIAGRAM.TYPE.P]})
              }
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
        exportWORD([]);
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-buttons`}>
        <Button type='primary' onClick={filterExport}>筛选导出</Button>
        <Button type='primary' onClick={exportAll}>全部导出</Button>
      </div>
    </div>;
});
