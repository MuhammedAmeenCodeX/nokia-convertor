node.js
// server.js (Node.js backend)

const express = require('express');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(fileUpload());
const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

app.post('/convert', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const mp4file = req.files.mp4file;
    const inputFilePath = path.join(uploadDir, `${Date.now()}_${mp4file.name}`);
    const outputFilePath = path.join(uploadDir, `${Date.now()}_converted.3gp`);

    // Save the file to the server
    mp4file.mv(inputFilePath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        // Use FFmpeg to convert MP4 to 3GP with 320x240 resolution
        const command = `ffmpeg -i ${inputFilePath} -s 320x240 -c:v libx264 -c:a aac ${outputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            // Remove the original MP4 file after conversion
            fs.unlinkSync(inputFilePath);

            if (error) {
                return res.json({ success: false, message: 'Conversion failed', error });
            }

            return res.json({ 
                success: true, 
                fileUrl: `http://localhost:3000/${outputFilePath}` 
            });
        });
    });
});

// Serve converted files
app.use('/uploads', express.static(uploadDir));

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
