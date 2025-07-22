import { Graph, Dom, Vector, Util} from '@antv/x6';


const showPort = (cellView) => {
    const ports =  Array.from(cellView.container.querySelectorAll(
        '.x6-port-body',
    ));
    if(!ports.some(p => p.style.visibility === 'visible')) {
        for (let i = 0, len = ports.length; i < len; i += 1) {
            // eslint-disable-next-line no-param-reassign
            ports[i].style.visibility = 'visible';
        }
    }
};

const hiddenPort = (cellView) => {
    const ports = Array.from(cellView.container.querySelectorAll(
        '.x6-port-body',
    ));
    if(ports.some(p => p.style.visibility === 'visible')) {
        for (let i = 0, len = ports.length; i < len; i += 1) {
            // eslint-disable-next-line no-param-reassign
            ports[i].style.visibility = 'hidden';
        }
    }
};

export const highlightAll = {
    highlight(cellView, magnet) {
        const path = Dom.createSvgElement('path');
        path.setAttribute('pathId', magnet.getAttribute('port') || magnet.getAttribute('data-cell-id'));
        const magnetVel = Vector.create(magnet);
        let pathData;
        try {
            pathData = magnetVel.toPathData();
        } catch (error) {
            const magnetBBox = Util.bbox(magnetVel.node, true);
            pathData = Dom.rectToPathData({...magnetBBox});
        }
        Dom.attr(path, {
            d: pathData,
            'pointer-events': 'none',
            'vector-effect': 'non-scaling-stroke',
            fill: 'none',
            'stroke-width': '3px',
            stroke: '#FEB663',
        });
        let highlightMatrix = magnetVel.getTransformToElement(
            cellView.container);
        Dom.transform(path, highlightMatrix);
        cellView.container.appendChild(path);
        showPort(cellView);
    },

    unhighlight(cellView, magnetEl) {
        const path = Array
            .from(cellView.container.querySelectorAll('path'))
            .filter(p => p.getAttribute('pathId'))
            .find((p) => {
                return p.getAttribute('pathId') === magnetEl.getAttribute('port') || p.getAttribute('pathId') === magnetEl.getAttribute('data-cell-id');
            });
        path && cellView.container.removeChild(path);
        hiddenPort(cellView);
    },
};

Graph.registerHighlighter('highlightAll', highlightAll, true);
