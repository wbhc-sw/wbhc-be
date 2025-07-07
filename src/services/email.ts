// import nodemailer from 'nodemailer';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
// type EmailInvestor = Awaited<ReturnType<typeof prisma.investor.create>>;

// const {
//   EMAIL_SERVICE_USER,
//   EMAIL_SERVICE_PASS,
//   COMPANY_ADMIN_EMAIL,
//   COMPANY_NAME,
// } = process.env;

// console.log('EMAIL_SERVICE_USER:', EMAIL_SERVICE_USER);
// console.log('EMAIL_SERVICE_PASS:', EMAIL_SERVICE_PASS);

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: EMAIL_SERVICE_USER,
//     pass: EMAIL_SERVICE_PASS,
//   },
// });

// console.log(transporter);

// export async function sendAdminNotification(investor: EmailInvestor) {
//   const mailOptions = {
//     from: EMAIL_SERVICE_USER,
//     to: COMPANY_ADMIN_EMAIL,
//     subject: `New Investor Inquiry - ${investor.fullName}`,
//     html: `<h2>New Investor Inquiry</h2>
//       <ul>
//         <li><b>Name:</b> ${investor.fullName}</li>
//         <li><b>Phone:</b> ${investor.phoneNumber || 'N/A'}</li>
//         <li><b>Package:</b> ${investor.investmentPackage}</li>
//         <li><b>City:</b> ${investor.city}</li>
//         <li><b>Submitted:</b> ${investor.createdAt}</li>
//         <li><b>ID:</b> ${investor.id}</li>
//       </ul>`
//   };
//   try {
//     await transporter.sendMail(mailOptions);
//   } catch (err) {
//     console.error('Email send error:', err);
//   }
// }

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