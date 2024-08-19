import React from "react";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="min-h-0 px-1 py-5 mb-11 lg:mb-0">
      <div>
        <div className="fixed bottom-0 left-0 z-10 flex items-center justify-between w-full p-4 pointer-events-none"></div>
      </div>
      <div className="w-full">
        <ul className="w-full menu menu-horizontal">
          <div className="flex items-center justify-center w-full gap-2 text-sm">
            <div className="text-center">欢迎来到 NFT 展览馆 🎉</div>
            <span>·</span>
            <div className="text-center">
              <a
                href="https://github.com/z1014420319/NFTExhibitionHall"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                GitHub
              </a>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
