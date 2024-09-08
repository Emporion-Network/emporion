export const COIN_DATA = {
    "NTRN":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/neutron/chain.png",
        coinGeckoId: "neutron-3",
        coinDenom:"NTRN",
        coinMinimalDenom:"untrn",
        onChainDenom:"untrn",
        coinDecimals: 6,
        addressPrefix:"neutron",
        chainName:"Neutron",
        rpc:"http://localhost:5173/rpc",
        isCw20:false,
    },
    "ATOM":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/cosmoshub/chain.png",
        coinGeckoId:"cosmos",
        coinDenom:"ATOM",
        coinMinimalDenom:"uatom",
        onChainDenom:"uibcatom",
        coinDecimals: 6,
        addressPrefix:"cosmos",
        chainName:"Cosmos Hub",
        rpc:"https://cosmos-rpc.publicnode.com:443",
        isCw20:false,
    },
    "DYDX":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-mainnet/adydx.png",
        coinGeckoId:"dydx-chain",
        coinDenom:"DYDX",
        coinMinimalDenom:"adydx",
        onChainDenom:"uibcusdc",
        coinDecimals: 18,
        addressPrefix:"dydx",
        chainName:"dYdX",
        rpc:"https://dydx-rpc.publicnode.com:443",
        isCw20:false,
    },
    "NLS":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/pirin/nolus.png",
        coinGeckoId:"nolus",
        coinDenom:"NLS",
        coinMinimalDenom:"unls",
        onChainDenom:"uibcusdc",
        coinDecimals: 6,
        addressPrefix:"nolus",
        chainName:"Nolus",
        rpc:"https://nolus-rpc.publicnode.com",
        isCw20:false,
    },
    "AXL":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/axelar-dojo/chain.png",
        coinGeckoId:"axelar",
        coinDenom:"AXL",
        coinMinimalDenom:"uaxl",
        onChainDenom:"uibcatom",
        coinDecimals: 6,
        addressPrefix:"axelar",
        chainName:"Axelar",
        rpc:"https://tm.axelar.lava.build",
        isCw20:false,
    },
    "OSMO":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/osmosis/chain.png",
        coinGeckoId:"osmosis",
        coinDenom:"OSMO",
        coinMinimalDenom:"uosmo",
        onChainDenom:"uibcatom",
        coinDecimals: 6,
        addressPrefix:"osmo",
        chainName:"Osmosis",
        rpc:"https://osmosis-rpc.publicnode.com:443",
        gasPrice:"50uosmo",
        isCw20:false,
    },
    "TIA":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/celestia/chain.png",
        coinGeckoId:"celestia",
        coinDenom:"TIA",
        coinMinimalDenom:"utia",
        onChainDenom:"uibcatom",
        coinDecimals: 6,
        addressPrefix:"celestia",
        chainName:"Celestia",
        rpc:"https://celestia-rpc.publicnode.com:443",
        isCw20:false,

    },
    "USDC":{
        icon:"https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/eip155:1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
        coinGeckoId:"usd-coin",
        coinDenom:"USDC",
        coinMinimalDenom:"uusdc",
        onChainDenom:"uibcusdc",
        coinDecimals: 6,
        addressPrefix:"noble",
        chainName:"Noble",
        rpc:"http://65.108.197.163:35657/",
        isCw20:false,

    },
    "axlWETH":{
        icon:"https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/weth.png",
        coinGeckoId:"weth",
        coinDenom:"axlWETH",
        coinMinimalDenom:"weth-wei",
        onChainDenom:"uibcusdc",
        coinDecimals: 18,
        addressPrefix:"axelar",
        chainName:"Axelar",
        rpc:"https://tm.axelar.lava.build",
        isCw20:false,
    },
    "CW20":{
        icon:"https://raw.githubusercontent.com/cosmos/chain-registry/master/juno/images/neta.png",
        coinGeckoId:"neta",
        coinDenom:"CW20",
        coinMinimalDenom:"neutron19vypfx2reyfp9uxhepdpznr0rel6jm684e5xpkgygm3st443ltusd4j0wt",
        onChainDenom:"neutron19vypfx2reyfp9uxhepdpznr0rel6jm684e5xpkgygm3st443ltusd4j0wt",
        coinDecimals: 6,
        addressPrefix:"neutron",
        chainName:"Neutron",
        rpc:"http://localhost:5173/rpc",
        isCw20:true,
    },
}