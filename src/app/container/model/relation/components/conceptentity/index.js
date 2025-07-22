import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Message, Tooltip} from 'components';
import {dasharrayMap} from '../../config/canvasData';
import {opacity} from '../../../../../../lib/color';
import {getPrefix} from '../../../../../../lib/classes';

export default ({ node, graph }) => {
    const nodeAttrs = node.attr();
    const originData = node.prop('originData');
    const count = node.prop('count');
    const entitySetting = node.prop('entitySetting');
    const textareaRef = useRef(null);
    const { body } = nodeAttrs;
    const [isEditable, setEditable] = useState(false);
    const { titleText, titleStyle, contentStyle, borderStyle} = entitySetting;
    const clampHeight = node.size().height - 26 - 1;
    const link = node.prop('link');
    const currentPrefix = getPrefix('container-model-relation-conceptentity');
    const event = useCallback((e) => {
        e.stopPropagation();
    }, []);
    useEffect(() => {
        if(graph) {
           // const view = graph.findView(node);
           // view.container.style.pointerEvents = 'none';
        }
    }, []);
    useEffect(() => {
        if(isEditable) {
            document.body.addEventListener('mousemove', event);
            document.body.addEventListener('mouseup', event);
        } else {
            document.body.removeEventListener('mousemove', event);
            document.body.removeEventListener('mouseup', event);
        }
    }, [isEditable]);
    const onDoubleClick = () => {
        setEditable(true);
    };
    const validateDefKeyValue = (defKey) => {
        const result = (graph.getCurrentDataSource().project.entities || [])
            .find(e => e.defKey?.toLocaleLowerCase() === defKey?.toLocaleLowerCase()
                && e.id !== originData.id);
        if(result) {
            Message.error({title: `代码${defKey}已经存在`});
            return false;
        }
        return true;
    };
    const validateKeyWordValue = (name, value) => {
        const keyWord = ((graph.getCurrentDataSource().plugins || []).find(p => p.pluginKey === 'reserveWord')?.dataBody?.DB || [])
            .find(r => r.keyWord?.toLocaleLowerCase() === value?.toLocaleLowerCase());
        if(keyWord) {
            Message.error({title: `${name === 'defName' ? '显示名称' : '代码'}[${value}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
            return false;
        }
        return true;
    };
    const str2entity = (str) => {
        const value = str.replace(/\r?\n|\r/g, '\n');
        const valueLines = value.split('\n');
        const title = valueLines[0] || '';
        const defKey = title.split('-')[0] || '';
        const defName = title.split('-')[1] || '';
        if(!defKey) {
            Message.error({title: '代码不能为空！'});
            return null;
        } else if(!validateDefKeyValue(defKey)
            || !validateKeyWordValue('defName', defName) || !validateKeyWordValue('defKey', defKey)) {
            return null;
        }
        return {
            defKey,
            defName,
            intro: valueLines.slice(1).join(''),
        };
    };
    const entity2str = (entity) => {
        const title = `${entity.defKey || ''}-${entity.defName || ''}`;
        return `${title}\n${entity.intro || ''}`;
    };
    const onBlur = (e) => {
        // 根据换行符区分标题和备注
        const entity = str2entity(e.target.value);
        if(entity && (entity.defName !== originData.defName
            || entity.defKey !== originData.defKey
            || entity.intro !== originData.intro)) {
            graph.emit('node:edit', {entity, originData});
        }
        setEditable(false);
    };
    const textareaInstance = (instance) => {
        textareaRef.current = instance;
        if(instance) {
            // eslint-disable-next-line no-param-reassign
            instance.onmousewheel = (e) => {
                e.stopPropagation();
            };
            // eslint-disable-next-line no-param-reassign
            instance.onmousemove = (e) => {
                e.stopPropagation();
            };
            // eslint-disable-next-line no-param-reassign
            instance.onkeydown = (e) => {
                e.stopPropagation();
            };
            instance.focus();
        }
    };
    return (
      <div
        onDoubleClick={onDoubleClick}
        style={{
          border: borderStyle.body.stroke === 'none' ? 'none' : `${1}px 
                ${dasharrayMap[borderStyle.body['stroke-dasharray']]} 
                ${opacity(borderStyle.body.stroke, borderStyle.body['stroke-opacity'])}`,
            borderRadius: body.rx,
            height: '100%',
            // backgroundOpacity: borderStyle.body['fill-opacity'],
            background: opacity(contentStyle.body.fill, contentStyle.body['fill-opacity']),
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
        {
              isEditable ? <textarea
                ref={textareaInstance}
                onBlur={onBlur}
                defaultValue={entity2str(originData)}
                className={`${currentPrefix}-edit`} /> : <><div
                  style={{
                      //pointerEvents: 'auto',
                      background: opacity(titleStyle.body.fill, titleStyle.body['fill-opacity']),
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      minHeight: 50,
                      flexGrow: 1,
                      color: titleStyle.text.fill,
                      fontStyle: titleStyle.text['font-style'],
                      // fontWeight: titleStyle.text['font-weight'],
                      textDecoration: titleStyle.text['text-decoration'],
                      wordWrap: 'break-word',
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
                  {originData.intro && <>
                    <div style={{height: 1, background: '#DFE3EB'}}/>
                    <Tooltip title={originData.intro}>
                      <div style={{
                              padding: '0px 5px',
                              flexGrow: 1,
                              color: contentStyle.text.fill,
                              fontStyle: contentStyle.text['font-style'],
                              // fontWeight: contentStyle.text['font-weight'],
                              background: opacity(contentStyle.body.fill, contentStyle.body['fill-opacity']),
                              textDecoration: contentStyle.text['text-decoration'],
                              display: '-webkit-box',
                              WebkitLineClamp: `${Math.floor(clampHeight / 21)}`,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordWrap: 'break-word',
                          }}>
                        {originData.intro}
                      </div>
                    </Tooltip></>
                  }</>
          }

      </div>
    );
};
