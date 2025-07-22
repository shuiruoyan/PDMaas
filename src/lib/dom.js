export const isChild = (parentDom, childDom) => {
    if(!parentDom || !childDom) {
        return false
    } else if(parentDom === childDom) {
        return false;
    } else if(parentDom.contains(childDom)) {
        return true;
    } else {
        let tempDom = childDom.parentNode;
        while ((tempDom !== parentDom) && (tempDom !== document)) {
            if(tempDom === null) {
                return false;
            }
            tempDom = tempDom.parentNode;

        }
        return tempDom === parentDom;
    }
}
