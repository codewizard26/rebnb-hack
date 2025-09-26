import * as fcl from "@onflow/fcl";

export type FlowEnv = "testnet" | "mainnet";

export function configureFlow(env: FlowEnv = (process.env.NEXT_PUBLIC_FLOW_NETWORK as FlowEnv) || "testnet") {
    if (env === "mainnet") {
        fcl.config()
            .put("app.detail.title", "ReAirbnb")
            .put("app.detail.icon", "/favicon.ico")
            .put("flow.network", "mainnet")
            .put("accessNode.api", "https://rest-mainnet.onflow.org")
            .put("discovery.wallet", "https://fcl-discovery.onflow.org/authn");
    } else {
        fcl.config()
            .put("app.detail.title", "ReAirbnb")
            .put("app.detail.icon", "/favicon.ico")
            .put("flow.network", "testnet")
            .put("accessNode.api", "https://rest-testnet.onflow.org")
            .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn");
    }
}

export const flowAuth = {
    subscribe(cb: (user: fcl.CurrentUserObject) => void) {
        return fcl.currentUser.subscribe(cb);
    },
    async logIn() {
        return fcl.authenticate();
    },
    async logOut() {
        return fcl.unauthenticate();
    },
};
