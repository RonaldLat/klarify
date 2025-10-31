<script>
	import { goto } from "$app/navigation";
	import { enhance } from "$app/forms";

	let { data } = $props();

	let uploading = $state(false);
	let form = $state(data.form);

	const handleSubmit = () => {
		uploading = true;
		
		return async ({ result }) => {
			uploading = false;
			
			if (result.type === 'success') {
				alert('Product updated successfully!');
				goto('/admin/products');
			} else if (result.type === 'failure') {
				form = result.data;
			}
		};
	};
</script>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="border-b border-border bg-card">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center gap-4">
					<a href="/admin/products" class="text-muted-foreground hover:text-foreground">← Back</a>
					<h1 class="text-xl font-bold text-foreground">Edit Product</h1>
				</div>
			</div>
		</div>
	</header>

	<!-- Form -->
	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<form method="POST" enctype="multipart/form-data" use:enhance={handleSubmit} class="space-y-8">
			<!-- Basic Info -->
			<div class="bg-card border border-border rounded-lg p-6">
				<h2 class="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
				
				<div class="space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium text-foreground mb-1.5">Title *</label>
						<input
							id="title"
							name="title"
							type="text"
							value={data.product.title}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					<div>
						<label for="slug" class="block text-sm font-medium text-foreground mb-1.5">Slug</label>
						<input
							id="slug"
							name="slug"
							type="text"
							value={data.product.slug}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-foreground mb-1.5">Description *</label>
						<textarea
							id="description"
							name="description"
							rows="4"
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							required
						>{data.product.description}</textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="author" class="block text-sm font-medium text-foreground mb-1.5">Author *</label>
							<input id="author" name="author" type="text" value={data.product.author} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
						</div>
						<div>
							<label for="narrator" class="block text-sm font-medium text-foreground mb-1.5">Narrator</label>
							<input id="narrator" name="narrator" type="text" value={data.product.narrator || ""} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="type" class="block text-sm font-medium text-foreground mb-1.5">Product Type *</label>
							<select id="type" name="type" class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
								<option value="EBOOK" selected={data.product.type === "EBOOK"}>E-Book (PDF)</option>
								<option value="AUDIOBOOK" selected={data.product.type === "AUDIOBOOK"}>Audiobook</option>
								<option value="MAGAZINE" selected={data.product.type === "MAGAZINE"}>Magazine</option>
								<option value="BUNDLE" selected={data.product.type === "BUNDLE"}>Bundle (PDF + Audio)</option>
							</select>
						</div>
						<div>
							<label for="language" class="block text-sm font-medium text-foreground mb-1.5">Language</label>
							<select id="language" name="language" class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
								<option value="en" selected={data.product.language === "en"}>English</option>
								<option value="sw" selected={data.product.language === "sw"}>Swahili</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="pageCount" class="block text-sm font-medium text-foreground mb-1.5">Page Count</label>
							<input id="pageCount" name="pageCount" type="number" value={data.product.pageCount || ""} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div>
							<label for="duration" class="block text-sm font-medium text-foreground mb-1.5">Duration (seconds)</label>
							<input id="duration" name="duration" type="number" value={data.product.duration || ""} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>

					<!-- Categories -->
					<div>
						<label class="block text-sm font-medium text-foreground mb-2">Categories</label>
						<div class="flex flex-wrap gap-2">
							{#each data.allCategories as category}
								<label class="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent cursor-pointer">
									<input
										type="checkbox"
										name="categories[]"
										value={category.id}
										checked={data.product.categories.some(c => c.id === category.id)}
										class="w-4 h-4 rounded border-input"
									/>
									<span class="text-sm">{category.icon} {category.name}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="flex items-center gap-4">
						<label class="flex items-center gap-2">
							<input id="featured" name="featured" type="checkbox" checked={data.product.featured} class="w-4 h-4 rounded border-input" />
							<span class="text-sm font-medium text-foreground">Featured</span>
						</label>
						<label class="flex items-center gap-2">
							<input id="active" name="active" type="checkbox" checked={data.product.active} class="w-4 h-4 rounded border-input" />
							<span class="text-sm font-medium text-foreground">Active</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Pricing -->
			<div class="bg-card border border-border rounded-lg p-6">
				<h2 class="text-lg font-semibold text-foreground mb-4">Pricing (KSh)</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="pdfPrice" class="block text-sm font-medium text-foreground mb-1.5">PDF Price</label>
						<input id="pdfPrice" name="pdfPrice" type="number" value={data.product.pdfPrice} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label for="audioPrice" class="block text-sm font-medium text-foreground mb-1.5">Audio Price</label>
						<input id="audioPrice" name="audioPrice" type="number" value={data.product.audioPrice} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label for="bundlePrice" class="block text-sm font-medium text-foreground mb-1.5">Bundle Price</label>
						<input id="bundlePrice" name="bundlePrice" type="number" value={data.product.bundlePrice || ""} class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
				</div>
			</div>

			<!-- Files (Optional - only upload if replacing) -->
			<div class="bg-card border border-border rounded-lg p-6">
				<h2 class="text-lg font-semibold text-foreground mb-2">Replace Files (Optional)</h2>
				<p class="text-sm text-muted-foreground mb-4">Only upload files if you want to replace existing ones.</p>
				
				<div class="space-y-4">
					<div>
						<label for="cover" class="block text-sm font-medium text-foreground mb-1.5">Cover Image</label>
						<input id="cover" name="cover" type="file" accept="image/*" class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground" />
					</div>
					<div>
						<label for="pdf" class="block text-sm font-medium text-foreground mb-1.5">PDF File</label>
						<input id="pdf" name="pdf" type="file" accept=".pdf" class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground" />
					</div>
					<div>
						<label for="audio" class="block text-sm font-medium text-foreground mb-1.5">Audio File</label>
						<input id="audio" name="audio" type="file" accept="audio/*" class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground" />
					</div>
				</div>
			</div>

			<!-- Error Message -->
			{#if form?.error}
				<div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
					{form.error}
				</div>
			{/if}

			<!-- Submit -->
			<div class="flex justify-end gap-4">
				<a href="/admin/products" class="px-6 py-2.5 rounded-md border border-input text-foreground hover:bg-accent">Cancel</a>
				<button type="submit" disabled={uploading} class="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 disabled:opacity-50">
					{uploading ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</form>
	</main>
</div>
