import { useTargetNetwork } from "./scaffold-eth";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

const useEventTimestamps = (eventsListWithId: any) => {
  const { targetNetwork } = useTargetNetwork();

  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const fetchBlockTimestamp = async (blockNumber: bigint) => {
    const block = await publicClient?.getBlock({
      blockNumber,
    });

    return block?.timestamp.toString();
  };

  const { data: timestamps } = useQuery({
    queryKey: ["blockTime", eventsListWithId?.map((item: any) => item.id?.toString())],
    queryFn: async () => {
      if (!eventsListWithId || eventsListWithId?.length === 0) return {};
      const timestampsMap: Record<string, string | undefined> = {};

      for (const eventWithId of eventsListWithId) {
        const timestamp = await fetchBlockTimestamp(eventWithId.evnet?.blockNumber);
        timestampsMap[eventWithId.id] = timestamp;
      }
      return timestampsMap;
    },
    enabled: !!eventsListWithId && eventsListWithId.length > 0,
  });

  return timestamps || {};
};

export default useEventTimestamps;
