import { getAuthToken } from './toolsHelper';

const BASE_URL = import.meta.env.VITE_DELCOM_BASEURL ?? '';

export interface ApiResponse<T = unknown> {
    status: 'success' | 'fail' | 'error';
    message: string;
    data?: T;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
    method?: Method;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    token?: string | null;
    fetcher?: typeof fetch;
    signal?: AbortSignal;
}

type ShortcutOptions = Omit<RequestOptions, 'method' | 'body'>;

const VALID_STATUS = ['success', 'fail', 'error'];

export async function apiRequest<T = unknown>(
    path: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {

    const {
        method = 'GET',
        body,
        query,
        token = getAuthToken(),
        fetcher = fetch,
        signal
    } = options;

    // Validasi konfigurasi API
    if (!BASE_URL) {
        console.error('VITE_DELCOM_BASEURL belum dikonfigurasi.');

        return {
            status: 'fail',
            message: 'Konfigurasi URL API belum tersedia. Periksa file .env.'
        };
    }

    let url: URL;

    try {
        url = new URL(
            `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
        );
    } catch {
        return {
            status: 'fail',
            message: 'Format URL API tidak valid.'
        };
    }

    // Query parameter
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    // Headers
    const headers: Record<string, string> = {
        Accept: 'application/json'
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Request body
    let payload: BodyInit | undefined;

    if (body instanceof FormData) {
        payload = body;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    try {
        const res = await fetcher(url.toString(), {
            method,
            headers,
            body: payload,
            signal
        });

        const json = await res.json().catch(() => null);

        // Respons standar API Delcom
        if (
            json &&
            typeof json === 'object' &&
            VALID_STATUS.includes(json.status)
        ) {
            return json as ApiResponse<T>;
        }

        return {
            status: res.ok ? 'success' : 'fail',
            message: res.ok
                ? 'Berhasil'
                : res.statusText || 'Terjadi kesalahan'
        };

    } catch (error) {
        console.error('API Request Error:', error);

        return {
            status: 'fail',
            message: 'Tidak dapat terhubung ke server'
        };
    }
}

export const apiGet = <T = unknown>(
    path: string,
    options?: ShortcutOptions
) => apiRequest<T>(path, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(
    path: string,
    body?: unknown,
    options?: ShortcutOptions
) => apiRequest<T>(path, {
    ...options,
    method: 'POST',
    body
});

export const apiPut = <T = unknown>(
    path: string,
    body?: unknown,
    options?: ShortcutOptions
) => apiRequest<T>(path, {
    ...options,
    method: 'PUT',
    body
});

export const apiDelete = <T = unknown>(
    path: string,
    options?: ShortcutOptions
) => apiRequest<T>(path, {
    ...options,
    method: 'DELETE'
});