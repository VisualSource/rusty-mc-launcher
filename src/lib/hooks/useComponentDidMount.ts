import { useEffect, useRef, useCallback } from "react";

const useComponentDidMount = (cb: ()=> Promise<void>): void => {
    const didMount = useRef(false);
    const callback = useCallback(cb,[]);

    useEffect(()=>{
        if(!didMount.current) {
            callback();
            didMount.current = true;
        }
    },[]);
}

export default useComponentDidMount;