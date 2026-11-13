/**
 * Contact Service for ANTIKATKO.
 */
import api from "./api";

export const contactService = {
  async submitContact(formData) {
    const response = await api.post("/api/v1/contact/", {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    });
    return response?.data || response;
  },
};

export default contactService;
