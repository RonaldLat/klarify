<script>
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import { LoaderCircle } from '@lucide/svelte';

	let { data } = $props();
	let form = $state(data.form);

	let loading = $state(false);
	let confirmPassword = $state('');
	let passwordError = $state('');

	// Email/password signup form
	const handleSubmit = () => {
		return async ({ result, formData }) => {
			const password = formData.get('password');
			const confirm = formData.get('confirmPassword');

			if (password !== confirm) {
				passwordError = 'Passwords do not match';
				return;
			}

			passwordError = '';
			loading = true;

			try {
				if (result.type === 'success' && result.data?.success) {
					await invalidateAll();
					await goto('/complete-profile', { invalidateAll: true });
				}
			} finally {
				loading = false;
			}
		};
	};

	// Social signup (Google)
	const signUpWithGoogle = async () => {
		loading = true;
		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/complete-profile',
				newUserCallbackURL: '/complete-profile'
			});
			await authClient.getSession();
		} finally {
			loading = false;
		}
	};
</script>

<div class="container mx-auto mt-10 max-w-md rounded-xl bg-white p-8 shadow-xl">
	<h1 class="mb-6 text-center text-3xl font-extrabold text-gray-900">Create Your Account</h1>

	{#if form?.error}
		<div
			class="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800"
			role="alert"
		>
			{form.error}
		</div>
	{/if}

	<button
		onclick={signUpWithGoogle}
		disabled={loading}
		class="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white py-2 font-medium text-gray-700 shadow-sm transition duration-150 hover:bg-gray-50 disabled:opacity-50"
	>
		<!-- Google logo -->
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M21.35 11.1H12v2.9h5.35a4.7 4.7 0 0 1-2.05 3.1v2.6h3.3a8 8 0 0 0 2.45-8.6z" fill="#4285F4" />
			<path d="M12 22a7.9 7.9 0 0 0 5.45-2l-3.3-2.6a4.9 4.9 0 0 1-7.3-2.6H3.4v2.65A8 8 0 0 0 12 22z" fill="#34A853" />
			<path d="M4.7 14.8A4.8 4.8 0 0 1 4.45 12c0-.95.25-1.85.7-2.65V6.7H3.4A8 8 0 0 0 3.4 17.3l1.3-2.5z" fill="#FBBC05" />
			<path d="M12 4.8c2.15 0 4.1.75 5.6 2.25l2.05-2.05A8 8 0 0 0 3.4 6.7l1.75 2.65A4.9 4.9 0 0 1 12 4.8z" fill="#EA4335" />
		</svg>

		<span>{loading ? 'Signing Up...' : 'Continue with Google'}</span>
	</button>

	<div class="my-6 flex items-center">
		<div class="flex-grow border-t border-gray-300"></div>
		<span class="mx-4 flex-shrink text-sm text-gray-500">or sign up with email</span>
		<div class="flex-grow border-t border-gray-300"></div>
	</div>

	<form method="POST" action="?/emailPasswordSignup" use:enhance={handleSubmit}>
		<div class="mb-4">
			<label for="name" class="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
			<input
				type="text"
				id="name"
				name="name"
				required
				value={form?.name ?? ''}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="mb-4">
			<label for="email" class="mb-2 block text-sm font-medium text-gray-700">Email</label>
			<input
				type="email"
				id="email"
				name="email"
				required
				value={form?.email ?? ''}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="mb-4">
			<label for="password" class="mb-2 block text-sm font-medium text-gray-700">Password</label>
			<input
				type="password"
				id="password"
				name="password"
				required
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="mb-4">
			<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">Confirm Password</label>
			<input
				type="password"
				id="confirmPassword"
				name="confirmPassword"
				bind:value={confirmPassword}
				required
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		{#if passwordError}
			<p class="text-sm text-red-600">{passwordError}</p>
		{/if}

		<button
			type="submit"
			disabled={loading}
			class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-bold text-white shadow-md transition duration-150 hover:bg-blue-700 disabled:opacity-50"
		>
			{#if loading}
				<LoaderCircle class="h-4 w-4 animate-spin" />
				<span>Creating account...</span>
			{:else}
				<span>Sign Up</span>
			{/if}
		</button>
	</form>

	<p class="mt-6 text-center text-sm text-gray-600">
		Already have an account?
		<a href="/login" class="font-medium text-blue-500 hover:underline">Log In</a>
	</p>
</div>
