const express = require('express')
const nodemailer = require('nodemailer')
const multer = require('multer');
const config = require('./config')

const PORT = config.port

const app = express()
app.use(express.json())

// Создание хранилища для attachments
const storage = multer.memoryStorage();
const upload = multer({ storage });

const emailServices = {
    'etalon': {
        host: config.host,
        port: config.transport_port,
        secure: config.secure,
        pool: config.pool,
        maxConnections: config.maxConnections,
        maxMessages: config.maxMessages,
        auth: {
            user: config.user,
            pass: config.pass
        }
    }
}

const transporter = {
    'etalon': nodemailer.createTransport(emailServices['etalon'])
}

app.post('/email', upload.array('attachments'), async (req, res) => {
    const { transport, to, subj, text, html } = req.body
    const authorization = req.headers.authorization

    // Если не отправлен токен авторизации
    if (!authorization) {
        console.log('Error: Missing Authorization header')
        return res.status(401).json({ ok: false, msg: 'Missing Authorization header' })
    }

    // Валидация токена авторизации
    const recievedToken = authorization.split(' ')[1]
    if (config.secret !== recievedToken) {
        console.log('Error: Invalid Authorization header');
        return res.status(401).json({ ok: false, msg: 'Invalid Authorization header' });
    }

    // Проверка на наличие файлов
    let attachments = [];
    if(req.files) {
        attachments = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));
    }

    // Проверка наличия указанного сервиса рассылки
    if (!transport || !transporter[transport]) {
        console.log(`Error: Invalid transport: ${transport}`)
        return res.status(400).json({ ok: false, msg: 'Invalid transport' });
    }
    
    // Проверка наличия тела документа для email
    if (!text && !html) {
        console.log(`Error: Missing text or html`)
        return res.status(400).json({ ok: false, msg: 'html or text param is required' });     
    }

    try {
        console.log(`Sending email from ${emailServices[transport].auth.user} to ${to} with subject: ${subj}`)
    
        await transporter[transport].sendMail({
            from: emailServices[transport].auth.user,
            to,
            subject: subj,
            text: text || '',
            html: html || '',
            attachments: attachments
        });

        console.log(`Email sent successfully to ${to}`);
        res.status(200).json({ ok: true, msg: `Email sent successfully to ${to}` });
    } catch (error) {
        console.log(error)
        res.status(500).json({ ok: false, msg: 'Failed to send email' });
    }
})

app.listen(PORT, () => {
    console.log(`Server is listening on PORT: ${PORT}`)
})