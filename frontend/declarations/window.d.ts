import { Window as KeplrWindow } from "@keplr-wallet/types";

interface EthereumProvider {
    isMetaMask?: boolean;
    isRabby?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

interface BitKeepEthereumProvider extends EthereumProvider {
    enable: () => Promise<string[]>;
    isConnected: () => boolean;
    selectedAddress?: string;
}

declare global {
    interface Window extends KeplrWindow {
        leap: KeplrWindow["keplr"];

        ethereum?: EthereumProvider;

        bitkeep?: {
            ethereum?: BitKeepEthereumProvider;
        };
    }
}
