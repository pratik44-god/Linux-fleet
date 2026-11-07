import { trpc } from "~/trpc/client";

export const useTokenGeneration = () => {
  const {
    mutateAsync: generateTokenAsync,
    mutateAsync: generateToken,
    data,
    error,
    isError,
    isPending,
    reset,
  } = trpc.tokenNodeRouter.generateTokenForNode.useMutation();

  return {
    generateTokenAsync,
    generateToken,
    token: data?.token,
    isError, 
    error,
    isPending,
    reset,
  };
};