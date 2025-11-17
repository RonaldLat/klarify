<script>
    let { data } = $props();

    // Material-inspired gradient palettes
    const palettes = [
        { from: "#7c3aed", to: "#a855f7", text: "text-purple-200" },
        { from: "#06b6d4", to: "#22d3ee", text: "text-cyan-200" },
        { from: "#f59e0b", to: "#fbbf24", text: "text-amber-200" },
        { from: "#e11d48", to: "#fb7185", text: "text-rose-200" }
    ];

    // Light masonry effect only on md+
    function brickLayout(i) {
        return i % 6 === 0
            ? "md:col-span-2 md:row-span-2"
            : i % 4 === 0
            ? "md:row-span-2"
            : "";
    }
</script>

<svelte:head>
    <title>Explore Categories - Klarify Book Summaries</title>
    <meta
        name="description"
        content="Browse all categories of expertly curated book summaries in a compact, mobile-first layout."
    />
</svelte:head>

<style>
    .category-card {
        transition: all 0.28s ease;
        background-size: 140% 140%;
    }
    .category-card:hover {
        background-position: right bottom;
        transform: translateY(-4px);
        box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18);
    }
</style>

<div class="bg-background min-h-screen py-14 font-[Inter]">
    <div class="max-w-6xl mx-auto px-4">

        <!-- Header -->
        <div class="text-center mb-10">
            <h1 class="text-3xl font-extrabold text-foreground mb-2">
                Explore Categories
            </h1>
            <p class="text-base text-muted-foreground max-w-lg mx-auto">
                Fast, compact, mobile-friendly categories to help you find summaries quickly.
            </p>
        </div>

        <!-- Compact Grid (Mobile-first: 2 columns) -->
        <div
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[100px]"
        >
            {#each data.categories as category, i}
                {@const palette = palettes[i % palettes.length]}
                {@const span = brickLayout(i)}

                <a
                    href={`/summaries?category=${category.slug}`}
                    class={`category-card rounded-xl p-3 shadow-sm flex flex-col justify-between text-white border border-white/10 ${span}`}
                    style={`background-image: linear-gradient(135deg, ${palette.from}, ${palette.to});`}
                >
                    <!-- Title (compact, truncates if long) -->
                    <h2 class="text-sm font-semibold truncate">
                        {category.name}
                    </h2>

                    <!-- Count -->
                    <span
                        class="text-[10px] font-medium px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm w-fit"
                    >
                        {category.summaryCount} summaries
                    </span>
                </a>
            {/each}

            <!-- CTA (compact) -->
            <div
                class="rounded-xl p-4 border-2 border-dashed border-gray-400/60 dark:border-gray-600 bg-card/40 backdrop-blur-sm 
                       flex items-center justify-center text-center shadow-sm hover:-translate-y-1 transition-all"
            >
                <div>
                    <p class="text-sm font-semibold text-foreground mb-2">
                        Can't find your topic?
                    </p>
                    <a
                        href="/contact"
                        class="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                    >
                        Request a Summary
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
