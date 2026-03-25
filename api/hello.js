export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ message: 'Hello World! 你好啊 👋' });
}
