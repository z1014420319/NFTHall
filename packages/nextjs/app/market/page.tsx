"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import ImageDisplayModal from "~~/components/ImageDisplayModal/ImageDisplayModal";
import useImageDisplayModal from "~~/components/ImageDisplayModal/useImageDisplayModal";
import Unconnected from "~~/components/Unconnected";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useMetaData } from "~~/hooks/useMetadata";
import { notification } from "~~/utils/scaffold-eth";

export default function NFTMarket() {
  const { address } = useAccount();
  const router = useRouter();

  const { data: MyERC721 } = useScaffoldContract({ contractName: "MyERC721" });

  const { data: balance } = useScaffoldReadContract({
    contractName: "MyERC20",
    functionName: "balanceOf",
    args: [address],
  });

  const { data: symbol } = useScaffoldReadContract({
    contractName: "MyERC20",
    functionName: "symbol",
  });

  const { data: currentAllowance } = useScaffoldReadContract({
    contractName: "MyERC20",
    functionName: "allowance",
    args: [address, MyERC721?.address],
  });

  const { data: forDisplayNFTs } = useScaffoldReadContract({
    contractName: "MyERC721",
    functionName: "getAllTokensForDisplay",
  });

  const { data: ownedNFTs } = useScaffoldReadContract({
    contractName: "MyERC721",
    functionName: "getTokensOwnedBy",
    args: [address],
  });

  const metaDatas = useMetaData(forDisplayNFTs);

  const { openImageModal, closeImageModal, tokenInfo } = useImageDisplayModal();

  const { writeContractAsync: writeMyERC721Async } = useScaffoldWriteContract("MyERC721");

  const handleBuyNFT = async (tokenId: bigint, price: bigint) => {
    if ((currentAllowance ?? 0n) < price) {
      notification.error("您的授权余额不足！");
      return;
    }
    try {
      await writeMyERC721Async({ functionName: "buyNFT", args: [tokenId] });
      notification.success("购买成功！");
    } catch (error) {
      console.error("Failed to purchase NFT:", error);
    }
  };

  const handleViewTransactionHistory = () => {
    router.push("/market/transaction");
  };

  if (!address) {
    return <Unconnected />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
      <h1 className="mb-6 text-4xl font-bold">NFT 展览馆</h1>

      <div className="w-full max-w-4xl p-6 mb-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="flex flex-col mb-6 md:flex-row md:justify-between">
          <p className="text-lg font-semibold">
            我的余额: {balance !== undefined ? balance.toString() : "Loading..."} {symbol}
          </p>
          <p className="text-lg font-semibold">
            当前授权: {currentAllowance !== undefined ? currentAllowance.toString() : "Loading..."} {symbol}
          </p>
        </div>

        <button
          onClick={handleViewTransactionHistory}
          className="px-4 py-2 mb-4 text-sm font-medium text-white transition duration-150 bg-blue-500 rounded shadow-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          查看交易记录
        </button>

        <div>
          <h2 className="mb-4 text-2xl font-semibold">欢迎参观：</h2>
          {forDisplayNFTs?.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">没有记录。</p>
          ) : (
            <ul className="space-y-4">
              {forDisplayNFTs?.map(tokenInfo => {
                const isMyOwned = ownedNFTs?.some(ownedItems => ownedItems.tokenId === tokenInfo.tokenId);
                const isSelling = tokenInfo.price > 0;
                const isDisplaying = tokenInfo.price === 0n;
                const tokenIdString = tokenInfo.tokenId.toString();
                return (
                  <li
                    key={tokenInfo.tokenId.toString()}
                    className="flex flex-col items-center justify-between p-4 rounded-lg shadow-sm md:flex-row bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex flex-col items-center gap-1 mb-4 md:mb-0">
                      <div className="flex justify-center">
                        <span className="font-semibold">标题：</span>
                        <span>{metaDatas[tokenIdString]?.title}</span>
                      </div>
                      {metaDatas[tokenIdString]?.image ? (
                        <div onClick={() => openImageModal(metaDatas[tokenIdString])} className="cursor-pointer">
                          <Image
                            src={metaDatas[tokenIdString]?.image}
                            alt={`NFT ${tokenInfo.tokenId}`}
                            className="object-cover rounded-md"
                            width={120}
                            height={120}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-24 h-24 bg-gray-200 rounded-md dark:bg-gray-600">
                          Loading...
                        </div>
                      )}
                    </div>
                    <div>
                      {isSelling && (
                        <p className="mb-2 text-lg font-semibold">
                          价格： {tokenInfo.price.toString()} {symbol}
                        </p>
                      )}
                      <div className="flex flex-col items-end text-center md:ml-4 md:text-left">
                        {isMyOwned && (
                          <div className="inline-flex px-4 py-2 mt-2 text-white bg-gray-500 rounded-lg">已拥有</div>
                        )}
                        {isDisplaying && (
                          <div className="inline-flex px-4 py-2 mt-2 text-white bg-yellow-500 rounded-lg">展出中</div>
                        )}
                        {!isMyOwned && isSelling && (
                          <button
                            onClick={() => handleBuyNFT(tokenInfo.tokenId, tokenInfo.price)}
                            className="inline-flex px-4 py-2 mt-2 text-white transition bg-blue-500 rounded-lg hover:bg-blue-700"
                          >
                            购买 NFT
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <ImageDisplayModal tokenInfo={tokenInfo} closeImageModal={closeImageModal} />
    </div>
  );
}
