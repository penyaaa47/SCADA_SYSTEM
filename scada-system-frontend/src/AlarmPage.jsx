// AlarmPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const AlarmPage = () => {
    const [alarms, setAlarms] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3001/api/alarms')
            .then(res => res.json())
            .then(data => setAlarms(data))
            .catch(err => console.error('Ошибка при загрузке аварий:', err));
    }, []);

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Segoe UI, sans-serif',
            backgroundColor: '#dcdcdc',
            minHeight: '100vh'
        }}>
            <h2 style={{ marginBottom: '10px' }}>Журнал аварий</h2>
            <Link to="/" style={{ marginBottom: '20px', display: 'inline-block', color: 'blue' }}>← Назад</Link>

            {alarms.length === 0 ? (
                <div style={{
                    backgroundColor: '#eee',
                    padding: '10px',
                    border: '1px solid #999',
                    width: 'fit-content'
                }}>
                    Нет зарегистрированных аварий
                </div>
            ) : (
                <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #aaa',
                    backgroundColor: '#f9f9f9'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: '#f0f0f0'
                    }}>
                        <thead style={{ backgroundColor: '#c0c0c0' }}>
                            <tr>
                                <th style={cellStyle}>Время</th>
                                <th style={cellStyle}>Тип</th>
                                <th style={cellStyle}>Сообщение</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alarms.map((alarm) => (
                                <tr key={alarm.id}>
                                    <td style={cellStyle}>{new Date(alarm.timestamp).toLocaleString()}</td>
                                    <td style={cellStyle}>{alarm.type}</td>
                                    <td style={cellStyle}>{alarm.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const cellStyle = {
    border: '1px solid #999',
    padding: '8px',
    fontSize: '14px',
    textAlign: 'left'
};

export default AlarmPage;
