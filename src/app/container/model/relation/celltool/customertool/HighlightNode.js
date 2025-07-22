import {Graph, ToolsView} from '@antv/x6';
import {getPrefix} from '../../../../../../lib/classes';

const ToolItem = ToolsView.ToolItem;

const currentPrefix = getPrefix('container-model-relation-celltool');

// 节点高亮显示
class HighlightNode extends ToolItem {
    constructor() {
        super();
        this.handler = {
            selected: ({cell}) => {
                if(cell.id === this.cell.id && !this.highlightDom) {
                    this.renderHighlight();
                }
            },
            unselected: ({cell}) => {
                if(cell.id === this.cell.id && this.highlightDom) {
                    this.container.removeChild(this.highlightDom);
                    this.highlightDom = null;
                }
            },
            scale: () => {
                if(this.highlightDom) {
                    this.renderHighlight();
                }
            },
            translate: () => {
                if(this.highlightDom) {
                    this.renderHighlight();
                }
            },
            twinkle: () => {
                this.renderTwinkle();
            },
        };
    }
    getCellRect = () => {
        const cell = this.cell;
        let x ;
        let y;
        const position = cell.position();
        const size = cell.size();
        const pos = this.graph.localToGraph(position);
        const zoom = this.graph.zoom();
        x = pos.x;
        y = pos.y;
        return {
            x,
            y,
            width: size.width * zoom,
            height: size.height * zoom,
        };
    }
    renderTwinkle(){
        const clear = () => {
            this.twinkleTime && clearTimeout(this.twinkleTime);
            this.twinkleDom && this.container.removeChild(this.twinkleDom);
            this.twinkleTime = null;
            this.twinkleDom = null;
        };
        clear();
        const { x, y, width, height } = this.getCellRect();
        const twinkleDom = ToolsView.createElement('div', false);
        twinkleDom.setAttribute('class', `${currentPrefix}-twinkle`);
        twinkleDom.style.left = `${x}px`;
        twinkleDom.style.top = `${y}px`;
        twinkleDom.style.width = `${width}px`;
        twinkleDom.style.height = `${height}px`;
        this.twinkleDom = twinkleDom;
        this.container.appendChild(twinkleDom);
        this.twinkleTime = setTimeout(() => {
            clear();
        }, 2000);
    }
    renderHighlight(){
        const { x, y, width, height } = this.getCellRect();
        if(!this.highlightDom) {
            const highlightDom = ToolsView.createElement('div', false);
            highlightDom.setAttribute('class', `${currentPrefix}-highlight`);
            highlightDom.style.left = `${x - 2}px`;
            highlightDom.style.top = `${y - 2}px`;
            highlightDom.style.width = `${width + 4}px`;
            highlightDom.style.height = `${height + 4}px`;
            this.highlightDom = highlightDom;
            this.container.appendChild(highlightDom);
        } else {
            this.highlightDom.style.left = `${x - 2}px`;
            this.highlightDom.style.top = `${y - 2}px`;
            this.highlightDom.style.width = `${width + 4}px`;
            this.highlightDom.style.height = `${height + 4}px`;
        }
    }
    initListener(){
        this.graph.on('node:selected', this.handler.selected);
        this.graph.on('node:unselected',  this.handler.unselected);
        this.graph.on('scale', this.handler.scale);
        this.graph.on('translate', this.handler.translate);
        this.cell.on('change:twinkle', this.handler.twinkle);
        const cellView = this.cellView;
        if(cellView.graph.isSelected(cellView.cell)) {
            this.renderHighlight();
        }
    }
    render() {
        this.initListener();
        return this;
    }
    update() {
        if(this.graph.isSelected(this.cell)) {
            this.renderHighlight();
        }
        return this;
    }
    onRemove() {
        this.graph.off(null, this.handler.selected);
        this.graph.off(null, this.handler.unselected);
        this.graph.off(null, this.handler.scale);
        this.graph.off(null, this.handler.translate);
        this.cell.off(null, this.handler.twinkle);
    }
}

HighlightNode.config({
    tagName: 'div',
    isSVGElement: false,
});

Graph.registerNodeTool('highlight-node', HighlightNode, true);
