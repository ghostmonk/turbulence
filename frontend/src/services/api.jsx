export const fetchContent = async () => {
    const response = await fetch('/api/data');
    return response.json();
};