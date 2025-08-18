"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNotification = sendAdminNotification;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const { EMAIL_SERVICE_USER, EMAIL_SERVICE_PASS, COMPANY_ADMIN_EMAIL, COMPANY_NAME, } = process.env;
// console.log('@@@@@ EMAIL_SERVICE_USER:', EMAIL_SERVICE_USER);
// console.log('@@@@@ EMAIL_SERVICE_PASS:', EMAIL_SERVICE_PASS);
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_SERVICE_USER,
        pass: EMAIL_SERVICE_PASS,
    },
});
// console.log(transporter);
async function sendAdminNotification(investor) {
    const mailOptions = {
        from: {
            name: investor.company || 'emails.ts 33',
            address: EMAIL_SERVICE_USER || 'emails.ts 34'
        },
        to: COMPANY_ADMIN_EMAIL,
        subject: `استفسار مستثمر جديد - ${investor.fullName}`,
        html: `
        <div dir="rtl" style="background: #f7f7fa; padding: 40px 0; min-height: 100vh;">
            <div style="
            max-width: 520px;
            margin: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.07);
            padding: 32px 28px 24px 28px;
            font-family: 'Cairo', 'Tahoma', Arial, sans-serif;
            color: #000;
            font-size: 20px;
            line-height: 1.8;
            ">
            <img src="cid:logograb" alt="Logo" style="max-width: 160px; display: block; margin: 0 auto 24px auto;" />
            <h2 style="font-size: 2.1em; font-weight: 800; margin-bottom: 18px; color: #000;">استفسار مستثمر جديد</h2>
            <p style="margin: 0 0 12px 0; font-size: 1.1em; color: #000;">مرحباً،</p>
            <p style="margin: 0 0 18px 0; color: #000;">تم استلام استفسار جديد من مستثمر عبر نموذج الموقع. التفاصيل أدناه:</p>
            <ul style="list-style: none; padding: 0; margin: 0 0 18px 0; color: #000;">
                <li style="margin-bottom: 8px;"><b>الاسم:</b> ${investor.fullName}</li>
                <li style="margin-bottom: 8px;">
                <b>رقم الجوال:</b>
                <span dir="ltr" style="unicode-bidi: embed;">${investor.phoneNumber || 'غير متوفر'}</span>
                </li>
                <li style="margin-bottom: 8px;"><b>الشركة:</b> ${investor.company || 'غير متوفر'}</li>
                <li style="margin-bottom: 8px;"><b>عدد الأسهم:</b> ${investor.sharesQuantity}</li>
                <li style="margin-bottom: 8px;"><b>إجمالي المبلغ:</b> ${investor.calculatedTotal}</li>
                <li style="margin-bottom: 8px;"><b>المدينة:</b> ${investor.city}</li>
                <li style="margin-bottom: 8px;"><b>تاريخ الإرسال:</b> ${investor.createdAt}</li>
                <li style="margin-bottom: 8px;"><b>رقم الطلب:</b> ${investor.id}</li>
            </ul>
            <p style="margin: 0 0 18px 0; color: #000;">يرجى متابعة الطلب والتواصل مع المستثمر في أقرب وقت ممكن.</p>
            <img src="cid:footerimg" style="max-width: 100%; height: auto; margin-top: 24px; border-radius: 8px;" alt="Footer"/>
            <p style="color: #888; font-size: 1em; margin-top: 24px;">مع تحيات فريق ${COMPANY_NAME}</p>
            </div>
        </div>
        `,
        attachments: [
            {
                filename: 'logo_grab.png',
                path: require('path').join(__dirname, '../../logo_grab.png'),
                cid: 'logograb'
            },
            {
                filename: 'footer.png',
                path: require('path').join(__dirname, '../../footer.png'),
                cid: 'footerimg'
            }
        ]
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (err) {
        console.error('Email send error:', err);
    }
}
// export async function sendInvestorConfirmation(investor: EmailInvestor) {
//   const mailOptions = {
//     from: EMAIL_SERVICE_USER,
//     to: COMPANY_ADMIN_EMAIL, // No investor email, so send to admin
//     subject: `Thank you for your interest in ${COMPANY_NAME}`,
//     html: `<h2>Thank you for your interest in ${COMPANY_NAME}</h2>
//       <p>Dear ${investor.fullName},</p>
//       <p>Thank you for your inquiry. Our team will contact you soon.</p>
//       <p>Best regards,<br/>${COMPANY_NAME} Team</p>`
//   };
//   try {
//     await transporter.sendMail(mailOptions);
//   } catch (err) {
//     console.error('Email send error:', err);
//   }
// } 
