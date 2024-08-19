"use client";

import { FormEvent, useState } from "react";
import { useAccount } from "wagmi";
import Unconnected from "~~/components/Unconnected";
import { Address } from "~~/components/scaffold-eth";
import {
  useScaffoldContract,
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import useEventTimestamps from "~~/hooks/useBlockTimes";
import { notification } from "~~/utils/scaffold-eth";

const ITEMS_PER_PAGE = 5;

export default function Wallet() {
  const { address } = useAccount();
  const [mintAmount, setMintAmount] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const { writeContractAsync: writeMyERC20Async } = useScaffoldWriteContract("MyERC20");

  const { data: mintEvent } = useScaffoldEventHistory({
    contractName: "MyERC20",
    eventName: "Mint",
    fromBlock: 0n,
    filters: { to: address },
    watch: true,
  });

  const blockTimes = useEventTimestamps(mintEvent?.map(event => ({ event, id: event.args.to })));

  const handleMint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const amount = mintAmount ? BigInt(mintAmount) : BigInt(0);
      if (amount <= 0) {
        notification.error("铸造数量需大于等于0");
        return;
      }
      await writeMyERC20Async({ functionName: "mint", args: [address, amount] });
      notification.success("铸造成功!");
    } catch (error) {
      console.error("Failed to mint tokens:", error);
    } finally {
      setMintAmount("");
    }
  };

  const handleApprove = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = approveAmount ? BigInt(approveAmount) : BigInt(0);
    if (amount > (balance ?? 0n)) {
      notification.error("授权数量需小于等于您的余额");
      return;
    }
    try {
      await writeMyERC20Async({
        functionName: "approve",
        args: [MyERC721?.address, amount], // Replace with actual contract address
      });
      notification.success("授权成功!");
    } catch (error) {
      console.error("Failed to approve tokens:", error);
    } finally {
      setApproveAmount("");
    }
  };

  const lastIndex = currentPage * ITEMS_PER_PAGE;
  const firstIndex = lastIndex - ITEMS_PER_PAGE;
  const currentMintItems = mintEvent?.slice(firstIndex, lastIndex);

  const totalPages = Math.ceil((mintEvent?.length || 0) / ITEMS_PER_PAGE);

  if (!address) {
    return <Unconnected />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
      <h1 className="mb-4 text-4xl font-bold">我的钱包</h1>
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-semibold">我的余额：</h2>
        <p className="text-xl">
          {balance !== undefined ? balance.toString() : "Loading..."} {symbol}
        </p>

        <div className="mt-6">
          <h2 className="mb-4 text-2xl font-semibold">铸造 {symbol}</h2>
          <form onSubmit={handleMint} className="flex flex-col space-y-4">
            <input
              type="number"
              value={mintAmount}
              onChange={e => setMintAmount(e.target.value)}
              placeholder="铸造金额"
              className="p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              required
            />
            <button type="submit" className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700">
              铸造 {symbol}
            </button>
          </form>
        </div>

        <div className="mt-6">
          <h2 className="mb-4 text-2xl font-semibold">当前授权：</h2>
          <p className="text-xl">
            {currentAllowance !== undefined ? currentAllowance.toString() : "Loading..."} {symbol}
          </p>
          <div className="mt-6">
            <h2 className="mb-4 text-2xl font-semibold">授权 {symbol}</h2>
            <form onSubmit={handleApprove} className="flex flex-col space-y-4">
              <input
                type="number"
                value={approveAmount}
                onChange={e => setApproveAmount(e.target.value)}
                placeholder="授权金额"
                className="p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <button type="submit" className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-700">
                授权 {symbol}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-4 text-2xl font-semibold">{symbol} 铸造记录：</h2>
          {currentMintItems?.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">没有记录。</p>
          ) : (
            <ul className="space-y-4">
              {currentMintItems?.map((event, index) => (
                <li key={index} className="flex flex-col p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold">地址 🗺️ ：</span>
                    <span>
                      <Address address={event.args.to} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">金额 💰 ：</span>
                    <span>
                      {event.args.amount?.toString()} {symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">日期 📅 ：</span>
                    <span>{new Date(Number(blockTimes[event.args.to?.toString() ?? ""]) * 1000).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
      </div>
    </div>
  );
}
