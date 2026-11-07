import { router } from "./trpc";

import { authRouter } from "./routes/auth/route";
import { fleetNodeRouter } from "./routes/fleetNodes/route";
import { tokenNodeRouter } from "./routes/TokenGenerationForNode/route";
import { alertRouter } from "./routes/alert/route";

export const serverRouter = router({
  auth: authRouter,
  fleetNode: fleetNodeRouter,
  tokenNodeRouter: tokenNodeRouter,
  alertRouter: alertRouter


});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
