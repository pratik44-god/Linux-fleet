import { trpc } from "~/trpc/client";

export const useLogin = () => {
  const utils = trpc.useUtils()
  const {

    mutateAsync: getGoogleAuthUrlAsync,
    mutate: getGoogleAuthUrl,
    error,
    isError,
    isSuccess,
    status,
    
    
  } = trpc.auth.getGoogleAuthUrl.useMutation({
    onSuccess: async () => {
      await utils.auth.isUserLoggedIn.invalidate()
    }
});
 
  
  return {
    getGoogleAuthUrlAsync,
    getGoogleAuthUrl,
    error,
    isError,
    isSuccess,
    status,
    
  };
};

export const useIsUserLoggedIn = () => {
  const{
    data,
    error,
    isError,
    isSuccess,
    status,
    isLoading
    
  } = trpc.auth.isUserLoggedIn.useQuery()

  const isUserLoggedIn = Boolean(data?.id);

  return{
    isUserLoggedIn,
    error,
    isSuccess,
    isError,
    status,
    isLoading
  }
}

export const useLogout = () => {
  const utils = trpc.useUtils()
  const {
    mutateAsync: logoutAsync,
    mutate: logout,
    error,
    isSuccess,
    isError,
    status,
    
  } = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.isUserLoggedIn.invalidate()
    }
  })

  return {
    logoutAsync,
    logout,
    error,
    isSuccess,
    isError,
    status
  }
}
export const useUser = () => {
    const {data: user, error, isFetched, isFetching, isLoading, status, isError,
    isSuccess,} = trpc.auth.getUserById.useQuery()

    return { 
        user, error, isFetched, isFetching, isLoading, status, isError,
    isSuccess,
    }
  }

export const useGetUserByEmail = () => {
  const {
    mutateAsync: getUserByEmailAsync,
    mutate: getUserByEmail,
    data: user,
    error,
    isError,
    isSuccess,
    status,
  } = trpc.auth.getUserByEmail.useMutation();

  return {
    getUserByEmailAsync,
    getUserByEmail,
    user,
    error,
    isError,
    isSuccess,
    status,
  };
};

export const useGetAllUsersForAdmin = (enabled = true) => {
  const {
    data: users,
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  } = trpc.auth.getAllUsersForAdmin.useQuery(undefined, {
    enabled,
  });

  return {
    users: users ?? [],
    error,
    isError,
    isSuccess,
    isLoading,
    status,
    refetch,
  };
};