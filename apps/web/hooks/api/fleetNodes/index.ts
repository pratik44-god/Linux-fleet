import { trpc } from "~/trpc/client";

export const useRegisterOrUpdateNode = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: registerOrUpdateNodeAsync,
    mutate: registerOrUpdateNode,
    data: node,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.fleetNode.registerOrUpdateNode.useMutation({
    onSuccess: async () => {
      await utils.fleetNode.getAllNodes.invalidate();
    },
  });

  return {
    registerOrUpdateNodeAsync,
    registerOrUpdateNode,
    node,
    error,
    isError,
    isSuccess,
    status,
  };
};

export const useGetAllNodes = () => {
  const {
    data: nodes,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.fleetNode.getAllNodes.useQuery(undefined, {
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  return {
    nodes,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};

export const useGetNodeByNodeId = (nodeId: string) => {
  const {
    data: node,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.fleetNode.getNodeByNodeId.useQuery(
    { nodeId },
    {
      enabled: Boolean(nodeId),
    }
  );

  return {
    node,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};

export const useDeleteNodeByNodeId = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: deleteNodeByNodeIdAsync,
    mutate: deleteNodeByNodeId,
    data: result,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.fleetNode.deleteNodeByNodeId.useMutation({
    onSuccess: async () => {
      await utils.fleetNode.getAllNodes.invalidate();
      await utils.fleetNode.getNodeByNodeId.invalidate();
    },
  });

  return {
    deleteNodeByNodeIdAsync,
    deleteNodeByNodeId,
    result,
    error,
    isError,
    isSuccess,
    status,
  };
};


export const useGetAllNodesForAdmin = (enabled = true) => {
  const {
    data: nodes,
    error,
    isError,
    isSuccess, 
    isLoading,
    status,
    refetch,
  } = trpc.fleetNode.getAllNodesForAdmin.useQuery(undefined, {
    enabled,
    refetchInterval: enabled ? 15000 : false,
    refetchIntervalInBackground: false,
  });

  return {
    nodes: nodes ?? [],
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};