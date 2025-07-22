import React, {
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

export default React.memo(({text}) => {
    const [truncatedText, setTruncatedText] = useState(text);
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const measureRef = useRef(null); // 用于测量文本宽度的隐藏元素

    // 防抖函数，减少resize触发频率
    const debounce = (func, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    useLayoutEffect(() => {
        const checkOverflow = () => {
            if (!containerRef.current || !contentRef.current) return;

            const containerWidth = containerRef.current.clientWidth;
            // 获取内容元素的字体样式
            const styles = window.getComputedStyle(contentRef.current);
            const fontSize = styles.fontSize;
            const fontFamily = styles.fontFamily;

            // 创建用于测量的隐藏元素
            if (!measureRef.current) {
                measureRef.current = document.createElement('div');
                measureRef.current.style.position = 'absolute';
                measureRef.current.style.visibility = 'hidden';
                measureRef.current.style.whiteSpace = 'nowrap';
                document.body.appendChild(measureRef.current);
            }
            measureRef.current.style.fontSize = fontSize;
            measureRef.current.style.fontFamily = fontFamily;

            // 测量函数
            const measureText = (str) => {
                measureRef.current.textContent = str;
                return measureRef.current.offsetWidth;
            };

            // 判断是否需要截断
            if (measureText(text) <= containerWidth) {
                setTruncatedText(text);
                return;
            }

            // 中间截断算法
            let frontChars = Math.floor(text.length / 2);
            let rearChars = Math.ceil(text.length / 2) - 3; // 留出...的位置
            let bestMatch = '';

            while (frontChars > 0 && rearChars > 0) {
                const truncated = `${text.slice(0, frontChars)}...${text.slice(-rearChars)}`;
                const width = measureText(truncated);

                if (width <= containerWidth) {
                    // 尝试增加字符以找到更优解
                    while (frontChars + 1 <= text.length && rearChars + 1 <= text.length) {
                        const nextTrunc = `${text.slice(0, frontChars + 1)}...${text.slice(-(rearChars + 1))}`;
                        const nextWidth = measureText(nextTrunc);
                        if (nextWidth > containerWidth) break;
                        frontChars += 1;
                        rearChars += 1;
                    }
                    bestMatch = `${text.slice(0, frontChars)}...${text.slice(-rearChars)}`;
                    break;
                } else {
                    frontChars -= 1;
                    rearChars -= 1;
                }
            }

            setTruncatedText(bestMatch || '...');
        };

        // 立即执行一次检测
        checkOverflow();

        // 防抖处理resize事件
        const debouncedCheck = debounce(checkOverflow, 200);
        window.addEventListener('resize', debouncedCheck);

        return () => {
            window.removeEventListener('resize', debouncedCheck);
            if (measureRef.current) {
                document.body.removeChild(measureRef.current);
                measureRef.current = null;
            }
        };
    }, [text]);

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <div ref={contentRef}>{truncatedText}</div>
      </div>
    );
});
