const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve build first so / returns the built React app (build/index.html), not the template (public/index.html)
app.use(express.static('build'));
app.use(express.static('public'));

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public', 'Images_input');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'public', 'result_s');
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Configure multer for result uploads
const resultStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, resultsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const resultUpload = multer({
    storage: resultStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// API Routes
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imagePath = `/Images_input/${req.file.filename}`;
        res.json({
            success: true,
            filename: req.file.filename,
            path: imagePath,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/api/images', (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        const images = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
        });

        res.json({
            images: images.map(filename => ({
                filename,
                path: `/Images_input/${filename}`
            }))
        });
    } catch (error) {
        console.error('Error reading images:', error);
        res.status(500).json({ error: 'Failed to read images' });
    }
});

app.delete('/api/images/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadDir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Save result image to result_s folder
app.post('/api/save-result', resultUpload.single('result'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No result file uploaded' });
        }

        const resultPath = `/result_s/${req.file.filename}`;
        res.json({
            success: true,
            filename: req.file.filename,
            path: resultPath,
            message: 'Result saved successfully'
        });
    } catch (error) {
        console.error('Result save error:', error);
        res.status(500).json({ error: 'Failed to save result' });
    }
});

// Get all results from result_s folder
app.get('/api/results', (req, res) => {
    try {
        const files = fs.readdirSync(resultsDir);
        const results = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
        });

        const resultsWithDetails = results.map(filename => {
            const filePath = path.join(resultsDir, filename);
            const stats = fs.statSync(filePath);

            return {
                filename,
                path: `/result_s/${filename}`,
                status: 'success',
                timestamp: stats.mtime.toISOString(),
                size: stats.size,
                error: null
            };
        });

        res.json({
            results: resultsWithDetails
        });
    } catch (error) {
        console.error('Error reading results:', error);
        res.status(500).json({ error: 'Failed to read results' });
    }
});

// Track failed attempts
app.post('/api/track-failure', (req, res) => {
    try {
        const { filename, error, originalImage, selectedCostume } = req.body;

        const failureRecord = {
            filename: filename || `failed-${Date.now()}`,
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: error || 'Unknown error',
            originalImage: originalImage || 'Unknown',
            selectedCostume: selectedCostume || 'Unknown'
        };

        console.log('Failed attempt tracked:', failureRecord);

        res.json({
            success: true,
            message: 'Failure tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking failure:', error);
        res.status(500).json({ error: 'Failed to track failure' });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
});

function startServer(port) {
    const p = port != null ? port : PORT;
    // Listen on 0.0.0.0 so other PCs on the network can reach /print and API
    return app.listen(p, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${p}`);
        console.log(`On your network: http://<this-pc-ip>:${p} (e.g. for /print on another PC)`);
        console.log(`Images will be saved to: ${uploadDir}`);
    });
}

if (require.main === module) {
    startServer(PORT);
} else {
    module.exports = { app, startServer, PORT };
}
