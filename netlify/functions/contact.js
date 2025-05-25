const nodemailer = require('nodemailer');
const querystring = require('querystring');

exports.handler = async function(event, context) {
    try {
        // Parse incoming form data (URL-encoded)
        const data = querystring.parse(event.body);
        const recaptchaToken = data['g-recaptcha-response'];

        // Validate reCAPTCHA
        const secretKey = process.env.RECAPTCHA_SECRET;
        const recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

        const recaptchaRes = await fetch(recaptchaVerifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${recaptchaToken}`
        });

        const recaptchaJson = await recaptchaRes.json();

        if (!recaptchaJson.success) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'CAPTCHA validation failed.' })
            };
        }

        // Set up Zoho mail transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.ZOHO_USER,
                pass: process.env.ZOHO_PASS
            }
        });

        const mailOptions = {
            from: process.env.ZOHO_USER,
            to: process.env.ZOHO_RECEIVER,
            subject: `New Contact Form Submission from ${data.name}`,
            text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`
        };

        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent successfully!' })
        };

    } catch (error) {
        console.error('Error in contact function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error.' })
        };
    }
};
