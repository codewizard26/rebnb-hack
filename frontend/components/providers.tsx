"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    mainnet,
    sepolia,
    polygon,
    polygonAmoy,
    rootstock,
    rootstockTestnet,
    arbitrumSepolia,
} from "wagmi/chains";
import {
    mainnet as appMainnet,
    sepolia as appSepolia,
    polygon as appPolygon,
    polygonAmoy as appPolygonAmoy,
    rootstock as appRootstock,
    rootstockTestnet as appRootstockTestnet,
} from "@reown/appkit/networks";

// Define Unichain Sepolia chain
const unichainSepolia = {
    id: 1301,
    name: "Unichain Sepolia",
    network: "unichain-sepolia",
    nativeCurrency: {
        decimals: 18,
        name: "Unichain",
        symbol: "UNI",
    },
    rpcUrls: {
        default: {
            http: ["https://unichain-sepolia-rpc.publicnode.com"],
        },
        public: {
            http: ["https://unichain-sepolia-rpc.publicnode.com"],
        },
    },
    blockExplorers: {
        default: {
            name: "Unichain Explorer",
            url: "https://sepolia.uniscan.xyz",
        },
    },
    testnet: true,
} as const;
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

const networks = [arbitrumSepolia, unichainSepolia] as const;
const transports = {
    [arbitrumSepolia.id]: http(),
    [unichainSepolia.id]: http(),
} as const;

const wagmiConfig = createConfig({ chains: networks, transports });

// Define Unichain Sepolia for AppKit
const appUnichainSepolia: AppKitNetwork = {
    id: 1301,
    name: "Unichain Sepolia",
    nativeCurrency: {
        name: "Unichain",
        symbol: "UNI",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://unichain-sepolia-rpc.publicnode.com"],
        },
    },
    blockExplorers: {
        default: {
            name: "Unichain Explorer",
            url: "https://sepolia.uniscan.xyz",
        },
    },
    testnet: true,
};

const appNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
    appMainnet,
    appSepolia,
    appPolygon,
    appPolygonAmoy,
    appRootstock,
    appRootstockTestnet,
    appUnichainSepolia,
];
const wagmiAdapter = new WagmiAdapter({ networks: appNetworks, projectId });

createAppKit({
    projectId,
    adapters: [wagmiAdapter],
    networks: appNetworks,
    features: { analytics: true },
});

type ProvidersProps = {
    children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    {children}
                    <Toaster richColors position="top-right" />
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
}
