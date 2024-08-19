import Image from "next/image";
import { Metadata } from "~~/app/mynfts/mint/page";

export type ImageDisplayModalProps = {
  tokenInfo?: Metadata;
  closeImageModal: () => void;
};
export default function ImageDisplayModal({ tokenInfo, closeImageModal }: ImageDisplayModalProps) {
  return tokenInfo ? (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black bg-opacity-50"
      onClick={closeImageModal}
    >
      <div className="flex justify-center">
        <span className="font-semibold">标题：</span>
        <span>{tokenInfo.title}</span>
      </div>
      <div
        className="relative"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <button
          onClick={closeImageModal}
          className="absolute top-0 right-0 z-10 flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full"
        >
          &times;
        </button>
        <Image src={tokenInfo.image} alt="Selected NFT" width={500} height={500} className="rounded-lg" />
      </div>
      <div className="flex justify-center">
        <span className="font-semibold">介绍：</span>
        <span>{tokenInfo.description}</span>
      </div>
    </div>
  ) : null;
}
