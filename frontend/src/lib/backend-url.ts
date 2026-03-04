const getBackendUrl = () => {
    const url = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
    if (!url) {
        throw new Error('Backend URL is not set (BACKEND_INTERNAL_URL or NEXT_PUBLIC_BACKEND_PUBLIC_URL)');
    }
    return url;
}

export default getBackendUrl;