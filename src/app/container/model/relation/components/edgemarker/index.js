import { Graph, Path } from '@antv/x6';

Graph.registerMarker('empty-block', (args) => {
    const { ...attrs } = args;
    return {
        ...attrs,
        tagName: 'path',
        fill: '#ffffff',
        d: 'M 10 -5 0 0 10 5 Z',
    };
});

Graph.registerMarker('open-block', (args) => {
    const { ...attrs } = args;
    return {
        ...attrs,
        tagName: 'path',
        fill: 'none',
        d: 'M 10 -5 0 0 10 5',
    };
});

Graph.registerMarker('er-1', (args) => {
    const { ...attrs } = args;
    return {
        ...attrs,
        tagName: 'path',
        fill: 'none',
        d: 'M 10 -5 10 5',
    };
});

Graph.registerMarker('er-n', (args) => {
    const { ...attrs } = args;
    return {
        ...attrs,
        tagName: 'path',
        fill: '#ffffff',
        d: 'M 3 3 10 0 M 10 0 3 -3 M 12.5 2.5 A 1 1 0 0 0 12.5 -2.5 M 12.5 2.5 A 1 1 0 0 1 12.5 -2.5',
    };
});

Graph.registerMarker('er-1n', (args) => {
    const { ...attrs } = args;
    return {
        ...attrs,
        tagName: 'path',
        fill: '#ffffff',
        d: 'M 12 -5 12 5 M 3 3 10 0 M 10 0 3 -3 M 12.5 2.5',
    };
});

Graph.registerMarker('er-01', (args) => {
    const { ...attrs } = args;
    return {
        ...attrs,
        tagName: 'path',
        fill: '#ffffff',
        d: 'M 9 -5 9 5 M 12.5 2.5 A 1 1 0 0 0 12.5 -2.5 M 12.5 2.5 A 1 1 0 0 1 12.5 -2.5',
    };
});

Graph.registerConnector(
    'curve',
    (sourcePoint, targetPoint) => {
        const path = new Path();
        path.appendSegment(Path.createSegment('M', sourcePoint));
        const calcIntersectionPoint = () => {
            // 计算中间节点
            const k = 0.5;
            const c = {
                x: (sourcePoint.x + targetPoint.x) / 2,
                y: (sourcePoint.y + targetPoint.y) / 2,
            };
            const dx = targetPoint.x - sourcePoint.x, dy = targetPoint.y - sourcePoint.y;
            const Px = c.x - dy * k;
            const Py = c.y + dx * k;
            return {
                x:  Px,
                y:  Py,
            };
        };
        const controlPoint = calcIntersectionPoint();
        // 基于控制点生成二次贝塞尔曲线
        path.appendSegment(path.quadTo(controlPoint, targetPoint));
        return path.serialize();
    },
    true,
);

Graph.registerConnector(
    'curveConnector',
    (sourcePoint, targetPoint) => {
        const hgap = Math.abs(targetPoint.x - sourcePoint.x);
        const path = new Path();
        path.appendSegment(
            Path.createSegment('M', sourcePoint.x - 4, sourcePoint.y),
        );
        path.appendSegment(
            Path.createSegment('L', sourcePoint.x + 12, sourcePoint.y),
        );
        // 水平三阶贝塞尔曲线
        path.appendSegment(
            Path.createSegment(
                'C',
                sourcePoint.x < targetPoint.x
                    ? sourcePoint.x + hgap / 2
                    : sourcePoint.x - hgap / 2,
                sourcePoint.y,
                sourcePoint.x < targetPoint.x
                    ? targetPoint.x - hgap / 2
                    : targetPoint.x + hgap / 2,
                targetPoint.y,
                targetPoint.x - 6,
                targetPoint.y,
            ),
        );
        path.appendSegment(
            Path.createSegment('L', targetPoint.x + 2, targetPoint.y),
        );

        return path.serialize();
    },
    true,
);

function sin(portsPositionArgs, elemBBox) {
    console.log(portsPositionArgs, elemBBox);
    return portsPositionArgs.map((_, index) => {
        const step = -Math.PI / 8;
        const y = Math.sin(index * step) * 50;
        return {
            position: {
                x: index * 12,
                y: y + elemBBox.height,
            },
            angle: 0,
        };
    });
}

Graph.registerPortLayout('lin1', sin);
