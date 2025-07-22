import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import { Tooltip, IconTitle, Button, SimpleTab, NumberInput } from 'components';
import * as colorTool from '../../../../../lib/color';
import CustomerColor from '../../relation/celltool/CustomerColor';
import {classesMerge, getPrefix} from '../../../../../lib/classes';

const parseColor = (color) =>  {
    if (typeof color !== 'string') return [];

    const rgbaRegex = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d*\.?\d+))?\)$/i;

    const match = color.match(rgbaRegex);
    if (!match) return [];

    const [, r, g, b, a] = match;
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const opacity = a !== undefined ? parseFloat(a) : 1;

    return [rgb, opacity];
};

const FontFill = ({onFillChange, defaultValue}) => {
    const currentPrefix = getPrefix('container-model-relation-celltool');
    const ButtonGroup = Button.ButtonGroup;
    const res = parseColor(defaultValue);

    const [fill, setFill] = useState(res[0]);
    // eslint-disable-next-line max-len
    const [opacity, setOpacity] = useState((res[1] === null || res[1] === undefined) ? 1 :  res[1]);

    const opacityRef = useRef();
    const fillRef = useRef();

    opacityRef.current = opacity;
    fillRef.current = fill;

    const [presetColors, setPresetColors] = useState(colorTool.getPresetClassicalColors());

    const _onFillChange = (color) => {
        setFill(color);
        if(fillRef.current !== color) {
            onFillChange && onFillChange(colorTool.opacity(color, opacityRef.current));
        }
        colorTool.setPresetColors(color);
    };

    const onOpacityChange = (o) => {
        setOpacity(o);
        if(opacityRef.current !== o) {
            onFillChange && onFillChange(colorTool.opacity(fillRef.current, o));
        }
    };

    return <div className={`${currentPrefix}-detail-fill`}>
      <div className={`${currentPrefix}-detail-fill-item`}>
        <span>
          <span>
            <span>标准颜色</span>
            <ButtonGroup
              className={`${currentPrefix}-detail-button`}
              onClick={(e, key) => setPresetColors(key === 'major' ?
                    colorTool.getPresetMajorColors() : colorTool.getPresetClassicalColors())}
              defaultActive="classical"
            >
              <Button key="classical">经典</Button>
              <Button key="major">专业</Button>
            </ButtonGroup>
          </span>
          <span>
            <CustomerColor onChange={_onFillChange}/>
          </span>
        </span>
        <span className={`${currentPrefix}-detail-fill-color-container`}>{
                presetColors.map((c) => {
                    return <span
                      onClick={() => _onFillChange(c)}
                      className={classesMerge({
                            [`${currentPrefix}-detail-fill-color`]: true,
                            [`${currentPrefix}-detail-fill-color-notColor`]: c === 'rgba(0, 0, 0, 0)',
                            [`${currentPrefix}-detail-fill-color-active`]: fill === c,
                        })}
                      key={c}
                      style={{background: c}}/>;
                })}
        </span>
      </div>
      <div className={`${currentPrefix}-detail-fill-item`}>
        <span>
          <span>最近颜色</span>
          <span>
          不透明度
            <span className={`${currentPrefix}-detail-cell`}>
              <NumberInput
                max={100}
                min={0}
                value={parseInt(opacity * 100, 10)}
                onBlur={e => onOpacityChange(e.target.value / 100)}
              />
            </span>
            %
          </span>
        </span>
        <span className={`${currentPrefix}-detail-fill-color-container`}>{
              colorTool.getPresetColors()
                  .map((c) => {
                      return <span
                        onClick={() => _onFillChange(c)}
                        className={`${currentPrefix}-detail-fill-color`}
                        key={c}
                        style={{background: c}}/>;
                    })
            }
        </span>
      </div>
    </div>;
};

