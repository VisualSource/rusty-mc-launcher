import { useCallback } from 'react';
import FileSizeFormat from '@saekitominaga/file-size-format';

const useFormatSize = () => {
    return useCallback((size: number) => FileSizeFormat.si(size), []);
}

export default useFormatSize;