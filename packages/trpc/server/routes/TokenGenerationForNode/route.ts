import {tokenGenerationService} from "../../services";
import { router, authenticatedProcedure } from "../../trpc";
import { generatePath } from "../../utils/path-generator"
import z from "zod"
const TAGS = ["Token_Generation"]

const getPath = generatePath("/tokenForNode");

export const tokenNodeRouter = router({

    generateTokenForNode : authenticatedProcedure
    .meta({
        openapi: {
            method: "POST",
            path: getPath("/generateTokenForNode"),
            tags: TAGS,

        }
    })
    .output(z.object({token: z.string()}))
    .mutation(async ({ctx}) => {
        const token = await tokenGenerationService.tokenGenerationForNode(ctx.user.id)
        return {
            token: token
        }
        
    })

})