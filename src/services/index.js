import client from "./api-client";

const services = {
  inventory: {
    getAll: ({ params }, configs) =>
      client({
        url: "/inventory",
        params,
        ...configs,
      }),
  },

};

export default services;
