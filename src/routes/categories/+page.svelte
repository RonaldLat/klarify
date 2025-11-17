<script>
    // Assuming the data prop contains an array of categories with 'name', 'slug', 'icon', 'description', and 'summaryCount'
    let { data } = $props();

    // Material-inspired color palette for card cycling.
    // Updated to use Deep Purple, Cyan, Amber, and Rose.
    const colors = [
        // Deep Purple
        { hex: '#7c3aed', tagText: 'text-purple-700 dark:text-purple-300' },
        // Cyan
        { hex: '#06b6d4', tagText: 'text-cyan-700 dark:text-cyan-300' },
        // Amber
        { hex: '#f59e0b', tagText: 'text-amber-700 dark:text-amber-300' },
        // Rose
        { hex: '#e11d48', tagText: 'text-rose-700 dark:text-rose-300' },
    ];
</script>

<svelte:head>
	<title>Explore Categories - Klarify Book Summaries</title>
	<meta name="description" content="Browse all categories of our expert-curated book summaries. Find the insights you need in business, self-help, technology, and more." />
</svelte:head>

<!-- Custom styles for reliable hover effect using CSS variables -->
<style>
    /* Define the custom hover behavior */
    .category-card:hover {
        /* Use a slightly darker color on hover for visual feedback */
        border-color: color-mix(in srgb, var(--category-color) 80%, black) !important;
        border-width: 2px !important; /* Make the border a bit thicker on hover */
    }
</style>

<div class="bg-background min-h-screen py-16 sm:py-24 font-[Inter]">
    <div class="max-w py-10-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header: Responsive Text Sizing -->
        <div class="text-center mb-12 sm:mb-16">
            <h1 class="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
                Explore All Categories
            </h1>
            <p class="text-lg  pb-10 sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Dive into our expertly-curated collection of book summaries organized by topic. Find the knowledge you need, faster.
            </p>
        </div>

        <!-- Categories Grid: Mobile-first (1 column) by default, scaling up to 4 columns.
             Mosaic effect applied by conditionally spanning 2 columns on medium/large screens. -->
        <div class="grid grid-cols-1 pb-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {#each data.categories as category, i}
                {@const color = colors[i % colors.length]}
                
                <!-- Card links to the summaries page, filtered by this category's slug. 
                     The class logic below creates the mosaic effect. -->
                <a
                    href={`/summaries?category=${category.slug}`}
                    class="category-card block p-6 rounded-xl border border-border bg-card shadow-lg hover:shadow-xl 
                        transition-all duration-300 transform hover:-translate-y-1
                        <!-- Mosaic effect: Make every 4th card span 2 columns and be taller on medium and larger screens -->
                        ${i % 4 === 0 && i !== 0 ? 'md:col-span-2 md:min-h-[250px]' : ''}"
                        
                    style={`
                        --category-color: ${color.hex}; 
                        border-color: ${color.hex};
                    `}
                >
                    <div class="h-full flex flex-col justify-between">
                        <!-- Title - Apply accent color directly to the text (The "item") -->
                        <h2 
                            class="text-2xl font-bold mb-3"
                            style={`color: ${color.hex};`}
                        >
                            {category.name}
                        </h2>
                        
                        <!-- Count Tag - Using Hex color with opacity for reliable background -->
                        <span 
                            class="inline-block text-xs font-medium px-3 py-1 rounded-full 
                                ${color.tagText}"
                            
                        >
                            {category.summaryCount} Summaries
                        </span>
                    </div>
                </a>
            {/each}

            <!-- Call to Action Card -->
            <div class="col-span-1 p-6 rounded-xl border-2 border-dashed border-gray-400 dark:border-gray-600 bg-card/50 flex flex-col justify-center items-center text-center">
                <p class="text-base sm:text-lg font-semibold text-foreground mb-4">Can't find your topic?</p>
                <a
                    href="/contact"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors text-sm shadow-md"
                >
                    Request a Summary
                </a>
            </div>
        </div>
        
    </div>
</div>
