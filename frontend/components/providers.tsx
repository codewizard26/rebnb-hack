"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, sepolia, polygon, polygonAmoy, rootstock, rootstockTestnet } from "wagmi/chains";
import { mainnet as appMainnet, sepolia as appSepolia, polygon as appPolygon, polygonAmoy as appPolygonAmoy, rootstock as appRootstock, rootstockTestnet as appRootstockTestnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

const networks = [mainnet, sepolia, polygon, polygonAmoy, rootstock, rootstockTestnet] as const;
const transports = {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [rootstock.id]: http(),
    [rootstockTestnet.id]: http(),
} as const;

const wagmiConfig = createConfig({ chains: networks, transports });

const appNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [appMainnet, appSepolia, appPolygon, appPolygonAmoy, appRootstock, appRootstockTestnet];
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


