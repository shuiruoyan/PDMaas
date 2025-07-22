import React from 'react';
import {
    getBaseTypeIcon,
} from '../../util/celltools';
import {opacity} from '../../../../../../lib/color';
import {dasharrayMap} from '../../config/canvasData';
import pk from '../../style/pk.png';
import fk from '../../style/fk.png';
import pf from '../../style/pf.png';
import note from '../../style/note.png';

// 纯渲染组件 不参与计算
export default ({ node, graph }) => {
    const nodeAttrs = node.attr();
    const count = node.prop('count');
    const originData = node.prop('originData');
    const { maxFieldSize, showFields, hiddenFields } = node.prop('fieldsData');
    const entityDisplay = node.prop('entityDisplay');
    const entitySetting = node.prop('entitySetting');
    const { body } = nodeAttrs;
    const { titleText, titleStyle, primaryKeyStyle,
        foreignKeyStyle, fieldStyle, borderStyle, divideLineStyle} = entitySetting;
    const typeRefStyle = {
        primary : primaryKeyStyle,
        foreign: foreignKeyStyle,
        normal: fieldStyle,
    };
    const link = node.prop('link');
    const conversionValue = (f, s, type) => {
        if(s === 'primaryKey') {
            if(type === 'primary') {
                return <img style={{width: 18, height: 18, marginTop: 4}} src={f.isForeign ? pf : pk} alt=''/>;
            } else if (type === 'foreign') {
                return <img style={{width: 18, height: 18, marginTop: 4}} src={fk} alt=''/>;
            }
            return '';
        } else if(s === 'baseDataType') {
            const svg = graph ? getBaseTypeIcon(graph, f[s]) : null;
            if(svg) {
                return <img style={{width: 18, marginTop: 4}} src={`data:image/svg+xml;charset=utf-8;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`} alt=''/>;
            }
            return f[s]?.split('')[0];
        } else if(s === 'dataLen' || s === 'numScale') {
            return f[s] || '';
        }
        return f[s];
    };
    const renderFieldRow = (f, type) => {
        let fieldMark = {};
        try {
            fieldMark = f.mark ? JSON.parse(f.mark) : {};
        } catch (e) {
            console.log(e);
        }
        return <div
          style={{
                backgroundColor: fieldMark.bgColor || opacity(typeRefStyle[type].body.fill, typeRefStyle[type].body['fill-opacity']),
                transition: 'background-color 0.3s',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'row',
                padding: '0 3px',
                height: '26px',
                lineHeight: '26px',
            }}
          key={f.id}
        >
          {
              ['primaryKey'].concat(entityDisplay.showFields).map((s, i) => {
                    return <span
                      key={s}
                      className='physical-entity-node-text'
                      style={{
                            color: fieldMark.fontColor || typeRefStyle[type].text.fill,
                            fontStyle: typeRefStyle[type].text['font-style'],
                            // fontWeight: typeRefStyle[type].text['font-weight'],
                            textDecoration: typeRefStyle[type].text['text-decoration'],
                            flexGrow: s === 'primaryKey' ? '0' : '1',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            width: maxFieldSize[s],
                            marginLeft: i === 0 ? 0 : 5,
                            display: 'inline-block',
                        }}
                    >{conversionValue(f, s, type)}</span>;
                })
          }
        </div>;
    };
    return (
      <div
        style={{
                cursor: 'default',
                border: borderStyle.body.stroke === 'none' ? 'none' : `${1}px 
                ${dasharrayMap[borderStyle.body['stroke-dasharray']]} 
                ${opacity(borderStyle.body.stroke, borderStyle.body['stroke-opacity'])}`,
                borderRadius: body.rx,
                height: '100%',
                backgroundOpacity: borderStyle.body['fill-opacity'],
                background: borderStyle.body.fill,
                display: 'flex',
                flexDirection: 'column',
            }}>
        <div
          className='physical-entity-node-text'
          style={{
                    cursor: 'move',
                    background: opacity(titleStyle.body.fill, titleStyle.body['fill-opacity']),
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    height: '39px',
                    lineHeight: '39px',
                    color: titleStyle.text.fill,
                    fontStyle: titleStyle.text['font-style'],
              // fontWeight: titleStyle.text['font-weight'],
              textDecoration: titleStyle.text['text-decoration'],
        }}
        >
          <a
            style={{
                    cursor: link?.value ? 'pointer' : 'auto',
                    color: link?.value ? '#386aff' : titleStyle.text.fill,
                    textDecoration: link?.value ? 'underline' : titleStyle.text['text-decoration'],
                }}
            >{titleText.customValue
                .replace(/\{defKey\}/g, originData.defKey)
                .replace(/\{defName\}/g, originData.defName)}{count > 1 ? `:${count}` : ''}</a>
        </div>
        {originData.intro && <img src={note} alt='' style={{height: 20, position: 'absolute', left: 5, top: 10}}/>}
        <div>
          {
                  showFields.map((f) => {
                      return <div key={f.id}>
                        {renderFieldRow(f, f.__type)}
                        {f.__isEnd && <div style={{borderBottom: `${divideLineStyle.body['stroke-width']}px 
                                    ${dasharrayMap[divideLineStyle.body['stroke-dasharray']]} 
                                    ${opacity(divideLineStyle.body.stroke, divideLineStyle.body['stroke-opacity'])}`}}/>}
                      </div>;
              })
          }
        </div>
        {hiddenFields.length > 0 && <div style={{
            backgroundColor: (opacity(typeRefStyle.normal.body.fill, typeRefStyle.normal.body['fill-opacity'])),
            textAlign: 'center',
            width: '100%',
            fontSize: 12,
            color: 'rgba(179, 179, 179, 0.79)',
            display: 'flex',
            flexDirection: 'row',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
          <span
          >-还有{hiddenFields.length}个/共有{originData.fields.length}个-</span>
        </div>}
      </div>
    );
};
