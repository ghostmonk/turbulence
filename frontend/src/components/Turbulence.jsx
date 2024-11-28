import React, { useEffect, useState } from 'react';

const Turbulence = () => {
    const [content, setContent] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/data')
            .then(response => response.json())
            .then(data => setContent(data))
            .catch(err => setError(err.message));
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            {content.map(item => (
                <div key={item.id} style={{ margin: '1em 0' }}>
                    <p>{item.content}</p>
                </div>
            ))}
        </div>
    );
};

export default FlexibleContent;