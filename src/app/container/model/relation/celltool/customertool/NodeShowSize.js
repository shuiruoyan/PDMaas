import {Graph, ToolsView} from '@antv/x6';
import {getPrefix} from '../../../../../../lib/classes';

const ToolItem = ToolsView.ToolItem;

const currentPrefix = getPrefix('container-model-relation-celltool');

// 节点大小显示
class NodeSizeTool extends ToolItem {
    constructor() {
        super();
        this.handler = {
            selected: ({cell}) => {
                if(cell.id === this.cell.id && !this.sizeDom) {
                    this.renderSizeDom();
                }
            },
            unselected: ({cell}) => {
                if(cell.id === this.cell.id && this.sizeDom) {
                    this.container.removeChild(this.sizeDom);
                    this.sizeDom = null;
                }
            },
            scale: () => {
                if(this.sizeDom) {
                    this.renderSizeDom();
                }
            },
            translate: () => {
                if(this.sizeDom) {
                    this.renderSizeDom();
                }
            },
        };
    }
    renderSizeDom(){
        const cell = this.cell;
        let x ;
        let y;
        const position = cell.position();
        const size = cell.size();
        const pos = this.graph.localToGraph(position);
        const zoom = this.graph.zoom();
        x = pos.x;
        y = pos.y;
        if(!this.sizeDom) {
            const sizeDom = ToolsView.createElement('div', false);
            sizeDom.setAttribute('class', `${currentPrefix}-nodesize`);
            sizeDom.style.position = 'absolute';
            sizeDom.style.left = `${x}px`;
            sizeDom.style.top = `${y + 10 + size.height * zoom}px`;
            sizeDom.style.width = `${size.width * zoom}px`;
            sizeDom.innerHTML = `<span>${Math.floor(size.width)} * ${Math.floor(size.height)}</span>`;
            this.sizeDom = sizeDom;
            this.container.appendChild(sizeDom);
        } else {
            this.sizeDom.style.left = `${x}px`;
            this.sizeDom.style.top = `${y + 10 + size.height * zoom}px`;
            this.sizeDom.style.width = `${size.width * zoom}px`;
            this.sizeDom.innerHTML = `<span>${Math.floor(size.width)} * ${Math.floor(size.height)}</span>`;
        }
    }
    initListener(){
        this.graph.on('node:selected', this.handler.selected);
        this.graph.on('node:unselected',  this.handler.unselected);
        this.graph.on('scale', this.handler.scale);
        this.graph.on('translate', this.handler.translate);
        const cellView = this.cellView;
        if(cellView.graph.isSelected(cellView.cell)) {
            this.renderSizeDom();
        }
    }
    render() {
        this.initListener();
        return this;
    }
    update() {
        if(this.graph.isSelected(this.cell)) {
            this.renderSizeDom();
        }
        return this;
    }
    onRemove() {
        this.graph.off(null, this.handler.selected);
        this.graph.off(null, this.handler.unselected);
        this.graph.off(null, this.handler.scale);
        this.graph.off(null, this.handler.translate);
    }
}

NodeSizeTool.config({
    tagName: 'div',
    isSVGElement: false,
});

Graph.registerNodeTool('node-size', NodeSizeTool, true);
