import {CookieOptions, Response, Request } from "express"
import { TRPCContext } from "../context";
import { CreateExpressContextOptions } from "@trpc/server/dist/adapters/express.cjs";

const ONE_MINUTE = 60*1000; //miliseconds
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 12 * ONE_MONTH;

const defalutCookieOption : CookieOptions ={
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge : ONE_YEAR
}

export function createCookieFactory(res: CreateExpressContextOptions["res"]){
    return function createCookie(
        name: string,
        value: string,
        opts: CookieOptions = defalutCookieOption
    ){
        res.cookie(name, value, opts)
    }

}

export function getCookieFactory(
    req: CreateExpressContextOptions["req"]
){
    return function getCookie(name: string){
        return req.cookies?.[name];
    }
}


export function clearCookieFactory(res: CreateExpressContextOptions["res"]){
    return function clearCookie(name: string){
         res.clearCookie(name);
    }

}

// Authentication Cookie 
const AUTHENTICATION_COOKIE_NAME = "authentication-token"


export function setAuthenticationCookie(ctx: TRPCContext, accessToken : string){
    ctx.createCookie(AUTHENTICATION_COOKIE_NAME, accessToken, {
        ...defalutCookieOption,
        sameSite: "lax",
    })
}

export function getAuthenticationCookie(ctx: TRPCContext){
    return ctx.getCookie(AUTHENTICATION_COOKIE_NAME)
}

export function clearAuthenticationCookie(ctx: TRPCContext){
    ctx.clearCookie(AUTHENTICATION_COOKIE_NAME)
}
