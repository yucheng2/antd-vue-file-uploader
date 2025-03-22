const express = require('express');
const multer = require('multer');
const cors = require('cors'); // Import the cors middleware
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Configure multer to handle file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Upload directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // File name
    }
});

const upload = multer({ storage: storage });

// 确保 uploads 目录存在
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 配置 Express 以提供静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});