import { useQuery } from "@tanstack/react-query";
import { Metadata } from "~~/app/mynfts/mint/page";
import { SaleInfo } from "~~/app/mynfts/page";
import { fetchMetadata } from "~~/utils/fetchMetadata";

export function useMetaData(saleInfos?: readonly SaleInfo[]) {
  const { data: metaData } = useQuery({
    queryKey: [
      "metaData",
      saleInfos?.map(info => ({ ...info, price: info.price.toString(), tokenId: info.tokenId.toString() })),
    ],
    queryFn: async () => {
      if (!saleInfos || saleInfos.length === 0) return {};
      const urls: Record<string, Metadata> = {};
      for (const saleInfo of saleInfos) {
        const metaData = await fetchMetadata(saleInfo.uri);
        if (metaData) {
          urls[saleInfo.tokenId.toString()] = metaData;
        }
      }
      return urls;
    },
    enabled: !!saleInfos && saleInfos.length > 0,
  });

  return metaData || {};
}
