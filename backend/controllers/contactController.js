const sendEmail = require('../utils/sendEmail');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and message' });
    }

    const emailContent = `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    await sendEmail({
      to: process.env.CONTACT_EMAIL || 'info@raphaelshorizon.com',
      subject: `[Contact Form] ${subject || 'New Submission'}`,
      html: emailContent
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

// @desc    Submit speaking request form
// @route   POST /api/contact/speaking
// @access  Public
exports.submitSpeakingRequest = async (req, res, next) => {
  try {
    const {
      organization,
      contact_person,
      email,
      phone,
      event_date,
      event_location,
      event_type,
      expected_attendance,
      event_duration,
      speaking_topic,
      audience_info,
      additional_info
    } = req.body;

    if (!organization || !contact_person || !email || !event_date || !event_location || !speaking_topic) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const emailContent = `
      <h3>New Speaking Request</h3>
      <p><strong>Organization:</strong> ${organization}</p>
      <p><strong>Contact Person:</strong> ${contact_person}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Date:</strong> ${event_date}</p>
      <p><strong>Location:</strong> ${event_location}</p>
      <p><strong>Type:</strong> ${event_type || 'N/A'}</p>
      <p><strong>Attendance:</strong> ${expected_attendance || 'N/A'}</p>
      <p><strong>Duration:</strong> ${event_duration || 'N/A'}</p>
      <p><strong>Speaking Topic:</strong></p>
      <p>${speaking_topic.replace(/\n/g, '<br>')}</p>
      <p><strong>Audience Info:</strong></p>
      <p>${(audience_info || 'None provided').replace(/\n/g, '<br>')}</p>
      <p><strong>Additional Info:</strong></p>
      <p>${(additional_info || 'None provided').replace(/\n/g, '<br>')}</p>
    `;

    await sendEmail({
      to: process.env.CONTACT_EMAIL || 'info@raphaelshorizon.com',
      subject: `[Speaking Request] ${organization} - ${event_date}`,
      html: emailContent
    });

    res.status(200).json({ success: true, message: 'Request sent successfully' });
  } catch (error) {
    console.error('Speaking request error:', error);
    res.status(500).json({ success: false, message: 'Error sending request' });
  }
};
