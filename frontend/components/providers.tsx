"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
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

// Define 0g Testnet chain
const ogTestnet = {
    id: 16602,
    name: "0g Testnet",
    network: "0g-testnet",
    nativeCurrency: {
        decimals: 18,
        name: "0g",
        symbol: "0G",
    },
    rpcUrls: {
        default: {
            http: ["https://evmrpc-testnet.0g.ai"],
        },
        public: {
            http: ["https://evmrpc-testnet.0g.ai"],
        },
    },
    blockExplorers: {
        default: {
            name: "0g Explorer",
            url: "https://testnet.0g.ai",
        },
    },
    testnet: true,
} as const;
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

const networks = [arbitrumSepolia, ogTestnet] as const;
const transports = {
    [arbitrumSepolia.id]: http(),
    [ogTestnet.id]: http(),
} as const;

const wagmiConfig = createConfig({ chains: networks, transports });

// Define 0g Testnet for AppKit
const appOgTestnet: AppKitNetwork = {
    id: 16602,
    name: "0g Testnet",
    nativeCurrency: {
        name: "0g",
        symbol: "0G",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://evmrpc-testnet.0g.ai"],
        },
    },
    blockExplorers: {
        default: {
            name: "0g Explorer",
            url: "https://testnet.0g.ai",
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
    appOgTestnet,
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
