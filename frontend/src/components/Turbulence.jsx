import React, { useEffect, useState } from 'react';

const Turbulence = () => {
    const [content, setContent] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/data')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json()
            })
            .then(data => setContent(data))
            .catch(err => setError(err.message));
    }, []);

    if (error) {
        return (
            <div>
                <h1>Error</h1>
                <p>There was an error loading the API:</p>
                <p style={{color: 'red'}}>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Turbulence</h1>
            {content.map(item => (
                <div key={item.id} style={{margin: '1em 0'}}>
                <p>{item.content}</p>
                </div>
            ))}
        </div>
    );
};

export default Turbulence;
