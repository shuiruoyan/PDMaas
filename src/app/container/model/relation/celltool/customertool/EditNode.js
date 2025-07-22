import {Graph, ToolsView} from '@antv/x6';
import {getPrefix} from '../../../../../../lib/classes';

const ToolItem = ToolsView.ToolItem;

const currentPrefix = getPrefix('container-model-relation-celltool');
// 节点编辑
class EditNodeTool extends ToolItem {
    constructor() {
        super();
        this.handler = {
            dblclick: ({cell}) => {
                if (cell.id === this.cell.id && !this.editorContent) {
                    this.renderTextarea();
                }
            },
            scale: () => {
                if(this.editorContent) {
                    this.renderTextarea();
                }
            },
            translate: () => {
                if(this.editorContent) {
                    this.renderTextarea();
                }
            },
        };
    }
    renderTextarea(){
        const cell = this.cell;
        let x = 0;
        let y = 0;
        let width = 0;
        let height = 0;

        const position = cell.position();
        const size = cell.size();
        const pos = this.graph.localToGraph(position);
        const zoom = this.graph.zoom();
        width = size.width * zoom;
        height = size.height * zoom;
        x = pos.x;
        y = pos.y;

        if(!this.editorContent) {
            this.editorParent = ToolsView.createElement('div', false);
            this.editorParent.setAttribute('class', `${currentPrefix}-editnode ${currentPrefix}-editnode-${cell?.cellType}`);
            this.editorParent.style.position = 'absolute';
            this.editorContent = ToolsView.createElement('textarea', false);
            this.editorParent.appendChild(this.editorContent);
            this.container.appendChild(this.editorParent);
            const moveEvent = (e) => {
                e.stopPropagation();
            };
            document.body.addEventListener('mousemove', moveEvent);
            const cellContainer = this.cellView.container;
            cellContainer.style.display = 'none';
            this.editorContent.focus();
            this.graph.disablePanning();
            if(cell.attr('text/text') === undefined) {
                cell.attr('text/text', '', { ignore: true});
            }
            const getValue = () => {
                return cell.attr('text/text');
            };
            const setValue = (value) => {
                cell.attr('text/text', value);
            };
            this.editorContent.value = getValue();
            this.editorContent.onblur = (e) => {
                this.container.removeChild(this.editorParent);
                this.editorContent = null;
                setValue(e.target.value);
                cellContainer.style.display = 'unset';
                this.graph.enablePanning();
                document.body.removeEventListener('mousemove', moveEvent);
            };
        }
        this.editorParent.style.left = `${x}px`;
        this.editorParent.style.top = `${y}px`;
        this.editorParent.style.width = `${width}px`;
        this.editorParent.style.height = `${height}px`;
    }

    initListener(){
        this.graph.on('node:dblclick', this.handler.dblclick);
        this.graph.on('scale', this.handler.scale);
        this.graph.on('translate', this.handler.translate);
    }

    render() {
        this.initListener();
        return this;
    }
    onRemove() {
        this.graph.off(null, this.handler.dblclick);
        this.graph.off(null, this.handler.scale);
        this.graph.off(null, this.handler.translate);
    }
}

EditNodeTool.config({
    tagName: 'div',
    isSVGElement: false,
});

Graph.registerNodeTool('edit-node', EditNodeTool, true);
