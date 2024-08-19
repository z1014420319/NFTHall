"use client";

import { useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { SaleInfo } from "~~/app/mynfts/page";
import ImageDisplayModal from "~~/components/ImageDisplayModal/ImageDisplayModal";
import useImageDisplayModal from "~~/components/ImageDisplayModal/useImageDisplayModal";
import Unconnected from "~~/components/Unconnected";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import useEventTimestamps from "~~/hooks/useBlockTimes";
import { useMetaData } from "~~/hooks/useMetadata";

const ITEMS_PER_PAGE = 5;

export default function TransactionHistory() {
  const { address } = useAccount();
  const [currentBuyPage, setCurrentBuyPage] = useState<number>(1);
  const [currentSellPage, setCurrentSellPage] = useState<number>(1);

  const { data: symbol } = useScaffoldReadContract({
    contractName: "MyERC20",
    functionName: "symbol",
  });

  const { data: buyEvents } = useScaffoldEventHistory({
    contractName: "MyERC721",
    eventName: "NFTSold",
    filters: { buyer: address },
    fromBlock: 0n,
    watch: true,
  });

  const { data: sellEvents } = useScaffoldEventHistory({
    contractName: "MyERC721",
    eventName: "NFTSold",
    filters: { seller: address },
    fromBlock: 0n,
    watch: true,
  });

  const buyEventsBlockTimes = useEventTimestamps(
    buyEvents?.map(event => ({ event, id: event.args.saleInfo?.tokenId })),
  );
  const sellEventsBlockTimes = useEventTimestamps(
    sellEvents?.map(event => ({ event, id: event.args.saleInfo?.tokenId })),
  );

  const buyEventsMetaDatas = useMetaData(buyEvents?.map(event => event.args.saleInfo as SaleInfo));
  const sellEventsMetaDatas = useMetaData(sellEvents?.map(event => event.args.saleInfo as SaleInfo));

  const { openImageModal, closeImageModal, tokenInfo } = useImageDisplayModal();

  const totalBuyPages = Math.ceil((buyEvents?.length || 0) / ITEMS_PER_PAGE);
  const totalSellPages = Math.ceil((sellEvents?.length || 0) / ITEMS_PER_PAGE);

  const paginatedBuyEvents = (buyEvents || []).slice(
    (currentBuyPage - 1) * ITEMS_PER_PAGE,
    currentBuyPage * ITEMS_PER_PAGE,
  );

  const paginatedSellEvents = (sellEvents || []).slice(
    (currentSellPage - 1) * ITEMS_PER_PAGE,
    currentSellPage * ITEMS_PER_PAGE,
  );

  if (!address) {
    return <Unconnected />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
      <h1 className="mb-6 text-4xl font-bold">交易记录</h1>

      {/* Buy Events Section */}
      <div className="w-full max-w-4xl p-6 mb-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:shadow-md">
        <h2 className="mb-4 text-2xl font-semibold">买入记录</h2>
        {buyEvents?.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">没有买入记录。</p>
        ) : (
          <ul className="space-y-4">
            {paginatedBuyEvents?.map((event, index) => {
              const tokenIdString = event.args.saleInfo?.tokenId?.toString() ?? "";

              return (
                <li
                  key={index}
                  className="flex flex-col gap-1 p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 dark:shadow-md"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">标题 📄 ：</span>
                    <span>{buyEventsMetaDatas[tokenIdString]?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">交易金额 💰 ：</span>
                    <span>
                      {event.args.price?.toString()} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">日期 📅 ：</span>
                    <span>{new Date(Number(buyEventsBlockTimes[tokenIdString]) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between ">
                    <span className="font-semibold">NFT 🎨：</span>
                    <div className="flex items-center mb-4 md:mb-0">
                      {tokenIdString !== undefined && buyEventsMetaDatas[tokenIdString]?.image ? (
                        <div
                          onClick={() => openImageModal(buyEventsMetaDatas[tokenIdString])}
                          className="cursor-pointer"
                        >
                          <Image
                            src={buyEventsMetaDatas[tokenIdString]?.image}
                            alt={`NFT ${event.args.saleInfo?.tokenId}`}
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalBuyPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setCurrentBuyPage(currentBuyPage - 1)}
              disabled={currentBuyPage === 1}
              className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {"<"}
            </button>
            <span className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-600">
              {currentBuyPage} / {totalBuyPages}
            </span>
            <button
              onClick={() => setCurrentBuyPage(currentBuyPage + 1)}
              disabled={currentBuyPage >= totalBuyPages}
              className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Sell Events Section */}
      <div className="w-full max-w-4xl p-6 mb-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:shadow-md">
        <h2 className="mb-4 text-2xl font-semibold">卖出记录</h2>
        {sellEvents?.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">没有卖出记录。</p>
        ) : (
          <ul className="space-y-4">
            {paginatedSellEvents.map((event, index) => {
              const tokenIdString = event.args.saleInfo?.tokenId?.toString() ?? "";

              return (
                <li
                  key={index}
                  className="flex flex-col gap-1 p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 dark:shadow-md"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">标题 📄 ：</span>
                    <span>{sellEventsMetaDatas[tokenIdString]?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">交易金额 💰 ：</span>
                    <span>
                      {event.args.price?.toString()} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">日期 📅 ：</span>
                    <span>{new Date(Number(sellEventsBlockTimes[tokenIdString]) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between ">
                    <span className="font-semibold">NFT 🎨：</span>
                    <div className="flex items-center mb-4 md:mb-0">
                      {tokenIdString !== undefined && buyEventsMetaDatas[tokenIdString]?.image ? (
                        <div
                          onClick={() => openImageModal(buyEventsMetaDatas[tokenIdString])}
                          className="cursor-pointer"
                        >
                          <Image
                            src={buyEventsMetaDatas[tokenIdString]?.image}
                            alt={`NFT ${event.args.saleInfo?.tokenId}`}
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalSellPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setCurrentSellPage(currentSellPage - 1)}
              disabled={currentSellPage === 1}
              className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {"<"}
            </button>
            <span className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-600">
              {currentSellPage} / {totalSellPages}
            </span>
            <button
              onClick={() => setCurrentSellPage(currentSellPage + 1)}
              disabled={currentSellPage >= totalSellPages}
              className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {">"}
            </button>
          </div>
        )}
      </div>
      <ImageDisplayModal tokenInfo={tokenInfo} closeImageModal={closeImageModal} />
    </div>
  );
}
