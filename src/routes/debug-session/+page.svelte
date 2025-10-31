<script>
	let { data } = $props();
</script>

<div class="max-w-4xl mx-auto p-8">
	<h1 class="text-3xl font-bold mb-6">Session Debug Info</h1>
	
	<div class="space-y-6">
		<div class="bg-card border border-border rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Locals User</h2>
			<pre class="bg-muted p-4 rounded overflow-auto text-sm">{JSON.stringify(data.localsUser, null, 2)}</pre>
		</div>

		<div class="bg-card border border-border rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Locals Session</h2>
			<pre class="bg-muted p-4 rounded overflow-auto text-sm">{JSON.stringify(data.localsSession, null, 2)}</pre>
		</div>

		<div class="bg-card border border-border rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Better-Auth User</h2>
			<pre class="bg-muted p-4 rounded overflow-auto text-sm">{JSON.stringify(data.betterAuthUser, null, 2)}</pre>
		</div>

		<div class="bg-card border border-border rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Better-Auth Session</h2>
			<pre class="bg-muted p-4 rounded overflow-auto text-sm">{JSON.stringify(data.betterAuthSession, null, 2)}</pre>
		</div>

		<div class="bg-card border border-border rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Cookies</h2>
			<pre class="bg-muted p-4 rounded overflow-auto text-sm">{data.cookies || 'No cookies'}</pre>
		</div>
	</div>
</div>
