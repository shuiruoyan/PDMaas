import React, {useState, forwardRef, useImperativeHandle} from 'react';
import { Icon } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import './style/index.less';

import BaseStyle from './BaseStyle';
import NodeStyle from './NodeStyle';
import Theme from './Theme';
import Structure from './Structure';
import Outline from './Outline';
import ShortcutKey from './ShortcutKey';

export default React.memo(forwardRef(({getMind, readonly}, ref) => {
    const currentPrefix = getPrefix('container-model-mind-config');
    const [expand, setExpand] = useState(true);
    const [nodeActive, setNodeActive] = useState([]);
    const [activeCom, setActiveCom] = useState(null);
    const finalReadonly = getMind()?.readonly || readonly;
    useImperativeHandle(ref, () => {
        return {
            setExpand,
            setNodeActive,
        };
    }, []);
    const onChange = (type) => {
        if(!finalReadonly) {
            switch (type) {
                case 'node':
                    setActiveCom({
                        key: type,
                        Com: NodeStyle,
                        title: '节点',
                    });
                    break;
                case 'base':
                    setActiveCom({
                        key: type,
                        Com: BaseStyle,
                        title: '画布',
                    });
                    break;
                case 'theme':
                    setActiveCom({
                        key: type,
                        Com: Theme,
                        title: '主题',
                    });
                    break;
                case 'structure':
                    setActiveCom({
                        key: type,
                        Com: Structure,
                        title: '结构',
                    });
                    break;
                case 'outline':
                    setActiveCom({
                        key: type,
                        Com: Outline,
                        title: '大纲',
                    });
                    break;
                case 'shortcutKey':
                    setActiveCom({
                        key: type,
                        Com: ShortcutKey,
                        title: '快捷键',
                    });
                    break;
                default:
                    setActiveCom(null);
                    break;

            }
        } else {
            switch (type) {
                case 'outline':
                    setActiveCom({
                        key: type,
                        Com: Outline,
                        title: '大纲',
                    });
                    break;
                case 'shortcutKey':
                    setActiveCom({
                        key: type,
                        Com: ShortcutKey,
                        title: '快捷键',
                    });
                    break;
                default:
                    setActiveCom(null);
                    break;

            }
        }
    };
    const onExpend = () => {
        setExpand(!expand);
        setActiveCom(null);
    };
    return <div className={classesMerge({
        [currentPrefix]: true,
    })}>
      <div className={classesMerge({
            [`${currentPrefix}-left`]: true,
            [`${currentPrefix}-left-expand`]: expand,
        })}>
        {!finalReadonly && <>{
                nodeActive.length > 0 ?
                  <span
                    onClick={() => {
                            onChange('node');
                        }}
                    className={classesMerge({
                            [`${currentPrefix}-left-active`]: activeCom && activeCom.key === 'node',
                        })}
                    >
                    <Icon type="icon-skin"/>
                    <span>节点</span>
                  </span> : <span className={`${currentPrefix}-disable`}>
                    <Icon type="icon-skin"/>
                    <span>节点</span>
                  </span>
            }
          <span
            onClick={() => {
                        onChange('base');
                    }}
            className={classesMerge({
                        [`${currentPrefix}-left-active`]: activeCom && activeCom.key === 'base',
                        [`${currentPrefix}-disable`]: finalReadonly,
                    })}
                >
            <Icon type='icon-adjust'/>
            <span>画布</span>
          </span>
          <span
            onClick={() => {
                        onChange('theme');
                    }}
            className={classesMerge({
                        [`${currentPrefix}-left-active`]: activeCom && activeCom.key === 'theme',
                        [`${currentPrefix}-disable`]: finalReadonly,
                    })}
                >
            <Icon type='icon-skin'/>
            <span>主题</span>
          </span>
          <span
            onClick={() => {
                        onChange('structure');
                    }}
            className={classesMerge({
                        [`${currentPrefix}-left-active`]: activeCom && activeCom.key === 'structure',
                        [`${currentPrefix}-disable`]: finalReadonly,
                    })}
                >
            <Icon type='icon-base-manage'/>
            <span>结构</span>
          </span>
        </>}
        <span
          onClick={() => {
                    onChange('outline');
                }}
          className={classesMerge({
                    [`${currentPrefix}-left-active`]: activeCom && activeCom.key === 'outline',
                })}
            >
          <Icon type='icon-syllabus'/>
          <span>大纲</span>
        </span>
        <span
          style={{width: 42}}
          onClick={() => {
                    onChange('shortcutKey');
                }}
          className={classesMerge({
                    [`${currentPrefix}-left-active`]: activeCom && activeCom.key === 'shortcutKey',
                })}
            >
          <Icon type='icon-keyboard'/>
          <span>快捷键</span>
        </span>
        <span onClick={() => onExpend()}>
          <Icon type='icon-double-arrow-right'/>
        </span>
      </div>
      {
            activeCom && <div
              className={`${currentPrefix}-right`}
            >
              <div>
                <span>{activeCom.title}</span>
                <Icon
                  type='icon-close'
                  onClick={() => {
                        onChange('');
                    }}/>
              </div>
              <div>
                <activeCom.Com nodeActive={nodeActive} readonly={finalReadonly} getMind={getMind}/>
              </div>
            </div>
      }
    </div>;
}));
