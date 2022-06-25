import { useEffect, useRef } from "react";

const useComponentDidMount = (cb: ()=> Promise<void>): void => {
    const didMount = useRef(false);

    useEffect(()=>{
        if(!didMount.current) {
            cb();
            didMount.current = true;
        }
    },[]);
}

export default useComponentDidMount;