export default React.memo(forwardRef(({
                                          data,
                                          selected,
                                          onFieldsChange,
                                          setFields,
                                          type = 'field',
                                      }, ref) => {
    const currentPrefix = getPrefix('container-model-entity-physical-mark');

    const [bgColor, setBgColor] = useState();
    const [fontColor, setFontColor] = useState();
    const [active, setActive] = useState('fontColor');

    const fontColorRef = useRef();
    const bgColorRef = useRef();

    bgColorRef.current = bgColor;
    fontColorRef.current = fontColor;

    useEffect(() => {
        if(type === 'entity') {
            const current = data[0];
            const mark = JSON.parse(current?.mark || '{}') || {};
            setFontColor(mark?.fontColor);
            setBgColor(mark?.bgColor);
            return;
        }
        if((selected || []).length <= 0) {
            return;
        }
        const currentField = data.find(f => f.id === selected[0]);
        const mark = JSON.parse(currentField?.mark || '{}') || {};
        setFontColor(mark?.fontColor);
        setBgColor(mark?.bgColor);
    }, [selected, data]);

    const _sendData = (key, value, isClear = false) => {
        if(type === 'entity') {
            return;
        }
        const sendOpts = (selected || []).map((item) => {
            const currentField = data.find(f => f.id === item);
            if(currentField) {
                return {
                    defKey: currentField.defKey,
                    defName: currentField.defName,
                    id: currentField.id,
                    next: {
                        mark: isClear ? '{}' : JSON.stringify({
                            ...(JSON.parse(currentField?.mark || '{}') || {}),
                            [key]: value,
                        }),
                    },
                    pre: {
                        mark: currentField.mark,
                    },
                    updateKeys: 'mark',
                };
            }
            return {};
        }).filter(it => it.id);

        if(sendOpts.length <= 0) {
            return;
        }
        setFields((pre) => {
            return (pre || []).map((f) => {
                if((selected || []).includes(f.id)) {
                    return  {
                        ...f,
                        mark: isClear ? '{}' : JSON.stringify({
                            ...(JSON.parse(f?.mark || '{}') || {}),
                            [key]: value,
                        }),
                    };
                }
                return f;
            });

        });
        onFieldsChange && onFieldsChange(sendOpts);
    };

    const onFillChange = (key, value, isClear = false) => {
        _sendData(key, value, isClear);
        switch (key) {
            case 'bgColor':
                setBgColor(value);
                return;
            case 'fontColor':
                setFontColor(value);
                return;
            default: ' ';
        }
    };

    const clear = (key, value) => {
        if(type === 'entity') {
            setFontColor(null);
            setBgColor(null);
            // sendWsRequest({
            //     event: WS.ENTITY.MOP_ENTITY_UPDATE,
            //     payload: (data || []).map((entity) => {
            //         return {
            //             hierarchyType: PROFILE.USER.TREE,
            //             next: {
            //                 data: {
            //                     mark: null,
            //                 },
            //                 id: entity.id,
            //             },
            //             pre: {
            //                 data: {mark: entity.mark},
            //                 id: entity.id,
            //             },
            //             updateKeys: 'mark',
            //         };
            //     }),
            // });

        }
        onFillChange(key, value, true);
    };

    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return {
                    fontColor: fontColorRef.current,
                    bgColor: bgColorRef.current,
                };
            },
        };
    }, []);

    const options = [
        {
            key: 'fontColor',
            title: '文字',
            content: <FontFill defaultValue={fontColor} onFillChange={v => onFillChange('fontColor', v)}/>,
            extra: <span className={`${currentPrefix}-del`}><IconTitle icon='icon-oper-delete' onClick={() => clear('fontColor', null)} title='清除' /></span>,
        },
        {
            key: 'bgColor',
            title: '背景',
            content: <FontFill defaultValue={bgColor} onFillChange={v => onFillChange('bgColor', v)}/>,
            extra: <span className={`${currentPrefix}-del`}><IconTitle icon='icon-oper-delete' onClick={() => clear('bgColor', null)} title='清除' /></span>,
        },
    ];

    const onTabItemClick = (key) => {
        setActive(key);
    };

    const SimpleContent = useMemo(() => () => {
        return <div>
          <SimpleTab options={options} active={active} onTabItemClick={onTabItemClick}/>
        </div>;
    }, [selected, fontColor, bgColor, active]);

    return type === 'entity' ? <SimpleContent /> : <Tooltip
      force
      visible={selected.length !== 0}
      trigger='click'
      title={<SimpleContent />}>
      <span>
        <IconTitle disable={selected.length === 0} icon='icon-palette'/>
      </span>
    </Tooltip>;
}));
