import { useMutation } from "@tanstack/react-query";
import { TxResult } from "@/components/listing-form";
import { ethers } from "ethers";

// Type definitions
export interface IEvmTransaction {
    chainId: string;
    data: string;
    to: string;
    value?: string;
}

// Mock wallet store - replace with actual implementation
const useWalletStore = {
    getState: () => ({
        setAwaitingConfirmation: (value: boolean) => console.log('setAwaitingConfirmation:', value),
        setMessageSigned: (value: boolean) => console.log('setMessageSigned:', value),
        setTxStep: (step: string) => console.log('setTxStep:', step),
    })
};

// Mock EvmConfig - replace with actual implementation
const EvmConfig = {
    rpc_urls: {
        default: {
            http: ["https://unichain-sepolia-rpc.publicnode.com"]
        }
    }
};

// Helper function to safely call ethereum methods
const ethereumRequest = async (method: string, params?: any[]): Promise<any> => {
    if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
    }
    return await (window.ethereum as any).request({ method, params });
};


export const signAndSendEVMTransaction = async (
    transaction: IEvmTransaction
) => {
    const { setAwaitingConfirmation, setMessageSigned, setTxStep } =
        useWalletStore.getState();

    // Set initial state
    setTxStep("initiated");
    setAwaitingConfirmation(true);

    const chainId = parseInt(transaction.chainId);
    const chainIdHex = `0x${chainId.toString(16)}`;

    const currentChainIdHex = await ethereumRequest("eth_chainId") as string;

    if (currentChainIdHex !== chainIdHex) {
        try {
            await ethereumRequest("wallet_switchEthereumChain", [{ chainId: chainIdHex }]);
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                setTxStep("error");
                setAwaitingConfirmation(false);
                throw new Error(
                    `Chain with ID ${chainId} needs to be added to your wallet first`
                );
            }
            setTxStep("error");
            setAwaitingConfirmation(false);
            throw switchError;
        }
    }

    try {
        const accounts = await ethereumRequest("eth_accounts") as string[];
        const hash = await ethereumRequest("eth_sendTransaction", [
            {
                from: accounts[0],
                to: transaction.to,
                data: transaction.data,
                value: transaction.value || "0x0",
                chainId: chainIdHex,
            },
        ]) as string;

        console.log("Transaction hash:", hash);
        const provider = new ethers.JsonRpcProvider(
            EvmConfig.rpc_urls.default.http[0]
        );

        const receipt = await provider.waitForTransaction(hash);
        console.log("Transaction receipt:", receipt);

        if (receipt?.status === 0) {
            setTxStep("error");
            setAwaitingConfirmation(false);
            throw new Error("Transaction reverted");
        }

        setTxStep("confirmed");
        setAwaitingConfirmation(false);
        setMessageSigned(true);

        return hash;
    } catch (error: any) {
        setAwaitingConfirmation(false);
        setTxStep("error");
        console.error("transaction failed:", error.message);
        throw error;
    }
};

export const sendTransaction = async (msg: IEvmTransaction) => {
    try {
        const targetChainId = parseInt(msg.chainId);

        console.log(msg, "msg");

        if (!targetChainId) {
            throw new Error("No chain ID provided in transaction");
        }

        if (!window.ethereum) {
            throw new Error(
                "No Ethereum provider found. Please install MetaMask or another wallet."
            );
        }

        const accounts = await ethereumRequest("eth_accounts") as string[];

        if (!accounts || accounts.length === 0) {
            await ethereumRequest("eth_requestAccounts");
        }

        const txHash = await signAndSendEVMTransaction(msg);
        // toast.success("Transaction sent successfully!");
        return txHash;
    } catch (err: any) {
        const { setAwaitingConfirmation } = useWalletStore.getState();
        const errorMessage = err.message || "Transaction failed";
        console.error("Error sending EVM transaction:", errorMessage);
        setAwaitingConfirmation(false);
        // toast.error("tt",errorMessage);
        throw err;
    }
};

export const useCreatePropertyWithSigning = () => {
    return useMutation({
        mutationFn: async (msg: { msg: TxResult }) => {
            console.log("swapping", msg);
            const txHash = await sendTransaction(msg.msg);
            return txHash;
        },
        onSuccess: (data, variables) => {
            console.log("Transaction successful:", data);
            // toast.success(`Transaction Initiated:${data}`);
        },
        onError: (error, variables) => {
            console.error("Transaction failed:", error);
            throw new Error(`Transaction failed: ${error.message}`);
        },
    });
};