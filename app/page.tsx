import Link from "next/link";

const Home = ({ searchParams }: SearchParamProps) => {
    return (
        <div className="flex min-h-screen items-center justify-center">

            <section className="w-full max-w-md">

                <div className="space-y-8">

                    <div className="space-y-3">
                        <h1 className="text-4xl font-semibold tracking-tight">
                            МедГарант
                        </h1>

                        <p className="text-muted-foreground text-base">
                            Ваш цифровой администратор
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]">
                            Начать
                        </button>

                        <button className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm font-medium transition hover:bg-accent">
                            Узнать больше
                        </button>
                    </div>

                </div>

                <div className="mt-20 flex items-center justify-between text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} МедГарант</p>

                    <Link
                        href="/?admin=true"
                        className="transition hover:text-foreground"
                    >
                        Администратор
                    </Link>
                </div>

            </section>
        </div>
    );
};

export default Home;