import React, { useState, useEffect } from 'react';
import './TankLine.css'; // стили для воды и анимаций
import { Link } from 'react-router-dom';
import TemperatureChart from './TemperatureChart';



// Получение data из App.js
const TankLine = ({ data, socket }) => {
    const [selectedPump, setSelectedPump] = useState(1);

    const [showAlarms, setShowAlarms] = useState(false);
    const [alarmList, setAlarmList] = useState([]);

    useEffect(() => {
        if (showAlarms) {
            fetchAlarms();
        }
    }, [showAlarms]);

    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (data) {
            setChartData(prev => {
                const updated = [...prev, {
                    timestamp: Date.now(),
                    temperature: data.temperature,
                    coolingTemperature: data.coolingTemperature
                }];
                return updated.slice(-30); // храним только 30 последних точек
            });
        }
    }, [data]);

    const fetchAlarms = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/alarms');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const alarms = await response.json();
            console.log('Получены аварии:', alarms);
            setAlarmList(alarms);
        } catch (error) {
            console.error('Ошибка при получении аварий:', error);
        }
    };

    if (!data) return null;
    // Деструктуризация, достаем все поля из data
    const {
        temperature,
        coolingTemperature,
        motorRunning,
        level,
        levelC,
        upperLevelCTriggered,
        lowerLevelCTriggered,
        upperLevelTriggered,
        lowerLevelTriggered,
        alarmActive,
        overheatSimulation,
        flowFailureSimulation,
        radiatorFailureSimulation,
        message
    } = data;

    const pumpStatus1 = selectedPump === 1 ? alarmActive ? 'alarm' : (motorRunning ? 'run' : 'wait') : 'wait';
    const pumpStatus2 = selectedPump === 2 ? alarmActive ? 'alarm' : (motorRunning ? 'run' : 'wait') : 'wait';
    const flowStatus = alarmActive ? 'alarm' : (motorRunning ? 'ok' : 'wait');
    const radiatorStatus = data.radiatorFailureSimulation && data.alarmActive ? 'alarm' : (motorRunning ? 'ok' : 'wait');




    const pumpImagePath1 = `/images/pump_${pumpStatus1}.png`;
    const pumpImagePath2 = `/images/pump_${pumpStatus2}.png`;
    const flowSensorImagePath = `/images/flow_sensor_${flowStatus}.png`;
    const radiatorImagePath = `/images/radiator_${radiatorStatus}.png`;

    //Перевод уровней воды в проценты для анимации
    const levelPercent = Math.min(Math.max(level, 0), 100);
    const levelPercentC = Math.min(Math.max(levelC, 0), 100);

    

    const handlePumpSelect = (pumpNumber) => {
        setSelectedPump(pumpNumber);
    }

    const simulateOverheat = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'simulateOverheat' }));
        } else {
            console.warn("WebSocket not ready for received command simulateOverheat");
        }
    };

    const resetAlarm = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'resetAlarm' }));
        } else {
            console.warn("WebSocket not ready for received command resetAlarm");
        }
    };

    const simulateFlowFailure = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'simulateFlowFailure' }));
        } else {
            console.warn("WebSocket not ready for command simulateFlowFailure");
        }
    };

    const simulateRadiatorFailure = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'simulateRadiatorFailure' }));
        } else {
            console.warn("WebSocket not ready for command simulateRadiatorFailure");
        }
    };
    const btnStyle = (bg) => ({
        padding: '4px 6px',
        backgroundColor: bg,
        color: 'white',
        border: '2px outset #fff',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer'
    });


    return (
        <div className="tank-container">
            

            



            {message && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeeba',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    zIndex: 1000
                }}>
                    {message}
                </div>
            )}


            <svg width="1000" height="600">
                {/* ─────── Tank A ─────── */}
                <ellipse cx="150" cy="450" rx="50" ry="10" fill="#999" />
                <rect x="100" y="450" width="100" height="120" fill="#ccc" stroke="#000" strokeWidth="2" />
                <ellipse cx="150" cy="570" rx="50" ry="10" fill="#999" />
                <rect
                    x="100"
                    y={570 - (120 * levelPercent) / 100}
                    width="100"
                    height={(120 * levelPercent) / 100}
                    fill="#00aaff"
                    className="water-animation"
                    opacity="0.6"
                />
                <rect x="100" y="450" width="100" height="120" fill="none" stroke="#333" strokeWidth="2" />
                <text x="130" y="470" fontSize="14">Tank A</text>

                {/* Датчики уровня */}
                <circle cx="210" cy="450" r="8" fill={upperLevelTriggered ? 'red' : 'gray'} />
                <text x="225" y="455" fontSize="12">Upper</text>
                <circle cx="210" cy="570" r="8" fill={lowerLevelTriggered ? 'red' : 'gray'} />
                <text x="225" y="575" fontSize="12">Lower</text>

                {/* ─────── Насос 1 и клапан 1 ─────── */}
               
                <image href={pumpImagePath1} x="390" y="555" width="60" height="40" />
                <text x="400" y="550" fontSize="12">Pump 1</text>

                
                
                

                {/* ─────── Насос 2 и клапан 2 ─────── */}
                <image href={pumpImagePath2} x="390" y="495" width="60" height="40" />
                <text x="400" y="490" fontSize="12">Pump 2</text>

                {/* ─────── Датчик потока ─────── */}
                <image href={flowSensorImagePath} x="690" y="519" width="60" height="40" />
                <text x="690" y="510" fontSize="12">Flow Sensor</text>

                {/* ─────── К Tank B справа вверх ─────── */}
                <line x1="150" y1="590" x2="150" y2="580" stroke="#000" strokeWidth="4" /> {/* Вниз от бака А */}
                <line x1="270" y1="582" x2="270" y2="530" stroke="#000" strokeWidth="4" /> {/* Вверх до насоса 2 */}
                <line x1="150" y1="590" x2="410" y2="590" stroke="#000" strokeWidth="4" />{/* Вправо до насоса 1 */}
                <line x1="270" y1="530" x2="410" y2="530" stroke="#000" strokeWidth="4" />{/* Вправо до насоса 2 */}
                <line x1="150" y1="582" x2="270" y2="582" stroke="#000" strokeWidth="4" />{/* Вправо от бака А до насоса 2 */}
                <line x1="430" y1="590" x2="530" y2="590" stroke="#000" strokeWidth="4" />{/* Вправо от насоса 1 */}
                <line x1="430" y1="530" x2="530" y2="530" stroke="#000" strokeWidth="4" />{/* Вправо от насоса 2 */}
                <line x1="530" y1="590" x2="530" y2="530" stroke="#000" strokeWidth="4" /> {/* Соединение между насосами */}
                <line x1="950" y1="560" x2="530" y2="560" stroke="#000" strokeWidth="4" />{/* Вправо от соединения насосов к баку Б */}
                <line x1="950" y1="560" x2="950" y2="20" stroke="#000" strokeWidth="4" />
                <line x1="950" y1="20" x2="785" y2="20" stroke="#000" strokeWidth="4" />
                <line x1="785" y1="40" x2="785" y2="20" stroke="#000" strokeWidth="4" /> {/* В радиатор */}
                

                {/* ─────── Radiator ─────── */}
                <image href={radiatorImagePath} x="700" y="40" width="100" height="100" />
                <text x="625" y="60" fontSize="14">Radiator</text>

                {/* Tank C (бак) */}
                <rect x="700" y="220" width="100" height="100" fill="#ccc" stroke="#000" strokeWidth="2" />
                <text x="725" y="240" fontSize="14">Tank C</text>

                {/* Уровень воды в Tank C */}
                <rect
                    x="700"
                    y={320 - (100 * levelPercentC) / 100}
                    width="100"
                    height={(100 * levelPercentC) / 100}
                    fill="#00aaff"
                    className="water-animation"
                    opacity="0.6"
                />



                {/* Датчики уровня Tank C */}
                <circle cx="810" cy="220" r="8" fill={upperLevelCTriggered ? 'red' : 'gray'} />
                <text x="825" y="225" fontSize="12">Upper</text>

                <circle cx="810" cy="320" r="8" fill={lowerLevelCTriggered ? 'red' : 'gray'} />
                <text x="825" y="325" fontSize="12">Lower</text>

                {/* Датчики температуры Tank C */}
                <text x="550" y="210" fontSize="14">Temp after cooling: {coolingTemperature} C</text>





             

                {/* ─────── Выход из Radiator вниз в Tank C ─────── */}
                <line x1="750" y1="220" x2="750" y2="140" stroke="#000" strokeWidth="4" />
                


                {/* ─────── Выход из Tank C вниз в "Cooling" ─────── */}
                <line x1="750" y1="320" x2="750" y2="350" stroke="#000" strokeWidth="4" />
                <line x1="750" y1="350" x2="550" y2="350" stroke="#000" strokeWidth="4" />

                {/* ─────── Cooling element ─────── */}
                
                <image href="/images/heating.png" x="450" y="300" width="100" height="100" />
                
                <text x="455" y="270" fontSize="12">Cooling element</text>

                {/* ─────── Обратно в Tank A ─────── */}
                <line x1="150" y1="350" x2="450" y2="350" stroke="#000" strokeWidth="4" />
                <line x1="150" y1="440" x2="150" y2="350" stroke="#000" strokeWidth="4" />
                {/* ─────── Температура Pump 1 ─────── */}
                <text x="300" y="580" fontSize="14">Temp: {temperature} C</text>
                {/* ─────── Температура Pump 2 ─────── */}
                <text x="300" y="520" fontSize="14">Temp: {temperature} C</text>
            </svg>
            <div style={{
                position: 'absolute',
                bottom: '60px',
                left: '0',
                width: '100%',
                height: '1px',
                backgroundColor: 'grey'
            }} />
            <button
                onClick={resetAlarm}
                style={{
                    position: 'fixed',         // привязка к экрану
                    right: '20px',
                    bottom: '20px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #fff',
                    padding: '4px 10px',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '14px',
                    color: 'black',
                    cursor: 'pointer',
                    boxShadow: 'inset 1px 1px white, inset -1px -1px #808080',
                    outline: 'none',
                    zIndex: 1000
                }}
            >
                Сброс аварии.
            </button>
            <div style={{
                position: 'absolute',
                right: '20px',
                top: '60px',
                width: '240px',
                backgroundColor: '#e0e0e0',
                border: '2px outset #fff',
                padding: '10px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '14px',
                color: 'black',
                boxShadow: 'inset 1px 1px white, inset -1px -1px #808080'
            }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Секция</div>
                <div style={{ marginBottom: '8px' }}>Cooling Tower</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Статус</span>
                    <span style={{
                        padding: '2px 10px',
                        backgroundColor: alarmActive
                            ? '#cc0000'
                            : motorRunning
                                ? '#33aa33'
                                : '#e6c200',
                        color: 'white',
                        border: '1px solid #000',
                        fontWeight: 'bold'
                    }}>
                        {alarmActive ? 'ALARM' : motorRunning ? 'RUN' : 'WAIT'}
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>Режим</span>
                    <span style={{
                        padding: '2px 10px',
                        backgroundColor: (overheatSimulation || flowFailureSimulation || radiatorFailureSimulation)
                            ? '#cc0000'
                            : '#999',
                        color: 'white',
                        border: '1px solid #000',
                        fontWeight: 'bold'
                    }}>
                        {(overheatSimulation || flowFailureSimulation || radiatorFailureSimulation) ? 'EMERGENCY' : 'AUTO'}
                    </span>
                </div>

                <div style={{
                    position: 'absolute',
                    right: '0px',
                    top: '150px',
                    width: '240px',
                    backgroundColor: '#e0e0e0',
                    border: '2px outset #fff',
                    padding: '10px',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '13px',
                    color: 'black',
                    boxShadow: 'inset 1px 1px white, inset -1px -1px #808080'
                }}>
                    <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Режим работы насосов</div>
                    <div style={{ marginBottom: '10px' }}>
                        <button
                            onClick={() => handlePumpSelect(1)}
                            style={{
                                marginRight: '6px',
                                padding: '4px 8px',
                                backgroundColor: selectedPump === 1 ? '#4CAF50' : '#ccc',
                                color: 'white',
                                border: '2px outset #fff',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px'
                            }}
                        >
                            Насос 1
                        </button>
                        <button
                            onClick={() => handlePumpSelect(2)}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: selectedPump === 2 ? '#4CAF50' : '#ccc',
                                color: 'white',
                                border: '2px outset #fff',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px'
                            }}
                        >
                            Насос 2
                        </button>
                    </div>

                    <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Аварийные ситуации</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <button onClick={simulateOverheat} style={btnStyle('#d9534f')}>Перегрев насоса</button>
                        <button onClick={simulateFlowFailure} style={btnStyle('#0275d8')}>Нет потока</button>
                        <button onClick={simulateRadiatorFailure} style={btnStyle('#d9534f')}>Неисправность радиатора</button>
                        <Link to="/alarms" style={{ textDecoration: 'none' }}>
                            <button style={btnStyle('#f0ad4e')}>Журнал аварий</button>
                        </Link>
                    </div>
                </div>

            </div>
            <div style={{
                position: 'absolute',
                top: '30px',
                left: '0px',
                width: '180px',
                bottom: '0px',
                height: 'calc(100% - 92px)',
                backgroundColor: '#d9d9d9',
                borderRight: '2px solid #aaa',
                padding: '35px',
                boxSizing: 'border-box',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5'
            }}>
                <b>Система управления производством</b><br />
                <b>SCADA-SYSTEM</b><br /><br />
                Выполнил студент<br />
                3 курса группы з5130903/20301<br />
                Институт компьютерных наук<br />
                и кибербезопасности
            </div>
            <div style={{ marginTop: '20px' }}>
                <TemperatureChart dataPoints={chartData} />
            </div>
        </div>
    );
};

export default TankLine;
