import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function AboutPage() {
    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="container flex-1 py-6 prose dark:prose-invert">
                <h1>About ReAirbnb</h1>
                <p>ReAirbnb is a decentralized short-term rental marketplace with vault-based payments, NFT verification, and a re-rent feature.</p>
            </main>
            <Footer />
        </div>
    );
}


