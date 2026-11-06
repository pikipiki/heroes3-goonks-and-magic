// Heroes III uses braces to highlight text in its native windows.
export const plainGameText=text=>String(text??'').replace(/\{([^{}]+)\}/g,'$1');
