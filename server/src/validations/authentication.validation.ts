import { z } from "zod";

const login = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default {
  login,
};
