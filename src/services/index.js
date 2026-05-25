import client from "./api-client";

const services = {
  inventory: {
    getAll: ({ params }, configs) =>
      client({
        url: "/custom/v2/inventory",
        params,
        ...configs,
      }),
  },
  enquiry: {
    postEn: (formData, configs) =>
      client({
        url: `/contact-form-7/v1/contact-forms/9311/feedback`,
        method: "post",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        ...configs,
      }),
    postHe: (formData, configs) =>
      client({
        url: `/contact-form-7/v1/contact-forms/9360/feedback`,
        method: "post",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        ...configs,
      }),
  },
};

export default services;
