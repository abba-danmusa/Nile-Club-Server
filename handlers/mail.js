const nodeMailer = require('nodemailer')
const juice = require('juice')
const pug = require('pug')
const { htmlToText } = require('html-to-text')
const { promisify } = require('es6-promisify')

const transport = nodeMailer.createTransport({
  // host: process.env.MAIL_HOST,
  // port: process.env.MAIL_PORT,
  // secure: false,
  service: 'gmail',
  auth: {
    // type: 'LOGIN',
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
})

// transport.verify(function(error, success) {
//     error ? console.log(error) :
//         console.log('ready to send some mails')
// })

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options)
  const inlined = juice(html)
  return inlined
}

exports.send = async(options) => {
  const html = generateHTML(options.filename, options)
  const text = htmlToText(html, { wordwrap: 130, longWordSplit: 50 })
  const mailOptions = {
    from: `Nile Club noreply@nileclub.com`,
    to: options.user,
    subject: options.subject,
    verificationCodeURL: options.verificationCodeURL,
    verificationCode: options.verificationCode,
    html,
    text
  }
  const sendMail = promisify(transport.sendMail.bind(transport))
  return sendMail(mailOptions)
}