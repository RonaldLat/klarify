<script>
	import { goto } from "$app/navigation";

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
						<a href="/admin" class="text-foreground font-medium">Dashboard</a>
						<a href="/admin/products" class="text-muted-foreground hover:text-foreground">Products</a>
						<a href="/admin/categories" class="text-muted-foreground hover:text-foreground">Categories</a>
						<a href="/admin/orders" class="text-muted-foreground hover:text-foreground">Orders</a>
					</nav>
				</div>
				<div class="flex items-center gap-4">
					<a href="/" class="text-muted-foreground hover:text-foreground">View Store</a>
					<span class="text-sm text-muted-foreground">{data.user.name}</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="mb-8">
			<h2 class="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
			<p class="text-muted-foreground">Manage your Klarify store</p>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<!-- Total Products -->
			<div class="bg-card border border-border rounded-lg p-6">
				<div class="text-sm text-muted-foreground mb-1">Total Products</div>
				<div class="text-3xl font-bold text-foreground">0</div>
			</div>

			<!-- Total Sales -->
			<div class="bg-card border border-border rounded-lg p-6">
				<div class="text-sm text-muted-foreground mb-1">Total Sales</div>
				<div class="text-3xl font-bold text-foreground">KSh 0</div>
			</div>

			<!-- Total Orders -->
			<div class="bg-card border border-border rounded-lg p-6">
				<div class="text-sm text-muted-foreground mb-1">Total Orders</div>
				<div class="text-3xl font-bold text-foreground">0</div>
			</div>

			<!-- Total Customers -->
			<div class="bg-card border border-border rounded-lg p-6">
				<div class="text-sm text-muted-foreground mb-1">Total Customers</div>
				<div class="text-3xl font-bold text-foreground">0</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					onclick={() => goto("/admin/products/new")}
					class="px-6 py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium text-left"
				>
					<div class="text-lg mb-1">➕ Add New Product</div>
					<div class="text-sm opacity-90">Upload ebooks, audiobooks, or magazines</div>
				</button>

				<button
					onclick={() => goto("/admin/categories")}
					class="px-6 py-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 font-medium text-left"
				>
					<div class="text-lg mb-1">📁 Manage Categories</div>
					<div class="text-sm opacity-90">Organize your product catalog</div>
				</button>

				<button
					onclick={() => goto("/admin/orders")}
					class="px-6 py-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 font-medium text-left"
				>
					<div class="text-lg mb-1">📦 View Orders</div>
					<div class="text-sm opacity-90">Manage customer purchases</div>
				</button>
			</div>
		</div>
	</main>
</div>
