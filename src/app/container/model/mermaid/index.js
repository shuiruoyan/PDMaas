import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import panzoom from 'svg-pan-zoom';
import {CodeEditor, Icon, Resize} from 'components';

import './style/index.less';
import {getPrefix} from '../../../../lib/classes';
import {sendData} from '../../../../lib/utils';
import {WS} from '../../../../lib/constant';
import {antiShake} from '../../../../lib/event';
import Mermaidtool from './mermaidtool';
import Quicktool from './quicktool';
import {downloadString} from '../../../../lib/rest';
import {svg2png} from '../relation/util/img';
import {baseMermaidNsKey, checkDataPermission} from '../../../../lib/permission';
import {ViewContent} from '../../../../lib/context';

export default React.memo(({defaultData, expandHome}) => {
    const isRender = useRef(true);
    const tempValue = useRef(null);
    const rightRef = useRef(null);
    const id = useRef(Math.uuid());
    const pzoom = useRef(null);
    const toolRef = useRef(null);
    const quickToolRef = useRef(null);
    const editRef = useRef(null);
    const [codeValue, setCodeValue] = useState(defaultData.cellsData?.[0]?.code || '');
    const readonly = checkDataPermission(baseMermaidNsKey) < 2 || useContext(ViewContent);
    const [expand, setExpand] = useState(!readonly);
    const handlePanZoomChange = () => {
        const zoom = pzoom.current.getZoom();
        toolRef.current.scaleChange(zoom);
    };
    const init = async (value) => {
        // eslint-disable-next-line func-names
        const drawDiagram = async function () {
            if(typeof mermaid === 'undefined') {
                rightRef.current.innerHTML = '当前浏览器版本太低，Mermaid图将不可用，请升级浏览器版本或使用客户端';
            } else {
                const { svg } = await mermaid.render(`desgin-${id.current}`, value, rightRef.current);
                rightRef.current.innerHTML = svg;
                if(pzoom.current) {
                    pzoom.current.destroy();
                }
                pzoom.current = panzoom(document.getElementById(`desgin-${id.current}`), {
                    onPan: handlePanZoomChange,
                    onZoom: handlePanZoomChange,
                    controlIconsEnabled: false,
                    fit: true,
                    center: true,
                });
            }
        };
        await drawDiagram();
    };
    useEffect(() => {
        init(codeValue).catch(() => {
            rightRef.current.innerHTML = '无效的数据格式';
        });
    }, []);
    const currentPrefix = getPrefix('container-model-mermaid');
    const sendAndRender = () => {
        const value = tempValue.current;
        init(value).catch(() => {
            rightRef.current.innerHTML = '无效的数据格式';
        }).finally(() => {
            isRender.current = true;
            sendData({
                event: WS.DIAGRAM.MOP_DIAGRAM_MER_UPDATE,
                payload: [{
                    diagramId: defaultData.id,
                    defName: defaultData.defName,
                    defKey: defaultData.defKey,
                    type: defaultData.type,
                    data: value,
                }],
            });
            if(tempValue.current) {
                sendAndRender();
                tempValue.current = null;
            }
        });
    };
    const onChange = useCallback(antiShake((e) => {
        tempValue.current = e.target.value;
        setCodeValue(e.target.value);
        if(isRender.current) {
            sendAndRender();
            tempValue.current = null;
        }
    }), []);
    const onFullScreen = (isFullScreen) => {
        quickToolRef.current.setExpand(!isFullScreen);
        expandHome(!isFullScreen);
    };
    const getPzoom = () => {
      return pzoom.current;
    };
    const getSvgElement = () => {
        const svgElement = document.querySelector(`#desgin-${id.current}`)?.cloneNode(true);
        svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        return svgElement;
    };
    const getBase64SVG = () => {
        const svg = getSvgElement();
        document.body.appendChild(svg);
        const child = svg.children[0];
        child.setAttribute('style', '');
        child.setAttribute('transform', '');
        const rect = child.getBoundingClientRect();
        svg.setAttribute('width', `${rect.width + 30}px`);
        svg.setAttribute('height', `${rect.height + 30}px`);
        const svgString = svg.outerHTML
            .replaceAll('<br>', '<br/>')
            .replaceAll(/<img([^>]*)>/g, (m, g) => `<img ${g}  alt=""/>`);
        document.body.removeChild(svg);
        return `<?xml version="1.0" encoding="UTF-8"?>${svgString}`;
    };
    const exportSVG = () => {
        downloadString(getBase64SVG(), 'image/svg+xml', `${defaultData.defName || defaultData.defKey}.svg`);
    };
    const exportPNG = (type) => {
        svg2png(getBase64SVG(), type).then((res) => {
            downloadString(res, `image/${type}`, `${defaultData.defName || defaultData.defKey}.${type}`);
        });
    };
    const onLoad = (edit) => {
        editRef.current = edit;
    };
    return <div className={currentPrefix}>
      <Resize
        minSize={180}
        maxSize={800}
        position='right'
        >
        <div className={`${currentPrefix}-left ${currentPrefix}-left-${expand ? 'expand' : 'normal'}`}>
          <CodeEditor
            mode='markdown'
            onLoad={onLoad}
            readOnly={readonly}
            style={{
                        margin: 10,
                        width: 'calc(100% - 20px)',
                        height: 'calc(100% - 20px)',
                    }}
            onChange={onChange}
            value={codeValue}
            width='100%'
            height='100%'
                />
          <div onClick={() => setExpand(!expand)} className={`${currentPrefix}-left-icon`}><Icon
            type='icon-code'/></div>
        </div>
      </Resize>
      <div ref={rightRef} className={`${currentPrefix}-right`}/>
      <Quicktool
        exportSVG={exportSVG}
        exportPNG={exportPNG}
        ref={quickToolRef}/>
      <Mermaidtool ref={toolRef} onFullScreen={onFullScreen} getPzoom={getPzoom}/>
    </div>;
});
