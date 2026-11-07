import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";
import { getAuthenticationCookie } from "./utils/cookie";
import { userService } from "./services";

type AuthenticatedUser = {
  id: string;
  role: string;
};

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authenticatedProcedure = tRPCContext.procedure.use(async options => {
  const { ctx } = options;

  const userToken = getAuthenticationCookie(ctx);
  if (!userToken) throw new Error("User is not LoggedIn");

  const {id} = (await userService.isUserIsLoggedIn(userToken)) as AuthenticatedUser;

  const user = await userService.getUserById(id);

  return options.next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const adminProcedure = authenticatedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    return next();
  }
);


// export const adminProcedure = authenticatedProcedure.use(
//   async ({ ctx, next }) => {
//     console.log("ADMIN CHECK:", {
//       userId: ctx.user.id,
//       role: ctx.user.role,
//       roleType: typeof ctx.user.role,
//     });

//     if (ctx.user.role !== "ADMIN") {
//       throw new TRPCError({
//         code: "FORBIDDEN",
//         message: "Admin access required",
//       });
//     }

//     return next();
//   }
// );