export const fetchContent = async () => {
    const response = await fetch('https://api.ghostmonk.com/data');
    return response.json();
};