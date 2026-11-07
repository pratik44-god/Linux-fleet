import { z } from "../../schema";

import { adminProcedure, authenticatedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { userService } from "../../services";
import { getGoogleAuthUrl } from "@repo/services/clients/google-oauth";
import { clearAuthenticationCookie } from "../../utils/cookie";
import { getAllUsersForAdminOutputModel, getGoogleAuthUrlOutputModel, getUserByIdInputModel, getUserByIdOutputModel, isUserLoggedInInputModel, isUserLoggedInOutputModel, logoutInputModel, logoutOutputModel } from "./model";

const TAGS = ["Authentication"];

const getPath = generatePath("/authentication");


export const authRouter = router({
    getGoogleAuthUrl: publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: getPath("getGoogleAuthUrl"),
      tags: TAGS,
    },
  })
  .output(getGoogleAuthUrlOutputModel)
  .mutation(async () => {
    const authUrl = getGoogleAuthUrl();

    if (!authUrl) {
      throw new Error("Google authentication is not configured");
    }

    return {
      authUrl,
    };
  }),

  isUserLoggedIn: publicProcedure
  .meta({openapi:{
    method: "GET",
    path: getPath("/isUserLoggedIn"),
    tags: TAGS,
  }})  
  // .input(isUserLoggedInInputModel)
  .output(isUserLoggedInOutputModel)
  .query(async ({ctx}) => {
    const userToken = ctx.getCookie("authentication-token")
    if(!userToken) throw new Error("User is not LoggedIn")
    const {id} = await userService.isUserIsLoggedIn(userToken)
    return {
     id
    }
  }), 

  logout : publicProcedure
  .meta({openapi:{
    method: "POST",
    path: getPath("/logout"),
    tags: TAGS,
  }})  
  // .input(logoutInputModel)
  .output(logoutOutputModel)
  .mutation(async ({ ctx }) => {
    clearAuthenticationCookie(ctx);

    return {
      success: true,
    };
  }),

  getUserById: authenticatedProcedure
  .meta({openapi: {
    method: "GET",
    path: getPath("/getUserById"),
    tags: TAGS
  }})
  .input(getUserByIdInputModel)
  .output(getUserByIdOutputModel)
  .query(async ({ctx}) => {
      const {id, fullName, email, profileImageUrl, role} = await userService.getUserById(ctx.user.id)
      return{
        id,
        fullName,
        email,
        profileImageUrl,
        role
      }
      
  }),
  getUserByEmail: authenticatedProcedure
  .meta({openapi: {
    method: "GET",
    path: getPath("/getUserByEmail"),
    tags: TAGS
  }})
  .input(z.object({
    email: z.string().email()
  }))
  .output(getUserByIdOutputModel)
  .mutation(async ({input}) => {
      const {id, fullName, email, profileImageUrl, role} = await userService.getUserByEmail(input.email)
      return{
        id,
        fullName,
        email,
        profileImageUrl,
        role
      }
      
  }),

  getAllUsers: authenticatedProcedure
  .meta({openapi: {
    method: "GET",
    path: getPath("/getAllUsers"),
    tags: TAGS
  }})
  .output(z.array(getUserByIdOutputModel))
  .query(async () => {
      const users = await userService.AllUsers()
      return users .map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      }))
      
  }),
   
getAllUsersForAdmin: adminProcedure
  .meta({
    openapi: {
      method: "GET",
      path: getPath("/getAllUsersForAdmin"),
      tags: TAGS,
    },
  })
  .output(z.array(getAllUsersForAdminOutputModel))
  .query(async () => {
    const users = await userService.getAllUsers();

    return users;
  }),

})
