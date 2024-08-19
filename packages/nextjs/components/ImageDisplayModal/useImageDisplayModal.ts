import { useState } from "react";
import { Metadata } from "~~/app/mynfts/mint/page";

export default function useImageDisplayModal() {
  const [tokenInfo, setTokeitokenInfo] = useState<Metadata | undefined>(undefined);

  const openImageModal = (tokenInfo: Metadata) => {
    setTokeitokenInfo(tokenInfo);
  };

  const closeImageModal = () => {
    setTokeitokenInfo(undefined);
  };

  return { tokenInfo, openImageModal, closeImageModal };
}
