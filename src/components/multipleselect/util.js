export function getScroller(ele) {
    // 获取所有可滚动的父节点
    const scrollerList = [];
    let current = ele?.parentElement;
    const scrollStyle = ['auto'];
    while (current && scrollerList.length === 0) {
        const { overflowX, overflowY, overflow } =
            ele.ownerDocument.defaultView.getComputedStyle(current);
        if ([overflowX, overflowY, overflow].some(o => scrollStyle.includes(o))) {
            scrollerList.push(current);
        }
        current = current.parentElement;
    }
    return scrollerList[0];
}
