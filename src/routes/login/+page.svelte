<script>
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
    import { authClient } from '$lib/auth-client.js';
	import { Loader2, LoaderCircle } from '@lucide/svelte'; // Shadcn uses Lucide icons

	let loading = $state(false);

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
		} finally {
			loading = false;
		}
	};

	let { data } = $props();
	let form = $state(data.form);

	const handleSubmit = () => {
		return async ({ result }) => {
			if (result.type === 'success' && result.data?.success) {
				// Invalidate all data to reload the layout (including session)
				await invalidateAll();
				// Navigate to dashboard - this will cause the layout to reload with new session
				await goto('/catalog', { invalidateAll: true });
			}
		};
	};
</script>

<div class="container mx-auto mt-10 max-w-md rounded-xl bg-white p-8 shadow-xl">
	<h1 class="mb-6 text-center text-3xl font-extrabold text-gray-900">Welcome Back</h1>

	{#if form?.error}
		<div
			class="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800"
			role="alert"
		>
			{form.error}
		</div>
	{/if}

	<button
		onclick={signInWithGoogle}
		disabled={loading}
		class="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white py-2 font-medium text-gray-700 shadow-sm transition duration-150 hover:bg-gray-50 disabled:opacity-50"
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="..." fill="#4285F4" />
			<path d="..." fill="#34A853" />
			<path d="..." fill="#FBBC05" />
			<path d="..." fill="#EA4335" />
		</svg>
		<span>{loading ? 'Signing In...' : 'Continue with Google'}</span>
	</button>

	<div class="my-6 flex items-center">
		<div class="flex-grow border-t border-gray-300"></div>
		<span class="mx-4 flex-shrink text-sm text-gray-500">or login with email</span>
		<div class="flex-grow border-t border-gray-300"></div>
	</div>

	<form method="POST" action="?/emailPasswordLogin" use:enhance={handleSubmit}>
		<div class="mb-4">
			<label for="email" class="mb-2 block text-sm font-medium text-gray-700">Email</label>
			<input
				type="email"
				id="email"
				name="email"
				value={form?.email ?? ''}
				required
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="mb-6">
			<label for="password" class="mb-2 block text-sm font-medium text-gray-700">Password</label>
			<input
				type="password"
				id="password"
				name="password"
				required
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<!-- <button -->
		<!-- 	type="submit" -->
		<!-- 	disabled={loading} -->
		<!-- 	class="w-full rounded-lg bg-blue-600 py-2 font-bold text-white shadow-md transition duration-150 hover:bg-blue-700 disabled:opacity-50" -->
		<!-- > -->
		<!-- 	{loading ? 'Logging In...' : 'Log In'} -->
		<!-- </button> -->

		<!-- Signup Button -->
		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-lg bg-blue-600 py-2 font-bold text-white shadow-md transition duration-150 hover:bg-blue-700 disabled:opacity-50"
		>
			{#if loading}
				<LoaderCircle class="h-4 w-4 animate-spin" />
				<span>Creating account...</span>
			{:else}
				<span>Login</span>
			{/if}
		</button>
	</form>

	<p class="mt-6 text-center text-sm text-gray-600">
		Don't have an account? <a href="/signup" class="font-medium text-blue-500 hover:underline"
			>Sign Up</a
		>
	</p>
</div>
