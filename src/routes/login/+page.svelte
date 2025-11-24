<script>
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import { LoaderCircle, CheckCircle2, AlertCircle } from '@lucide/svelte';
	
	let loading = $state(false);
	let emailLoading = $state(false);
	let showSuccessMessage = $state(false);
	let successMessage = $state('');
	
	const signInWithGoogle = async () => {
		loading = true;
		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/products',
				newUserCallbackURL: '/signup'
			});
			// Force session refresh after social login
			await authClient.getSession();
		} catch (error) {
			console.error('Google sign-in error:', error);
		} finally {
			loading = false;
		}
	};
	
	let { data } = $props();
	let form = $state(data.form);
	
	const handleSubmit = () => {
		emailLoading = true;
		return async ({ result }) => {
			if (result.type === 'success' && result.data?.success) {
				// Show success message
				showSuccessMessage = true;
				successMessage = 'Login successful! Redirecting...';
				
				// Wait a moment to show the success message
				await new Promise(resolve => setTimeout(resolve, 800));
				
				// Invalidate all data to reload the layout (including session)
				await invalidateAll();
				// Navigate to dashboard
				await goto('/products', { invalidateAll: true });
			} else {
				// Reset loading state on error
				emailLoading = false;
			}
		};
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Success Toast -->
		{#if showSuccessMessage}
			<div
				class="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg animate-in fade-in slide-in-from-top-2"
				role="alert"
			>
				<CheckCircle2 class="h-5 w-5 flex-shrink-0 text-green-600" />
				<span class="text-sm font-medium text-green-800">{successMessage}</span>
			</div>
		{/if}

		<!-- Main Card -->
		<div class="rounded-2xl bg-white p-8 shadow-2xl">
			<div class="mb-8 text-center">
				<h1 class="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
				<p class="text-sm text-gray-600">Sign in to continue to your account</p>
			</div>

			<!-- Error Alert -->
			{#if form?.error}
				<div
					class="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2"
					role="alert"
				>
					<AlertCircle class="h-5 w-5 flex-shrink-0 text-red-600" />
					<div class="flex-1">
						<p class="text-sm font-medium text-red-800">{form.error}</p>
					</div>
				</div>
			{/if}

			<!-- Google Sign In Button -->
			<button
				onclick={signInWithGoogle}
				disabled={loading || emailLoading}
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if loading}
					<LoaderCircle class="h-5 w-5 animate-spin text-blue-600" />
				{:else}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
				{/if}
				<span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
			</button>

			<!-- Divider -->
			<div class="my-6 flex items-center">
				<div class="flex-grow border-t border-gray-300"></div>
				<span class="mx-4 text-xs font-medium uppercase text-gray-500">Or</span>
				<div class="flex-grow border-t border-gray-300"></div>
			</div>

			<!-- Email/Password Form -->
			<form method="POST" action="?/emailPasswordLogin" use:enhance={handleSubmit}>
				<div class="space-y-4">
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
							Email Address
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={form?.email ?? ''}
							required
							disabled={emailLoading}
							placeholder="you@example.com"
							class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between">
							<label for="password" class="block text-sm font-medium text-gray-700">
								Password
							</label>
							<a href="/forgot-password" class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
								Forgot password?
							</a>
						</div>
						<input
							type="password"
							id="password"
							name="password"
							required
							disabled={emailLoading}
							placeholder="••••••••"
							class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
						/>
					</div>

					<button
						type="submit"
						disabled={loading || emailLoading}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if emailLoading}
							<LoaderCircle class="h-5 w-5 animate-spin" />
							<span>Signing in...</span>
						{:else}
							<span>Sign In</span>
						{/if}
					</button>
				</div>
			</form>

			<!-- Sign Up Link -->
			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600">
					Don't have an account?
					<a href="/signup" class="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
						Create account
					</a>
				</p>
			</div>
		</div>

		<!-- Terms & Privacy -->
		<p class="mt-6 text-center text-xs text-gray-600">
			By signing in, you agree to our
			<a href="/terms" class="font-medium text-gray-700 hover:underline">Terms of Service</a>
			and
			<a href="/privacy" class="font-medium text-gray-700 hover:underline">Privacy Policy</a>
		</p>
	</div>
</div>
