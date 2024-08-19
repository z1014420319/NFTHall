import Link from "next/link";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-20 text-center">
        <h1 className="text-6xl font-bold">欢迎来到 NFT 展览馆 🎉</h1>

        <div className="flex flex-row mt-10 space-x-4">
          <Link
            href="/wallet"
            className="px-6 py-3 text-white bg-blue-500 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            我的钱包 👛
          </Link>

          <Link
            href="/mynfts"
            className="px-6 py-3 text-white bg-green-500 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            我的 NFT 🎨
          </Link>

          <Link
            href="/market"
            className="px-6 py-3 text-white bg-purple-500 rounded hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            NFT 展览馆 🏬
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;
