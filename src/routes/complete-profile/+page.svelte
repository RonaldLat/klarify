<script>
	import { goto, invalidateAll } from "$app/navigation";

	let { data } = $props();

	let phone = $state("254");
	let error = $state("");
	let loading = $state(false);

	/**
	 * Handle phone number submission
	 */
	async function handleSubmit() {
		error = "";

		// Validation
		const phoneRegex = /^254[17]\d{8}$/;
		if (!phoneRegex.test(phone)) {
			error = "Invalid phone number. Use format: 254712345678";
			return;
		}

		loading = true;

		try {
			const response = await fetch("/api/user/update-phone", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || "Failed to update phone number";
				loading = false;
				return;
			}

			// Refresh user data
			await invalidateAll();

			// Redirect to home
			goto("/");
		} catch (err) {
			console.error("Update phone error:", err);
			error = err.message || "Failed to update phone number";
		} finally {
			loading = false;
		}
	}

	/**
	 * Skip for now
	 */
	function skipForNow() {
		goto("/");
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-background px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
			<p class="text-muted-foreground">
				Add your phone number for M-Pesa payments
			</p>
		</div>

		<div class="bg-card rounded-lg border border-border p-6 shadow-sm">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				<!-- User Info -->
				<div class="bg-muted rounded-md p-4 mb-4">
					<p class="text-sm text-muted-foreground mb-1">Signed in as</p>
					<p class="font-medium text-foreground">{data.user.name}</p>
					<p class="text-sm text-muted-foreground">{data.user.email}</p>
				</div>

				<!-- Phone Number -->
				<div>
					<label for="phone" class="block text-sm font-medium text-foreground mb-1.5">
						Phone Number (M-Pesa) *
					</label>
					<input
						id="phone"
						type="tel"
						bind:value={phone}
						placeholder="254712345678"
						class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground 
							focus:outline-none focus:ring-2 focus:ring-ring"
						required
					/>
					<p class="text-xs text-muted-foreground mt-1">
						This will be used for M-Pesa payments. Format: 254712345678
					</p>
				</div>

				<!-- Error Message -->
				{#if error}
					<div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
						{error}
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={loading}
					class="w-full bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-md 
						hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Saving..." : "Save Phone Number"}
				</button>

				<!-- Skip Button -->
				<button
					type="button"
					onclick={skipForNow}
					class="w-full text-muted-foreground hover:text-foreground text-sm py-2"
				>
					Skip for now (you'll need to add it before making purchases)
				</button>
			</form>
		</div>
	</div>
</div>
