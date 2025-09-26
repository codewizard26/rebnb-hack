import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex w-full max-w-none flex-col items-center justify-between gap-3 px-4 py-6 md:h-16 md:flex-row">
                <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ReAirbnb</p>
                <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/about">About</Link>
                    <Link href="/contact">Contact</Link>
                    <a href="https://docs.example.com" target="_blank" rel="noreferrer">Docs</a>
                </nav>
            </div>
        </footer>
    );
}


