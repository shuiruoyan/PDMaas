import {Graph, ToolsView} from '@antv/x6';
import {openLink} from '../../../../../../lib/app_tool';

const ToolItem = ToolsView.ToolItem;

// 节点编辑
class LinkNodeTool extends ToolItem {
    constructor() {
        super();
        this.handler = {
            click: ({cell, e}) => {
                if (cell.id === this.cell.id) {
                    const link = this.cell.prop('link');
                    if(link?.value && (e.target.tagName === 'tspan' || e.target.tagName === 'p' || e.target.tagName === 'P' || e.target.tagName === 'A')) {
                        e.stopPropagation();
                        if(link.type === 'in') {
                            this.graph.emit('node:jump', link);
                        } else {
                            openLink(link?.value);
                        }
                    }
                }
            },
        };
    }
    initListener(){
        this.graph.on('node:click', this.handler.click);
    }
    render() {
        this.initListener();
        return this;
    }
    onRemove() {
        this.graph.off(null, this.handler.click);
    }
}

Graph.registerNodeTool('link-node', LinkNodeTool, true);
