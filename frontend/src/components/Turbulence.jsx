import React, { useEffect, useState } from 'react';
import { fetchContent } from '../services/api';
import { formatDate } from '../utils/date_time';
import { ClipLoader } from 'react-spinners';

const Turbulence = () => {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetchContent()
            .then(data => {
                setContent(data)
                setLoading(false);
            })
            .catch(err => {
                setError(err.message)
                setLoading(false);
            }); // Handle errors
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '2em' }}>
                <ClipLoader color="#3498db" loading={loading} size={50} />
                <p>Loading content...</p>
            </div>
        );
    }

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
            {content.map(item => (
                <div key={item.id} style={{margin: '1em 0'}}>
                    <h3>{item.title}</h3>
                    <h4>{formatDate(item.date)}</h4>
                    <p>{item.content}</p>
                </div>
            ))}
        </div>
    );
};

export default Turbulence;
