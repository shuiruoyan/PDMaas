let memoryCache = {};

export const getMemoryCache = (key) => {
    return memoryCache[key];
};

export const setMemoryCache = (key, value) => {
    memoryCache[key] = value;
};

export const clearMemoryCache = () => {
    memoryCache = {};
};