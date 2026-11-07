import { trpc } from "~/trpc/client";

// Alert category type.
export type AlertCategory = "CRITICAL" | "WARNING";

// Create alert input.
export type CreateAlertInput = {
  message: string;
  category: AlertCategory;
  nodeId: string;
};

// Get alerts for a specific node input.
export type GetAlertsForNodeInput = {
  nodeId: string;
};

// Get alert by ID input.
export type GetAlertByIdInput = {
  alertId: string;
};

// Create a new alert.
export const useCreateAlert = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: createAlertAsync,
    mutate: createAlert,
    data: alert,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.alertRouter.createAlert.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.alertRouter.getAllAlerts.invalidate(),
        utils.alertRouter.getUnreadAlerts.invalidate(),
        utils.alertRouter.getUnreadAlertCount.invalidate(),
      ]);
    },
  });

  return {
    createAlertAsync,
    createAlert,
    alert,
    error,
    isError,
    isSuccess,
    status,
  };
};

// Get all alerts for the authenticated user.
export const useGetAllAlerts = () => {
  const {
    data: alerts,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.alertRouter.getAllAlerts.useQuery();

  return {
    alerts: alerts ?? [],
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};

// Get alerts for a specific node.
export const useGetAlertsForNode = (
  input: GetAlertsForNodeInput,
) => {
  const {
    data: alerts,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.alertRouter.getAlertsForNode.useQuery(input);

  return {
    alerts: alerts ?? [],
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};

// Get unread alerts.
export const useGetUnreadAlerts = () => {
  const {
    data: alerts,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.alertRouter.getUnreadAlerts.useQuery();

  return {
    alerts: alerts ?? [],
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};

// Get unread alert count.
export const useGetUnreadAlertCount = () => {
  const {
    data,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.alertRouter.getUnreadAlertCount.useQuery();

  return {
    count: data?.count ?? 0,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};

// Mark a single alert as read.
export const useMarkAlertAsRead = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: markAlertAsReadAsync,
    mutate: markAlertAsRead,
    data: alert,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.alertRouter.markAlertAsRead.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.alertRouter.getAllAlerts.invalidate(),
        utils.alertRouter.getUnreadAlerts.invalidate(),
        utils.alertRouter.getUnreadAlertCount.invalidate(),
      ]);
    },
  });

  return {
    markAlertAsReadAsync,
    markAlertAsRead,
    alert,
    error,
    isError,
    isSuccess,
    status,
  };
};

// Mark all alerts as read.
export const useMarkAllAlertsAsRead = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: markAllAlertsAsReadAsync,
    mutate: markAllAlertsAsRead,
    data: result,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.alertRouter.markAllAlertsAsRead.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.alertRouter.getAllAlerts.invalidate(),
        utils.alertRouter.getUnreadAlerts.invalidate(),
        utils.alertRouter.getUnreadAlertCount.invalidate(),
      ]);
    },
  });

  return {
    markAllAlertsAsReadAsync,
    markAllAlertsAsRead,
    result,
    error,
    isError,
    isSuccess,
    status,
  };
};

// Delete a single alert.
export const useDeleteAlert = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: deleteAlertAsync,
    mutate: deleteAlert,
    data: result,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.alertRouter.deleteAlert.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.alertRouter.getAllAlerts.invalidate(),
        utils.alertRouter.getUnreadAlerts.invalidate(),
        utils.alertRouter.getUnreadAlertCount.invalidate(),
      ]);
    },
  });

  return {
    deleteAlertAsync,
    deleteAlert,
    result,
    error,
    isError,
    isSuccess,
    status,
  };
};

// Delete all alerts.
export const useDeleteAllAlerts = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: deleteAllAlertsAsync,
    mutate: deleteAllAlerts,
    data: result,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.alertRouter.deleteAllAlerts.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.alertRouter.getAllAlerts.invalidate(),
        utils.alertRouter.getUnreadAlerts.invalidate(),
        utils.alertRouter.getUnreadAlertCount.invalidate(),
      ]);
    },
  });

  return {
    deleteAllAlertsAsync,
    deleteAllAlerts,
    result,
    error,
    isError,
    isSuccess,
    status,
  };
};


export const useSendingAlertMessageToUser = () => {
  const {
    mutateAsync: sendingAlertMessageToUserAsync,
    mutate: sendingAlertMessageToUser,
    data: alert,
    error,
    isError,
    isSuccess,
    isPending,
    status,
  } = trpc.alertRouter.sendingAlertMessageToUser.useMutation();

  return {
    sendingAlertMessageToUserAsync,
    sendingAlertMessageToUser,
    alert,
    error,
    isError,
    isSuccess,
    isPending,
    status,
  };

}