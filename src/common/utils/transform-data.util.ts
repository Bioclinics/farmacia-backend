export const toBoolean = (value: any, defaultValue): boolean => {
    if (value === "true") return true;
    if (value === "false") return false;
    return defaultValue;
};
