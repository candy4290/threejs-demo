import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 自定义hook解决组件卸载时还会调用setState引发的内存泄露问题
 *
 * @export
 * @param {*} props
 * @return {*} 
 */
export function useFetchState<T>(props: T): [T, Function] {
  const focus = useRef<boolean>();
  const [state, setState] = useState(props);
  useEffect(() => {
    focus.current = true;
    return () => {
      focus.current = false
    };
  }, []);
  const setFetchState = useCallback((params) => {
    focus.current && setState(params);
  }, []);
  return [state, setFetchState];
}