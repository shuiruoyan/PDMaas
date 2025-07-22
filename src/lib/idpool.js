let pool = [];
let branchId = '';
let projectId = '';
let isFetch = false;


const getRemoteId = (size) => {
    if(!isFetch) {
        isFetch = true;
        return new Promise((resolve) => {
            if(projectId) {
                for (let i = 0; i < size; i+= 1) {
                    pool.push(`${branchId}.${Math.uuid(12)}`)
                }
                isFetch = false;
                resolve()
            } else {
                for (let i = 0; i < size; i+= 1) {
                    pool.push(Math.uuid())
                }
                isFetch = false;
                resolve()
            }
        })
    } else {
        return Promise.resolve()
    }
}

export const initIdPool = (pId, bId = '', size = 500) => {
    // 发送第一次请求
    branchId = bId;
    projectId = pId;
    return getRemoteId(size);
}

export const getId = (size) => {
    if(isFetch) {
        return [];
    }
    if(pool.length < size) {
        getRemoteId(500 - pool.length);
        return [];
    } else {
        const leftId = pool.splice(0, size);
        if(pool.length < 250) {
            getRemoteId(500 - pool.length);
        }
        return leftId;
    }
}

export const getRemoteIdAsyn = (size) => {
    return new Promise((resolve) => {
        if(projectId) {
            for (let i = 0; i < size; i+= 1) {
                pool.push(`${branchId}.${Math.uuid(12)}`)
            }
            resolve()
        } else {
            for (let i = 0; i < size; i+= 1) {
                pool.push(Math.uuid())
            }
            resolve()
        }
    })
}

export const getIdAsyn = async (size) => {
    if(pool.length < size) {
        await getRemoteId(size - pool.length + 500);
    }
    return pool.splice(0, size);
}
