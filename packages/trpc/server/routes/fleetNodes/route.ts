import { z } from "../../schema";

import {
  adminProcedure,
  authenticatedProcedure,
  router,
} from "../../trpc";

import { generatePath } from "../../utils/path-generator";
import { fleetNodeService } from "../../services";

import {
  fleetNodeReportInputModel,
  fleetNodeOutputModel,
  getNodeByNodeIdInputModel,
  getNodeByNodeIdOutputModel,
  getAllNodesOutputModel,
  deleteNodeByNodeIdInputModel,
  deleteNodeOutputModel,
  fleetNodeReportOutputModel,
  getAllNodesForAdminOutputModel,
} from "./model";

const TAGS = ["Fleet Nodes"];

const getPath = generatePath("/fleet-nodes");

export const fleetNodeRouter = router({
  // Register a new node or update its latest metrics.
  registerOrUpdateNode: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("registerOrUpdateNode"),
        tags: TAGS,
      },
    })
    .input(fleetNodeReportInputModel)
    .output(fleetNodeReportOutputModel)
    .mutation(async ({ ctx, input }) => {
      const node = await fleetNodeService.registerOrUpdateNode(
        ctx.user.id,
        input
      );

      return node;
    }),

  // Get all nodes owned by the logged-in user.
  getAllNodes: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("getAllNodes"),
        tags: TAGS,
      },
    })
    .output(getAllNodesOutputModel)
    .query(async ({ ctx }) => {
      const nodes = await fleetNodeService.getAllNodesByUserId(
        ctx.user.id
      );

      return nodes;
    }),

    // Admin can see nodes belonging to every user.
  getAllNodesForAdmin: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("getAllNodesForAdmin"),
        tags: TAGS,
      },
    })
    .output(z.array(getAllNodesForAdminOutputModel))
    .query(async () => {
      return await fleetNodeService.getAllNodesForAdmin();
    }),

  // Get one node by its node ID.
  getNodeByNodeId: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("getNodeByNodeId"),
        tags: TAGS,
      },
    })
    .input(getNodeByNodeIdInputModel)
    .output(getNodeByNodeIdOutputModel)
    .query(async ({ ctx, input }) => {
      const node = await fleetNodeService.getNodeByNodeId(
        ctx.user.id,
        input.nodeId
      );

      return node;
    }),

  // Delete a node owned by the logged-in user.
  deleteNodeByNodeId: authenticatedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("deleteNodeByNodeId"),
        tags: TAGS,
      },
    })
    .input(deleteNodeByNodeIdInputModel)
    .output(deleteNodeOutputModel)
    .mutation(async ({ ctx, input }) => {
      const result = await fleetNodeService.deleteNodeByNodeId(
        ctx.user.id,
        input.nodeId
      );

      return result;
    }),


});
