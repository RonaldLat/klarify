<script>
	import { goto } from "$app/navigation";
	import { uploadMultipleFiles, formatFileSize } from "$lib/utils/uploadHelper.js";

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
	let currentFileIndex = $state(0);
	let currentFileProgress = $state(0);
	let overallProgress = $state(0);
	let currentFileName = $state("");
	let totalFiles = $state(0);

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

	// Handle form submission with client-side uploads
	async function handleSubmit(e) {
		e.preventDefault();
		
		if (uploading) return;

		// Validate required fields
		if (!title || !slug || !description || !author || !coverFile) {
			error = "Please fill in all required fields and upload a cover image";
			return;
		}

		uploading = true;
		error = "";
		overallProgress = 0;

		try {
			// Step 1: Create product in database (without files)
			const createResponse = await fetch('/api/products/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					slug,
					description,
					author,
					narrator,
					language,
					type,
					pdfPrice,
					audioPrice,
					bundlePrice,
					pageCount: pageCount ? parseInt(pageCount) : null,
					duration: duration ? parseInt(duration) : null,
					featured,
					categoryIds: selectedCategories
				})
			});

			if (!createResponse.ok) {
				const errorData = await createResponse.json();
				throw new Error(errorData.error || 'Failed to create product');
			}

			const { productId } = await createResponse.json();

			// Step 2: Prepare files for upload
			const filesToUpload = [];
			
			if (coverFile) {
				filesToUpload.push({ file: coverFile, productId, fileType: 'cover' });
			}
			if (pdfFile) {
				filesToUpload.push({ file: pdfFile, productId, fileType: 'pdf' });
			}
			if (audioFile) {
				filesToUpload.push({ file: audioFile, productId, fileType: 'audio' });
			}
			if (samplePdfFile) {
				filesToUpload.push({ file: samplePdfFile, productId, fileType: 'sample-pdf' });
			}
			if (sampleAudioFile) {
				filesToUpload.push({ file: sampleAudioFile, productId, fileType: 'sample-audio' });
			}

			totalFiles = filesToUpload.length;

			// Step 3: Upload files with progress tracking
			const uploadResults = await uploadMultipleFiles(
				filesToUpload,
				(fileIndex, fileProgress, overall) => {
					currentFileIndex = fileIndex + 1;
					currentFileName = filesToUpload[fileIndex].file.name;
					currentFileProgress = fileProgress;
					overallProgress = overall;
				}
			);

			// Check if all uploads succeeded
			const failedUploads = uploadResults.filter(r => !r.success);
			if (failedUploads.length > 0) {
				// Rollback: delete product
				await fetch(`/api/products/${productId}`, { method: 'DELETE' });
				throw new Error(`Upload failed: ${failedUploads[0].error}`);
			}

			// Step 4: Update product with file paths
			const updateResponse = await fetch(`/api/products/${productId}/files`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					files: uploadResults.reduce((acc, result) => {
						acc[result.fileType] = result.key;
						return acc;
					}, {})
				})
			});

			if (!updateResponse.ok) {
				throw new Error('Failed to update product with file paths');
			}

			// Success!
			alert('Product created successfully!');
			goto('/admin/products');

		} catch (err) {
			console.error('Create product error:', err);
			error = err.message || 'Failed to create product';
			uploading = false;
		}
	}
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
		<form onsubmit={handleSubmit} class="space-y-8">
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
							type="text"
							bind:value={title}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
							required
							disabled={uploading}
						/>
					</div>

					<!-- Slug -->
					<div>
						<label for="slug" class="block text-sm font-medium text-foreground mb-1.5">
							Slug (URL-friendly)
						</label>
						<input
							id="slug"
							type="text"
							bind:value={slug}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
							required
							disabled={uploading}
						/>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-foreground mb-1.5">
							Description *
						</label>
						<textarea
							id="description"
							bind:value={description}
							rows="4"
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring"
							required
							disabled={uploading}
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
								type="text"
								bind:value={author}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								required
								disabled={uploading}
							/>
						</div>

						<div>
							<label for="narrator" class="block text-sm font-medium text-foreground mb-1.5">
								Narrator (for audiobooks)
							</label>
							<input
								id="narrator"
								type="text"
								bind:value={narrator}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={uploading}
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
								bind:value={type}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={uploading}
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
								bind:value={language}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={uploading}
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
								type="number"
								bind:value={pageCount}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={uploading}
							/>
						</div>

						<div>
							<label for="duration" class="block text-sm font-medium text-foreground mb-1.5">
								Duration in seconds (for audio)
							</label>
							<input
								id="duration"
								type="number"
								bind:value={duration}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={uploading}
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
										disabled={uploading}
										class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50
											{selectedCategories.includes(category.id)
												? 'bg-primary text-primary-foreground'
												: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
									>
										{category.icon} {category.name}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Featured -->
					<div class="flex items-center gap-2">
						<input
							id="featured"
							type="checkbox"
							bind:checked={featured}
							disabled={uploading}
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
							type="number"
							bind:value={pdfPrice}
							disabled={uploading}
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
							type="number"
							bind:value={audioPrice}
							disabled={uploading}
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
							type="number"
							bind:value={bundlePrice}
							disabled={uploading}
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
							type="file"
							accept="image/*"
							onchange={(e) => handleFileChange(e, 'cover')}
							disabled={uploading}
							class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
								focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
								file:rounded file:border-0 file:bg-primary file:text-primary-foreground
								file:cursor-pointer hover:file:bg-primary/90 disabled:opacity-50"
							required
						/>
						{#if coverFile}
							<p class="text-sm text-muted-foreground mt-1">✓ {coverFile.name} ({formatFileSize(coverFile.size)})</p>
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
								type="file"
								accept=".pdf"
								onchange={(e) => handleFileChange(e, 'pdf')}
								disabled={uploading}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
									file:rounded file:border-0 file:bg-primary file:text-primary-foreground
									file:cursor-pointer hover:file:bg-primary/90 disabled:opacity-50"
								required={type === "EBOOK" || type === "MAGAZINE" || type === "BUNDLE"}
							/>
							{#if pdfFile}
								<p class="text-sm text-muted-foreground mt-1">✓ {pdfFile.name} ({formatFileSize(pdfFile.size)})</p>
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
								type="file"
								accept="audio/*"
								onchange={(e) => handleFileChange(e, 'audio')}
								disabled={uploading}
								class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
									focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
									file:rounded file:border-0 file:bg-primary file:text-primary-foreground
									file:cursor-pointer hover:file:bg-primary/90 disabled:opacity-50"
								required={type === "AUDIOBOOK" || type === "BUNDLE"}
							/>
							{#if audioFile}
								<p class="text-sm text-muted-foreground mt-1">✓ {audioFile.name} ({formatFileSize(audioFile.size)})</p>
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
										type="file"
										accept=".pdf"
										onchange={(e) => handleFileChange(e, 'sample-pdf')}
										disabled={uploading}
										class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
											focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
											file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground
											file:cursor-pointer hover:file:bg-secondary/90 disabled:opacity-50"
									/>
									{#if samplePdfFile}
										<p class="text-sm text-muted-foreground mt-1">✓ {samplePdfFile.name} ({formatFileSize(samplePdfFile.size)})</p>
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
										type="file"
										accept="audio/*"
										onchange={(e) => handleFileChange(e, 'sample-audio')}
										disabled={uploading}
										class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
											focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4
											file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground
											file:cursor-pointer hover:file:bg-secondary/90 disabled:opacity-50"
									/>
									{#if sampleAudioFile}
										<p class="text-sm text-muted-foreground mt-1">✓ {sampleAudioFile.name} ({formatFileSize(sampleAudioFile.size)})</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
					{error}
				</div>
			{/if}

			<!-- Upload Progress -->
			{#if uploading}
				<div class="bg-card border border-border rounded-lg p-6">
					<div class="space-y-3">
						<div class="flex justify-between items-center text-sm text-foreground">
							<span>Uploading file {currentFileIndex} of {totalFiles}</span>
							<span class="font-medium">{overallProgress}%</span>
						</div>
						
						<!-- Overall Progress Bar -->
						<div class="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
							<div 
								class="bg-primary h-full transition-all duration-300"
								style="width: {overallProgress}%"
							></div>
						</div>

						<!-- Current File Info -->
						<div class="text-xs text-muted-foreground space-y-1">
							<p class="truncate">Current file: {currentFileName}</p>
							<div class="flex justify-between">
								<span>File progress: {currentFileProgress}%</span>
							</div>
						</div>

						<p class="text-xs text-muted-foreground pt-2">
							Please wait, this may take a few minutes for large files.
						</p>
					</div>
				</div>
			{/if}

			<!-- Submit Button -->
			<div class="flex justify-end gap-4">
				<a
					href="/admin/products"
					class="px-6 py-2.5 rounded-md border border-input text-foreground hover:bg-accent
						{uploading ? 'pointer-events-none opacity-50' : ''}"
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
