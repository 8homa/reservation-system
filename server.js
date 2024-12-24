const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());

// SQLiteデータベースの設定
const db = new sqlite3.Database(':memory:');

// データベースの初期化
db.serialize(() => {
    db.run(`CREATE TABLE reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL
    )`);
});

// 過去の予約を削除する関数
const deletePastReservations = () => {
    const today = moment().startOf('day');
    db.run('DELETE FROM reservations WHERE date < ?', [today.format('YYYY-MM-DD')], (err) => {
        if (err) {
            console.error('過去の予約の削除に失敗しました:', err);
        } else {
            console.log('過去の予約が削除されました。');
        }
    });
};

// サーバー起動時に過去の予約を削除
deletePastReservations();

// 予約の取得
app.get('/api/reservations', (req, res) => {
    db.all('SELECT * FROM reservations', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 予約の作成
app.post('/api/reservations', (req, res) => {
    const { date, time } = req.body;
    const today = moment();
    const oneWeekLater = moment().add(7, 'days');

    if (moment(date).isBefore(today) || moment(date).isAfter(oneWeekLater)) {
        return res.status(400).json({ error: '予約は今日から1週間先まで可能です。' });
    }

    db.run('INSERT INTO reservations (date, time) VALUES (?, ?)', [date, time], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ id: this.lastID, date, time });
        }
    });
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});