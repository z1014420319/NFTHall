"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import ImageDisplayModal from "~~/components/ImageDisplayModal/ImageDisplayModal";
import useImageDisplayModal from "~~/components/ImageDisplayModal/useImageDisplayModal";
import Unconnected from "~~/components/Unconnected";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useMetaData } from "~~/hooks/useMetadata";
import { notification } from "~~/utils/scaffold-eth";

export type SaleInfo = {
  seller: string;
  price: bigint;
  tokenId: bigint;
  uri: string;
  display: boolean;
};

export default function MyNFTs() {
  const { address } = useAccount();
  const router = useRouter();

  const [prices, setPrices] = useState<{ [key: string]: number }>({});

  const { data: symbol } = useScaffoldReadContract({
    contractName: "MyERC20",
    functionName: "symbol",
  });
  const { data: ownedNFTs, refetch } = useScaffoldReadContract({
    contractName: "MyERC721",
    functionName: "getTokensOwnedBy",
    args: [address],
  });

  const { writeContractAsync: writeMyERC721Async } = useScaffoldWriteContract("MyERC721");

  const { forSaleTokens, collectionsTokens, diaplayingTokens } = useMemo(() => {
    const forSaleTokens: SaleInfo[] = [];
    const collectionsTokens: SaleInfo[] = [];
    const diaplayingTokens: SaleInfo[] = [];

    ownedNFTs?.forEach(item => {
      if (item.display) {
        if (item.price === 0n) {
          diaplayingTokens.push(item);
        } else {
          forSaleTokens.push(item);
        }
      } else {
        collectionsTokens.push(item);
      }
    });

    return { forSaleTokens, collectionsTokens, diaplayingTokens };
  }, [ownedNFTs]);

  const metaDatas = useMetaData(ownedNFTs);

  const { openImageModal, closeImageModal, tokenInfo } = useImageDisplayModal();

  const handleForSale = async (tokenId: bigint) => {
    try {
      const price = prices[tokenId.toString()] || 0;

      if (price <= 0) {
        notification.error("价格输入有误");
        return;
      }

      await writeMyERC721Async({
        functionName: "listNFTForSale",
        args: [tokenId, BigInt(price)],
      });

      await refetch();
    } catch (error) {
      console.error("Failed to list NFT for sale:", error);
    } finally {
      setPrices(prev => ({
        ...prev,
        [tokenId.toString()]: 0,
      }));
    }
  };

  const handleForDisplay = async (tokenId: bigint) => {
    try {
      await writeMyERC721Async({
        functionName: "listNFTForDisplay",
        args: [tokenId],
      });

      await refetch();
    } catch (error) {
      console.error("Failed to list NFT for sale:", error);
    }
  };

  const handleUpdatePrice = async (tokenId: bigint) => {
    try {
      const newPrice = prices[tokenId.toString()] || 0;

      if (newPrice <= 0) {
        notification.error("价格输入有误");
        return;
      }

      await writeMyERC721Async({
        functionName: "listNFTForSale",
        args: [tokenId, BigInt(newPrice)],
      });
      await refetch();
    } catch (error) {
      console.error("Failed to update NFT price:", error);
    } finally {
      setPrices(prev => ({
        ...prev,
        [tokenId.toString()]: 0,
      }));
    }
  };

  const handleForCollections = async (tokenId: bigint) => {
    try {
      await writeMyERC721Async({
        functionName: "removeNFTFromDisplay",
        args: [tokenId],
      });

      await refetch();
    } catch (error) {
      console.error("Failed to cancel NFT sale:", error);
    }
  };

  if (!address) {
    return <Unconnected />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="mb-6 text-4xl font-extrabold">我的 NFT</h1>
      <button
        onClick={() => router.push("/mynfts/mint")}
        className="px-6 py-3 mb-6 text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none dark:bg-green-600 dark:hover:bg-green-700"
      >
        铸造 NFT
      </button>

      <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-semibold">出售中：</h2>
        {forSaleTokens?.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">没有记录。</p>
        ) : (
          <ul className="space-y-6">
            {forSaleTokens.map(tokenInfo => {
              const tokenIdString = tokenInfo.tokenId.toString();
              return (
                <li
                  key={tokenInfo.tokenId.toString()}
                  className="flex items-center justify-between p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-center">
                        <span className="font-semibold">标题：</span>
                        <span>{metaDatas[tokenIdString]?.title}</span>
                      </div>
                      {metaDatas[tokenIdString]?.image ? (
                        <div onClick={() => openImageModal(metaDatas[tokenIdString])} className="cursor-pointer">
                          <Image
                            src={metaDatas[tokenIdString]?.image}
                            alt={`NFT ${tokenInfo.tokenId}`}
                            className="object-cover w-24 h-24"
                            width={96}
                            height={96}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-24 h-24 bg-gray-200 rounded-md dark:bg-gray-600">
                          Loading...
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        价格: {tokenInfo.price.toString()} {symbol}
                      </p>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={prices[tokenInfo.tokenId.toString()] || ""}
                          onChange={e =>
                            setPrices(prev => ({
                              ...prev,
                              [tokenInfo.tokenId.toString()]: Number(e.target.value),
                            }))
                          }
                          className="px-3 py-1 mt-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        />
                        <button
                          onClick={() => handleUpdatePrice(tokenInfo.tokenId)}
                          className="px-4 py-2 mt-2 text-white bg-green-500 rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                        >
                          更改价格
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleForDisplay(tokenInfo.tokenId)}
                      className="px-4 py-2 text-white bg-yellow-500 rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                    >
                      仅展出
                    </button>
                    <button
                      onClick={() => handleForCollections(tokenInfo.tokenId)}
                      className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      收藏
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <h2 className="mt-8 mb-4 text-2xl font-semibold">展出中：</h2>
        {diaplayingTokens?.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">没有记录。</p>
        ) : (
          <ul className="space-y-6">
            {diaplayingTokens.map(tokenInfo => {
              const tokenIdString = tokenInfo.tokenId.toString();
              return (
                <li
                  key={tokenInfo.tokenId.toString()}
                  className="flex items-center justify-between p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-center">
                        <span className="font-semibold">标题：</span>
                        <span>{metaDatas[tokenIdString]?.title}</span>
                      </div>
                      {metaDatas[tokenIdString]?.image ? (
                        <div onClick={() => openImageModal(metaDatas[tokenIdString])} className="cursor-pointer">
                          <Image
                            src={metaDatas[tokenIdString]?.image}
                            alt={`NFT ${tokenInfo.tokenId}`}
                            className="object-cover w-24 h-24"
                            width={96}
                            height={96}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-24 h-24 bg-gray-200 rounded-md dark:bg-gray-600">
                          Loading...
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={prices[tokenInfo.tokenId.toString()] || ""}
                          onChange={e =>
                            setPrices(prev => ({
                              ...prev,
                              [tokenInfo.tokenId.toString()]: Number(e.target.value),
                            }))
                          }
                          className="px-3 py-1 mt-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        />
                        <button
                          onClick={() => handleForSale(tokenInfo.tokenId)}
                          className="px-4 py-2 mt-2 text-white bg-green-500 rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                        >
                          上架出售
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleForCollections(tokenInfo.tokenId)}
                    className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    收藏
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <h2 className="mt-8 mb-4 text-2xl font-semibold">我的收藏：</h2>
        {collectionsTokens?.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">没有记录。</p>
        ) : (
          <ul className="space-y-6">
            {collectionsTokens.map(tokenInfo => {
              const tokenIdString = tokenInfo.tokenId.toString();
              return (
                <li
                  key={tokenInfo.tokenId.toString()}
                  className="flex items-center justify-between p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-center">
                        <span className="font-semibold">标题：</span>
                        <span>{metaDatas[tokenIdString]?.title}</span>
                      </div>
                      {metaDatas[tokenIdString]?.image ? (
                        <div onClick={() => openImageModal(metaDatas[tokenIdString])} className="cursor-pointer">
                          <Image
                            src={metaDatas[tokenIdString]?.image}
                            alt={`NFT ${tokenInfo.tokenId}`}
                            className="object-cover w-24 h-24"
                            width={96}
                            height={96}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-24 h-24 bg-gray-200 rounded-md dark:bg-gray-600">
                          Loading...
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={prices[tokenInfo.tokenId.toString()] || ""}
                        onChange={e =>
                          setPrices(prev => ({
                            ...prev,
                            [tokenInfo.tokenId.toString()]: Number(e.target.value),
                          }))
                        }
                        className="px-3 py-1 mt-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      />
                      <button
                        onClick={() => handleForSale(tokenInfo.tokenId)}
                        className="px-4 py-2 mt-2 text-white bg-green-500 rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        上架出售
                      </button>
                      <button
                        onClick={() => handleForDisplay(tokenInfo.tokenId)}
                        className="px-4 py-2 mt-2 text-white bg-yellow-500 rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                      >
                        展出
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ImageDisplayModal tokenInfo={tokenInfo} closeImageModal={closeImageModal} />
    </div>
  );
}
