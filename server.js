const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// ====== MIDDLEWARE ======
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ====== DATA FOLDER & FILE PATHS ======
const dataFolder = path.join(__dirname, 'data');
const attendanceFile = path.join(dataFolder, 'attendance.json');
const leaveFile = path.join(dataFolder, 'leave.json');
const roomFile = path.join(dataFolder, 'rooms.json');
const wardenMsgFile = path.join(dataFolder, 'warden_messages.json');

// ====== FUNCTION: Ensure files exist ======
function ensureFileExists(filePath) {
    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder);
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
}

// ====== INIT: Create all files if not exists ======
[attendanceFile, leaveFile, roomFile, wardenMsgFile].forEach(file => ensureFileExists(file));

// ====== ROUTES ======

// HOMEPAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ====== HTML PAGES ======
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, 'views', 'student_login.html')));
app.get('/warden', (req, res) => res.sendFile(path.join(__dirname, 'views', 'warden_login.html')));
app.get('/student-attendance', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student_attendance.html')));
app.get('/warden-attendance', (req, res) => res.sendFile(path.join(__dirname, 'public', 'warden_attendance.html')));
app.get('/student-leave', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student_leave.html')));
app.get('/warden-leave', (req, res) => res.sendFile(path.join(__dirname, 'public', 'warden_leave.html')));
app.get('/room-allotment', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room_allotment.html')));
app.get('/warden-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'warden_dashboard.html')));
app.get('/warden-room-view', (req, res) => res.sendFile(path.join(__dirname, 'public', 'warden_room_view.html')));
app.get('/warden-message', (req, res) => res.sendFile(path.join(__dirname, 'public', 'warden_message.html')));
app.get('/student-messages', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student_messages.html')));

// ====== LOGIN ======
app.post('/student-login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'student' && password === '1234') {
        res.sendFile(path.join(__dirname, 'public', 'student_dashboard.html'));
    } else {
        res.send('Invalid Student Credentials');
    }
});

app.post('/warden-login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'warden' && password === '5678') {
        res.sendFile(path.join(__dirname, 'public', 'warden_dashboard.html'));
    } else {
        res.send('Invalid Warden Credentials');
    }
});

// ====== ATTENDANCE ======
app.post('/submit-attendance', (req, res) => {
    ensureFileExists(attendanceFile);
    let data = JSON.parse(fs.readFileSync(attendanceFile));
    data.push(req.body);
    fs.writeFileSync(attendanceFile, JSON.stringify(data, null, 2));
    res.send('✅ Attendance Submitted!');
});

app.get('/get-attendance', (req, res) => {
    ensureFileExists(attendanceFile);
    res.json(JSON.parse(fs.readFileSync(attendanceFile)));
});

// ====== LEAVE ======
app.post('/submit-leave', (req, res) => {
    ensureFileExists(leaveFile);
    let data = JSON.parse(fs.readFileSync(leaveFile));
    data.push(req.body);
    fs.writeFileSync(leaveFile, JSON.stringify(data, null, 2));
    res.send('<h3>✅ Leave submitted successfully!</h3><a href="/student-leave">Go back</a>');
});

app.get('/get-leave', (req, res) => {
    ensureFileExists(leaveFile);
    res.json(JSON.parse(fs.readFileSync(leaveFile)));
});

// ====== ROOM ALLOTMENT ======
app.post('/submit-room', (req, res) => {
    ensureFileExists(roomFile);
    let roomData = JSON.parse(fs.readFileSync(roomFile));

    let studentData = {};
    for (let i = 1; i <= 5; i++) {
        studentData[`studentName${i}`] = req.body[`studentName${i}`] || "";
        studentData[`parentName${i}`] = req.body[`parentName${i}`] || "";
        studentData[`studentMobile${i}`] = req.body[`studentMobile${i}`] || "";
        studentData[`collegeName${i}`] = req.body[`collegeName${i}`] || "";
    }

    let newRoom = {
        roomNumber: req.body.roomNumber,
        ...studentData,
        chairs: req.body.chairs || "0",
        tables: req.body.tables || "0",
        beds: req.body.beds || "0",
        fans: req.body.fans || "0"
    };

    roomData.push(newRoom);
    fs.writeFileSync(roomFile, JSON.stringify(roomData, null, 2));
    res.send({ success: true, message: '✅ Room data submitted successfully!' });
});

app.get('/all-rooms', (req, res) => {
    ensureFileExists(roomFile);
    res.json(JSON.parse(fs.readFileSync(roomFile)));
});

app.delete('/delete-room/:index', (req, res) => {
    ensureFileExists(roomFile);
    const index = parseInt(req.params.index);
    let roomData = JSON.parse(fs.readFileSync(roomFile));
    if (index >= 0 && index < roomData.length) {
        roomData.splice(index, 1);
        fs.writeFileSync(roomFile, JSON.stringify(roomData, null, 2));
        res.send({ success: true, message: '✅ Room deleted successfully' });
    } else {
        res.status(400).send({ success: false, message: 'Invalid index' });
    }
});

// ====== WARDEN MESSAGE ======
app.post('/send-warden-message', (req, res) => {
    ensureFileExists(wardenMsgFile);
    let messages = JSON.parse(fs.readFileSync(wardenMsgFile));

    const newMessage = {
        title: req.body.title || '',
        message: req.body.message,
        date: new Date().toLocaleString()
    };

    messages.push(newMessage);
    fs.writeFileSync(wardenMsgFile, JSON.stringify(messages, null, 2));
    res.send(`<script>alert('✅ Message sent successfully!'); window.location='/warden-message';</script>`);
});

app.get('/get-warden-messages', (req, res) => {
    ensureFileExists(wardenMsgFile);
    res.json(JSON.parse(fs.readFileSync(wardenMsgFile)));
});

// ====== START SERVER ======
app.listen(port, () => {
    console.log(`✅ Server started at http://localhost:${port}`);
});
