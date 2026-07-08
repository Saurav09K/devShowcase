const app = require('./src/app');
const config = require('./src/config/storage');

const PORT = process.env.PORT || 5001;

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    node: config.NODE_ID
  });
});

app.listen(config.PORT, () => {
  console.log(`[${config.NODE_ID}] Storage Node is actively listening on port ${config.PORT}`);
});