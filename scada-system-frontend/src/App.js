import React, { useEffect, useState, useRef } from 'react'; //библа для создания интерфейсов. use спец хуки, стейт хранит текущие данные, эффект запускает действия при старте
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TankLine from './TankLine'; // компонент, рисует графики
import AlarmPage from './AlarmPage'; // новый компонент
import './App.css';


function App() {
    const [data, setData] = useState(null); // usestate(null) спец переменная data хранит получ.дату, сначала она null пока серв не пришлет новую дату
    // Подключение к WebSocket, выполняется один раз при запуске страницы, создает WS соединение с сервом на localhost:3001
    const socketRef = useRef(null); // добавляем useRef для хранения сокета

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:3001');
        //Получаю дату от серва

        socketRef.current = socket;

        socket.onmessage = (event) => {
            const incoming = JSON.parse(event.data);
            setData(incoming); // передаем данные в TankLine
        };
        //Очистка при закрытии страницы. Пустые скобки [] значат что код запускается только один раз при первом рендере
        return () => socket.close();
    }, []);

    return (
        <Router>
            <div className="scada-app">
                <div className="scada-header">
                    <div className="scada-title">WinCC-Runtime - SCADA Simulation</div>
                    <div className="scada-time">{new Date().toLocaleTimeString()}</div>
                </div>

                <div className="scada-content">
                    <Routes>
                        <Route path="/" element={<TankLine data={data} socket={socketRef.current} />} />
                        <Route path="/alarms" element={<AlarmPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
