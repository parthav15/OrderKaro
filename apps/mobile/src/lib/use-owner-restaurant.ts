import { useQuery } from "@tanstack/react-query"
import { ownerApi } from "./owner-api"
import type { OwnerRestaurant } from "./types"

export function useOwnerRestaurant() {
  const query = useQuery({
    queryKey: ["owner-restaurants"],
    queryFn: () => ownerApi.get<OwnerRestaurant[]>("/api/v1/restaurants"),
    staleTime: 5 * 60 * 1000,
  })
  return { restaurant: query.data?.[0], isLoading: query.isLoading }
}
