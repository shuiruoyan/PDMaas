import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {getPrefix} from '../../../../../lib/classes';

import './style/index.less';

export default React.memo(forwardRef((props, ref) => {
    const currentPrefix = getPrefix('container-model-mind-mini');
    const mindMapRef = useRef(null);
    const timer = useRef(null);
    const [miniData, setMiniData] = useState({});
    const miniShow = useRef(false);
    const miniRef = useRef(null);
    const drawMiniMap = () => {
        if(miniShow.current) {
            const {
                getImgUrl,
                viewBoxStyle,
                miniMapBoxScale,
                miniMapBoxLeft,
                miniMapBoxTop,
                svgHTML,
            } = mindMapRef.current.miniMap.calculationMiniMap(370, 220);
            // 渲染到小地图
            getImgUrl((mindMapImg) => {
                setMiniData((p) => {
                    return {
                        ...p,
                        mindMapImg,
                    };
                });
            });
            setMiniData((p) => {
                return {
                    ...p,
                    svgHTML,
                    viewBoxStyle,
                    miniMapBoxScale,
                    miniMapBoxLeft,
                    miniMapBoxTop,
                };
            });
        }
    };
    const dataChange = () => {
        timer.current && clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            drawMiniMap();
        }, 500);
    };
    useEffect(() => {
        return () => {
            mindMapRef.current?.off?.('data_change', dataChange);
            mindMapRef.current?.off?.('view_data_change', dataChange);
            mindMapRef.current?.off?.('node_tree_render_end', dataChange);
        };
    }, []);
    useImperativeHandle(ref, () => {
        return {
            show: (mindMap, show) => {
                miniShow.current = show;
                if(show) {
                    if(!mindMapRef.current)  {
                        mindMapRef.current = mindMap;
                        mindMapRef.current.on('data_change', dataChange);
                        mindMapRef.current.on('view_data_change', dataChange);
                        mindMapRef.current.on('node_tree_render_end', dataChange);
                    }
                    miniRef.current.style.display = 'block';
                    drawMiniMap();
                } else {
                    miniRef.current.style.display = 'none';
                }
            },
        };
    }, []);
    const onMousedown = (e) => {
        mindMapRef.current.miniMap.onMousedown(e);
    };
    const onMousemove = (e) =>  {
        mindMapRef.current.miniMap.onMousemove(e);
    };
    const onMouseup = (e) =>  {
        mindMapRef.current.miniMap.onMouseup(e);
    };
    return <div
      onMouseUp={onMouseup}
      onMouseMove={onMousemove}
      onMouseDown={onMousedown}
      className={currentPrefix}
      ref={miniRef}
    >
      <div style={{
            transform: `scale(${miniData.miniMapBoxScale})`,
            left: `${miniData.miniMapBoxLeft}px`,
            top: `${miniData.miniMapBoxTop}px`,
        }}>
        <img
          onMouseDown={e => e.preventDefault()}
          alt=''
          src={miniData.mindMapImg}/>
      </div>
      <div style={miniData.viewBoxStyle} />
    </div>;
}));
