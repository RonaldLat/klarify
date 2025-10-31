<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  // Reactive values from page data (set in +layout.server.js)
  const session = $derived($page.data.session);
  const user = $derived(session?.user);

  let phone = "";
  let loading = false;
  let error = "";

  // Run once on mount — redirect if not logged in
  onMount(() => {
    if (!user) {
      goto("/login");
    }
  });
</script>

{#if !user}
  <p class="text-center">Redirecting to login...</p>
{:else}
  <div class="max-w-md mx-auto p-6 space-y-4 bg-card rounded-lg border">
    <h1 class="text-xl font-bold">Complete Your Profile</h1>
    <p class="text-sm text-muted-foreground">We need your phone number for payments and delivery.</p>

    <input
      bind:value={phone}
      placeholder="e.g. 0712973489"
      class="w-full p-3 border rounded-md"
      disabled={loading}
    />

    {#if error}
      <p class="text-sm text-destructive">{error}</p>
    {/if}

    <button
      on:click={async () => {
        loading = true;
        error = "";

        const clean = phone.replace(/[\s\-\(\)]/g, "");
        if (!clean) {
          error = "Phone number is required";
          loading = false;
          return;
        }

        let normalized = clean.replace(/^\+?0?/, "+254");
        if (!normalized.startsWith("+254")) {
          normalized = "+254" + normalized.replace(/^\+/, "");
        }

        const res = await fetch("/api/user/phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalized }),
        });

        const data = await res.json();

        if (data.error) {
          error = data.error;
        } else {
          goto("/");
        }

        loading = false;
      }}
      disabled={loading || !phone.trim()}
      class="w-full bg-primary text-white p-3 rounded-md font-medium disabled:opacity-50"
    >
      {loading ? "Saving..." : "Save Phone"}
    </button>
  </div>
{/if}
