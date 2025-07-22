import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import './style/index.less'
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import { Icon, Tooltip } from 'components';
import {borderStyleMap, dasharrayMap} from './canvasData';

const IconRender = React.memo(forwardRef(({iconItems, firstKey, secondKey,
                                              setCanvasStyle, diagramData, canvasStyle}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-icon')

    useImperativeHandle(ref, () => {

    });

    useEffect(() => {

    }, []);
    const convertToRgba = (color, opacity) => {
        if(!color) {
            return ''
        }
        if(color?.startsWith('rgba')) {
            return color;
        }
        if(color?.startsWith('rgb')) {
            const [r, g, b] = color.match(/\d+/g);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } else {
            const [r, g, b] = color.match(/\w\w/g).map(x => parseInt(x, 16));
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
    }

    const parsePropertyValue = (currentStyle, property, defaultValue, value) => {
        const tempValue = currentStyle[property];
        if(defaultValue === '') {
            if(value instanceof Object) {
                let [color, opacity, dasharray, width] = value;
                if(!color) {
                    return {};
                }
                const rgba = convertToRgba(color, opacity)
                if (dasharray) {
                    return {
                        borderColor: rgba,
                        borderStyle: dasharrayMap[dasharray],
                        borderWidth: width,
                    }
                }
                return {
                    [property]: rgba
                };
            }
            return {
                [property]: value
            };
        } else {
            if(value instanceof Object) {
                let [color, opacity, dasharray, width] = value;
                if(!color) {
                    return {};
                }
                const rgba = convertToRgba(color, opacity)
                if (dasharray) {
                    return {
                        borderColor: rgba,
                        borderStyle: dasharrayMap[dasharray],
                        borderWidth: width,
                    }
                }
                return {
                    [property]: rgba
                };
            }
            return  {
                [property]: tempValue === defaultValue ? value : defaultValue
            };
        }
    }
    const getDiagramsPropertyValue = (data, diagramsProperty, diagramsPropertyValue, v) => {
        const tempValue = data[diagramsProperty];
        let color, opacity, dasharray, width
        switch (diagramsProperty) {
            case 'colorFill' :
                [color, opacity, dasharray, width] = v;
                return {
                    fill: color
                }
            case 'bgFill' :
                [color, opacity, dasharray, width] = v;
                return {
                    fill: color,
                    'fill-opacity': opacity
                }
            case 'stroke' :
                [color, opacity, dasharray, width] = v;
                return {
                    stroke: color || '',
                    'stroke-dasharray': dasharray || '',
                    'stroke-opacity': opacity || '',
                    'stroke-width': width || ''
                }
            case 'font-weight':
            case 'font-style':
            case 'text-decoration':
                return {
                    [diagramsProperty]: tempValue === '' ? v : ''
                }
            default:
                return {
                    [diagramsProperty]: diagramsPropertyValue
                }
        }
    }
    const updateCanvasProps = (item, v) => {
        let { property, defaultValue, value, defKey,
            diagramsProperty, diagramsPropertyValue} = item;
        value = v || value;
        if(secondKey === '') {
            setCanvasStyle(p => {
                return {
                    ...p,
                    [firstKey]: {
                    ...p[firstKey],
                        [defKey]: {
                            ...p[firstKey][defKey],
                            ...parsePropertyValue(p[firstKey][defKey], property, defaultValue, value)
                        }
                    }
                };
            })
            diagramData.current =  {
                ...diagramData.current,
                [firstKey]: {
                    ...diagramData.current[firstKey],
                    [defKey]: {
                        ...diagramData.current[firstKey][defKey],
                        ...getDiagramsPropertyValue(diagramData.current[firstKey][defKey],
                            diagramsProperty, diagramsPropertyValue, value)
                    }
                }
            }
        } else {
            setCanvasStyle(p => {
                return {
                    ...p,
                    [firstKey]: {
                        ...p[firstKey],
                        [secondKey]: {
                            ...p[firstKey][secondKey],
                            [defKey]: {
                                ...p[firstKey][secondKey][defKey],
                                ...parsePropertyValue(p[firstKey][secondKey][defKey], property, defaultValue, value)
                            }
                        }
                    }
                };
            })
            diagramData.current =  {
                ...diagramData.current,
                [firstKey]: {
                    ...diagramData.current[firstKey],
                    [secondKey]: {
                        ...diagramData.current[firstKey][secondKey],
                        [defKey]: {
                            ...diagramData.current[firstKey][secondKey][defKey],
                            ...getDiagramsPropertyValue(diagramData.current[firstKey][secondKey][defKey],
                                diagramsProperty, diagramsPropertyValue, value)
                        }
                    }
                }
            }
        }
    }
    function parseRGBA(rgbaValue) {
        if (/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.test(rgbaValue)) {
            return  {
                color: rgbaValue,
                opacity: 1
            }
        } else if ((/^rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)$/).test(rgbaValue)) {
            const parts = rgbaValue.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)$/);
            const r = parseInt(parts[1]);
            const g = parseInt(parts[2]);
            const b = parseInt(parts[3]);
            const a = parseFloat(parts[4]);
            return { color: `rgb(${r}, ${g}, ${b})`, opacity: a };
        } else {
            return {
                color: '',
                opacity: 1
            };
        }

    }

    return iconItems.map((item, index) => {
        if (item.icon === 'separator') {
            return <span
                key={index}
                className={`${currentPrefix}-separator`}></span>;
        } else if(item.icon === 'text') {
            return <span
                key={index}
            >{item.text}</span>
        } else if(!item.Com) {
            let currentComStyle,checked;
            if(secondKey) {
                currentComStyle = canvasStyle[firstKey][secondKey][item.defKey][item.property];
            } else {
                currentComStyle = canvasStyle[firstKey][item.defKey][item.property];
            }
            switch (item.property) {
                case 'fontWeight':
                case 'fontStyle':
                    checked = currentComStyle !== 'normal'
                    break;
                case 'textDecoration':
                    checked = currentComStyle !== 'none';
                    break;
                default :
                    checked = item.value === currentComStyle
            }
            return <span
                key={index}
                className={`${currentPrefix}-item`}
            >
                 <Icon
                     style={{
                         color: checked ? '#386aff' : ''
                     }}
                     key={index}
                     type={item.icon}
                     onClick={() => {
                         updateCanvasProps(item, undefined);
                     }}
                 />
            </span>;
        } else {
            const Com = item.Com;
            let currentColor;
            let currentComStyle, color, opacity, dasharray,
                width, colorAndOpacityObj;
            if(secondKey) {
                currentComStyle = canvasStyle[firstKey][secondKey][item.defKey];
            } else {
                currentComStyle = canvasStyle[firstKey][item.defKey];
            }
            switch (item.diagramsProperty) {
                case 'colorFill' :
                    currentColor = currentComStyle.color;
                    colorAndOpacityObj = parseRGBA(currentComStyle.color)
                    color = colorAndOpacityObj.color;
                    break;
                case 'bgFill' :
                    currentColor = currentComStyle.backgroundColor;
                    colorAndOpacityObj = parseRGBA(currentComStyle.backgroundColor)
                    color = colorAndOpacityObj.color;
                    opacity = colorAndOpacityObj.opacity
                    break;
                case 'stroke' :
                    currentColor = currentComStyle.borderColor;
                    colorAndOpacityObj = parseRGBA(currentComStyle.borderColor)
                    color = colorAndOpacityObj.color;
                    opacity = colorAndOpacityObj.opacity
                    dasharray = currentComStyle.borderStyle
                    width = currentComStyle.borderWidth
                    break;
            }

            return <Tooltip
                force
                key={index}
                placement="bottom"
                trigger="click"
                title={<Com
                    isSimple={true}
                    color={color}
                    opacity={opacity}
                    dasharray={borderStyleMap[dasharray]}
                    width={width}
                    hasOpacity={item.defKey === 'body'}
                    hasWidth={firstKey !== 'entitySetting'}
                    onChange={(v) => {updateCanvasProps(item, v);
                }}/>}>
               <span className={classesMerge({
                   [`${currentPrefix}-item`]: true,
                   // [`${currentPrefix}-notColor`]: currentColor === 'rgba(0, 0, 0, 0)'
               })}>
                    <Icon style={{
                        color,
                        opacity: opacity || 1
                    }} type={item.icon}/>
               </span>
            </Tooltip>
        }
    })
}));
export default IconRender;
