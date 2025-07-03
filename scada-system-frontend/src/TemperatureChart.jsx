// TemperatureChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TemperatureChart = ({ dataPoints }) => {
    const chartData = {
        labels: dataPoints.map(point => new Date(point.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Temp Pumps',
                data: dataPoints.map(point => point.temperature),
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                tension: 0.3
            },
            {
                label: 'Temp after cooling',
                data: dataPoints.map(point => point.coolingTemperature),
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                tension: 0.3
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Temperature (C)'
                }
            }
        }
    };

    return (
        <div style={{ height: '300px', backgroundColor: '#f0f0f0', padding: '10px', border: '1px solid #999' }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default TemperatureChart;
