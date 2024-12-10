export const stringReduce = (stringToReduce, length) => {
    if (stringToReduce.length <= length) {
        return stringToReduce;
    }
    return stringToReduce.slice(0, length) + '...';
};

export const currentTime = () => {
    return new Date().getTime();
}
