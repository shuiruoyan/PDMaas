// 去掉DOM节点中的公式标签
export const removeFormulaTags = (node) => {
    const walk = (root) => {
        const childNodes = root.childNodes;
        // eslint-disable-next-line no-shadow
        childNodes.forEach((node) => {
            if (node.nodeType === 1) {
                if (node.classList.contains('ql-formula')) {
                    node.parentNode.removeChild(node);
                } else {
                    walk(node);
                }
            }
        });
    };
    walk(node);
};

// 会过滤掉节点中的格式节点
let nodeRichTextToTextWithWrapEl = null;
export const nodeRichTextToTextWithWrap = (html) => {
    if (!nodeRichTextToTextWithWrapEl) {
        nodeRichTextToTextWithWrapEl = document.createElement('div');
    }
    nodeRichTextToTextWithWrapEl.innerHTML = html;
    const childNodes = nodeRichTextToTextWithWrapEl.childNodes;
    let res = '';
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        if (node.nodeType === 1) {
            // 元素节点
            removeFormulaTags(node);
            if (node.tagName.toLowerCase() === 'p') {
                res += `${node.textContent  }\n`;
            } else {
                res += node.textContent;
            }
        } else if (node.nodeType === 3) {
            // 文本节点
            res += node.nodeValue;
        }
    }
    return res.replace(/\n$/, '');
};

export const htmlEscape = (str) => {
    [
        ['&', '&amp;'],
        ['<', '&lt;'],
        ['>', '&gt;'],
    ].forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        str = str.replace(new RegExp(item[0], 'g'), item[1]);
    });
    return str;
};

export const mind2tree = (mindData) => {
    const getText = () => {
      return htmlEscape(mindData.data.richText
          ? nodeRichTextToTextWithWrap(mindData.data.text)
          : mindData.data.text).replaceAll(/\n/g, '<br>');
    };
    return [{
        id: mindData.data.uid,
        defName: getText(),
        data: mindData.data,
        children: mindData.children.length > 0 ? mindData.children.map((c) => {
            return mind2tree(c)[0];
        }) : null,
    }];
};

// 将<br>换行的文本转换成<p><span></span><p>形式的节点富文本内容
let textToNodeRichTextWithWrapEl = null;
export const textToNodeRichTextWithWrap = (html) => {
    if (!textToNodeRichTextWithWrapEl) {
        textToNodeRichTextWithWrapEl = document.createElement('div');
    }
    textToNodeRichTextWithWrapEl.innerHTML = html;
    const childNodes = textToNodeRichTextWithWrapEl.childNodes;
    let list = [];
    let str = '';
    for (let i = 0; i < childNodes.length; i += 1) {
        const node = childNodes[i];
        if (node.nodeType === 1) {
            // 元素节点
            if (node.tagName.toLowerCase() === 'br') {
                list.push(str);
                str = '';
            } else {
                str += node.textContent;
            }
        } else if (node.nodeType === 3) {
            // 文本节点
            str += node.nodeValue;
        }
    }
    if (str) {
        list.push(str);
    }
    return list
        .map((item) => {
            return `<p><span>${htmlEscape(item)}</span></p>`;
        })
        .join('');
};
