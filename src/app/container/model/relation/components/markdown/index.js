import React from 'react';
import marked from 'marked';
import {dasharrayMap} from '../../config/canvasData';
import {opacity} from '../../../../../../lib/color';

export default ({ node }) => {
    const nodeAttrs = node.attr();
    const getHtml = (str) => {
        marked.use({ renderer: {
                heading(text, level, raw, slugger) {
                    // eslint-disable-next-line react/no-this-in-sfc
                    if (this.options.headerIds) {
                        return `<h${
                            level
                        } style="margin: 5px" id="${
                            // eslint-disable-next-line react/no-this-in-sfc
                            this.options.headerPrefix
                        }${slugger.slug(raw)
                        }">${
                            text
                        }</h${
                            level
                        }>\n`;
                    }
                    // ignore IDs
                    return `<h${level} style="margin: 5px">${text}</h${level}>\n`;
                },
                paragraph(text) {
                    return `<p style="margin: 5px">${text}</p>`;
                },
                hr(){
                    return '<hr style="margin: 0;border-style: solid;color: #F2F5F6" size="1px"/>';
                },
                list(body, ordered, start) {
                    const type = ordered ? 'ol' : 'ul',
                        startatt = (ordered && start !== 1) ? (` start="${start}"`) : '';
                    return `<${type}${startatt} style="text-align: left;margin: 0px 0px 0px 20px;padding: 0px;line-height: 18px;${ordered ? '' : 'list-style: disc'}">\n${body}</${type}>\n`;
                },
            }});
        const reg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        return marked(str, {
            breaks: true,
        }).replace(reg, '');
    };
    const { body, text } = nodeAttrs;
    return (
      <div
        style={{
            overflow: 'hidden',
            border: body.stroke === 'none' ? 'none' : `${body['stroke-width']}px ${dasharrayMap[body['stroke-dasharray']]} ${body.stroke}`,
            borderRadius: body.rx,
            height: '100%',
            background: opacity(body.fill, body['fill-opacity']),
        }}
        // eslint-disable-next-line
        dangerouslySetInnerHTML={{
            __html: getHtml(text.text || ''),
      }}
       />
    );
};
