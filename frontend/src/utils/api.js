export const fetchContent = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
};