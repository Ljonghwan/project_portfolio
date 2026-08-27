import { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/libs/api';

const MIN_LOADING_MS = 300;

/**
 * 리스트 페이지 공통 훅 (서버 페이지네이션 모드)
 * - 기존 페이지들의 하위 호환용
 */
export default function useListPage({ url, limit = 20, params = {}, deps = [] }) {
    const [list, setList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const mountedRef = useRef(true);
    const paramsRef = useRef(params);
    paramsRef.current = params;
    const requestIdRef = useRef(0);

    const fetchData = useCallback(async (currentPage) => {
        const reqId = ++requestIdRef.current;
        setLoading(true);
        const resolvedParams = typeof paramsRef.current === 'function'
            ? paramsRef.current()
            : paramsRef.current;
        const [{ data }] = await Promise.all([
            API.post(url, { page: currentPage, limit, ...resolvedParams }),
            new Promise(r => setTimeout(r, MIN_LOADING_MS)),
        ]);
        if (!mountedRef.current || reqId !== requestIdRef.current) return;
        setList(data?.list || []);
        setTotalCount(data?.totalCount || 0);
        setLoading(false);
    }, [url, limit]);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        fetchData(page);
    }, [page, ...deps]);

    const reload = useCallback(() => {
        if (page === 1) {
            fetchData(1);
        } else {
            setPage(1);
        }
    }, [page, fetchData]);

    return { list, totalCount, page, setPage, loading, reload, fetchData };
}


/**
 * 전체 데이터 훅 (프론트 필터/페이지네이션 모드)
 *
 * - 서버에서 전체 데이터를 한번에 가져옴 (limit: 0)
 * - 모듈 레벨 캐시: 뒤로가기 시 즉시 표시, 백그라운드로 갱신
 * - 컴포넌트 상태(필터, 페이지)는 컴포넌트에서 직접 관리
 */
const _dataCache = new Map();

export function useAllData({ url, params = {}, deps = [] }) {
    const paramsRef = useRef(params);
    paramsRef.current = params;
    const mountedRef = useRef(true);
    const requestIdRef = useRef(0);

    const depsKey = `${url}|${JSON.stringify(deps)}`;

    const [allData, setAllData] = useState(() => _dataCache.get(depsKey) || []);
    const [loading, setLoading] = useState(() => !_dataCache.has(depsKey));

    // deps 키 변경 시 캐시에서 복원
    const prevDepsKeyRef = useRef(depsKey);
    useEffect(() => {
        if (prevDepsKeyRef.current !== depsKey) {
            const cached = _dataCache.get(depsKey);
            if (cached) {
                setAllData(cached);
                setLoading(false);
            } else {
                setAllData([]);
                setLoading(true);
            }
            prevDepsKeyRef.current = depsKey;
        }
    }, [depsKey]);

    const fetchData = useCallback(async (force = false) => {
        const reqId = ++requestIdRef.current;
        const hasCached = _dataCache.has(depsKey);

        if (force || !hasCached) setLoading(true);

        const resolvedParams = typeof paramsRef.current === 'function'
            ? paramsRef.current()
            : paramsRef.current;

        try {
            const { data } = await API.post(url, { ...resolvedParams, limit: 0 });
            if (!mountedRef.current || reqId !== requestIdRef.current) return;

            const list = data?.list || data || [];
            _dataCache.set(depsKey, list);
            setAllData(list);
        } catch (e) {
            // ignore
        }
        if (mountedRef.current && reqId === requestIdRef.current) {
            setLoading(false);
        }
    }, [url, depsKey]);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        fetchData();
    }, [depsKey]);

    const reload = useCallback(() => {
        _dataCache.delete(depsKey);
        fetchData(true);
    }, [depsKey, fetchData]);

    return { allData, loading, reload };
}


/**
 * 리스트+디테일 뷰 전환 훅
 */
export function useDetailView(defaultForm = {}) {
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ ...defaultForm });

    useEffect(() => {
        const onPopState = () => {
            if (editItem) {
                setEditItem(null);
                setForm({ ...defaultForm });
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [editItem]);

    const handleEdit = (item, formMapper) => {
        history.pushState({ ...history.state, detail: true }, '');
        setEditItem(item);
        if (formMapper) {
            setForm(formMapper(item));
        }
    };

    const handleNew = () => {
        history.pushState({ ...history.state, detail: true }, '');
        setEditItem({});
        setForm({ ...defaultForm });
    };

    const handleCancel = () => {
        setEditItem(null);
        setForm({ ...defaultForm });
    };

    const isNew = editItem && !editItem.idx;

    return { editItem, setEditItem, form, setForm, isNew, handleEdit, handleNew, handleCancel };
}
