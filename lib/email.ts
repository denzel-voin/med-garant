import nodemailer from "nodemailer";

const port = parseInt(process.env.SMTP_PORT ?? "465");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.yandex.ru",
    port,
    secure: port === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
} as Parameters<typeof nodemailer.createTransport>[0]);

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@medgarant.ru";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function formatDate(d: Date): string {
    return d.toLocaleString("ru-RU", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export async function sendConfirmationEmail(data: {
    to: string;
    patientName: string;
    clinicName: string;
    doctorName: string;
    serviceName: string;
    startTime: Date;
    cancelToken: string;
}) {
    const cancelUrl = `${APP_URL}/api/v1/appointments/cancel?token=${data.cancelToken}`;
    await transporter.sendMail({
        from: `МедГарант <${FROM}>`,
        to: data.to,
        subject: `Запись подтверждена — ${data.clinicName}`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1B4F72">Запись подтверждена ✓</h2>
        <p>Здравствуйте, <strong>${data.patientName}</strong>!</p>
        <p>Вы записаны на приём:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Клиника</td><td style="padding:8px">${data.clinicName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Врач</td><td style="padding:8px">${data.doctorName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Услуга</td><td style="padding:8px">${data.serviceName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Дата и время</td><td style="padding:8px">${formatDate(data.startTime)}</td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="${cancelUrl}" style="color:#c0392b;font-size:13px">Отменить запись</a>
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#888">МедГарант — цифровой администратор для медицинских клиник</p>
      </div>
    `,
    });
}

export async function sendCancellationEmail(data: {
    to: string;
    patientName: string;
    clinicName: string;
    startTime: Date;
    byClinic?: boolean;
}) {
    await transporter.sendMail({
        from: `МедГарант <${FROM}>`,
        to: data.to,
        subject: `Запись отменена — ${data.clinicName}`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#c0392b">Запись отменена</h2>
        <p>Здравствуйте, <strong>${data.patientName}</strong>!</p>
        <p>
          Ваша запись в клинику <strong>${data.clinicName}</strong>
          на <strong>${formatDate(data.startTime)}</strong>
          ${data.byClinic ? "была отменена клиникой" : "отменена по вашему запросу"}.
        </p>
        <p>Для записи на другое время воспользуйтесь виджетом на сайте клиники.</p>
      </div>
    `,
    });
}

export async function sendReminderEmail(data: {
    to: string;
    patientName: string;
    clinicName: string;
    doctorName: string;
    startTime: Date;
    hoursLeft: 24 | 2;
}) {
    const timeLabel = data.hoursLeft === 24 ? "завтра" : "через 2 часа";
    await transporter.sendMail({
        from: `МедГарант <${FROM}>`,
        to: data.to,
        subject: `Напоминание: приём ${timeLabel} — ${data.clinicName}`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1B4F72">Напоминание о визите 🔔</h2>
        <p>Здравствуйте, <strong>${data.patientName}</strong>!</p>
        <p>Напоминаем, что у вас запись <strong>${timeLabel}</strong>:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Клиника</td><td style="padding:8px">${data.clinicName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Врач</td><td style="padding:8px">${data.doctorName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Дата и время</td><td style="padding:8px">${formatDate(data.startTime)}</td></tr>
        </table>
      </div>
    `,
    });
}

export async function sendClinicNotification(data: {
    to: string;
    clinicName: string;
    patientName: string;
    doctorName: string;
    serviceName: string;
    startTime: Date;
}) {
    await transporter.sendMail({
        from: `МедГарант <${FROM}>`,
        to: data.to,
        subject: `Новая запись: ${data.patientName} — ${formatDate(data.startTime)}`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1B4F72">Новая запись 📋</h2>
        <p>Клиника <strong>${data.clinicName}</strong>:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Пациент</td><td style="padding:8px">${data.patientName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Врач</td><td style="padding:8px">${data.doctorName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Услуга</td><td style="padding:8px">${data.serviceName}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Дата и время</td><td style="padding:8px">${formatDate(data.startTime)}</td></tr>
        </table>
      </div>
    `,
    });
}