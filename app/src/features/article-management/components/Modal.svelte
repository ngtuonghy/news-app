<script>
	let { showModal = $bindable(),  children } = $props();

	let dialog = $state(); // HTMLDialogElement

	$effect(() => {
    	if (showModal) dialog.showModal();
		else if (dialog.open) dialog.close();
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
>
	<div class="modal-content">
		{@render children?.()}
		<!-- svelte-ignore a11y_autofocus -->
	</div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
		box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.3);
    overflow: hidden;

		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
		animation: fade 0.2s ease-out;
	}

	dialog > .modal-content {
		padding: 1em;
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes zoom {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	button {
		display: block;
		margin-left: auto;
	}
</style>


