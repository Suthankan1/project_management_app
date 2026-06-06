/**
 * Helper to retrieve the base URL of the Spring Boot backend API from environment variables.
 * 
 * In development, defaults to 'http://localhost:8080' if NEXT_PUBLIC_API_BASE_URL is missing.
 * In production, allows an empty string to be returned if NEXT_PUBLIC_API_BASE_URL is missing,
 * so Axios uses relative URLs (making requests through the Next.js/Netlify reverse proxy).
 */
export function getApiBaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
        const isProdRuntime = process.env.NODE_ENV === 'production';
        if (isProdRuntime) {
            return '';
        }
        return 'http://localhost:8080';
    }
    return url;
}
