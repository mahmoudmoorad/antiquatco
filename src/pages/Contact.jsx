
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import contactService from "../services/contactService";

function Contact() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const content = isArabic
    ? {
        heroTag: "يسعدنا التواصل معك",
        heroTitle: "تواصل معنا",
        heroDescription:
          "كل قطعة لها حكاية، وكل محادثة تبدأ بخطوة. يسعدنا أن نسمع منك.",
        infoTitle: "لنبدأ محادثة",
        infoDescription:
          "هل لديك سؤال عن قطعة قديمة أو طلب أو إحدى مجموعاتنا؟ أرسل لنا رسالة وسنسعد بمساعدتك.",
        promiseTitle: "وعدنا لك",
        promiseDescription:
          "خدمة نهتم فيها بأدق التفاصيل، تمامًا مثل كل قطعة نختارها بعناية.",
        collectionTitle: "مجموعتنا",
        collectionDescription:
          "تحف وقطع كلاسيكية فريدة، لكل منها حكايتها الخاصة.",
        formTitle: "أرسل لنا رسالة",
        success: "شكرًا لك! تم استلام رسالتك بنجاح وسنتواصل معك قريبًا.",
        name: "الاسم",
        namePlaceholder: "اكتب اسمك",
        email: "البريد الإلكتروني",
        emailPlaceholder: "اكتب بريدك الإلكتروني",
        subject: "الموضوع",
        subjectPlaceholder: "ما موضوع رسالتك؟",
        message: "رسالتك",
        messagePlaceholder: "اكتب رسالتك هنا...",
        send: "إرسال الرسالة",
        demo:
          "هذا النموذج تجريبي حاليًا. لن يتم إرسال الرسائل أو حفظها حتى يتم ربط الموقع بالخادم الخلفي.",
      }
    : {
        heroTag: "WE WOULD LOVE TO HEAR FROM YOU",
        heroTitle: "Get in Touch",
        heroDescription:
          "Every piece has a story, and every conversation starts somewhere. We'd be delighted to hear from you.",
        infoTitle: "Let's Start a Conversation",
        infoDescription:
          "Have a question about a vintage piece, an order, or our collection? Send us a message and we'll be happy to help.",
        promiseTitle: "Our Promise",
        promiseDescription:
          "Thoughtful service, just like every piece we curate.",
        collectionTitle: "Our Collection",
        collectionDescription:
          "Unique antiques and vintage finds, each with its own story.",
        formTitle: "Send Us a Message",
        success: "Thank you! Your message was sent successfully. We'll get back to you soon.",
        name: "Your Name",
        namePlaceholder: "Enter your name",
        email: "Email Address",
        emailPlaceholder: "Enter your email",
        subject: "Subject",
        subjectPlaceholder: "What is this about?",
        message: "Your Message",
        messagePlaceholder: "Write your message here...",
        send: "Send Message",
        demo:
          "This form is currently a frontend demo. Messages are not sent or stored until a backend service is connected.",
      };

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSubmitted(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await contactService.submitContact(formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setError(
        isArabic
          ? "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى."
          : "An error occurred while sending your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <span>{content.heroTag}</span>
        <h1>{content.heroTitle}</h1>
        <p>{content.heroDescription}</p>
      </section>

      <section className="contact-container">
        <div className="contact-info">
          <span className="contact-eyebrow">ANTIQUTCO</span>

          <h2>{content.infoTitle}</h2>
          <p>{content.infoDescription}</p>

          <div className="contact-info-item">
            <span className="contact-info-icon">✦</span>
            <div>
              <h3>{content.promiseTitle}</h3>
              <p>{content.promiseDescription}</p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon">◇</span>
            <div>
              <h3>{content.collectionTitle}</h3>
              <p>{content.collectionDescription}</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>{content.formTitle}</h2>

          {submitted && (
            <p className="contact-success" role="status">
              {content.success}
            </p>
          )}

          {error && (
            <p className="contact-error" role="alert" style={{ color: "red", marginBottom: "1rem" }}>
              {error}
            </p>
          )}

          <label>
            {content.name}
            <input
              type="text"
              name="name"
              placeholder={content.namePlaceholder}
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </label>

          <label>
            {content.email}
            <input
              type="email"
              name="email"
              placeholder={content.emailPlaceholder}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label>
            {content.subject}
            <input
              type="text"
              name="subject"
              placeholder={content.subjectPlaceholder}
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            {content.message}
            <textarea
              name="message"
              placeholder={content.messagePlaceholder}
              rows="6"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </label>

          <button
            type="submit"
            className="btn-primary contact-submit"
            disabled={sending}
          >
            {sending ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : content.send}
          </button>

          <small style={{ display: "none" }}>{content.demo}</small>
        </form>
      </section>
    </main>
  );
}

export default Contact;
