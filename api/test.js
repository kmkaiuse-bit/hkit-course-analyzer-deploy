// 简单的测试版本
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  res.status(200).json({ 
    message: 'Vercel Function is working!',
    timestamp: new Date().toISOString()
  });
};