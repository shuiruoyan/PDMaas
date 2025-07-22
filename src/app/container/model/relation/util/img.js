import { elementToSVG } from 'dom-to-svg';
import {Graph} from '@antv/x6';
import {
    clearHighLineCells,
    isEdge,
    isNode,
    removeDiagramCells,
} from './celltools';
import {transformCells2Img} from './celltools-img';
import clipCanvasEmptyPadding from './clip-img';

export const cell2html = (cellsData, dataSource) => {
    return new Promise((resolve) => {
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);
        // eslint-disable-next-line max-len
        const transformCellsData = clearHighLineCells(removeDiagramCells(transformCells2Img(cellsData, dataSource)));
        const data = {
            nodes: transformCellsData.filter(c => isNode(c)),
            edges: transformCellsData.filter(c => isEdge(c)),
        };
        const graph = new Graph({
            container,
            autoResize: true,
            connecting: {
                snap: true,
                connectionPoint: 'anchor',
            },
            background: {
                color: '#ffffff',
            },
        });
        graph.getCurrentDataSource = () => dataSource;
        graph.fromJSON(data);
        graph.centerContent();
        if(transformCellsData.length > 0) {
            graph.on('render:done', () => {
                resolve({
                    cells: graph.getCells(),
                    container,
                });
            });
        } else {
            resolve({
                cells: graph.getCells(),
                container,
            });
        }
    });
};

export const html2svg = (data = [], dom) => {
    const cells = data.reduce((p, n) => {
        if(n.position) {
            return p.concat({
                position: n.position(),
            });
        }
        return p.concat((n.vertices || [])
            .concat(n.target.x ? n.target : [])
            .concat(n.source.x ? n.source : []).map(v => ({position: v})));
    }, []);
    const minX = Math.min(...cells.map(c => c.position.x));
    const minY = Math.min(...cells.map(c => c.position.y));
    const svg = dom.querySelector('.x6-graph-svg');
    const viewport = dom.querySelector('.x6-graph-svg-viewport');
    viewport.setAttribute('transform', `matrix(1,0,0,1,${-minX},${-minY + 10})`);
    let lengthValueCache = {};
    const checkLength = (e, text, length, width) => {
        const tempText = text.slice(0, length);
        if(tempText.length > 0) {
            e.innerText = `${tempText}...`;
            if(Math.abs(e.scrollWidth - width) > 1) {
                checkLength(e, text, length - 1, width);
            }
        } else {
            e.innerText = '...';
        }
    };
    //替换foreignObject
    dom.querySelectorAll('foreignObject').forEach((f) => {
        const parent = f.parentElement;
        // 获取父节点的旋转角度
        const transform = parent.getAttribute('transform');
        const rotate = transform.match(/rotate\((.*)\)/)?.[0];
        if(rotate) {
            f.setAttribute('transform', rotate);
        }
        const ellipsis = f.querySelectorAll('.physical-entity-node-text');
        ellipsis.forEach((e) => {
            const children = e.children;
            // 如果是图片 则不需要参与计算
            if(children[0]?.tagName !== 'IMG') {
                const width = e.getBoundingClientRect().width;
                if(Math.abs(e.scrollWidth - width) > 1) {
                    const text = e.innerText;
                    // 由于生成的svg无法实现文本超宽省略，因此需要手动计算文本超宽增加省略
                    const name = `${text}:${width}`;
                    if(lengthValueCache[name]) {
                        e.innerText = lengthValueCache[name];
                    } else {
                        checkLength(e, text, text.length, width);
                        lengthValueCache[name] = e.innerText;
                    }
                }
            }
        });
        const svgDom = elementToSVG(f).children[0];
        const clearId = (d) => {
            d.setAttribute('id', Math.uuid());
            // 重新设置透明度 支持word显示
            if(d.getAttribute('fill')?.includes('rgba')) {
                const fill = d.getAttribute('fill').replace(/\s/g, '');
                const fillArray = fill.split(',');
                if(fillArray.length === 4) {
                    d.setAttribute('fill', fill.replace('rgba', 'rgb').replace(/,\s*(\d|\.)+\)$/, ')'));
                    d.setAttribute('fill-opacity', fillArray.slice(-1)[0].replace(')', ''));
                }
            }
            if(d.children) {
                Array.from(d.children).forEach((c) => {
                    clearId(c);
                });
            }
        };
        clearId(svgDom);
        parent.replaceChild(svgDom, f);
    });
    const rect = viewport.getBoundingClientRect();
    return `<svg width="${rect.width + 40}px" height="${rect.height + 30}px" viewBox="0 0 ${rect.width + 30} ${rect.height + 30}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          ${svg.innerHTML.replaceAll('size="1px">', 'size="1px"/>').replaceAll('&nbsp;', ' ')}</svg>`;
};

export const svg2png = (svgData, type) => {
    return new Promise((resolve, reject) => {
        const svgDataUrl = `data:image/svg+xml;charset=utf-8;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`;
        const img = document.createElement('img');
        img.src = svgDataUrl;
        img.onload = () => {
            const { width, height } = img.getBoundingClientRect();
            const canvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio
                || window.webkitDevicePixelRatio || window.mozDevicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const context = canvas.getContext('2d');
            context.scale(dpr, dpr);
            if(type === 'jpg') {
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, width, height);
            }
            context.drawImage(img, 0, 0, width, height);
            document.body.removeChild(img);
            const baseData = clipCanvasEmptyPadding(canvas, 10).toDataURL('image/png');
            const dataBuffer = Buffer.from(baseData.replace(/^data:image\/\w+;base64,/, ''),
                'base64');
            resolve(dataBuffer);
        };
        img.onerror = (err) => {
            reject(err);
        };
        document.body.appendChild(img);
    });
};
