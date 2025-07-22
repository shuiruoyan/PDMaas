import React, {useState, forwardRef, useImperativeHandle, useCallback, useEffect} from 'react';
import {AutoCom, Fieldset} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {getColumnComponent} from '../../../../../lib/component';
import {getCache, getMemoryCache, setCache} from '../../../../../lib/cache';
import {checkPermission, projectSettingNsKey} from '../../../../../lib/permission';

export default React.memo(forwardRef(({defaultDataSource, defaultData,
                                          onEntityAttrsChange, profile,
                                          openProjectSetting}, ref) => {
    const [setting] = useState(defaultDataSource.profile.project.setting);
    const physicEntityAttr = setting.physicEntityAttr;
    const currentPrefix = getPrefix('container-model-entity-physical-attribute');
    const [attrs, setAttrs] = useState(
        Object.keys(physicEntityAttr).filter(t => physicEntityAttr[t].enable));
    const [attrsData, setAttrsData] = useState(attrs.reduce((p, n) => {
        return {
            ...p,
            [n]: defaultData[n],
        };
    }, {}));
    useEffect(() => {
        const tempPhysicEntityAttr = profile.project.setting.physicEntityAttr;
        const tempAttrs = Object.keys(tempPhysicEntityAttr)
            .filter(t => tempPhysicEntityAttr[t].enable);
        setAttrs(tempAttrs);
        setAttrsData({
            ...tempAttrs.reduce((p, n) => {
                return {
                    ...p,
                    [n]: defaultData[n],
                };
            }, {}),
            ...attrsData,
        });
    }, [profile]);
    useImperativeHandle(ref, () => {
        return {
            // setSetting,
            setAttrsData,
        };
    }, []);
    const onChange = (attr, component, nextValue, preValue) => {
        setAttrsData((p) => {
            return {
                ...p,
                [attr]: nextValue,
            };
        });
        if(component !== 'Input' && component !== 'NumberInput') {
            // 以上两个组件需要失焦的时候再触发
            onEntityAttrsChange && onEntityAttrsChange({
                updateKeys: attr,
                pre: preValue,
                next: nextValue,
            });
        }
    };
    const onBlur = (attr, nextValue, preValue) => {
        onEntityAttrsChange && onEntityAttrsChange({
            updateKeys: attr,
            pre: preValue,
            next: nextValue,
        });
    };

    const _onExpand = useCallback((e) => {
        setCache('attributeExpend', {
            ...(getCache('attributeExpend', true) || {}),
            [`${defaultDataSource.id}_${defaultData.id}`]: e,
        });
        // setCache(`expand_${defaultDataSource.id}_${defaultData.id}`, e);
    }, []);
    const attributeExpend = getCache('attributeExpend', true) || {};
    const jumpProjectSetting = () => {
        openProjectSetting && openProjectSetting('physicEntityAttr');
    };
    const renderEmpty = () => {
        if(checkPermission(projectSettingNsKey) && !getMemoryCache('release')) {
            return <span className={`${currentPrefix}-empty`}>暂无启用的增强属性,可前往【<span
              onClick={jumpProjectSetting}>项目设置</span>】启用</span>;
        }
        return <span className={`${currentPrefix}-empty`}>暂无启用的增强属性</span>;
    };
    return <Fieldset
      title='自定义属性'
      defaultExpand={attributeExpend[`${defaultDataSource.id}_${defaultData.id}`] !== undefined ?
          attributeExpend[`${defaultDataSource.id}_${defaultData.id}`] : false}
      onExpand={(e) => { _onExpand(e); }}
    >
      <div className={currentPrefix}>
        {
            attrs.length > 0 ? attrs
              .map((t) => {
            const attr =  profile.project.setting.physicEntityAttr[t];
            const { component, options, props } =  getColumnComponent(attr);
            return <div key={t}>
              <span>
                {attr.title || t}
              </span>
              <span>
                <AutoCom
                  value={attrsData[t]}
                  onChange={(...args) => onChange(t, component, ...args)}
                  onBlur={(...args) => onBlur(t, ...args)}
                  component={component}
                  options={options}
                  props={{
                      ...props,
                      valueFormat: {
                          checked: '1',
                          unchecked: '0',
                      }}}
                />
              </span>
            </div>;
          }) : renderEmpty()
        }
      </div>
    </Fieldset>;
}));
