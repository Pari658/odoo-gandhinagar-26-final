import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Urban Furniture ERP Backend running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});
