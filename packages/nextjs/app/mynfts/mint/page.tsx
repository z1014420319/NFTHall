"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { SaleInfo } from "~~/app/mynfts/page";
import ImageDisplayModal from "~~/components/ImageDisplayModal/ImageDisplayModal";
import useImageDisplayModal from "~~/components/ImageDisplayModal/useImageDisplayModal";
import Unconnected from "~~/components/Unconnected";
import { useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import useEventTimestamps from "~~/hooks/useBlockTimes";
import { useMetaData } from "~~/hooks/useMetadata";
import { notification } from "~~/utils/scaffold-eth";

export type Metadata = {
  title: string;
  description: string;
  image: string;
};

export default function MintNFT() {
  const { address } = useAccount();
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const router = useRouter();

  const { writeContractAsync: writeMyERC721Async } = useScaffoldWriteContract("MyERC721");

  const { data: mintEvent } = useScaffoldEventHistory({
    contractName: "MyERC721",
    eventName: "Mint",
    fromBlock: 0n,
    filters: { to: address },
    watch: true,
  });

  const blockTimes = useEventTimestamps(mintEvent?.map(event => ({ event, id: event.args.saleInfo?.tokenId })));

  const metaDatas = useMetaData(mintEvent?.map(event => event.args.saleInfo as SaleInfo));

  const { openImageModal, closeImageModal, tokenInfo } = useImageDisplayModal();

  const mintNFT = async (uri: string) => {
    return writeMyERC721Async({ functionName: "safeMint", args: [address, uri] });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  const handleMintNFT = async () => {
    if (!image || !title || !description) {
      notification.error("请填写所有必填项并上传一张图片。");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", image);
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const { imageCID } = await response.json();

      const metadata = {
        title,
        description,
        image: `https://gateway.pinata.cloud/ipfs/${imageCID}`,
      };

      const metadataResponse = await fetch("/api/upload/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });
      const { metadataCID } = await metadataResponse.json();

      await mintNFT(`https://teal-impressed-echidna-536.mypinata.cloud/ipfs/${metadataCID}`);

      notification.success("NFT 已成功铸造！");
      router.push("/mynfts");
    } catch (error) {
      console.error("Error minting NFT:", error);
      notification.error("铸造 NFT 失败。");
    } finally {
      setUploading(false);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMintEvent = mintEvent?.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil((mintEvent?.length || 0) / itemsPerPage);

  if (!address) {
    return <Unconnected />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
      <h1 className="mb-6 text-4xl font-extrabold text-gray-800 dark:text-gray-100">欢迎铸造 NFT</h1>
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="mb-4">
          <label htmlFor="image" className="block mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
            NFT 图片
          </label>
          <input
            type="file"
            accept="image/*"
            id="image"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-gray-700 dark:file:text-green-300 dark:hover:file:bg-gray-600"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="title" className="block mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
            NFT 标题
          </label>
          <input
            type="text"
            id="title"
            placeholder="请输入 NFT 标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-green-400"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
            NFT 介绍
          </label>
          <textarea
            id="description"
            placeholder="请输入 NFT 介绍"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-green-400"
            rows={4}
          />
        </div>
        <button
          onClick={handleMintNFT}
          disabled={uploading}
          className={`px-6 py-3 text-white rounded-md shadow-md focus:outline-none ${
            uploading ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
          } transition duration-150 ${
            uploading ? "dark:bg-green-400 dark:hover:bg-green-300" : "dark:bg-green-600 dark:hover:bg-green-500"
          }`}
        >
          {uploading ? "NFT 铸造中..." : "铸造 NFT"}
        </button>
        <div className="mt-6">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">NFT 铸造记录：</h2>
          {paginatedMintEvent?.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">没有记录。</p>
          ) : (
            <ul className="space-y-2">
              {paginatedMintEvent?.map((nft, index) => {
                const tokenIdString = nft.args.saleInfo?.tokenId?.toString() ?? "";
                return (
                  <li key={index} className="flex flex-col gap-1 p-4 border rounded-lg dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="font-semibold">标题 📄 ：</span>
                      <span>{metaDatas[tokenIdString]?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">日期 📅 ：</span>
                      <span>{new Date(Number(blockTimes[tokenIdString]) * 1000).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between ">
                      <span className="font-semibold">NFT 🎨：</span>
                      <div className="flex items-center mb-4 md:mb-0">
                        {tokenIdString !== undefined && metaDatas[tokenIdString]?.image ? (
                          <div onClick={() => openImageModal(metaDatas[tokenIdString])} className="cursor-pointer">
                            <Image
                              src={metaDatas[tokenIdString]?.image}
                              alt={`NFT ${nft.args.saleInfo?.tokenId}`}
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
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {"<"}
            </button>
            <span className="px-2 py-1 bg-gray-200 rounded dark:bg-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
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
