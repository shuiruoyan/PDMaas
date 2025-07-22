export const shallowCompare = (pre, next, names = []) => {
    const preNames = names.length > 0 ? names : Object.keys(pre);
    const nextNames = names.length > 0 ? names : Object.keys(next);
    if(preNames.length !== nextNames.length) {
        return false;
    } else {
        return !preNames.some(n => pre[n] !== next[n]);
    }
}
