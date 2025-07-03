const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const app = express();
app.use(cors());
const Database = require('better-sqlite3');
const db = new Database('scada.db');

// Создание таблицы для аварий, если она ещё не существует
db.prepare(`
    CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        type TEXT,
        message TEXT
    )
`).run();

// Функция записи аварии в БД
function logAlarm(type, message) {
    db.prepare(`
        INSERT INTO alarms (timestamp, type, message)
        VALUES (?, ?, ?)
    `).run(new Date().toISOString(), type, message);
}

app.get('/api/alarms', (req, res) => {
    const alarms = db.prepare('SELECT * FROM alarms ORDER BY timestamp DESC LIMIT 100').all();
    res.json(alarms);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


let level = 85;     // уровень в Tank A
let levelC = 40;     // уровень в Tank C
let motorRunning = false;

let temperature = 25;
let baseTemperature = 25;
let coolingTemperature = 18;
let lastCriticalTemp = 50;

let overheatSimulation = false;
let flowFailureSimulation = false;
let flowFailureCountdown = 0;
let radiatorFailureSimulation = false;



let alarmActive = false;
let message = '';


function autoControlPump() {
    if (alarmActive) return false; //  Авария: насос должен быть выключен

    const lowLevel = level <= 10;
    const fullTankC = levelC >= 90;
    const emptyTankC = levelC <= 10;
    const overflowTankA = level >= 90;

    // Защита от переполнения Tank A
    if (overflowTankA) return true;

    if (motorRunning) {
        if (fullTankC || lowLevel) return false; // выключаем при заполнении или нижнем датчике TANK A
        return true;
    } else {
        if (emptyTankC && !lowLevel) return true; // включаем если Tank C пуст и датчик нижний Tank A не горит
        return false;
    }
}

function updateLevels() {
    const delta = Math.random() * 2;
    const returnDelta = Math.random() * 1.5;

    if (alarmActive) {
        // при аварии: вода уходит из Tank C, но не поступает обратно, если Tank A не переполнен
        if (level < 100 && levelC > 0) {
            levelC = Math.max(0, levelC - returnDelta);
            level = Math.min(100, level + returnDelta);
        }
        return;
    }

    if (motorRunning) {
        level = Math.max(0, level - delta);
        levelC = Math.min(100, levelC + delta);
    } else {
        if (levelC > 0 && level < 100) {
            levelC = Math.max(0, levelC - returnDelta);
            level = Math.min(100, level + returnDelta);
        }
    }
}

function updateTemperature() {
    // если причина аварии не перегрев — не менять температуру насоса
    if (alarmActive && !overheatSimulation) return;

    if (overheatSimulation && motorRunning) {
        temperature += Math.random() * 2; // наращивание температуры
        if (temperature >= 50) {
            alarmActive = true;
            motorRunning = false;
            lastCriticalTemp = temperature;
            message = 'Насос перегрелся, система в аварии, для продолжения нажмите "Сброс аварии".';
            logAlarm('overheat', message);
        }
    } else {
        baseTemperature = 20 + Math.random() * 10;
        temperature = baseTemperature;
    }
}


function updateCoolingTemperature() {
    if (alarmActive && radiatorFailureSimulation) {
        coolingTemperature = 40;
        return;
    }

    if (radiatorFailureSimulation) {
        coolingTemperature += Math.random() * 1.5;
        if (coolingTemperature >= 40) {
            alarmActive = true;
            motorRunning = false;
            message = 'Радиатор неисправен! Температура после охлаждения слишком высокая. Нажмите "Сброс аварии".';
            logAlarm('radiator_failure', message);
        }
    } else {
        coolingTemperature = 15 + Math.random() * 10;
    }
}
function updateFlowFailure() {
    if (alarmActive || !flowFailureSimulation) return false;

    if (motorRunning) {
        if (flowFailureCountdown > 0) {
            flowFailureCountdown--;
        } else {
            alarmActive = true;
            motorRunning = false;
            message = 'Обнаружено отсутствие потока! Система в аварии. Нажмите "Сброс аварии" для продолжения!';
            logAlarm('flow_failure', message);
        }
    } else {
        flowFailureCountdown = 5; // сброс таймера, если насос выключен
    }
}


function generateSensorData() {
    motorRunning = autoControlPump();
    updateLevels();
    updateTemperature();
    updateFlowFailure();
    updateCoolingTemperature();

    // 🧠 Добавим: если аварии нет, то сообщение сбрасывается
    if (!alarmActive && message !== '') {
        message = '';
    }
    const flowStatus = alarmActive && flowFailureSimulation ? 'alarm' : (motorRunning ? 'ok' : 'wait');
    return {
        temperature: +temperature.toFixed(2),
        coolingTemperature: +coolingTemperature.toFixed(2),
        motorRunning,
        

        level: +level.toFixed(2),
        levelC: +levelC.toFixed(2),

        upperLevelTriggered: level >= 90,
        lowerLevelTriggered: level <= 10,
        upperLevelCTriggered: levelC >= 90,
        lowerLevelCTriggered: levelC <= 10,

        alarmActive,
        overheatSimulation,
        flowFailureSimulation,
        radiatorFailureSimulation,
        flowStatus,

        timestamp: new Date().toISOString(),

        message
    };
}


wss.on('connection', (ws) => {
    console.log('Client connected');

    const interval = setInterval(() => {
        const data = generateSensorData();
        ws.send(JSON.stringify(data));
    }, 1000);

    ws.on('message', (message) => {
        try {
            const command = JSON.parse(message);
            if (command.type === 'simulateOverheat') {
                console.log('Command received simulateOverheat');
                overheatSimulation = true;
            } else if (command.type === 'simulateFlowFailure') {
                console.log('Command received simulateFlowFailure');
                flowFailureSimulation = true;
                flowFailureCountdown = 5;
            } else if (command.type === 'simulateRadiatorFailure') {
                console.log('Command received simulateRadiatorFailure');
                radiatorFailureSimulation = true;
            } else if (command.type === 'resetAlarm') {
                console.log('Command received resetAlarm');
                overheatSimulation = false;
                flowFailureSimulation = false;
                radiatorFailureSimulation = false;
                alarmActive = false;
                message = '';
            }
        } catch (e) {
            console.error('Error processing command from client:', e);
        }
    });

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

server.listen(3001, () => {
    console.log('Server run on  http://localhost:3001');
});
