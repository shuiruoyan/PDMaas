import { NodeView } from '@antv/x6';

export default class SimpleNodeView extends NodeView {
    renderMarkup() {
        return this.renderJSONMarkup({
            tagName: 'rect',
            selector: 'body',
        });
    }
    update() {
        super.update({
            body: {
                refWidth: '100%',
                refHeight: '100%',
                fill: '#ECF0FF',
                stroke: '#0F40F5',
                strokeWidth: 1,
            },
        });
    }
}
