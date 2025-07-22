import React, {useMemo, useState, forwardRef, useImperativeHandle, useRef} from 'react';
import { Tooltip, Icon, Button, openModal } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';


import './style/index.less';
import Img from '../mindconfig/Img';
import NodeIcon from './icon';
import NodeLink from './link';
import NodeNote from './note';
import NodeTag from './tag';
import NodeFormul from './formul';
import ImportData from './import';
import ExportData from './export';

export default React.memo(forwardRef(({getMind, hiddenTool, readonly,
                                          getCurrentDataSource}, ref) => {
    const [nodeActive, setNodeActive] = useState([]);
    const [painter, setPainter] = useState(false);
    const [expand, setExpand] = useState(true);
    const currentPrefix = getPrefix('container-model-mind-bar');
    useImperativeHandle(ref, () => {
        return {
            setNodeActive,
            setPainter,
        };
    }, []);
    const onItemClick = (cmd) => {
        const mind = getMind();
        mind.execCommand(cmd);
    };
    const createLineFromActiveNode = () => {
        const mind = getMind();
        mind.associativeLine.createLineFromActiveNode();
    };
    const hasGeneralization = useMemo(() => nodeActive.some(n => n.isGeneralization), [nodeActive]);
    const isOnlyRoot = useMemo(() => nodeActive.length === 1 && nodeActive[0].isRoot, [nodeActive]);
    const startPainter = () => {
        const mind = getMind();
        mind.painter.startPainter();
    };
    const iconChange = (icon) => {
        hiddenTool();
        nodeActive.forEach((node) => {
            const currentIcons = [...node.getData('icon') || []];
            const sameTypeIndex = currentIcons.findIndex(i => i.split('_')[0] === icon.split('_')[0]);
            if(sameTypeIndex > -1) {
                if(currentIcons[sameTypeIndex] === icon) {
                    currentIcons.splice(sameTypeIndex, 1);
                } else {
                    currentIcons[sameTypeIndex] = icon;
                }
            } else {
                currentIcons.push(icon);
            }
            node.setIcon(currentIcons);
        });
    };
    const imgChange = (img, size) => {
        nodeActive.forEach((node) => {
            node.setImage({
                url: img.backgroundImage,
                width: size.w,
                height: size.h,
            });
        });
    };
    const linkChange = (linkData) => {
        nodeActive.forEach((node) => {
            if(linkData) {
                node.setHyperlink(linkData.hyperlink, linkData.hyperlinkTitle);
            } else {
                node.setHyperlink('', '');
            }
        });
    };
    const noteChange = (note) => {
        nodeActive.forEach((node) => {
            node.setNote(note);
        });
    };
    const tagChange = (tags) => {
        nodeActive.forEach((node) => {
            node.setTag(tags);
        });
    };
    const getKatexConfig = () => {
        const mind = getMind();
        return mind?.formula?.getKatexConfig?.();
    };
    const formulChange = (str) => {
        const mind = getMind();
        mind.execCommand('INSERT_FORMULA', str);
    };
    const onImportData = (data) => {
        const mind = getMind();
        if(data.root) {
            mind.setFullData(data);
        } else {
            mind.setData(data);
        }
    };
    const nodeLinkRef = useRef();
    const onExportData = (...args) => {
        const mind = getMind();
        mind.export(...args);
    };
    const _setLink = () => {
        let modal;
        const onCancel = () => {
            modal.close();
        };
        const onOK = () => {
            const currentLink = nodeLinkRef.current.linkData();
            if(currentLink.value) {
                linkChange(currentLink);
            } else {
                linkChange(null);
            }
            modal.close();
        };
        modal = openModal(<NodeLink
          ref={nodeLinkRef}
          getCurrentDataSource={getCurrentDataSource}
          defaultData={{
              hyperlink: nodeActive[0]?.getData?.('hyperlink') || '',
              hyperlinkTitle: nodeActive[0]?.getData?.('hyperlinkTitle') || [],
          }}
        />, {
            title: '设置链接',
            buttons: [
              <Button key='onCancel' onClick={onCancel}>取消</Button>,
              <Button key='onOk' type="primary" onClick={onOK} >确定</Button>,
            ],
        });
    };
    const onExpend = () => {
        setExpand(p => !p);
    };
    return <div className={`${currentPrefix} ${currentPrefix}-${expand ? 'expand' : 'normal'}`}>
      {!readonly && <div className={`${currentPrefix}-group`}>
        <span
          onClick={startPainter}
          className={classesMerge({
                [`${currentPrefix}-group-item`]: true,
                [`${currentPrefix}-group-item-active`]: painter,
                [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
            })}>
          <span>
            <Icon type='icon-adjust'/>
            <span>格式刷</span>
          </span>
        </span>
        <Tooltip
          visible={nodeActive.length !== 0 && !hasGeneralization}
          force
          title={<Img
            defaultData={{backgroundImage: nodeActive[0]?.getData?.('image') || 'none'}}
            onChange={imgChange}
            showImgConfig={false}/>}>
          <span
            className={classesMerge({
                  [`${currentPrefix}-group-item`]: true,
                  [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
              })}>
            <span>
              <Icon type="icon-shape-image"/>
              <span>图片</span>
            </span>
          </span>
        </Tooltip>
        <Tooltip
          visible={nodeActive.length !== 0 && !hasGeneralization}
          force
          title={<NodeIcon
            defaultData={{
                        imageData: nodeActive[0]?.getData?.('image') || '',
                        iconList: nodeActive[0]?.getData?.('icon') || [],
                    }}
            onIconChange={iconChange}
            onImgChange={imgChange}
            showImgConfig={false}/>}>
          <span
            className={classesMerge({
                  [`${currentPrefix}-group-item`]: true,
                  [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
              })}>
            <span>
              <Icon type="icon-emoticon"/>
              <span>图标</span>
            </span>
          </span>
        </Tooltip>
        <span
          className={classesMerge({
                    [`${currentPrefix}-group-item`]: true,
                    [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
                })}
          onClick={_setLink}
            >
          <span>
            <Icon type='icon-link'/>
            <span>链接</span>
          </span>
        </span>
        <Tooltip
          visible={nodeActive.length !== 0 && !hasGeneralization}
          force
          title={<NodeNote
            defaultData={nodeActive[0]?.getData?.('note') || ''}
            onChange={noteChange}
                />}
            >
          <span
            className={classesMerge({
                  [`${currentPrefix}-group-item`]: true,
                  [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
              })}
          >
            <span>
              <Icon type="  icon-note"/>
              <span>备注</span>
            </span>
          </span>
        </Tooltip>
        <Tooltip
          visible={nodeActive.length !== 0 && !hasGeneralization}
          force
          title={<NodeTag
            defaultData={nodeActive[0]?.getData?.('tag') || []}
            onChange={tagChange}
                />}
            >
          <span
            className={classesMerge({
                  [`${currentPrefix}-group-item`]: true,
                  [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
              })}
          >
            <span>
              <Icon type='icon-tag'/>
              <span>标签</span>
            </span>
          </span>
        </Tooltip>
        <span
          onClick={() => !isOnlyRoot && onItemClick('ADD_GENERALIZATION')}
          className={classesMerge({
                    [`${currentPrefix}-group-item`]: true,
                    [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || isOnlyRoot || hasGeneralization,
                })}>
          <span>
            <Icon type="icon-summary-outline"/>
            <span>概要</span>
          </span>
        </span>
        <span
          onClick={createLineFromActiveNode}
          className={classesMerge({
                    [`${currentPrefix}-group-item`]: true,
                    [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
                })}>
          <span>
            <Icon type="icon-line-relation"/>
            <span>关联线</span>
          </span>
        </span>
        <Tooltip
          visible={nodeActive.length !== 0 && !hasGeneralization}
          force
          title={<NodeFormul
            katexConfig={getKatexConfig()}
            onChange={formulChange}
                />}
            >
          <span
            className={classesMerge({
                  [`${currentPrefix}-group-item`]: true,
                  [`${currentPrefix}-group-item-disable`]: nodeActive.length === 0 || hasGeneralization,
              })}
          >
            <span>
              <Icon type="icon-formula"/>
              <span>公式</span>
            </span>
          </span>
        </Tooltip>
        </div>}
      <div className={`${currentPrefix}-group`}>
        {!readonly && <Tooltip force title='支持导入.smm,.json,.xmind,.xlsx,.md文件格式'>
          <span
            className={classesMerge({
                  [`${currentPrefix}-group-item`]: true,
                  [`${currentPrefix}-group-item-disable`]: readonly,
              })}>
            <ImportData onImportData={onImportData} readonly={readonly}/>
          </span>
        </Tooltip>}
        <span
          className={classesMerge({
                    [`${currentPrefix}-group-item`]: true,
                })}>
          <ExportData getMind={getMind} onExportData={onExportData}/>
        </span>
      </div>
      <span className={`${currentPrefix}-expandopt`} onClick={() => onExpend()}>
        <Icon type='icon-double-arrow-right'/>
      </span>
    </div>;
}));
