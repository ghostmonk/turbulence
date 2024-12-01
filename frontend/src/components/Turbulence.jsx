import React, { useEffect, useState } from 'react';
import { fetchContent } from '../services/api';
import { formatDate } from '../utils/date_time';

const Turbulence = () => {
    const [content, setContent] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContent()
            .then(data => setContent(data)) // Set the data on success
            .catch(err => setError(err.message)); // Handle errors
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
                <div style={{margin: '1em 0'}}>
                    <h1>{item.title}</h1>
                    <h3>{formatDate(item.date)}</h3>
                    <p>{item.content}</p>
                </div>
            ))}
        </div>
    );
};

export default Turbulence;
