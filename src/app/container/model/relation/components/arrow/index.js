export const getAllow = (position) => {
    const shape = `arrow_${position}`;
    const getRefD = () => {
        if(position === 'right') {
            return 'M 0 0 L 40 0 L 40 -10 L60 10 L 40 30 L 40 20 L 0 20 Z';
        } else if(position === 'left') {
            return 'M 60 0 L 20 0 L 20 -10 L0 10 L 20 30 L 20 20 L 60 20 Z';
        } else if(position === 'top') {
            return 'M 0 60 L 0 20 L -10 20 L10 0 L 30 20 L 20 20 L 20 60 Z';
        }
        return 'M 0 0 L 0 40 L -10 40 L10 60 L 30 40 L 20 40 L 20 0 Z';
    };
    return {
        shape,
        markup: [
            {
                tagName: 'path',
                selector: 'body',
            },
            {
                tagName: 'foreignObject',
                selector: 'foreignObject',
                children: [
                    {
                        tagName: 'div',
                        ns: 'http://www.w3.org/1999/xhtml',
                        selector: 'text',
                        style: {
                            overflow: 'hidden',
                            width: '100%',
                            height: '100%',
                            position: 'static',
                            backgroundColor: 'transparent',
                            textAlign: 'center',
                            margin: 0,
                            padding: '5px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            wordBreak: 'break-all',
                        },
                    },
                ],
            },
        ],
        attrs: {
            body: {
                refD: getRefD(),
            },
            foreignObject: {
                refWidth: '100%',
                refHeight: '100%',
            },
            text: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
            },
        },
        attrHooks: {
            text: {
                set(text, { elem }) {
                    // eslint-disable-next-line no-param-reassign
                    elem.innerHTML = '';
                    (text || '').replace(/\r|\n|\r\n/g, '\n')
                        .split('\n').forEach((t) => {
                        const p = document.createElement('p');
                        p.style.width = '100%';
                        p.style.margin = '0px';
                        p.innerText = t;
                        elem.appendChild(p);
                    });
                },
            },
            fill: {
                // eslint-disable-next-line consistent-return
                set(text, {elem }) {
                    if (elem instanceof HTMLElement) {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.color = text;
                    } else {
                        elem.setAttribute('fill', text);
                    }
                },
            },
            textAnchor: {
                set(text, { elem }) {
                    if(text === 'end') {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.textAlign = 'left';
                    } else if(text === 'start') {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.textAlign = 'right';
                    } else {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.textAlign = 'center';
                    }
                },
            },
            textVerticalAnchor: {
                set(text, { elem }) {
                    if(text === 'bottom') {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.justifyContent = 'start';
                    } else if(text === 'top') {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.justifyContent = 'end';
                    } else {
                        // eslint-disable-next-line no-param-reassign
                        elem.style.justifyContent = 'center';
                    }
                },
            },
            fontSize: {
                set(text, { elem }) {
                    // eslint-disable-next-line no-param-reassign
                    elem.style.fontSize = `${text}px`;
                },
            },
            'font-weight': {
                set(text, { elem }) {
                    // eslint-disable-next-line no-param-reassign
                    elem.style.fontWeight = text;
                },
            },
            'font-style': {
                set(text, { elem }) {
                    // eslint-disable-next-line no-param-reassign
                    elem.style.fontStyle = text;
                },
            },
            'text-decoration': {
                set(text, { elem }) {
                    setTimeout(() => {
                        Array.from(elem.children).forEach((c) => {
                            // eslint-disable-next-line no-param-reassign
                            c.style.textDecoration = text;
                        });
                    });
                },
            },
            cursor: {
                set(text, { elem }) {
                    Array.from(elem.children).forEach((c) => {
                        // eslint-disable-next-line no-param-reassign
                        c.style.cursor = text;
                    });
                },
            },
        },
    };
};
