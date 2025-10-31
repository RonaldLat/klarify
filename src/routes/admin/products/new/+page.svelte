<script>
	import { goto } from "$app/navigation";
	import { enhance } from "$app/forms";

	let { data } = $props();

	// Form state
	let title = $state("");
	let slug = $state("");
	let description = $state("");
	let author = $state("");
	let narrator = $state("");
	let language = $state("en");
	let type = $state("EBOOK");
	let pdfPrice = $state(50);
	let audioPrice = $state(99);
	let bundlePrice = $state(140);
	let pageCount = $state("");
	let duration = $state("");
	let featured = $state(false);
	let selectedCategories = $state([]);

	// File state
	let coverFile = $state(null);
	let pdfFile = $state(null);
	let audioFile = $state(null);
	let samplePdfFile = $state(null);
	let sampleAudioFile = $state(null);

	// UI state
	let uploading = $state(false);
	let error = $state("");
	let uploadProgress = $state(0);
	let form = $state(data.form);

	// Auto-generate slug from title
	$effect(() => {
		if (title) {
			slug = title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");
		}
	});

	// Handle file input
	function handleFileChange(e, fileType) {
		const file = e.target.files?.[0];
		if (!file) return;

		switch (fileType) {
			case "cover":
				coverFile = file;
				break;
			case "pdf":
				pdfFile = file;
				break;
			case "audio":
				audioFile = file;
				break;
			case "sample-pdf":
				samplePdfFile = file;
				break;
			case "sample-audio":
				sampleAudioFile = file;
				break;
		}
	}

	// Toggle category selection
	function toggleCategory(categoryId) {
		if (selectedCategories.includes(categoryId)) {
			selectedCategories = selectedCategories.filter(id => id !== categoryId);
		} else {
			selectedCategories = [...selectedCategories, categoryId];
		}
	}

	const handleSubmit = () => {
		uploading = true;
		uploadProgress = 0;
		
		return async ({ result, formElement }) => {
			uploading = false;
			
			if (result.type === 'success') {
				// Show success message
				alert('Product created successfully!');
				// Redirect to products list
				goto('/admin/products');
			} else if (result.type === 'failure') {
				form = result.data;
				error = result.data?.error || 'Upload failed';
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
					<h1 class="text-xl font-bold text-foreground">Add New Product</h1>
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
					<!-- Title -->
					<div>
						<label for="title" class="block text-sm font-medium text-foreground mb-1.5">
							Title *
						</label>
						<input
							id="title"
							name="title"
							type="text"
							bind:value={title}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					<!-- Slug -->
					<div>
						<label for="slug" class="block text-sm font-medium text-foreground mb-1.5">
							Slug (URL-friendly)
						</label>
						<input
							id="slug"
							name="slug"
							type="text"
							bind:value={slug}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-foreground mb-1.5">
							Description *
						</label>
						<textarea
							id="description"
							name="description"
							bind:value={description}
							rows="4"
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
							required
						></textarea>
					</div>

					<!-- Author & Narrator -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="author" class="block text-sm font-medium text-foreground mb-1.5">
								Author *
							</label>
							<input
								id="author"
								name="author"
								type="text"
								bind:value={author}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								required
							/>
						</div>

						<div>
							<label for="narrator" class="block text-sm font-medium text-foreground mb-1.5">
								Narrator (for audiobooks)
							</label>
							<input
								id="narrator"
								name="narrator"
								type="text"
								bind:value={narrator}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					</div>

					<!-- Type & Language -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="type" class="block text-sm font-medium text-foreground mb-1.5">
								Product Type *
							</label>
							<select
								id="type"
								name="type"
								bind:value={type}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option value="EBOOK">E-Book (PDF)</option>
								<option value="AUDIOBOOK">Audiobook</option>
								<option value="MAGAZINE">Magazine</option>
								<option value="BUNDLE">Bundle (PDF + Audio)</option>
							</select>
						</div>

						<div>
							<label for="language" class="block text-sm font-medium text-foreground mb-1.5">
								Language
							</label>
							<select
								id="language"
								name="language"
								bind:value={language}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option value="en">English</option>
								<option value="sw">Swahili</option>
							</select>
						</div>
					</div>

					<!-- Page Count & Duration -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="pageCount" class="block text-sm font-medium text-foreground mb-1.5">
								Page Count (for PDFs)
							</label>
							<input
								id="pageCount"
								name="pageCount"
								type="number"
								bind:value={pageCount}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>

						<div>
							<label for="duration" class="block text-sm font-medium text-foreground mb-1.5">
								Duration in seconds (for audio)
							</label>
							<input
								id="duration"
								name="duration"
								type="number"
								bind:value={duration}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					</div>

					<!-- Categories -->
					{#if data.categories.length > 0}
						<div>
							<label class="block text-sm font-medium text-foreground mb-2">
								Categories
							</label>
							<div class="flex flex-wrap gap-2">
								{#each data.categories as category}
									<button
										type="button"
										onclick={() => toggleCategory(category.id)}
										class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
											{selectedCategories.includes(category.id)
												? 'bg-primary text-primary-foreground'
												: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
									>
										{category.icon} {category.name}
									</button>
									{#if selectedCategories.includes(category.id)}
										<input type="hidden" name="categories[]" value={category.id} />
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					<!-- Featured -->
					<div class="flex items-center gap-2">
						<input
							id="featured"
							name="featured"
							type="checkbox"
							bind:checked={featured}
							class="w-4 h-4 rounded border-input"
						/>
						<label for="featured" class="text-sm font-medium text-foreground">
							Feature this product on homepage
						</label>
					</div>
				</div>
			</div>

			<!-- Pricing -->
			<div class="bg-card border border-border rounded-lg p-6">
				<h2 class="text-lg font-semibold text-foreground mb-4">Pricing (KSh)</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="pdfPrice" class="block text-sm font-medium text-foreground mb-1.5">
							PDF Price
						</label>
						<input
							id="pdfPrice"
							name="pdfPrice"
							type="number"
							bind:value={pdfPrice}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label for="audioPrice" class="block text-sm font-medium text-foreground mb-1.5">
							Audio Price
						</label>
						<input
							id="audioPrice"
							name="audioPrice"
							type="number"
							bind:value={audioPrice}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label for="bundlePrice" class="block text-sm font-medium text-foreground mb-1.5">
							Bundle Price (Discount)
						</label>
						<input
							id="bundlePrice"
							name="bundlePrice"
							type="number"
							bind:value={bundlePrice}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>
			</div>

			<!-- Files -->
			<div class="bg-card border border-border rounded-lg p-6">
				<h2 class="text-lg font-semibold text-foreground mb-4">Files</h2>
				
				<div class="space-y-4">
					<!-- Cover Image -->
					<div>
						<label for="cover" class="block text-sm font-medium text-foreground mb-1.5">
							Cover Image * (Max 5MB)
						</label>
						<input
							id="cover"
							name="cover"
							type="file"
							accept="image/*"
							onchange={(e) => handleFileChange(e, 'cover')}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
								file:rounded file:border-0 file:bg-primary file:text-primary-foreground
								file:cursor-pointer hover:file:bg-primary/90"
							required
						/>
						{#if coverFile}
							<p class="text-sm text-muted-foreground mt-1">✓ {coverFile.name}</p>
						{/if}
					</div>

					<!-- PDF File -->
					{#if type === "EBOOK" || type === "MAGAZINE" || type === "BUNDLE"}
						<div>
							<label for="pdf" class="block text-sm font-medium text-foreground mb-1.5">
								PDF File * (Max 100MB)
							</label>
							<input
								id="pdf"
								name="pdf"
								type="file"
								accept=".pdf"
								onchange={(e) => handleFileChange(e, 'pdf')}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
									file:rounded file:border-0 file:bg-primary file:text-primary-foreground
									file:cursor-pointer hover:file:bg-primary/90"
								required={type === "EBOOK" || type === "MAGAZINE" || type === "BUNDLE"}
							/>
							{#if pdfFile}
								<p class="text-sm text-muted-foreground mt-1">✓ {pdfFile.name}</p>
							{/if}
						</div>
					{/if}

					<!-- Audio File -->
					{#if type === "AUDIOBOOK" || type === "BUNDLE"}
						<div>
							<label for="audio" class="block text-sm font-medium text-foreground mb-1.5">
								Audio File * (Max 500MB)
							</label>
							<input
								id="audio"
								name="audio"
								type="file"
								accept="audio/*"
								onchange={(e) => handleFileChange(e, 'audio')}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
									file:rounded file:border-0 file:bg-primary file:text-primary-foreground
									file:cursor-pointer hover:file:bg-primary/90"
								required={type === "AUDIOBOOK" || type === "BUNDLE"}
							/>
							{#if audioFile}
								<p class="text-sm text-muted-foreground mt-1">✓ {audioFile.name}</p>
							{/if}
						</div>
					{/if}

					<!-- Sample Files -->
					<div class="pt-4 border-t border-border">
						<h3 class="text-sm font-medium text-foreground mb-3">Sample/Preview Files (Optional)</h3>
						
						<div class="space-y-4">
							<!-- Sample PDF -->
							{#if type === "EBOOK" || type === "MAGAZINE" || type === "BUNDLE"}
								<div>
									<label for="samplePdf" class="block text-sm text-muted-foreground mb-1.5">
										Sample PDF (First chapter, max 10MB)
									</label>
									<input
										id="samplePdf"
										name="samplePdf"
										type="file"
										accept=".pdf"
										onchange={(e) => handleFileChange(e, 'sample-pdf')}
										class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
											focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
											file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground
											file:cursor-pointer hover:file:bg-secondary/90"
									/>
									{#if samplePdfFile}
										<p class="text-sm text-muted-foreground mt-1">✓ {samplePdfFile.name}</p>
									{/if}
								</div>
							{/if}

							<!-- Sample Audio -->
							{#if type === "AUDIOBOOK" || type === "BUNDLE"}
								<div>
									<label for="sampleAudio" class="block text-sm text-muted-foreground mb-1.5">
										Sample Audio (5 min preview, max 50MB)
									</label>
									<input
										id="sampleAudio"
										name="sampleAudio"
										type="file"
										accept="audio/*"
										onchange={(e) => handleFileChange(e, 'sample-audio')}
										class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
											focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
											file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground
											file:cursor-pointer hover:file:bg-secondary/90"
									/>
									{#if sampleAudioFile}
										<p class="text-sm text-muted-foreground mt-1">✓ {sampleAudioFile.name}</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Error Message -->
			{#if form?.error || error}
				<div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
					{form?.error || error}
				</div>
			{/if}

			<!-- Upload Progress -->
			{#if uploading}
				<div class="bg-card border border-border rounded-lg p-6">
					<div class="text-sm text-foreground mb-2">Uploading files...</div>
					<div class="w-full bg-secondary rounded-full h-2">
						<div 
							class="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse"
							style="width: 100%"
						></div>
					</div>
					<p class="text-xs text-muted-foreground mt-2">Please wait, this may take a few minutes for large files.</p>
				</div>
			{/if}

			<!-- Submit Button -->
			<div class="flex justify-end gap-4">
				<a
					href="/admin/products"
					class="px-6 py-2.5 rounded-md border border-input text-foreground hover:bg-accent"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={uploading}
					class="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md 
						hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{uploading ? "Uploading..." : "Create Product"}
				</button>
			</div>
		</form>
	</main>
</div>
