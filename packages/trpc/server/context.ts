import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import {
  createCookieFactory,
  getCookieFactory,
  clearCookieFactory,
} from "./utils/cookie";

export interface TRPCCtxUser {
  id: string;
}

export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;

  user?: TRPCCtxUser;
}

function buildContext(
  req: CreateExpressContextOptions["req"],
  res: CreateExpressContextOptions["res"],
): TRPCContext {
  return {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
    user: undefined,
  };
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TRPCContext> {
  return buildContext(req, res);
}

export function createContextFromExpress(
  req: CreateExpressContextOptions["req"],
  res: CreateExpressContextOptions["res"],
): TRPCContext {
  return buildContext(req, res);
}

export type Context = Awaited<ReturnType<typeof createContext>>;