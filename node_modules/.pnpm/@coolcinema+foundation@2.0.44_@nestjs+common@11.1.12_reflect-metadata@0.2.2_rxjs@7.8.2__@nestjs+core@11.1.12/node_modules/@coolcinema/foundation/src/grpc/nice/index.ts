import { createClients } from "./factory";
import { clientMiddleware, serverMiddleware } from "./middleware";

export const Nice = {
  createClients,
  clientMiddleware,
  serverMiddleware,
};
