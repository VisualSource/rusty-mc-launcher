import { useEffect, useRef, useCallback } from "react";

const useComponentDidMount = (cb: ()=> Promise<void>): void => {
    const didMount = useRef(false);
    const callback = useCallback(cb,[cb]);

    useEffect(()=>{
        if(!didMount.current) {
            callback();
            didMount.current = true;
        }
    },[callback]);
}

export default useComponentDidMount;