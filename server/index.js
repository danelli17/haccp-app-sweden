const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { TemperatureLog, CCP, GoodsReceipt, CleaningTask, CleaningLog, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/api/ccps', async (req, res) => {
  const ccps = await CCP.findAll();
  res.json(ccps);
});

app.get('/api/logs', async (req, res) => {
  const logs = await TemperatureLog.findAll({ order: [['createdAt', 'DESC']] });
  res.json(logs);
});

app.post('/api/logs', async (req, res) => {
  try {
    const log = await TemperatureLog.create(req.body);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Goods Receipt Routes
app.get('/api/goods', async (req, res) => {
  const goods = await GoodsReceipt.findAll({ order: [['createdAt', 'DESC']] });
  res.json(goods);
});

app.post('/api/goods', async (req, res) => {
  try {
    const item = await GoodsReceipt.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cleaning Routes
app.get('/api/cleaning/tasks', async (req, res) => {
  const tasks = await CleaningTask.findAll();
  res.json(tasks);
});

app.get('/api/cleaning/logs', async (req, res) => {
  const logs = await CleaningLog.findAll({ 
    include: CleaningTask,
    order: [['createdAt', 'DESC']] 
  });
  res.json(logs);
});

app.post('/api/cleaning/logs', async (req, res) => {
  try {
    const { taskId, staffName } = req.body;
    const log = await CleaningLog.create({ CleaningTaskId: taskId, staffName });
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  const totalLogs = await TemperatureLog.count();
  const deviations = await TemperatureLog.count({ where: { isDeviation: true } });
  res.json({ totalLogs, deviations });
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`HACCP Server running on http://localhost:${PORT}`);
});
