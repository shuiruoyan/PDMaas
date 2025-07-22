import React, {useState, useEffect, useCallback, useImperativeHandle, forwardRef , useRef} from 'react';
import {Radio, Input, Icon, TreeSelect, openModal, Button } from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {isConceptEntitySimple, isEntityNode} from '../util/celltools';
import {renderValue} from '../../menu/tool';
import {filterTreeData, labelRenderGlobal} from '../../menu/filterTree';

const RadioGroup = Radio.RadioGroup;

const currentPrefix = getPrefix('container-model-relation-celltool');
const NodeLink = forwardRef(({defaultValue,
                                 getCurrentDataSource}, ref) => {
    const userProfile = getCurrentDataSource().profile?.user;
    const modelingNavDisplayRef = useRef({});
    modelingNavDisplayRef.current = userProfile.modelingNavDisplay;
    const {entities, diagrams } = getCurrentDataSource().project;

    const [link, setLink] = useState(() => {
        const checkLinkValue = (type, value) => {
            if(type === 'in' && value) {
                if((entities || []).concat(diagrams || []).some(d => d.id === value)) {
                    return value;
                }
                return '';
            }
            return value;
        };
        const linkData = defaultValue.link || {
            type: 'in',
            value: '',
        };
        if (linkData) {
            return {
                type: linkData.type || 'in',
                [`${linkData.type}Value`]: checkLinkValue(linkData.type || 'in', linkData.value || ''),
            };
        }
        return {
            type: 'in',
            outValue: '',
        };
    });
    const linkRef = useRef({});
    linkRef.current = link;

    const _setLink = (name, value) => {
        setLink((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
    };

    useImperativeHandle(ref, () => ({
        getLink: () => {
            return linkRef.current;
        },
    }), []);
    const labelRender = useCallback((node) => {
        const modelingNavDisplay = modelingNavDisplayRef.current;
        return labelRenderGlobal(node, {modelingNavDisplay});
    }, []);
    const _onClick = (e) => {
        e.stopPropagation();
    };
    return <div className={`${currentPrefix}-detail-link`}>
      <RadioGroup
        direction='column'
        value={link.type}
        onChange={e => _setLink('type', e.target.value)}
        >
        <Radio
          value="out"
            >
          <div onClick={_onClick} className={`${currentPrefix}-detail-link-item`}>
            <span>外部</span>
            <span style={{width: 400}}>
              <Input value={link.outValue} onChange={e => _setLink('outValue', e.target.value)}/>
            </span>
            <span onClick={() => _setLink('outValue', '')}>清除</span>
          </div>
        </Radio>
        <Radio
          value="in"
            >
          <div onClick={_onClick} className={`${currentPrefix}-detail-link-item`}>
            <span>内部</span>
            <span>
              <TreeSelect
                fieldNames={{
                  icon: 'icon',
                  defKey: 'id',
                  defName: 'defKey',
                }}
                style={{zIndex: 1000}}
                nodeExpand
                leafSelected
                countable
                valueRender={renderValue}
                labelRender={labelRender}
                options={filterTreeData(getCurrentDataSource())}
                value={link.inValue}
                onChange={e => _setLink('inValue', e.target.value)}
                        />
            </span>
          </div>
        </Radio>
      </RadioGroup>
    </div>;
});

export default React.memo(({cell, getCurrentDataSource}) => {
    const [link, setLink] = useState(cell.prop('link'));
    const nodeLinkRef = useRef();

    const updateLink =  (value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells()
            .filter(c => c.isNode());
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                c.prop('link', {
                    ...value,
                });
                if (!isEntityNode(c) || isConceptEntitySimple(c)) {
                    if(value.value) {
                        c.attr('text/fill', '#0F40F5');
                        c.attr('text/text-decoration', 'underline');
                        c.attr('text/cursor', 'pointer');
                    } else {
                        c.attr('text/text-decoration', 'none');
                        c.attr('text/cursor', 'default');
                    }
                }
            });
        });
    };

    useEffect(() => {
        const handler = () => {
            setLink(cell.prop('link'));
        };
        cell.on('change:link', handler);
        // cell.on('change:entitySetting', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);

    const onLinkChange = (value) => {
        updateLink(value);
        setLink(value);
    };
    const _setLink = () => {
        let modal;
        const onCancel = () => {
            modal.close();
        };
        const onOK = () => {
            const currentLink = nodeLinkRef.current.getLink();
            onLinkChange({
                type: currentLink.type,
                value: currentLink[`${currentLink.type}Value`],
            });
            modal.close();
        };
        modal = openModal(<NodeLink
          ref={nodeLinkRef}
          onLinkChange={onLinkChange}
          defaultValue={{link}}
          getCurrentDataSource={getCurrentDataSource}
        />, {
            title: '设置链接',
            bodyStyle: {
                width: '40%',
            },
            buttons: [
              <Button key='onCancel' onClick={onCancel}>取消</Button>,
              <Button key='onOk' type="primary" onClick={onOK} >确定</Button>,
            ],
        });
    };

    return <span onClick={_setLink}>
      <Icon style={{color: link?.value ? '#0F40F5' : '#18191C'}} type='icon-link'/>
    </span>;
});
