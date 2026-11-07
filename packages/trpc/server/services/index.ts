import UserService from "@repo/services/user";
import FleetNodeService from "@repo/services/fleetNode";
import TokenGenerationService from "@repo/services/tokenGeneration"
import AlertService from "@repo/services/alert"

export const alertService =  new AlertService();
export const tokenGenerationService =  new TokenGenerationService();
export const fleetNodeService = new FleetNodeService();
export const userService = new UserService();
