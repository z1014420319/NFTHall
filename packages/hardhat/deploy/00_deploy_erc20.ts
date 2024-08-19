import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMyERC721: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 首先部署 MyERC20 合约
  const myERC20 = await deploy("MyERC20", {
    from: deployer,
    args: ["ArtCoin", "ART"],
    log: true,
    autoMine: true,
  });

  // 然后部署 MyERC721 合约，传入 MyERC20 的地址作为参数
  const myERC721 = await deploy("MyERC721", {
    from: deployer,
    args: [myERC20.address, "ArtCoin", "ART"], // 将 MyERC20 合约地址作为参数传递
    log: true,
    autoMine: true,
  });

  // 获取部署的合约实例
  const myERC721Contract = await hre.ethers.getContract<Contract>("MyERC721", deployer);
  console.log("👋 MyERC721 deployed at:", myERC721Contract.address);
  console.log("👋 MyERC721 deployed at:", myERC721);
};

export default deployMyERC721;

deployMyERC721.tags = ["MyERC721"];
