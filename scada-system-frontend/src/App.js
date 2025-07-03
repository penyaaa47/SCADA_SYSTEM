import React, { useEffect, useState, useRef } from 'react'; //����� ��� �������� �����������. use ���� ����, ����� ������ ������� ������, ������ ��������� �������� ��� ������
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TankLine from './TankLine'; // ���������, ������ �������
import AlarmPage from './AlarmPage'; // ����� ���������
import './App.css';


function App() {
    const [data, setData] = useState(null); // usestate(null) ���� ���������� data ������ �����.����, ������� ��� null ���� ���� �� ������� ����� ����
    // ����������� � WebSocket, ����������� ���� ��� ��� ������� ��������, ������� WS ���������� � ������ �� localhost:3001
    const socketRef = useRef(null); // ��������� useRef ��� �������� ������

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:3001');
        //������� ���� �� �����

        socketRef.current = socket;

        socket.onmessage = (event) => {
            const incoming = JSON.parse(event.data);
            setData(incoming); // �������� ������ � TankLine
        };
        //������� ��� �������� ��������. ������ ������ [] ������ ��� ��� ����������� ������ ���� ��� ��� ������ �������
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
