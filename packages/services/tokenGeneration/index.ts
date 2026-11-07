import { env } from "../env";
import jwt from "jsonwebtoken";

class TokenGenerationService {

    private async getFleetSecret() {

        const secrete = env.JWT_SECRET;

        if (!secrete) throw new Error("JWT_SECRETE must be configured securely");

        return secrete;
    }

    public async tokenGenerationForNode(userId: string) {
        const secret = await this.getFleetSecret();

        const token = jwt.sign({ userId, purpose: "node_registration" }, secret, {
            expiresIn: "10m",
            algorithm: "HS256",
            issuer: "linux-fleet",
            audience: "fleet-node-registration",
        });

        return token;
    }

    public async verifyTokenGenerationForNode(token: string) {

        const payload = jwt.verify(token, env.JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "linux-fleet",
            audience: "fleet-node-registration",

        })

        if (
            typeof payload === "string" ||
            typeof payload.userId !== "string" ||
            payload.purpose !== "node_registration"
        ) {
            throw new Error("Invalid fleet registration token");
        }

        return {
            userId: payload.userId,
        };
    }
}

export default TokenGenerationService;

