<script>
	import { enhance } from "$app/forms";
	
	let { data } = $props();
</script>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="border-b border-border bg-card">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center gap-8">
					<h1 class="text-xl font-bold text-primary">Klarify Admin</h1>
					<nav class="flex gap-4">
						<a href="/admin" class="text-muted-foreground hover:text-foreground">Dashboard</a>
						<a href="/admin/products" class="text-foreground font-medium">Products</a>
						<a href="/admin/categories" class="text-muted-foreground hover:text-foreground">Categories</a>
						<a href="/admin/orders" class="text-muted-foreground hover:text-foreground">Orders</a>
					</nav>
				</div>
				<a href="/" class="text-muted-foreground hover:text-foreground">View Store</a>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="flex justify-between items-center mb-6">
			<div>
				<h2 class="text-3xl font-bold text-foreground mb-2">Products</h2>
				<p class="text-muted-foreground">{data.products.length} total products</p>
			</div>
			<a
				href="/admin/products/new"
				class="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90"
			>
				+ Add Product
			</a>
		</div>

		<!-- Products Table -->
		<div class="bg-card border border-border rounded-lg overflow-hidden">
			<table class="w-full">
				<thead class="bg-muted">
					<tr class="border-b border-border">
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Title</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Author</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Type</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Price</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Downloads</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Status</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if data.products.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-muted-foreground">
								No products yet. <a href="/admin/products/new" class="text-primary hover:underline">Add your first product</a>
							</td>
						</tr>
					{:else}
						{#each data.products as product}
							<tr class="border-b border-border hover:bg-accent/50">
								<td class="px-6 py-4">
									<div class="font-medium text-foreground">{product.title}</div>
									{#if product.featured}
										<span class="text-xs text-primary">⭐ Featured</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-foreground">{product.author}</td>
								<td class="px-6 py-4">
									<span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
										{product.type}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-foreground">
									{#if product.type === "BUNDLE"}
										KSh {product.audioPrice}
									{:else if product.type === "AUDIOBOOK"}
										KSh {product.audioPrice}
									{:else}
										KSh {product.pdfPrice}
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-foreground">{product.downloads}</td>
								<td class="px-6 py-4">
									{#if product.active}
										<span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">Active</span>
									{:else}
										<span class="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600">Inactive</span>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="flex gap-2">
										<a
											href="/admin/products/{product.id}/edit"
											class="text-sm text-primary hover:underline"
										>
											Edit
										</a>
										<form method="POST" action="?/delete" use:enhance={() => {
											return async ({ result }) => {
												if (result.type === 'success') {
													// Reload the page to show updated list
													window.location.reload();
												}
											};
										}}>
											<input type="hidden" name="productId" value={product.id} />
											<button
												type="submit"
												onclick={(e) => {
													if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) {
														e.preventDefault();
													}
												}}
												class="text-sm text-destructive hover:underline"
											>
												Delete
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</main>
</div>
