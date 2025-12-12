import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const ProgressChart = ({ sessions, type = 'line' }) => {
    // Group sessions by week
    const weeklyData = {};

    sessions.forEach(session => {
        const date = new Date(session.fecha);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = 0;
        }
        weeklyData[weekKey] += parseFloat(session.horas_entrenadas || 0);
    });

    const sortedWeeks = Object.keys(weeklyData).sort();
    const labels = sortedWeeks.map(week => {
        const date = new Date(week);
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    const data = sortedWeeks.map(week => weeklyData[week]);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Horas Entrenadas',
                data,
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#26262a',
                titleColor: '#FF6B35',
                bodyColor: '#e5e5e9',
                borderColor: '#4a4a51',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#36363c'
                },
                ticks: {
                    color: '#a6a6b2'
                }
            },
            x: {
                grid: {
                    color: '#36363c'
                },
                ticks: {
                    color: '#a6a6b2'
                }
            }
        }
    };

    return (
        <div className="w-full h-64">
            {type === 'line' ? (
                <Line data={chartData} options={options} />
            ) : (
                <Bar data={chartData} options={options} />
            )}
        </div>
    );
};

export default ProgressChart;
