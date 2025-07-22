import React, {useEffect, useRef} from 'react';
import {dasharrayMap} from '../../config/canvasData';
import {opacity} from '../../../../../../lib/color';

export default ({ node, graph }) => {
    const nodeAttrs = node.attr();
    const { body, text } = nodeAttrs;
    const bodyRef = useRef(null);
    const titleRef = useRef(null);
    useEffect(() => {
        if(graph) {
           const view = graph.findView(node);
           view.container.style.pointerEvents = 'none';
        }
    }, []);
    return (
      <div
        ref={bodyRef}
        style={{
            cursor: 'default',
            border: body.stroke === 'none' ? 'none' : `${body['stroke-width']}px ${dasharrayMap[body['stroke-dasharray']]} ${body.stroke}`,
            borderRadius: body.rx,
            height: '100%',
            background: opacity(body.fill, body['fill-opacity']),
        }}
      >
        <span
          ref={titleRef}
          style={{
              display: 'inline-block',
              pointerEvents: 'auto',
              background: '#f6f7f8',
              cursor: 'move',
              padding: '5px 10px',
              margin: 5,
              color: text.fill,
              fontSize: text.fontSize,
              fontWeight: text['font-weight'],
              fontStyle: text['font-style'],
              textDecoration: text['text-decoration'],
        }}
        >
          {text.text || '未命名容器'}
        </span>
      </div>
    );
};
